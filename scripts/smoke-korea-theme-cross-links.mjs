/**
 * 테마여행 S12 — 크로스 링크 매처 스모크 (오프라인).
 *
 *   npm run smoke:korea-theme-cross-links
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { listKoreaTop10Scenic } from '../src/pages/Home/lib/koreaTop10Scenic.js';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import {
  buildThemeMembershipIndex,
  getThemeMembership,
  listSameHubCrossSpots,
  resolveFestivalThemeCrossLinks,
  resolveThemeCrossLinks,
  resolveThemePackageKey,
  resolveThemeSpotAreaCode,
  THEME_REGION_LABEL_TO_AREA,
} from '../src/pages/Home/lib/koreaThemeCrossLinks.js';
import { extractTourAttractionSigungu } from '../src/pages/Home/lib/koreaTourAttractionLocality.js';

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

assert(THEME_REGION_LABEL_TO_AREA['제주'] === '39', 'region 제주 → area 39');
assert(THEME_REGION_LABEL_TO_AREA['강원'] === '32', 'region 강원 → area 32');

const hallasan = listKoreaTop10Scenic().find((s) => s.id === 'hallasan');
assert(Boolean(hallasan), 'top10 hallasan exists');
assert(resolveThemeSpotAreaCode(hallasan) === '39', 'hallasan areaCode 39 via hub');

const index = buildThemeMembershipIndex();
assert(index.byPlaceSlug.size >= 40, `membership size ≥40 (got ${index.byPlaceSlug.size})`);

const hallaMem = getThemeMembership(hallasan.placeSlug);
assert(
  Boolean(hallaMem?.top10) && hallaMem?.modules?.includes('top10'),
  'hallasan in top10 membership',
);

const sameHub = listSameHubCrossSpots('jeju', { excludePlaceSlug: hallasan.placeSlug });
assert(Array.isArray(sameHub), 'sameHub returns array');
assert(
  sameHub.every((s) => s.hubId === 'jeju' && s.placeSlug !== hallasan.placeSlug),
  'sameHub all jeju and excludes self',
);

const bundle = resolveThemeCrossLinks(hallasan);
assert(bundle.areaCode === '39', 'bundle areaCode 39');
assert(bundle.deepLinks.festivals.includes('area=39'), 'festival deep link has area');
assert(bundle.deepLinks.courses.includes('area=39'), 'courses deep link has area');
assert(bundle.deepLinks.regions.includes('area=39'), 'regions deep link has area');
assert(bundle.stay?.keyword, `stay keyword (got ${bundle.stay?.keyword})`);
assert(bundle.tna?.keyword, `tna keyword (got ${bundle.tna?.keyword})`);
assert(resolveThemePackageKey(hallasan) === 'koreaJeju', 'hallasan package koreaJeju');
assert(bundle.packageCta?.key === 'koreaJeju', 'bundle packageCta koreaJeju');
assert(Array.isArray(bundle.nearbyHubs), 'nearbyHubs array');

const gyeongjuScenic = listKoreaScenicSpots().find((s) => s.hubId === 'gyeongju');
if (gyeongjuScenic) {
  assert(
    resolveThemePackageKey(gyeongjuScenic) == null,
    'gyeongju scenic → no package CTA (LIVE 상주 오탐)',
  );
} else {
  console.log('SKIP  no gyeongju scenic for package key');
}

const yeosuSpot = { hubId: 'yeosu', placeSlug: 'yeosu', name: '여수', region: '전라' };
assert(resolveThemePackageKey(yeosuSpot) === 'koreaYeosu', 'yeosu → koreaYeosu');
assert(
  resolveThemeCrossLinks(yeosuSpot).packageCta?.key === 'koreaYeosu',
  'yeosu packageCta',
);

const ulleungSpot = { hubId: 'ulleung', placeSlug: 'ulleung', name: '울릉', region: '경상' };
assert(resolveThemePackageKey(ulleungSpot) === 'koreaUlleungdo', 'ulleung → koreaUlleungdo');

const seoulSpot = {
  hubId: 'seoul',
  placeSlug: 'gyeongbokgung',
  name: '경복궁',
  region: '수도권',
  lat: 37.5796,
  lng: 126.977,
};
const seoulBundle = resolveThemeCrossLinks(seoulSpot);
assert(seoulBundle.areaCode === '1', 'seoul areaCode 1');
assert(seoulBundle.packageCta == null, 'seoul has no city package CTA (avoid false busan-like)');

const jejuFest = resolveFestivalThemeCrossLinks(
  {
    title: '제주 불꽃축제',
    areaCode: '39',
    mapx: 126.5312,
    mapy: 33.4996,
    contentId: '9999999',
  },
  { region: '제주' },
);
assert(jejuFest.areaCode === '39', 'festival cross area 39');
assert(jejuFest.stay?.keyword, `festival stay keyword (got ${jejuFest.stay?.keyword})`);
assert(jejuFest.packageCta?.key === 'koreaJeju', 'festival jeju package koreaJeju');
assert(
  jejuFest.deepLinks.scenic.includes('region='),
  'festival scenic deep link keeps region',
);

assert(
  extractTourAttractionSigungu('강원특별자치도 춘천시 동면 순환로 1150') ===
    '춘천시',
  'sigungu from addr1 → 춘천시',
);

const poiNoHub = {
  name: '생명건강 과학원',
  hubId: null,
  placeSlug: null,
  region: '강원',
  locality: '춘천시 동면',
  addr1: '강원특별자치도 춘천시 동면 순환로 1150',
  lat: 37.88,
  lng: 127.73,
};
const poiBundle = resolveThemeCrossLinks(poiNoHub);
assert(
  poiBundle.stay?.keyword === '춘천' || poiBundle.stay?.keyword === '춘천시',
  `POI stay uses region not title (got ${poiBundle.stay?.keyword})`,
);
assert(
  poiBundle.stay?.keyword !== '생명건강 과학원',
  'POI stay keyword is not attraction title',
);
assert(
  poiBundle.tna?.keyword === '춘천' || poiBundle.tna?.keyword === '춘천시',
  `POI tna uses region not title (got ${poiBundle.tna?.keyword})`,
);

const libSrc = readFileSync(
  join(root, 'src/pages/Home/lib/koreaThemeCrossLinks.js'),
  'utf8',
);
assert(libSrc.includes('nearbyHubsForFestival'), 'reuses festival nearby matcher');
assert(libSrc.includes('resolveMrtStayQuery'), 'wires stay query');
assert(libSrc.includes('resolveMrtTnaQuery'), 'wires tna query');
assert(libSrc.includes('extractTourAttractionSigungu'), 'uses addr→sigungu for MRT');
assert(!libSrc.includes('VITE_'), 'no VITE_ secrets in cross-links lib');

const planSrc = readFileSync(join(root, 'plans/korea-theme-travel-plan.md'), 'utf8');
assert(planSrc.includes('### 2.5 테마 크로스 연결'), 'plan has §2.5');
assert(planSrc.includes('테마여행 #18, 테마 연결'), 'plan chat name #18 테마 연결');
assert(planSrc.includes('### S12 — 테마 크로스 연결'), 'plan has S12');

if (failed > 0) {
  console.error(`\n${failed} failure(s)`);
  process.exit(1);
}
console.log('\nPASS smoke:korea-theme-cross-links');
