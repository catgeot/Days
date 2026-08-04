/**
 * 테마여행 S11 — 테마 상세 모달 스모크 (오프라인 정적 검사).
 *
 *   npm run smoke:korea-theme-spot-modal
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { listKoreaTop10Scenic } from '../src/pages/Home/lib/koreaTop10Scenic.js';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';

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

const top10 = listKoreaTop10Scenic();
assert(top10.length === 10, `top10 has 10 spots (got ${top10.length})`);
assert(
  top10.some((s) => s.contentId && /^\d+$/.test(String(s.contentId))),
  'top10 has at least one contentId for LIVE detail',
);

const scenic = listKoreaScenicSpots();
assert(scenic.length >= 12, `scenic ≥12 (got ${scenic.length})`);
assert(
  scenic.some((s) => s.contentId && /^\d+$/.test(String(s.contentId))),
  'scenic has at least one contentId',
);

const fetchSrc = readFileSync(
  join(root, 'src/utils/fetchTourApiAttractionDetail.js'),
  'utf8',
);
assert(fetchSrc.includes("ATTRACTION_CONTENT_TYPE_ID = '12'"), 'fetch type12');
assert(fetchSrc.includes("detailCommon"), 'fetch detailCommon');
assert(fetchSrc.includes("detailIntro"), 'fetch detailIntro');
assert(fetchSrc.includes("detailInfo"), 'fetch detailInfo');
assert(fetchSrc.includes("detailImage"), 'fetch detailImage');
assert(
  fetchSrc.includes('export async function fetchTourApiAttractionDetail'),
  'exports fetchTourApiAttractionDetail',
);

const modalSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ThemeSpotDetailModal.jsx'),
  'utf8',
);
assert(modalSrc.includes('장소 카드 보기'), 'modal has place CTA');
assert(modalSrc.includes('setPlaceReturnTo'), 'modal sets returnTo');
assert(modalSrc.includes('Escape'), 'modal Esc close');
assert(modalSrc.includes('fetchTourApiAttractionDetail'), 'modal loads Tour detail');

for (const [file, label] of [
  ['Top10Page.jsx', 'top10'],
  ['ScenicPage.jsx', 'scenic'],
  ['RegionsPage.jsx', 'regions'],
]) {
  const src = readFileSync(join(root, 'src/pages/KoreaTheme', file), 'utf8');
  assert(src.includes('ThemeSpotDetailModal'), `${label} uses ThemeSpotDetailModal`);
  assert(
    !src.includes("navigate(`/place/${"),
    `${label} does not navigate to place on list click`,
  );
  assert(
    src.includes('항목을 누르면 상세') || src.includes('상세를 봅니다'),
    `${label} copy mentions detail modal`,
  );
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke-korea-theme-spot-modal: all assertions passed');
