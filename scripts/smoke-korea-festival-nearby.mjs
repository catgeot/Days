#!/usr/bin/env node
/**
 * 테마여행 #26 — 축제 상세 주변 관광지 연결 스모크.
 *
 *   npm run smoke:korea-festival-nearby
 *
 * 정적 검사 + (Secrets 있을 때) DB nearby LIVE.
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { mapTourAttractionRow } from '../src/pages/Home/lib/koreaTourAttractionMap.js';
import { isNearbyTourAttractionTitle } from '../src/pages/Home/lib/koreaTourAttractionNearbyFilter.js';
import { formatTourAttractionLocality } from '../src/pages/Home/lib/koreaTourAttractionLocality.js';

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

assert(!isNearbyTourAttractionTitle('강문해변화장실'), 'drop toilet title');
assert(!isNearbyTourAttractionTitle('강릉교회'), 'drop ordinary church');
assert(!isNearbyTourAttractionTitle('역삼동성당'), 'drop ordinary cathedral');
assert(
  isNearbyTourAttractionTitle('구 철원제일교회'),
  'keep heritage-marked church',
);
assert(
  isNearbyTourAttractionTitle('언양성당 성지'),
  'keep sanctuary / 성지',
);
assert(
  isNearbyTourAttractionTitle('경포대'),
  'keep ordinary scenic name',
);

assert(
  formatTourAttractionLocality(
    '강원특별자치도 영월군 영월읍 방절리 263-4',
  ) === '영월군 영월읍 방절리',
  'locality yeongwol eup ri',
);
assert(
  formatTourAttractionLocality(
    '강원특별자치도 영월군 김삿갓면 옥동장터길 36',
  ) === '영월군 김삿갓면',
  'locality yeongwol myeon (stop at street)',
);
assert(
  formatTourAttractionLocality(
    '서울특별시 양천구 신정동 162-56',
  ) === '양천구 신정동',
  'locality seoul gu dong',
);
assert(
  formatTourAttractionLocality(
    '서울특별시 강남구 압구정로 161 (압구정동)',
  ) === '강남구 압구정동',
  'locality from parenthetical dong',
);

const sheetSrc = readFileSync(
  join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'),
  'utf8',
);
assert(
  sheetSrc.includes('fetchNearbyTourAttractions'),
  'FestivalDetailSheet imports fetchNearbyTourAttractions',
);
assert(sheetSrc.includes('주변 관광지'), 'FestivalDetailSheet shows 주변 관광지');
assert(
  sheetSrc.includes('nearbyPlaceLabel') || sheetSrc.includes('locality'),
  'FestivalDetailSheet shows locality not only broad region',
);
assert(
  sheetSrc.includes('ThemeSpotDetailModal'),
  'FestivalDetailSheet opens ThemeSpotDetailModal',
);
assert(sheetSrc.includes('overlayZClass'), 'nearby modal elevated over festival sheet');
assert(
  !sheetSrc.includes('KoreaFestivalMap'),
  'FestivalDetailSheet does not touch map component',
);

const nearbySrc = readFileSync(
  join(root, 'src/utils/fetchNearbyTourAttractions.js'),
  'utf8',
);
assert(
  nearbySrc.includes("from('tourapi_attraction')"),
  'nearby reads tourapi_attraction',
);
assert(nearbySrc.includes('content_type_id'), 'nearby filters type12');
assert(
  nearbySrc.includes('isNearbyTourAttractionCandidate'),
  'nearby applies curation filter',
);

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(modalSrc.includes('overlayZClass'), 'ThemeSpotDetailModal accepts overlayZClass');
assert(
  modalSrc.includes('e.stopPropagation()'),
  'ThemeSpotDetailModal stops backdrop bubble',
);

const url = String(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '').trim();
const anon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();

if (url && anon) {
  const sb = createClient(url, anon, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await sb
    .from('tourapi_attraction')
    .select(
      'content_id, title, addr1, addr2, area_code, mapx, mapy, first_image, active',
    )
    .eq('active', true)
    .eq('content_type_id', '12')
    .not('mapx', 'is', null)
    .not('mapy', 'is', null)
    .limit(3);

  assert(!error, `sample query (${error?.message || 'ok'})`);
  const withGeo = (data || []).find(
    (r) => Number.isFinite(Number(r.mapx)) && Number.isFinite(Number(r.mapy)),
  );
  if (withGeo) {
    const lat = Number(withGeo.mapy);
    const lng = Number(withGeo.mapx);
    const radiusKm = 8;
    const dLat = radiusKm / 111;
    const cos = Math.cos((lat * Math.PI) / 180);
    const dLng = radiusKm / (111 * Math.max(Math.abs(cos), 0.2));
    const { data: nearRows, error: nearErr } = await sb
      .from('tourapi_attraction')
      .select(
        'content_id, title, addr1, addr2, area_code, mapx, mapy, first_image, active',
      )
      .eq('active', true)
      .eq('content_type_id', '12')
      .gte('mapy', lat - dLat)
      .lte('mapy', lat + dLat)
      .gte('mapx', lng - dLng)
      .lte('mapx', lng + dLng)
      .limit(80);
    assert(!nearErr, `nearby LIVE (${nearErr?.message || 'ok'})`);
    const r2 = radiusKm * radiusKm;
    let hits = 0;
    for (const row of nearRows || []) {
      if (!isNearbyTourAttractionTitle(row.title)) continue;
      const spot = mapTourAttractionRow(row);
      if (!spot || spot.lat == null || spot.lng == null) continue;
      const dy = (spot.lat - lat) * 111;
      const dx = (spot.lng - lng) * 111 * cos;
      if (dy * dy + dx * dx <= r2) hits += 1;
    }
    assert(hits >= 1, `nearby LIVE curated ≥1 (got ${hits})`);
  } else {
    console.log('SKIP  nearby LIVE (no geo sample)');
  }
} else {
  console.log('SKIP  nearby LIVE (no supabase secrets)');
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke:korea-festival-nearby PASS');
