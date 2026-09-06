#!/usr/bin/env node
/**
 * 자킨토스 검색 #9 — 방문 place_stats 행이 검색 카드로 매칭되는지.
 * 네트워크·Supabase 없음.
 */
import assert from 'node:assert/strict';

import {
  buildPlaceStatsIdentityPayload,
  buildVisitedLookupTokens,
  isSafeVisitedSearchQuery,
  normalizeVisitedSearchKey,
  rowMatchesVisitedSearchQuery,
  visitedRowToSearchSpot,
} from '../src/pages/Home/lib/visitedPlaceSearch.js';

assert.equal(isSafeVisitedSearchQuery('자킨토스'), true);
assert.equal(isSafeVisitedSearchQuery('a'), false);
assert.equal(isSafeVisitedSearchQuery('foo,bar'), false);
assert.equal(normalizeVisitedSearchKey('  자킨 토스 '), '자킨토스');

const zakynthosRow = {
  place_id: 'zakynthos',
  name_ko: '자킨토스',
  name_en: 'Zakynthos',
  lat: 37.787,
  lng: 20.9,
  image_url: 'https://example.com/z.jpg',
};

assert.equal(rowMatchesVisitedSearchQuery(zakynthosRow, '자킨토스'), true);
assert.equal(rowMatchesVisitedSearchQuery(zakynthosRow, 'Zakynthos'), true);
assert.equal(rowMatchesVisitedSearchQuery(zakynthosRow, 'zakynthos'), true);
assert.equal(rowMatchesVisitedSearchQuery(zakynthosRow, '파로스'), false);
assert.equal(rowMatchesVisitedSearchQuery(zakynthosRow, '자킨'), false);

const tokens = buildVisitedLookupTokens('자킨토스');
assert.ok(tokens.includes('자킨토스'));
assert.equal(tokens.includes('zakynthos'), false, 'Hangul does not slugify to latin');

const spot = visitedRowToSearchSpot(zakynthosRow, { desc: '이오니아 해변' });
assert.equal(spot.source, 'visited');
assert.equal(spot.uiPlace, true);
assert.equal(spot.name, '자킨토스');
assert.equal(spot.name_en, 'Zakynthos');
assert.equal(spot.slug, 'zakynthos');
assert.equal(spot.desc, '이오니아 해변');
assert.equal(spot.badge, '장소');
assert.ok(!visitedRowToSearchSpot({ ...zakynthosRow, lat: 'x' }));

const identity = buildPlaceStatsIdentityPayload({
  slug: 'zakynthos',
  name: '자킨토스',
  name_en: 'Zakynthos',
  originalQuery: '자킨토스',
  lat: 37.787,
  lng: 20.9,
  uiPlace: true,
});
assert.equal(identity.place_id, 'zakynthos');
assert.equal(identity.name_ko, '자킨토스');
assert.equal(identity.name_en, 'Zakynthos');
assert.equal(identity.source, 'visit');
assert.equal(
  buildPlaceStatsIdentityPayload({ name: '자킨토스', name_en: 'Zakynthos' }),
  null,
  'coords required',
);

console.log('smoke:visited-place-search OK');
