#!/usr/bin/env node
/**
 * 홈 검색 = /explore SearchDiscoveryModal → buildLocalSearchSuggestions + runExploreHybridSuggestUpdate.
 * 갯벌 집합은 TourAPI title·Mapbox 부분일치 음식점에 덮이지 않아야 함.
 */
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildLocalSearchSuggestions, buildHybridSearchSuggestions } from '../../src/pages/Home/lib/searchSuggestions.js';
import { buildExploreSiteSearchHybridSuggestions } from '../../src/pages/Home/lib/exploreSiteSearchHybrid.js';
import { runExploreHybridSuggestUpdate } from '../../src/pages/Home/lib/exploreHybridSuggestUpdate.js';
import { normalizeExploreSelectionPin } from '../../src/pages/Home/lib/explorePlaceNav.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';

const REGRESSION_TOP = {
  경복궁: ['서울', '경복궁', '남산서울타워'],
  한라산: ['한라산국립공원'],
  제주: ['제주', '제주시', '용두암'],
  파리: ['파리', '에펠탑', '루브르 박물관'],
};

function placeParam(item) {
  return resolveSearchResultSelect(normalizeExploreSelectionPin(item));
}

function assertNoRestaurantNoise(rows) {
  for (const row of rows) {
    const name = String(row?.name || '');
    assert.ok(!/횟집|회집|팰리스|스타일/.test(name), `unexpected restaurant noise: ${name}`);
  }
}

test('갯벌 — local·hybrid·site hybrid·debounced paint (홈=/explore 동일 경로)', async () => {
  const local = buildLocalSearchSuggestions('갯벌');
  assert.equal(local.length, 3, 'local 3 UNESCO');
  assertNoRestaurantNoise(local);
  for (const row of local) {
    assert.equal(placeParam(row)?.type, 'place', row.name);
  }
  assert.match(String(placeParam(local[0])?.param || ''), /^(tour-2615234|tour-575607|tour-126730|gochang-tidal-flat)$/);

  const hybrid = await buildHybridSearchSuggestions('갯벌');
  assert.equal(hybrid.length, 3, 'hybrid without TourAPI noise');
  assertNoRestaurantNoise(hybrid);

  const siteHybrid = await buildExploreSiteSearchHybridSuggestions('갯벌', { locale: 'ko' });
  assert.equal(siteHybrid.length, 3, 'site search hybrid');
  assertNoRestaurantNoise(siteHybrid);

  const paints = [];
  await runExploreHybridSuggestUpdate('갯벌', 1, () => 1, {
    onPaint: (items) => paints.push(items.map((i) => i.name)),
  });
  assert.deepEqual(paints, [['고창 갯벌', '신안갯벌(증도)', '순천만습지(보성·순천갯벌)']]);
});

test('회귀 — 대표 검색어 상위 제안 순서', () => {
  for (const [query, expected] of Object.entries(REGRESSION_TOP)) {
    const names = buildLocalSearchSuggestions(query).slice(0, expected.length).map((r) => r.name);
    assert.deepEqual(names, expected, query);
  }
});
