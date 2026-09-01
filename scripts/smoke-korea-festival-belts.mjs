#!/usr/bin/env node
/**
 * 축제 로드(벨트) smoke — SSOT · hub 매칭 · (옵션) LIVE 강원 축제.
 *
 *   npm run smoke:korea-festival-belts
 *   KOREA_FESTIVAL_BELT_LIVE=1 npm run smoke:korea-festival-belts
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listCityAttractionHubs } from '../src/pages/Home/lib/cityAttractionHubs.js';
import { nearbyHubsForFestival } from '../src/pages/Korea/nearbyFestivalHubs.js';
import { areaCodeForHubId } from '../src/pages/Korea/koreaHubSeeds.js';
import { detectSidoCode } from '../src/pages/Korea/festivalRegionTags.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

console.log('▶ npm run generate:korea-festival-belts');
execSync('npm run generate:korea-festival-belts', { cwd: root, stdio: 'inherit' });

console.log('\n▶ npm run audit:korea-festival-belts');
execSync('npm run audit:korea-festival-belts', { cwd: root, stdio: 'inherit' });

const beltsPath = join(root, 'src/pages/Korea/data/koreaFestivalBelts.json');
const beltsData = JSON.parse(readFileSync(beltsPath, 'utf8'));
const belts = beltsData.belts || [];

assert(belts.length === 4, '4 phase-1 belts in JSON');

const hubList = listCityAttractionHubs()
  .filter((h) => h?.hubId && Number.isFinite(Number(h.lat)) && Number.isFinite(Number(h.lng)))
  .map((h) => ({
    hubId: String(h.hubId).toLowerCase(),
    name: String(h.name || h.hubId),
    lat: Number(h.lat),
    lng: Number(h.lng),
  }));

/** @type {Map<string, { beltId: string, stopIndex: number }>} */
const stopIndex = new Map();
for (const belt of belts) {
  for (const stop of belt.stops || []) {
    stopIndex.set(String(stop.hubId).toLowerCase(), {
      beltId: belt.id,
      stopIndex: stop.stopIndex,
    });
  }
}

for (const belt of belts) {
  for (const stop of belt.stops || []) {
    const hubId = String(stop.hubId).toLowerCase();
    const area = areaCodeForHubId(hubId);
    assert(Boolean(area), `${belt.id}: ${hubId} has areaCode mapping`);
    assert(
      hubList.some((h) => h.hubId === hubId),
      `${belt.id}: ${hubId} in hubList`,
    );
  }
}

function primaryHubForFestival(item) {
  const nearby = nearbyHubsForFestival(item, hubList, { limit: 1, maxKm: 120 });
  return nearby[0]?.hubId ? String(nearby[0].hubId).toLowerCase() : null;
}

for (const belt of belts) {
  for (const stop of belt.stops || []) {
    const mock = {
      areaCode: stop.areaCode,
      addr1: `강원특별자치도 ${stop.name}`,
      mapx: stop.lng,
      mapy: stop.lat,
      title: `${stop.name} 테스트 축제`,
      eventStartDate: '20260901',
    };
    const matched = primaryHubForFestival(mock);
    assert(
      matched === String(stop.hubId).toLowerCase(),
      `${belt.id}: mock@${stop.hubId} → ${matched}`,
    );
  }
}

const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
const liveEnabled = process.env.KOREA_FESTIVAL_BELT_LIVE === '1';

if (url && anon && liveEnabled) {
  const res = await fetch(`${url.replace(/\/$/, '')}/functions/v1/tourapi-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${anon}`,
      apikey: anon,
    },
    body: JSON.stringify({ action: 'festivalWindow' }),
  });
  const data = await res.json().catch(() => null);
  const errMsg = String(data?.error || data?.message || '');

  if (!data?.ok) {
    if (/not configured|TOUR_API/i.test(errMsg)) {
      console.log(`SKIP  LIVE festivalWindow (${errMsg})`);
    } else {
      assert(false, `LIVE festivalWindow (${errMsg || `HTTP ${res.status}`})`);
    }
  } else {
    const items = (data.items || []).filter((it) => {
      if (!it?.title || !/^\d{8}$/.test(String(it.eventStartDate || ''))) return false;
      const sido =
        (it.areaCode != null && String(it.areaCode).trim() !== ''
          ? String(it.areaCode).trim()
          : null) || detectSidoCode(it.addr1);
      return sido === '32' || sido === '33';
    });
    assert(items.length >= 1, `LIVE gangwon/chungbuk festivals ≥1 (got ${items.length})`);

    /** @type {Map<string, number>} */
    const perStop = new Map();
    /** @type {Map<string, number>} */
    const perBelt = new Map();

    for (const item of items) {
      const hubId = primaryHubForFestival(item);
      if (!hubId || !stopIndex.has(hubId)) continue;
      perStop.set(hubId, (perStop.get(hubId) || 0) + 1);
      const { beltId } = stopIndex.get(hubId);
      perBelt.set(beltId, (perBelt.get(beltId) || 0) + 1);
    }

    let stopsWithFestivals = 0;
    let totalStops = 0;
    for (const belt of belts) {
      for (const stop of belt.stops || []) {
        totalStops += 1;
        const count = perStop.get(String(stop.hubId).toLowerCase()) || 0;
        if (count > 0) stopsWithFestivals += 1;
        console.log(`      ${belt.id}@${stop.hubId}: ${count} LIVE`);
      }
    }

    assert(stopsWithFestivals >= 4, `LIVE stops with festivals ≥4 (got ${stopsWithFestivals}/${totalStops})`);
    for (const belt of belts) {
      const count = perBelt.get(belt.id) || 0;
      assert(count >= 1, `LIVE belt ${belt.id} has ≥1 festival (got ${count})`);
    }
    console.log(
      `OK    LIVE matched ${stopsWithFestivals}/${totalStops} stops · ${items.length} festivals scanned`,
    );
  }
} else if (!url || !anon) {
  console.log('SKIP  LIVE (no supabase secrets)');
} else {
  console.log('SKIP  LIVE (set KOREA_FESTIVAL_BELT_LIVE=1 to enable)');
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:korea-festival-belts PASS');
