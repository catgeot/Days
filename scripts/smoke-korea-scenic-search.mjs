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

const libSrc = readFileSync(
  join(__dirname, '../src/pages/Home/lib/koreaTourAttractions.js'),
  'utf8',
);
assert.ok(libSrc.includes('title.ilike.'), 'DB title ilike');
assert.ok(libSrc.includes('searchQuery'), 'fetch accepts searchQuery');

console.log('smoke-korea-scenic-search: PASS');
