#!/usr/bin/env node
/**
 * 홈 검색 = /explore SearchDiscoveryModal → buildLocalSearchSuggestions + runExploreHybridSuggestUpdate.
 * 갯벌 — 유네스코 3건은 /place, 음식점은 external.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalSearchSuggestions, buildHybridSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { buildExploreSiteSearchHybridSuggestions } from '../../src/pages/Home/lib/exploreSiteSearchHybrid.js';
import { runExploreHybridSuggestUpdate } from '../../src/pages/Home/lib/exploreHybridSuggestUpdate.js';
import { normalizeExploreSelectionPin } from '../../src/pages/Home/lib/explorePlaceNav.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { isExploreRestaurantItem } from '../../src/shared/search/tourRestaurantDetect.js';

const GETBOL_TOUR_FIXTURE = [
  {
    title: '갯벌의조개 성수역점',
    contentId: '2599001',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 성동구',
    mapy: 37.544,
    mapx: 127.055,
  },
  {
    title: '갯벌의진주',
    contentId: '2599002',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구',
    mapy: 37.568,
    mapx: 126.982,
  },
  {
    title: '무교동원조낙지전문점 갯벌',
    contentId: '2599003',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구 무교동',
    mapy: 37.568,
    mapx: 126.98,
  },
  {
    title: '갯벌낙지수제비',
    contentId: '2599004',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 강남구',
    mapy: 37.5,
    mapx: 127.03,
  },
];

const REGRESSION_TOP = {
  경복궁: ['서울', '경복궁', '남산서울타워'],
  한라산: ['한라산국립공원'],
  제주: ['제주', '제주시', '용두암'],
  파리: ['파리', '에펠탑', '루브르 박물관'],
};

function placeParam(item) {
  return resolveSearchResultSelect(normalizeExploreSelectionPin(item));
}

test('갯벌 — local·hybrid·site hybrid·debounced paint', async () => {
  const local = buildLocalSearchSuggestions('갯벌');
  assert.equal(local.length, 3, 'local 3 UNESCO');
  for (const row of local) {
    assert.equal(isExploreRestaurantItem(row), false);
    assert.equal(placeParam(row)?.type, 'place', row.name);
  }
  assert.match(String(placeParam(local[0])?.param || ''), /^(tour-2615234|tour-575607|tour-126730|gochang-tidal-flat)$/);

  const hybrid = await buildHybridSearchSuggestions('갯벌', {
    restaurantLookupItems: async () => GETBOL_TOUR_FIXTURE,
  });
  assert.ok(hybrid.length >= 3);
  const restaurants = hybrid.filter((r) => isExploreRestaurantItem(r));
  assert.ok(restaurants.length >= 1, 'hybrid merges restaurant keyword rows');
  for (const row of restaurants) {
    assert.equal(placeParam(row)?.type, 'external', row.name);
  }

  const siteHybrid = await buildExploreSiteSearchHybridSuggestions('갯벌', { locale: 'ko' });
  assert.ok(siteHybrid.length >= 3);

  const paints = [];
  await runExploreHybridSuggestUpdate(
    '갯벌',
    1,
    () => 1,
    {
      onPaint: (items) => paints.push(items.map((i) => i.name)),
    },
    {
      buildHybrid: async (q) =>
        buildHybridSearchSuggestions(q, {
          restaurantLookupItems: async () => GETBOL_TOUR_FIXTURE,
        }),
    },
  );
  assert.ok(paints[0]?.length >= 3);
  assert.ok(paints[0].some((n) => /갯벌의조개|갯벌의진주/.test(n)));
});

test('회귀 — 대표 검색어 상위 제안 순서', () => {
  for (const [query, expected] of Object.entries(REGRESSION_TOP)) {
    const names = buildLocalSearchSuggestions(query).slice(0, expected.length).map((r) => r.name);
    assert.deepEqual(names, expected, query);
  }
});
