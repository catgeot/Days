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
  overlayGeoFieldsOnVisitedSpot,
  overlayGeoFieldsOnVisitedSpots,
  rowMatchesVisitedSearchQuery,
  visitedRowToSearchSpot,
  visitedSpotNeedsGeoCountry,
} from '../src/pages/Home/lib/visitedPlaceSearch.js';
import { resolveGalleryStockQuery } from '../src/pages/Home/lib/uiPlaceAssetQuery.js';

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
assert.notEqual(spot.country, 'Explore');
assert.notEqual(spot.country_en, 'Explore');
assert.equal(visitedSpotNeedsGeoCountry(spot), true);
assert.ok(!visitedRowToSearchSpot({ ...zakynthosRow, lat: 'x' }));

const hangulEnRow = visitedRowToSearchSpot({
  ...zakynthosRow,
  name_en: '자킨토스',
});
assert.equal(hangulEnRow.name_en, '', 'hangul is not used as name_en');

const exploreExtras = visitedRowToSearchSpot(zakynthosRow, {
  country: 'Explore',
  country_en: 'Explore',
});
assert.equal(exploreExtras.country, '');
assert.equal(exploreExtras.country_en, '');

const greeceHit = {
  name: '자킨토스',
  name_en: 'Zakynthos',
  country: '그리스',
  country_en: 'Greece',
  lat: 37.79,
  lng: 20.9,
};
const overlaid = overlayGeoFieldsOnVisitedSpot(spot, [greeceHit]);
assert.equal(overlaid.country, '그리스');
assert.equal(overlaid.country_en, 'Greece');
assert.equal(overlaid.name_en, 'Zakynthos');
assert.equal(visitedSpotNeedsGeoCountry(overlaid), false);
const gallery = resolveGalleryStockQuery(overlaid);
assert.equal(gallery.primaryQuery, 'Zakynthos');
assert.match(gallery.backupQuery, /Greece/);

const caribbeanSaba = {
  name: '사바섬',
  name_en: 'Saba',
  country: '네덜란드',
  country_en: 'Caribbean Netherlands',
  lat: 17.63,
  lng: -63.23,
};
const sabahVisited = visitedRowToSearchSpot({
  place_id: 'sabah',
  name_ko: '사바',
  name_en: 'Sabah',
  lat: 5.98,
  lng: 116.07,
});
const sabahKept = overlayGeoFieldsOnVisitedSpot(sabahVisited, [caribbeanSaba]);
assert.notEqual(sabahKept.country_en, 'Caribbean Netherlands');
assert.equal(overlayGeoFieldsOnVisitedSpots([spot], [greeceHit])[0].country, '그리스');

const reverseOnly = overlayGeoFieldsOnVisitedSpot(spot, [
  {
    name: '자킨토스',
    name_en: 'Zakynthos',
    country: '그리스',
    country_en: 'Greece',
    lat: 37.787,
    lng: 20.9,
  },
]);
assert.equal(reverseOnly.country, '그리스');
assert.equal(reverseOnly.country_en, 'Greece');
assert.equal(resolveGalleryStockQuery(reverseOnly).primaryQuery, 'Zakynthos');

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
