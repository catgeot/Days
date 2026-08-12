/**
 * 축제홈·명승홈 최근 검색어 localStorage SSOT 스모크.
 *   npm run smoke:korea-recent-searches
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

/** @type {Map<string, string>} */
const mem = new Map();
globalThis.localStorage = {
  getItem: (k) => (mem.has(k) ? mem.get(k) : null),
  setItem: (k, v) => {
    mem.set(k, String(v));
  },
  removeItem: (k) => {
    mem.delete(k);
  },
};

const {
  FESTIVAL_RECENT_SEARCH_KEY,
  SCENIC_RECENT_SEARCH_KEY,
  MAX_RECENT_SEARCHES,
  loadRecentSearches,
  pushRecentSearch,
  removeRecentSearch,
  clearRecentSearches,
  filterRecentSearches,
} = await import('../src/pages/Korea/koreaRecentSearches.js');

assert.equal(
  FESTIVAL_RECENT_SEARCH_KEY,
  'gateo:korea-festivals:v1:recent-searches',
);
assert.equal(SCENIC_RECENT_SEARCH_KEY, 'gateo:korea-scenic:v1:recent-searches');
assert.ok(MAX_RECENT_SEARCHES >= 8);

assert.deepEqual(loadRecentSearches(FESTIVAL_RECENT_SEARCH_KEY), []);

let list = pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, '  화천  ');
assert.deepEqual(list, ['화천']);
list = pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, '보령');
assert.deepEqual(list, ['보령', '화천']);
list = pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, '화천');
assert.deepEqual(list, ['화천', '보령'], '중복은 맨 앞으로');
list = pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, 'HWA');
list = pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, 'hwa');
assert.equal(list[0], 'hwa', '대소문자 무시 중복');
assert.equal(list.filter((x) => x.toLowerCase() === 'hwa').length, 1);

for (let i = 0; i < MAX_RECENT_SEARCHES + 5; i += 1) {
  pushRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, `q${i}`);
}
assert.equal(
  loadRecentSearches(FESTIVAL_RECENT_SEARCH_KEY).length,
  MAX_RECENT_SEARCHES,
);

list = removeRecentSearch(FESTIVAL_RECENT_SEARCH_KEY, 'q0');
assert.ok(!list.includes('q0'));
assert.deepEqual(clearRecentSearches(FESTIVAL_RECENT_SEARCH_KEY), []);

pushRecentSearch(SCENIC_RECENT_SEARCH_KEY, '화엄사');
pushRecentSearch(SCENIC_RECENT_SEARCH_KEY, '경포');
assert.deepEqual(loadRecentSearches(SCENIC_RECENT_SEARCH_KEY), [
  '경포',
  '화엄사',
]);
assert.deepEqual(
  loadRecentSearches(FESTIVAL_RECENT_SEARCH_KEY),
  [],
  '축제·명승 키 분리',
);

const filtered = filterRecentSearches(['화엄사', '경포대', '설악'], '엄');
assert.deepEqual(filtered, ['화엄사']);
assert.deepEqual(filterRecentSearches(['화엄사', '경포'], ''), [
  '화엄사',
  '경포',
]);
assert.deepEqual(filterRecentSearches(['ABC'], 'ab'), ['ABC']);

const festivalSrc = readFileSync(
  join(root, 'src/pages/Korea/index.jsx'),
  'utf8',
);
const scenicSrc = readFileSync(
  join(root, 'src/pages/KoreaTheme/ScenicPage.jsx'),
  'utf8',
);
const suggestSrc = readFileSync(
  join(root, 'src/pages/Korea/RecentSearchSuggestions.jsx'),
  'utf8',
);

assert.ok(festivalSrc.includes('RecentSearchSuggestions'));
assert.ok(festivalSrc.includes('FESTIVAL_RECENT_SEARCH_KEY'));
assert.ok(festivalSrc.includes('openSearchSuggestions'));
assert.ok(festivalSrc.includes('onRequestClose'));
assert.ok(!festivalSrc.includes('searchSuggestOpen || searchOpen'));
assert.ok(scenicSrc.includes('RecentSearchSuggestions'));
assert.ok(scenicSrc.includes('SCENIC_RECENT_SEARCH_KEY'));
assert.ok(scenicSrc.includes('openSearchSuggestions'));
assert.ok(scenicSrc.includes('onRequestClose'));
assert.ok(!scenicSrc.includes('searchSuggestOpen || searchOpen'));
assert.ok(suggestSrc.includes('최근 검색'));
assert.ok(suggestSrc.includes('전체 지우기'));
assert.ok(suggestSrc.includes('pointerdown'));
assert.ok(suggestSrc.includes('onRequestClose'));

console.log('smoke-korea-recent-searches: PASS');
