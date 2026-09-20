#!/usr/bin/env node
/**
 * 테마여행 #49 — 명승 홈 내 주변(거리순) 스모크.
 * 테마여행 #51 — 축제 상세 인근 명소도 축제장 거리순.
 * 테마여행 #69 — 내 주변 관광지 bbox(관내 최근접 포함).
 * 테마여행 #114 — bbox range 페이지네이션(양구 등 밀집권역 관내 누락 방지).
 *
 *   npm run smoke:korea-scenic-nearby
 *   LIVE(옵션): VITE_SUPABASE_* — 화천·양구 관내 관광지 최근접 검증
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { loadEnvFile } from './lib/load-env-file.mjs';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import { listKoreaHeritageScenic } from '../src/pages/Home/lib/koreaHeritageScenic.js';
import {
  formatDistanceKm,
  limitNearbyRanked,
  nearbySpotMapChips,
  NEAR_DISPLAY_SOFT_MAX,
  NEAR_RADIUS_STEPS_KM,
  NEAR_SCENIC_KM,
  nextNearRadiusStepKm,
  pickAdaptiveNearRadiusKm,
  rankNearbyScenicSpots,
  rankSpotsByDistance,
  scenicSpotLngLat,
} from '../src/pages/KoreaTheme/nearbyScenicRank.js';

loadEnvFile();

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = join(__dirname, '../src/pages/KoreaTheme/ScenicPage.jsx');
const FESTIVAL_SHEET = join(
  __dirname,
  '../src/pages/Korea/FestivalDetailSheet.jsx',
);
const pageSrc = readFileSync(PAGE, 'utf8');
const festivalSheetSrc = readFileSync(FESTIVAL_SHEET, 'utf8');

assert.equal(NEAR_SCENIC_KM, 80, 'NEAR_SCENIC_KM=80 (축제와 동일)');
assert.deepEqual(
  [...NEAR_RADIUS_STEPS_KM],
  [20, 40, 60, 80],
  'adaptive radius steps',
);
assert.equal(NEAR_DISPLAY_SOFT_MAX, 12, 'display soft max');
assert.equal(formatDistanceKm(0.42), '0.4km', 'sub-km format');
assert.equal(formatDistanceKm(3.26), '3.3km', 'ones-km format');
assert.equal(formatDistanceKm(42.2), '42km', 'tens-km format');
assert.equal(nextNearRadiusStepKm(20), 40, 'next step after 20');
assert.equal(nextNearRadiusStepKm(80), null, 'no step after 80');

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
const seoulRadius = pickAdaptiveNearRadiusKm(nearCurated);
assert.equal(seoulRadius, 20, `서울 적응 반경=20 (got ${seoulRadius})`);
const seoulLimited = limitNearbyRanked(nearCurated, {
  radiusKm: seoulRadius,
  limit: NEAR_DISPLAY_SOFT_MAX,
});
assert.equal(
  seoulLimited.length,
  NEAR_DISPLAY_SOFT_MAX,
  `서울 표시 상한 ${NEAR_DISPLAY_SOFT_MAX}`,
);
const seoulChips = nearbySpotMapChips(seoulLimited);
assert.equal(seoulChips.length, NEAR_DISPLAY_SOFT_MAX, '서울 지도 칩=상한');
assert.equal(seoulChips[0].kind, 'spot', 'chip kind spot');
assert.ok(seoulChips[0].spotId, 'chip spotId');

const chuncheon = { lat: 37.8813, lng: 127.7298 };
const nearChuncheon = rankNearbyScenicSpots(curated, chuncheon.lat, chuncheon.lng);
const chuncheonLimited = limitNearbyRanked(nearChuncheon, {
  radiusKm: 20,
  limit: NEAR_DISPLAY_SOFT_MAX,
});
const chuncheonEnChips = nearbySpotMapChips(chuncheonLimited, { locale: 'en' });
assert.ok(chuncheonEnChips.length >= 3, `춘천 20km EN 칩≥3 (got ${chuncheonEnChips.length})`);
const gongjiChip = chuncheonEnChips.find((c) => c.spotId === 'gongjicheon');
assert.ok(gongjiChip, '춘천 EN 칩에 gongjicheon');
assert.equal(
  gongjiChip.label,
  'Gongjiche…',
  '공지천 EN 칩 라벨(10자 truncate)',
);
assert.equal(gongjiChip.labelFull, 'Gongjicheon', '공지천 EN 칩 full');
assert.ok(
  chuncheonEnChips.every((c) => !/[가-힣]/.test(String(c.label || ''))),
  '춘천 EN 칩 라벨에 한글 없음',
);
const skywalkChip = chuncheonEnChips.find((c) => c.spotId === 'soyanggang-skywalk');
assert.ok(skywalkChip, '춘천 EN 칩에 soyanggang-skywalk');
assert.equal(
  skywalkChip.label,
  'Soyanggan…',
  '소양강스카이워크 EN 칩 라벨(10자 truncate)',
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
assert.ok(pageSrc.includes('pickAdaptiveNearRadiusKm'), 'adaptive radius');
assert.ok(pageSrc.includes('nearbySpotMapChips'), 'map near chips');
assert.ok(pageSrc.includes('mapNearOrigin'), 'map-only near origin');
assert.ok(pageSrc.includes('formatDistanceKm'), 'distance label');
assert.ok(pageSrc.includes('resolveKoreaAreaFromCoords'), 'GPS→hub');
assert.ok(
  pageSrc.includes('fetchKoreaTourAttractionsNear'),
  'ScenicPage near uses bbox distance fetch (not region sample)',
);
assert.ok(
  pageSrc.includes('NEAR_DB_POOL_LIMIT') &&
    (pageSrc.includes('NEAR_DB_LIST_HARD_MAX') ||
      pageSrc.includes('NEAR_LIST_SOFT_MAX')),
  'near tour pool + list soft/hard limits',
);
assert.ok(
  pageSrc.includes('countTourCatsFromNearSpots') &&
    pageSrc.includes('heritageCategoryChipsFromSpots'),
  'near mode builds category chips from nearby pools',
);
assert.ok(
  pageSrc.includes('showTourFilterChips = nearActive'),
  'near mode shows tour category chips',
);
assert.ok(
  pageSrc.includes('showCuratedFilterChips = nearActive') &&
    pageSrc.includes('showHeritageFilterChips = nearActive'),
  'near mode shows curated hub + heritage category chips',
);
assert.ok(
  pageSrc.includes('if (!nearActive) clearNear()'),
  'hub/heritage chip click keeps near mode',
);

const libPath = join(__dirname, '../src/pages/Home/lib/koreaTourAttractions.js');
const libSrc = readFileSync(libPath, 'utf8');
assert.ok(
  libSrc.includes('export async function fetchKoreaTourAttractionsNear'),
  'fetchKoreaTourAttractionsNear exported',
);
assert.ok(libSrc.includes('NEAR_BBOX_FETCH_CAP'), 'bbox fetch cap');
assert.ok(libSrc.includes('NEAR_BBOX_PAGE'), 'bbox page size');
assert.ok(
  /NEAR_BBOX_FETCH_CAP\s*=\s*3000/.test(libSrc),
  'NEAR_BBOX_FETCH_CAP>=3000 (single 500 drops rural nearest)',
);
assert.ok(
  libSrc.includes('.range(from, to)') || libSrc.includes('.range(from,to)'),
  'near bbox uses range pagination',
);

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

const supabaseUrl = String(
  process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '',
).trim();
const supabaseAnon = String(process.env.VITE_SUPABASE_ANON_KEY || '').trim();
let liveNote = 'LIVE skipped';

/**
 * PostgREST bbox 전수(페이지) → 원 거리순 — fetchKoreaTourAttractionsNear와 동일 계약.
 * @param {{ lat: number, lng: number }} origin
 * @param {string} [cat1]
 */
async function liveRankNearTour(origin, cat1) {
  const radiusKm = NEAR_SCENIC_KM;
  const dLat = radiusKm / 111;
  const cos = Math.cos((origin.lat * Math.PI) / 180);
  const dLng = radiusKm / (111 * Math.max(Math.abs(cos), 0.2));
  const page = 1000;
  const cap = 3000;
  /** @type {object[]} */
  const rows = [];
  for (let from = 0; from < cap; from += page) {
    const u = new URL(`${supabaseUrl}/rest/v1/tourapi_attraction`);
    u.searchParams.set('select', 'content_id,title,addr1,mapx,mapy,cat1');
    u.searchParams.set('active', 'eq.true');
    u.searchParams.set('content_type_id', 'eq.12');
    if (cat1) u.searchParams.set('cat1', `eq.${cat1}`);
    u.searchParams.set(
      'and',
      `(mapy.gte.${origin.lat - dLat},mapy.lte.${origin.lat + dLat},mapx.gte.${origin.lng - dLng},mapx.lte.${origin.lng + dLng})`,
    );
    u.searchParams.set('limit', String(page));
    u.searchParams.set('offset', String(from));
    const res = await fetch(u, {
      headers: {
        apikey: supabaseAnon,
        Authorization: `Bearer ${supabaseAnon}`,
      },
    });
    assert.ok(res.ok, `near bbox HTTP ${res.status} @${from}`);
    const batch = await res.json();
    assert.ok(Array.isArray(batch), 'near bbox rows array');
    rows.push(...batch);
    if (batch.length < page) break;
  }
  const r2 = radiusKm * radiusKm;
  const scored = [];
  for (const row of rows) {
    const la = Number(row.mapy);
    const ln = Number(row.mapx);
    if (!Number.isFinite(la) || !Number.isFinite(ln)) continue;
    const dy = (la - origin.lat) * 111;
    const dx = (ln - origin.lng) * 111 * cos;
    const dist2 = dy * dy + dx * dx;
    if (dist2 > r2) continue;
    scored.push({
      title: row.title,
      addr1: row.addr1,
      distKm: Math.sqrt(dist2),
    });
  }
  scored.sort((a, b) => a.distKm - b.distKm);
  return { rows: rows.length, scored };
}

if (supabaseUrl && supabaseAnon) {
  const hwacheon = { lat: 38.1063, lng: 127.7082 };
  const { scored: hwScored } = await liveRankNearTour(hwacheon, 'A01');
  assert.ok(hwScored.length >= 5, `화천 80km 관광지≥5 (got ${hwScored.length})`);
  const hwFirst = hwScored[0];
  assert.ok(
    /화천/.test(String(hwFirst?.addr1 || '')),
    `화천 최근접이 관내여야 함 (got ${hwFirst?.title} · ${hwFirst?.addr1})`,
  );
  assert.ok(
    Number.isFinite(hwFirst?.distKm) && hwFirst.distKm < 10,
    `화천 최근접 <10km (got ${hwFirst?.distKm})`,
  );

  // 양구: 단일 limit 500이면 인제·춘천만 남고 관내(0~수 km)가 샘플에서 빠짐
  const yanggu = { lat: 38.1075, lng: 127.9897 };
  const { rows: ygRows, scored: ygScored } = await liveRankNearTour(yanggu);
  assert.ok(ygRows > 500, `양구 bbox 후보>500 (got ${ygRows}) — 페이지네이션 필요`);
  assert.ok(ygScored.length >= 5, `양구 80km 관광지≥5 (got ${ygScored.length})`);
  const ygFirst = ygScored[0];
  assert.ok(
    /양구/.test(String(ygFirst?.addr1 || '')),
    `양구 최근접이 관내여야 함 (got ${ygFirst?.title} · ${ygFirst?.addr1})`,
  );
  assert.ok(
    Number.isFinite(ygFirst?.distKm) && ygFirst.distKm < 5,
    `양구 최근접 <5km (got ${ygFirst?.distKm})`,
  );
  assert.ok(
    !/인제/.test(String(ygFirst?.addr1 || '')),
    '양구 최근접이 인제면 안 됨',
  );

  liveNote = `LIVE 화천 ${hwFirst.title} ${hwFirst.distKm.toFixed(1)}km · 양구 ${ygFirst.title} ${ygFirst.distKm.toFixed(1)}km · n=${ygScored.length}`;
}

console.log(
  `OK  smoke:korea-scenic-nearby — curated ${nearCurated.length} · heritage ${nearHeritage.length} within ${NEAR_SCENIC_KM}km of Seoul · festival-rank first ${rankedFromFestival[0].km.toFixed(1)}km · ${liveNote}`,
);
