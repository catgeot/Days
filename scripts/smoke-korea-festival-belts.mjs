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
import {
  getFestivalBeltById,
  getFestivalBelts,
  groupFestivalsForBelt,
  primaryHubIdForFestival,
} from '../src/pages/Korea/festivalBelts.js';

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
/** @type {Record<string, unknown>[] | null} */
let liveItems = null;

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
    liveItems = items;
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

console.log('\n▶ groupFestivalsForBelt() leg matching');

assert(getFestivalBelts().length === 4, 'getFestivalBelts() returns 4 belts');

const northBelt = getFestivalBeltById('gw-north-inland');
assert(Boolean(northBelt), 'getFestivalBeltById(gw-north-inland)');

const hwacheonFest = {
  contentId: 'belt-hwacheon-1',
  title: '화천 산천어축제',
  addr1: '강원특별자치도 화천군',
  eventStartDate: '20260110',
  areaCode: '32',
  mapx: '127.7082',
  mapy: '38.1063',
};
const chuncheonFest = {
  contentId: 'belt-chuncheon-1',
  title: '춘천 마임축제',
  addr1: '강원특별자치도 춘천시',
  eventStartDate: '20260520',
  areaCode: '32',
  mapx: '127.7298',
  mapy: '37.8811',
};
const seoulFest = {
  contentId: 'belt-seoul-1',
  title: '서울빛초롱축제',
  addr1: '서울특별시 종로구',
  eventStartDate: '20261101',
  areaCode: '1',
};

assert(
  primaryHubIdForFestival(hwacheonFest, hubList) === 'hwacheon',
  'primaryHub hwacheon festival → hwacheon',
);

const mockItems = [hwacheonFest, chuncheonFest, seoulFest];
const northLegs = groupFestivalsForBelt(northBelt, mockItems, hubList);

assert(
  northLegs.length === northBelt.stops.length,
  `north belt leg count === stops (${northLegs.length}/${northBelt.stops.length})`,
);

for (let i = 0; i < northBelt.stops.length; i += 1) {
  const stop = northBelt.stops[i];
  const leg = northLegs[i];
  assert(leg.stopIndex === stop.stopIndex, `leg[${i}] stopIndex`);
  assert(leg.hubId === String(stop.hubId).toLowerCase(), `leg[${i}] hubId`);
  assert(leg.stop?.hubId === stop.hubId, `leg[${i}] stop ref`);
  const expectedNext =
    i < northBelt.stops.length - 1 ? northBelt.stops[i + 1].name : null;
  assert(leg.nextLabel === expectedNext, `leg[${i}] nextLabel`);
}

const cheorwonLeg = northLegs.find((leg) => leg.hubId === 'cheorwon');
assert(Boolean(cheorwonLeg), 'cheorwon leg exists');
assert(cheorwonLeg.empty === true, 'sparse cheorwon leg stays empty');
assert(cheorwonLeg.items.length === 0, 'cheorwon leg items.length === 0');

const hwacheonLeg = northLegs.find((leg) => leg.hubId === 'hwacheon');
assert(hwacheonLeg?.items.length === 1, 'hwacheon leg has 1 festival');
assert(hwacheonLeg?.empty === false, 'hwacheon leg not empty');

const chuncheonLeg = northLegs.find((leg) => leg.hubId === 'chuncheon');
assert(chuncheonLeg?.items.length === 1, 'chuncheon leg has 1 festival');

const assignedIds = new Set();
for (const leg of northLegs) {
  for (const item of leg.items) {
    const id = String(item.contentId || item.title || '');
    assert(!assignedIds.has(id), `no duplicate festival across legs: ${id}`);
    assignedIds.add(id);
  }
}
assert(!assignedIds.has('belt-seoul-1'), 'off-belt seoul festival excluded');

let totalLegFestivals = 0;
for (const belt of belts) {
  const legs = groupFestivalsForBelt(belt, mockItems, hubList);
  assert(legs.length === belt.stops.length, `${belt.id}: legs === stops`);
  for (const leg of legs) {
    assert(leg.empty === (leg.items.length === 0), `${belt.id}@${leg.hubId}: empty flag`);
    totalLegFestivals += leg.items.length;
  }
}
assert(totalLegFestivals === 2, `mock festivals on belts === 2 (got ${totalLegFestivals})`);

if (liveItems?.length) {
  console.log('\n▶ LIVE groupFestivalsForBelt()');
  let liveLegsWithFestivals = 0;
  for (const belt of belts) {
    const legs = groupFestivalsForBelt(belt, liveItems, hubList);
    let beltFestivals = 0;
    for (const leg of legs) {
      beltFestivals += leg.items.length;
      if (leg.items.length > 0) liveLegsWithFestivals += 1;
    }
    assert(beltFestivals >= 1, `LIVE ${belt.id} groupFestivalsForBelt ≥1 (got ${beltFestivals})`);
  }
  assert(
    liveLegsWithFestivals >= 4,
    `LIVE legs with festivals ≥4 (got ${liveLegsWithFestivals})`,
  );
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:korea-festival-belts PASS');
