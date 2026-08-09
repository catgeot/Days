#!/usr/bin/env node
/**
 * 테마여행 #58 — 명소 홈 검색 스모크.
 *
 *   npm run smoke:korea-scenic-search
 */
import assert from 'assert';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { listKoreaScenicSpots } from '../src/pages/Home/lib/koreaScenicSpots.js';
import { listKoreaHeritageScenic } from '../src/pages/Home/lib/koreaHeritageScenic.js';
import {
  filterScenicSpotsByQuery,
  normalizeScenicQuery,
  pickBestRegionByCounts,
  sanitizeScenicDbSearchQuery,
} from '../src/pages/Home/lib/scenicSearch.js';
import { SCENIC_REGION_ORDER } from '../src/pages/Home/lib/koreaTourAttractionMap.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGE = join(__dirname, '../src/pages/KoreaTheme/ScenicPage.jsx');
const pageSrc = readFileSync(PAGE, 'utf8');

assert.equal(normalizeScenicQuery('  경 복 궁  '), '경복궁');
assert.equal(sanitizeScenicDbSearchQuery('경복궁,(test)%'), '경복궁test');
assert.ok(sanitizeScenicDbSearchQuery('a'.repeat(80)).length <= 40);

const curated = listKoreaScenicSpots();
const heritage = listKoreaHeritageScenic();
const gyeongbok = filterScenicSpotsByQuery(curated, '경복궁');
assert.ok(
  gyeongbok.some((s) => String(s.name || '').includes('경복궁')),
  '선정 명소 경복궁 검색',
);
const gyeongpo = filterScenicSpotsByQuery(heritage, '경포');
assert.ok(
  gyeongpo.some((s) => String(s.name || '').includes('경포')),
  '국가유산 명승 경포 검색',
);
assert.equal(filterScenicSpotsByQuery(curated, '').length, curated.length);
assert.equal(
  filterScenicSpotsByQuery(curated, 'zzzz-no-match-xxxx').length,
  0,
);

assert.ok(pageSrc.includes('filterScenicSpotsByQuery'), 'ScenicPage uses filter');
assert.ok(pageSrc.includes('korea-scenic-search'), 'ScenicPage search input');
assert.ok(pageSrc.includes('명소·지역 검색'), 'ScenicPage search placeholder');
assert.ok(pageSrc.includes('searchQuery'), 'ScenicPage DB searchQuery');
assert.ok(pageSrc.includes('commitSearch'), 'ScenicPage commitSearch');
assert.ok(pageSrc.includes('closeSearch'), 'ScenicPage closeSearch');
assert.ok(
  pageSrc.includes('korea-scenic-search-modal-title'),
  'search results render as modal',
);
assert.ok(pageSrc.includes('aria-label="맨 위로"'), 'scroll-to-top FAB');
assert.ok(pageSrc.includes('mainScrollRef'), 'scroll container ref');
assert.ok(
  pageSrc.includes('bg-amber-500 shadow-sm') &&
    pageSrc.includes('bg-amber-100 ring-1 ring-amber-300/50'),
  'chip horizontal scrollbar uses amber track/thumb',
);
assert.ok(
  !pageSrc.includes('aria-label="한국의 축제로"'),
  'scenic home header has no festival chip',
);
assert.ok(
  pageSrc.includes('onlyWhenBack'),
  'scenic home hides default 명승 self-link',
);
assert.ok(pageSrc.includes('curatedSearchPool'), 'search pool for curated');
assert.ok(pageSrc.includes('heritageSearchPool'), 'search pool for heritage');
assert.ok(pageSrc.includes('pickRegionFromSpotMatches'), 'commit picks per-pod region');
assert.ok(
  pageSrc.includes('setCuratedRegion') &&
    pageSrc.includes('setHeritageRegion') &&
    pageSrc.includes('setTourRegion'),
  'curated/heritage/tour region chips are independent',
);
assert.ok(
  pageSrc.includes('한국관광공사 선정 관광지입니다.'),
  'tour catalog blurb is short',
);
assert.ok(
  pageSrc.includes('showTourFilterChips'),
  'search keeps category chips',
);
assert.ok(
  pageSrc.includes('분류 칩으로 결과 분해'),
  'search comment mentions chip breakdown',
);
assert.ok(pageSrc.includes('showCuratedFilterChips'), 'hide curated chips if empty');
assert.ok(
  pageSrc.includes('시·군 hub에 선정 명소 0건이면') &&
    pageSrc.includes('Boolean(hubId) && curatedSpots.length === 0 && !searchActive'),
  'hub with 0 curated spots hides region/hub chips',
);
assert.ok(
  pageSrc.includes('에는 아직 GATEO 선정 명소가 없습니다') &&
    pageSrc.includes('curatedSpots.length > 0 ? ('),
  'empty hub copy skips “골랐습니다” blurb',
);
assert.ok(
  pageSrc.includes('Landmark') &&
    pageSrc.includes('Mountain') &&
    pageSrc.includes('MapPin') &&
    pageSrc.includes('text-emerald-800') &&
    pageSrc.includes('text-sky-800'),
  'three section titles use distinct icons',
);
assert.ok(pageSrc.includes('showHeritageFilterChips'), 'hide heritage chips if empty');
assert.ok(
  pageSrc.includes('해당 섹션 매칭이 있는 권역만'),
  'per-section region chips during search',
);
assert.ok(
  pageSrc.includes('결과 있는 첫 종목으로 전환'),
  'search auto-picks cat1 with matches',
);
assert.ok(
  pageSrc.includes('pickRegionFromTourCounts'),
  'search can pick region from TourAPI counts',
);
assert.ok(
  pageSrc.includes('pickBestRegionByCounts'),
  'search uses max-count region pick',
);
assert.ok(
  pageSrc.includes('화천') && pageSrc.includes('TourAPI'),
  'search auto-picks tour region when curated/heritage empty (화천→강원)',
);
assert.ok(
  filterScenicSpotsByQuery(curated, '화천').some((s) => s.hubId === 'hwacheon'),
  '화천 curated includes hwacheon hub (붕어섬 등)',
);
assert.equal(
  filterScenicSpotsByQuery(heritage, '화천').length,
  0,
  '화천 heritage 0',
);

// 국내 hub 감사에서 드러난 오탐: 첫 권역이 아니라 최다 권역
assert.equal(
  pickBestRegionByCounts(
    SCENIC_REGION_ORDER,
    { 수도권: 0, 강원: 0, 충청: 7, 전라: 0, 경상: 26, 제주: 0 },
    '수도권',
  ),
  '경상',
  '성주형: 보령 성주면(7)보다 성주군(26)',
);
assert.equal(
  pickBestRegionByCounts(
    SCENIC_REGION_ORDER,
    { 수도권: 0, 강원: 0, 충청: 0, 전라: 1, 경상: 26, 제주: 0 },
    '수도권',
  ),
  '경상',
  '함안형: 함안로(1)보다 함안군(26)',
);
assert.equal(
  pickBestRegionByCounts(
    SCENIC_REGION_ORDER,
    { 수도권: 0, 강원: 1, 충청: 0, 전라: 0, 경상: 20, 제주: 0 },
    '수도권',
  ),
  '경상',
  '독도형: 체험관(1)보다 울릉·독도(20)',
);
assert.equal(
  pickBestRegionByCounts(
    SCENIC_REGION_ORDER,
    { 수도권: 0, 강원: 35, 충청: 0, 전라: 0, 경상: 1, 제주: 0 },
    '수도권',
  ),
  '강원',
  '화천형: 강원 35',
);
assert.equal(
  pickBestRegionByCounts(SCENIC_REGION_ORDER, { 수도권: 0, 강원: 0 }, '수도권'),
  '수도권',
  '전부 0이면 fallback',
);
const goseongCurated = filterScenicSpotsByQuery(curated, '고성');
const goseongHeritage = filterScenicSpotsByQuery(heritage, '고성');
assert.ok(goseongCurated.length >= 1, '고성 curated ≥1 (강원·경상 hub)');
assert.ok(goseongHeritage.length >= 2, '고성 heritage ≥2');
assert.ok(
  new Set(goseongHeritage.map((s) => s.region)).size === 1,
  '고성 heritage single region → no region chip row',
);
const setCuratedRegionBlock = pageSrc.slice(
  pageSrc.indexOf('const setCuratedRegion = useCallback'),
  pageSrc.indexOf('const setCuratedArea = useCallback'),
);
assert.ok(
  setCuratedRegionBlock.length > 0 &&
    !setCuratedRegionBlock.includes('clearSearchFilter'),
  'region chip must not clear search',
);
assert.ok(
  pageSrc.includes("next.set('cregion'") &&
  pageSrc.includes("next.set('hregion'") &&
  pageSrc.includes("next.set('tregion'"),
  'pod chip writes use cregion/hregion/tregion',
);
assert(
  pageSrc.includes("next.set('ccluster'") ||
    pageSrc.includes('ccluster'),
  '명소 파드 has ccluster 세권 param',
);
assert.ok(
  filterScenicSpotsByQuery(curated, '경복궁').some((s) => s.region === '수도권'),
  '경복궁 matches include 수도권',
);

const libSrc = readFileSync(
  join(__dirname, '../src/pages/Home/lib/koreaTourAttractions.js'),
  'utf8',
);
assert.ok(libSrc.includes('title.ilike.'), 'DB title ilike');
assert.ok(libSrc.includes('searchQuery'), 'fetch accepts searchQuery');
const chipCountFn = libSrc.slice(
  libSrc.indexOf('export async function fetchScenicFilterChipCounts'),
  libSrc.indexOf('export async function fetchKoreaTourAttractions'),
);
assert.ok(
  chipCountFn.includes('sanitizeScenicDbSearchQuery(opts.searchQuery)'),
  'chip counts accept searchQuery',
);
assert.ok(
  chipCountFn.includes('searchQuery,'),
  'region/cat chip counts pass searchQuery',
);

console.log('smoke-korea-scenic-search: PASS');
