#!/usr/bin/env node
/**
 * 테마여행 #49 — 명승 홈 내 주변(거리순) 스모크.
 * 테마여행 #51 — 축제 상세 인근 명소도 축제장 거리순.
 *
 *   npm run smoke:korea-scenic-nearby
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import { listKoreaHeritageScenic } from '../src/pages/Home/lib/koreaHeritageScenic.js';
import {
  formatDistanceKm,
  NEAR_SCENIC_KM,
  rankNearbyScenicSpots,
  rankSpotsByDistance,
  scenicSpotLngLat,
} from '../src/pages/KoreaTheme/nearbyScenicRank.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = join(__dirname, '../src/pages/KoreaTheme/ScenicPage.jsx');
const FESTIVAL_SHEET = join(
  __dirname,
  '../src/pages/Korea/FestivalDetailSheet.jsx',
);
const pageSrc = readFileSync(PAGE, 'utf8');
const festivalSheetSrc = readFileSync(FESTIVAL_SHEET, 'utf8');

assert.equal(NEAR_SCENIC_KM, 80, 'NEAR_SCENIC_KM=80 (축제와 동일)');
assert.equal(formatDistanceKm(0.42), '0.4km', 'sub-km format');
assert.equal(formatDistanceKm(3.26), '3.3km', 'ones-km format');
assert.equal(formatDistanceKm(42.2), '42km', 'tens-km format');

const seoul = { lat: 37.5665, lng: 126.978 };
const curated = listKoreaScenicSpots();
const heritage = listKoreaHeritageScenic();
assert.ok(curated.length >= 50, `curated>=50 (got ${curated.length})`);
assert.ok(heritage.length >= 100, `heritage>=100 (got ${heritage.length})`);
assert.ok(
  curated.every((s) => scenicSpotLngLat(s)),
  'curated all have KR coords',
);
const heritageWithCoords = heritage.filter((s) => scenicSpotLngLat(s));
assert.ok(
  heritageWithCoords.length >= 100,
  `heritage with coords≥100 (got ${heritageWithCoords.length})`,
);

const nearCurated = rankNearbyScenicSpots(curated, seoul.lat, seoul.lng);
const nearHeritage = rankNearbyScenicSpots(heritage, seoul.lat, seoul.lng);
assert.ok(nearCurated.length >= 3, `서울 80km 안 선정 명소≥3 (got ${nearCurated.length})`);
assert.ok(
  nearHeritage.length >= 3,
  `서울 80km 안 국가유산 명승≥3 (got ${nearHeritage.length})`,
);
for (let i = 1; i < nearCurated.length; i += 1) {
  assert.ok(
    nearCurated[i].km >= nearCurated[i - 1].km,
    'curated distance ascending',
  );
}
assert.ok(nearCurated[0].km < nearCurated.at(-1).km, 'curated not all equal');

const gangneung = { lat: 37.7519, lng: 128.8761 };
const nearGn = rankNearbyScenicSpots(heritage, gangneung.lat, gangneung.lng);
assert.ok(nearGn.length >= 1, '강릉 인근 명승≥1');
assert.ok(
  String(nearGn[0].item?.name || '').includes('경포') ||
    nearGn.some((r) => String(r.item?.name || '').includes('경포')),
  '강릉 인근에 경포 계열',
);

assert.ok(pageSrc.includes('handleNearMe'), 'ScenicPage handleNearMe');
assert.ok(pageSrc.includes('내 주변'), 'ScenicPage 내 주변 CTA');
assert.ok(pageSrc.includes('rankNearbyScenicSpots'), 'ScenicPage uses rank helper');
assert.ok(pageSrc.includes('NEAR_SCENIC_KM') || pageSrc.includes('NEAR_KM'), 'NEAR km');
assert.ok(pageSrc.includes('formatDistanceKm'), 'distance label');
assert.ok(pageSrc.includes('resolveKoreaAreaFromCoords'), 'GPS→hub');

const gangwon = listKoreaScenicSpots('강원');
assert.ok(gangwon.length >= 3, `강원 선정 명소≥3 (got ${gangwon.length})`);
const rankedFromFestival = rankSpotsByDistance(
  gangwon,
  gangneung.lat,
  gangneung.lng,
);
assert.ok(rankedFromFestival.length >= 3, '축제장 기준 강원 랭크≥3');
for (let i = 1; i < rankedFromFestival.length; i += 1) {
  assert.ok(
    rankedFromFestival[i].km >= rankedFromFestival[i - 1].km,
    '축제장→명소 distance ascending',
  );
}
assert.ok(
  rankedFromFestival[0].km < rankedFromFestival.at(-1).km,
  '축제장 기준 거리가 모두 같지 않음',
);
assert.ok(
  festivalSheetSrc.includes('rankSpotsByDistance'),
  'FestivalDetailSheet ranks scenic by festival coords',
);
assert.ok(
  festivalSheetSrc.includes('formatDistanceKm'),
  'FestivalDetailSheet distance badge',
);
assert.ok(
  festivalSheetSrc.includes('festivalLngLat'),
  'FestivalDetailSheet uses festivalLngLat',
);

console.log(
  `OK  smoke:korea-scenic-nearby — curated ${nearCurated.length} · heritage ${nearHeritage.length} within ${NEAR_SCENIC_KM}km of Seoul · festival-rank first ${rankedFromFestival[0].km.toFixed(1)}km`,
);
