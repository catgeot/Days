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
import {
  listKoreaThemeAreas,
  listKoreaThemeRegionAttractions,
} from '../src/pages/Home/lib/koreaThemeRegions.js';

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
  top10.every((s) => s.contentId && /^\d+$/.test(String(s.contentId))),
  'top10 all 10 have contentId for LIVE detail',
);

const scenic = listKoreaScenicSpots();
assert(scenic.length >= 12, `scenic ≥12 (got ${scenic.length})`);
assert(
  scenic.every((s) => s.contentId && /^\d+$/.test(String(s.contentId))),
  `scenic all have contentId (got ${scenic.filter((s) => s.contentId).length}/${scenic.length})`,
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
assert(modalSrc.includes("t('korea.theme.spotDetail.askMooni')"), 'modal has Mooni CTA i18n');
assert(modalSrc.includes("t('korea.theme.spotDetail.youtubeVideos')"), 'modal has YouTube CTA i18n');
assert(modalSrc.includes('MooniBoundChatHost'), 'modal hosts Mooni chat in-place');
assert(modalSrc.includes('setMooniOpen(true)'), 'Mooni opens without leaving theme route');
assert(
  !modalSrc.includes("navigate('/',") && !modalSrc.includes('navigate("/",'),
  'modal does not navigate to globe home for Mooni',
);
assert(!modalSrc.includes('openMooni: true'), 'modal does not use Home openMooni route state');
assert(modalSrc.includes('fetchScenicSpotVideos'), 'modal loads scenic videos');
assert(modalSrc.includes('scenicHomePathForHubId'), 'nearby hubs open scenic home');
assert(
  modalSrc.includes('themeNavBackEntryForSpot'),
  'modal builds themeBack via themeNavBackEntryForSpot',
);
assert(
  modalSrc.includes('중첩 모달 우선') ||
    (modalSrc.includes('row.modalSpot && onOpenSameHub') &&
      modalSrc.indexOf('row.modalSpot && onOpenSameHub') <
        modalSrc.indexOf('row.deepPath')),
  'sameHub prefers nested modal over deepPath navigate',
);
assert(modalSrc.includes('galleryUrls'), 'modal keeps Tour gallery photos');
assert(modalSrc.includes('openLightboxAt'), 'modal opens photo lightbox');
assert(modalSrc.includes('PHOTO_SWIPE_THRESHOLD_PX'), 'modal supports photo swipe');
assert(!modalSrc.includes('장소 카드 보기'), 'modal does not link to place card');
assert(!modalSrc.includes('setPlaceReturnTo'), 'modal does not set place returnTo');
assert(modalSrc.includes('Escape'), 'modal Esc close');
assert(modalSrc.includes('fetchTourApiAttractionDetail'), 'modal loads Tour detail');
assert(modalSrc.includes('resolveThemeCrossLinks'), 'modal wires cross-links matcher');
assert(modalSrc.includes("t('korea.theme.spotDetail.crossThemeTitle')"), 'modal cross rail membership section');
assert(modalSrc.includes("t('korea.theme.spotDetail.festivalsInArea')"), 'modal cross rail festival deep-link');
assert(modalSrc.includes("t('korea.theme.spotDetail.coursesInArea')"), 'modal cross rail courses deep-link');
assert(modalSrc.includes('homepageDisplayLabel'), 'modal short homepage label helper');
assert(
  modalSrc.includes("t('korea.theme.spotDetail.officialHeritage')"),
  'modal maps heritage.go.kr to officialHeritage i18n',
);
assert(
  !modalSrc.includes("homepage.replace(/^https?:\\/\\//i, '')"),
  'modal does not dump raw homepage URL as label',
);

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
    src.includes('항목을 누르면 상세') ||
      src.includes('상세를 봅니다') ||
      src.includes('상세를 모달로') ||
      src.includes('ThemeSpotDetailModal'),
    `${label} copy mentions detail modal`,
  );
}

const regionsSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/RegionsPage.jsx'),
  'utf8',
);
assert(
  regionsSrc.includes('contentId: selectedSpot.contentId'),
  'regions passes contentId into modal (not hardcoded null)',
);
assert(
  regionsSrc.includes('hubId: selectedSpot.hubId'),
  'regions passes hubId for cross rail',
);
assert(
  regionsSrc.includes("searchParams.get('area')") ||
    regionsSrc.includes('areaFromSearch'),
  'regions reads ?area= deep-link',
);

const coursesSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/CoursesPage.jsx'),
  'utf8',
);
assert(
  coursesSrc.includes("searchParams.get('area')"),
  'courses reads ?area= deep-link',
);
assert(
  coursesSrc.includes('pickChipIdForArea'),
  'courses maps area query to chip',
);

const koreaSrc = readFileSync(join(root, 'src/pages/Korea/index.jsx'), 'utf8');
assert(
  koreaSrc.includes("searchParams.get('area')"),
  'festival hub reads ?area= (theme deep-link, no chip refactor)',
);

let regionTotal = 0;
let regionWithId = 0;
for (const area of listKoreaThemeAreas()) {
  for (const a of listKoreaThemeRegionAttractions(area.areaCode)) {
    regionTotal += 1;
    if (a.contentId && /^\d+$/.test(String(a.contentId))) regionWithId += 1;
  }
}
assert(regionTotal >= 100, `regions attractions ≥100 (got ${regionTotal})`);
assert(
  regionWithId / regionTotal >= 0.6,
  `regions contentId coverage ≥60% (got ${regionWithId}/${regionTotal})`,
);
assert(
  listKoreaThemeRegionAttractions('1').some((a) => a.contentId),
  '서울 region sample has at least one contentId',
);

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nsmoke-korea-theme-spot-modal: all assertions passed');
