/**
 * 명승 목록 「시도 도시」표기 스모크.
 *
 *   npm run smoke:korea-scenic-place-label
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import { formatScenicSpotPlaceLabel } from '../src/pages/Home/lib/scenicSpotPlaceLabel.js';

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

assert(
  formatScenicSpotPlaceLabel({
    areaCode: '32',
    areaLabel: '강원',
    locality: '춘천시 동면',
    addr1: '강원특별자치도 춘천시 동면 순환로 1150',
  }) === '강원 춘천',
  'DB POI → 강원 춘천',
);
assert(
  formatScenicSpotPlaceLabel({
    areaCode: '35',
    areaLabel: '경북',
    locality: '경주시 인왕동',
  }) === '경북 경주',
  'DB POI → 경북 경주',
);
assert(
  formatScenicSpotPlaceLabel({
    areaCode: '1',
    areaLabel: '서울',
    locality: '종로구 사직동',
  }) === '서울 종로',
  '서울 구 → 서울 종로',
);
assert(
  formatScenicSpotPlaceLabel({
    areaCode: '1',
    areaLabel: '서울',
    hubId: 'seoul',
  }) === '서울',
  '서울=도시 중복 시 한 번만',
);

const nami = listKoreaScenicSpots().find((s) => s.id === 'nami-island');
assert(Boolean(nami), 'nami-island curated');
assert(
  formatScenicSpotPlaceLabel(nami) === '강원 춘천',
  `남이섬 → 강원 춘천 (got ${formatScenicSpotPlaceLabel(nami)})`,
);

const seokguram = listKoreaScenicSpots().find((s) => s.id === 'seokguram');
assert(Boolean(seokguram), 'seokguram curated');
assert(
  formatScenicSpotPlaceLabel(seokguram) === '경북 경주',
  `석굴암 → 경북 경주 (got ${formatScenicSpotPlaceLabel(seokguram)})`,
);

const cheonji = listKoreaScenicSpots().find((s) => s.id === 'cheonjiyeon');
assert(
  formatScenicSpotPlaceLabel(cheonji) === '제주 서귀포',
  `천지연 → 제주 서귀포 (got ${formatScenicSpotPlaceLabel(cheonji)})`,
);

for (const s of listKoreaScenicSpots()) {
  const label = formatScenicSpotPlaceLabel(s);
  assert(Boolean(label), `${s.id} has place label`);
  assert(
    !label.includes('수도권') && !label.includes(' · '),
    `${s.id} not broad region·sido style (got ${label})`,
  );
}

const pageSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ScenicPage.jsx'),
  'utf8',
);
assert(
  pageSrc.includes('formatScenicSpotPlaceLabel'),
  'ScenicPage uses place label helper',
);
assert(!pageSrc.includes('spotRegionLabel'), 'old spotRegionLabel removed');

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS smoke:korea-scenic-place-label');
