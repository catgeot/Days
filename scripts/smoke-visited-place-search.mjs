#!/usr/bin/env node
/**
 * 자킨토스 검색 #9 — 방문 place_stats 행이 검색 카드로 매칭되는지.
 * 네트워크·Supabase 없음.
 */
import assert from 'node:assert/strict';

import {
  buildPlaceStatsIdentityPayload,
  buildVisitedLookupTokens,
  collapseDuplicateVisitedSpots,
  isSafeVisitedSearchQuery,
  normalizeVisitedSearchKey,
  overlayGeoFieldsOnVisitedSpot,
  overlayGeoFieldsOnVisitedSpots,
  rowMatchesVisitedSearchQuery,
  visitedRowToSearchSpot,
  visitedSpotNeedsGeoCountry,
  hasUsableVisitedCoords,
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
assert.equal(
  visitedRowToSearchSpot({ ...zakynthosRow, lat: 0, lng: 0 }),
  null,
  'Null Island visit row is not a search card',
);
assert.equal(hasUsableVisitedCoords(37.787, 20.9), true);
assert.equal(hasUsableVisitedCoords(0, 0), false);
assert.equal(hasUsableVisitedCoords(null, 20.9), false);

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
assert.equal(
  buildPlaceStatsIdentityPayload({
    name: '자킨토스',
    name_en: 'Zakynthos',
    lat: 0,
    lng: 0,
  }),
  null,
  'Null Island coords are not persisted',
);

const gibackKo = visitedRowToSearchSpot({
  place_id: '기백산',
  name_ko: '기백산',
  name_en: null,
  lat: 35.6874394914,
  lng: 127.7632188894,
  image_url: null,
});
const gibackLatin = visitedRowToSearchSpot({
  place_id: 'sang-won-ri',
  name_ko: '기백산',
  name_en: 'Sang-won-ri',
  lat: 35.6874394914,
  lng: 127.7632188894,
  image_url: 'https://images.unsplash.com/photo-1744058644697-ccb2e002edae',
});
const gibackCollapsed = collapseDuplicateVisitedSpots([gibackLatin, gibackKo]);
assert.equal(gibackCollapsed.length, 1, '같은 기백산·같은 좌표는 카드 하나');
assert.equal(gibackCollapsed[0].slug, '기백산', '한글 place_id가 라틴 슬러그보다 남음');
assert.equal(gibackCollapsed[0].name, '기백산');
const gibackOtherPeak = visitedRowToSearchSpot({
  place_id: 'giback-other',
  name_ko: '기백산',
  name_en: 'Gibaeksan',
  lat: 35.8,
  lng: 127.9,
});
assert.equal(
  collapseDuplicateVisitedSpots([gibackKo, gibackOtherPeak]).length,
  2,
  '좌표가 다르면 합치지 않음',
);
const stockOnly = visitedRowToSearchSpot({
  place_id: 'sang-won-ri',
  name_ko: '기백산',
  name_en: 'Sang-won-ri',
  lat: 35.6874394914,
  lng: 127.7632188894,
  image_url: 'https://images.unsplash.com/photo-1744058644697-ccb2e002edae',
});
const realPhoto = visitedRowToSearchSpot({
  place_id: 'other-slug',
  name_ko: '기백산',
  name_en: 'Gibaeksan',
  lat: 35.6874394914,
  lng: 127.7632188894,
  image_url: 'https://example.com/gibaek.jpg',
});
const preferReal = collapseDuplicateVisitedSpots([stockOnly, realPhoto]);
assert.equal(preferReal.length, 1);
assert.equal(preferReal[0].image_url, 'https://example.com/gibaek.jpg');

console.log('smoke:visited-place-search OK');
