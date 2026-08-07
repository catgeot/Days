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
  sanitizeScenicDbSearchQuery,
} from '../src/pages/Home/lib/scenicSearch.js';

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
assert.ok(pageSrc.includes('curatedSearchPool'), 'search pool for curated');
assert.ok(pageSrc.includes('heritageSearchPool'), 'search pool for heritage');
assert.ok(pageSrc.includes('pickRegionForSearchMatches'), 'commit picks region');
assert.ok(
  pageSrc.includes('종목 칩으로 나눠 확인'),
  'search keeps category chips',
);
assert.ok(
  pageSrc.includes('분류 칩으로 결과 분해'),
  'search comment mentions chip breakdown',
);
assert.ok(pageSrc.includes('showCuratedFilterChips'), 'hide curated chips if empty');
assert.ok(pageSrc.includes('showHeritageFilterChips'), 'hide heritage chips if empty');
assert.ok(
  pageSrc.includes('해당 섹션 매칭이 있는 권역만'),
  'per-section region chips during search',
);
const goseongHeritage = filterScenicSpotsByQuery(heritage, '고성');
assert.equal(filterScenicSpotsByQuery(curated, '고성').length, 0, '고성 curated 0');
assert.ok(goseongHeritage.length >= 2, '고성 heritage ≥2');
assert.ok(
  new Set(goseongHeritage.map((s) => s.region)).size === 1,
  '고성 heritage single region → no region chip row',
);
const setRegionBlock = pageSrc.slice(
  pageSrc.indexOf('const setRegion = useCallback'),
  pageSrc.indexOf('const setArea = useCallback'),
);
assert.ok(
  setRegionBlock.length > 0 && !setRegionBlock.includes('clearSearchFilter'),
  'region chip must not clear search',
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
