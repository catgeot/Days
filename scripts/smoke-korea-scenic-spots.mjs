/**
 * 명승지 runtime resolve 스모크 — 샘플 5건 hub → place slug.
 *
 *   npm run smoke:korea-scenic-spots
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  placeUrlSlug,
  resolveCityAttractionHub,
  resolveHubAttraction,
  resolveHubPlaceFromSlug,
} from '../src/pages/Home/lib/cityAttractionHubs.js';
import {
  countKoreaScenicSpotsByRegion,
  countKoreaScenicSpotsByTourArea,
  listKoreaScenicHubChips,
} from '../src/pages/Home/lib/koreaScenicSpots.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json');

const SAMPLE_IDS = [
  'gyeongbokgung',
  'nami-island',
  'jeonju-hanok',
  'haeinsa',
  'cheonjiyeon',
];

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

const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const spots = data.spots || [];
const byId = new Map(spots.map((s) => [s.id, s]));

assert(spots.length >= 12, `count ≥12 (got ${spots.length})`);
assert(data.meta?.curation === 'GATEO', 'GATEO curation label');
assert(
  String(data.meta?.disclaimer || '').includes('인기 관광지'),
  'disclaimer is short curated blurb',
);

const NEW_SAMPLES = [
  'bukchon',
  'gamcheon',
  'seokguram',
  'seonginbong',
  'seongsan-ilchulbong',
  'haeundae-beach',
  'hallasan-national-park',
  'n-seoul-tower',
  'woljeongsa',
  'daegwallyeong-sheep-farm',
  'namhae-german-village',
  'geumsan-boriam',
  'daebudo',
  'byeolmangseong-fortress',
  'gapgot-dondae',
  'manisan',
];
for (const id of NEW_SAMPLES) {
  const spot = byId.get(id);
  assert(Boolean(spot), `expanded sample present: ${id}`);
  if (spot?.contentId) {
    assert(/^\d+$/.test(String(spot.contentId)), `${id} contentId digits`);
  }
}

for (const id of SAMPLE_IDS) {
  const spot = byId.get(id);
  assert(Boolean(spot), `sample present: ${id}`);
  if (!spot) continue;

  const hub = resolveCityAttractionHub(spot.hubId);
  assert(Boolean(hub), `${id} hub resolve: ${spot.hubId}`);

  const hit = resolveHubAttraction(spot.attractionName);
  assert(Boolean(hit), `${id} attraction resolve: ${spot.attractionName}`);
  assert(hit?.hub?.hubId === spot.hubId, `${id} attraction hubId === ${spot.hubId}`);

  const slug = placeUrlSlug(hit?.attraction?.name_en, hit?.attraction?.name);
  assert(slug === spot.placeSlug, `${id} placeSlug runtime === ${spot.placeSlug}`);

  const fromSlug = resolveHubPlaceFromSlug(spot.placeSlug);
  assert(Boolean(fromSlug), `${id} resolveHubPlaceFromSlug(${spot.placeSlug})`);
  assert(
    fromSlug?.name === spot.attractionName,
    `${id} slug hydrates attraction ${spot.attractionName}`,
  );
}

const curatedRegionCounts = countKoreaScenicSpotsByRegion();
assert(
  (curatedRegionCounts['경상'] || 0) >= 20,
  `명소 권역 칩 경상≥20 (got ${curatedRegionCounts['경상']})`,
);
const gyeongArea = countKoreaScenicSpotsByTourArea('경상');
assert((gyeongArea['35'] || 0) >= 5, `명소 경북 중분류≥5 (got ${gyeongArea['35']})`);
const gyeongHubs = listKoreaScenicHubChips('경상', '35');
assert(
  gyeongHubs.some((h) => h.hubId === 'gyeongju' && h.count >= 3),
  '명소 소분류에 경주≥3',
);
const capitalAreas = countKoreaScenicSpotsByTourArea('수도권');
assert((capitalAreas['1'] || 0) > 0, '수도권 서울 명소>0');
assert(
  Object.values(capitalAreas).every((n) => n > 0),
  '명소 시도 건수는 양수만(0 칩 없음)',
);
const seoulHubs = listKoreaScenicHubChips('수도권', '1');
assert(
  seoulHubs.every((h) => h.label !== '서울') || seoulHubs.length <= 1,
  '서울 시도=서울 여행지 동일 라벨은 UI에서 숨김 대상',
);
const gangwonHubs = listKoreaScenicHubChips('강원', null);
assert(
  gangwonHubs.length >= 3 &&
    gangwonHubs.some((h) => h.hubId === 'gangneung'),
  `강원 소분류(여행지)≥3 (got ${gangwonHubs.length})`,
);
assert(
  gangwonHubs.some((h) => h.hubId === 'yangyang' && h.count >= 4),
  `강원 소분류에 양양≥4 (got ${JSON.stringify(gangwonHubs.find((h) => h.hubId === 'yangyang'))})`,
);
for (const id of ['naksansa', 'surfyy-beach', 'hajodae-beach', 'naksan-beach', 'seorak-beach']) {
  const spot = byId.get(id);
  assert(Boolean(spot), `양양 선정 명소 present: ${id}`);
  assert(spot?.hubId === 'yangyang', `${id} hubId === yangyang`);
}
const jejuHubs = listKoreaScenicHubChips('제주', null);
assert(
  jejuHubs.some((h) => h.hubId === 'seogwipo') &&
    jejuHubs.some((h) => h.hubId === 'jeju'),
  '제주 소분류에 서귀포·제주시',
);

const withImage = spots.filter((s) => String(s.imageUrl || '').trim()).length;
assert(
  withImage >= Math.floor(spots.length * 0.85),
  `선정 명소 imageUrl ≥85% (got ${withImage}/${spots.length})`,
);
for (const id of ['gyeongbokgung', 'nami-island', 'haeinsa', 'seongsan-ilchulbong']) {
  const spot = byId.get(id);
  assert(Boolean(String(spot?.imageUrl || '').trim()), `${id} has imageUrl`);
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-scenic-spots SMOKE OK');
