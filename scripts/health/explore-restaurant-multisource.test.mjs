#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { featureToSuggestion } from '../../src/pages/Home/lib/mapboxSearchBox.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { shouldEnsurePlaceChatIntroForLocation } from '../../src/shared/place/placeChatIntroEligibility.js';
import { isPlacePlannerEligible } from '../../src/shared/place/placePlannerEligibility.js';
import { isExploreRestaurantItem } from '../../src/shared/search/tourRestaurantDetect.js';
import {
  collectPoiCategoryTokens,
  isPoiCategoryRestaurant,
} from '../../src/shared/search/poiRestaurantCategory.js';
import { stampExploreRestaurantSuggestion } from '../../src/shared/search/exploreRestaurantStamp.js';
import { collectExploreRestaurantKeywordMatches } from '../../src/pages/Home/lib/exploreRestaurantSearchCandidates.js';

function mapboxPoiFeature({
  name,
  placeFormatted,
  categoryIds,
  categories,
  lng,
  lat,
  country = 'Japan',
  id = 'mapbox-poi',
}) {
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [lng, lat] },
    properties: {
      mapbox_id: id,
      feature_type: 'poi',
      name,
      place_formatted: placeFormatted,
      poi_category_ids: categoryIds,
      poi_category: categories,
      context: { country: { name: country }, place: { name: placeFormatted.split(',')[0] } },
    },
  };
}

test('Mapbox poi_category_ids restaurant — 식당 배지·Google 지도·외부 이동', () => {
  const ichiran = featureToSuggestion(
    mapboxPoiFeature({
      name: 'Ichiran Ramen',
      placeFormatted: 'Shibuya, Tokyo, Japan',
      categoryIds: ['restaurant', 'ramen'],
      categories: ['restaurant', 'ramen'],
      lng: 139.7,
      lat: 35.66,
      country: 'Japan',
    }),
    { source: 'mapbox' },
  );
  assert.equal(ichiran.badge, '식당');
  assert.equal(ichiran.kind, 'restaurant');
  assert.equal(isExploreRestaurantItem(ichiran), true);
  const decision = resolveSearchResultSelect(ichiran);
  assert.equal(decision?.type, 'external');
  assert.match(decision?.href || '', /^https:\/\/www\.google\.com\/maps\/search\//);
  assert.equal(shouldEnsurePlaceChatIntroForLocation(ichiran), false);
  assert.equal(isPlacePlannerEligible(ichiran), false);
});

test('Mapbox restaurant — 서울 CoCo Ichibanya 네이버', () => {
  const coco = featureToSuggestion(
    mapboxPoiFeature({
      name: 'CoCo Ichibanya',
      placeFormatted: 'Jongno, Seoul, South Korea',
      categoryIds: ['restaurant', 'fast_food'],
      categories: ['restaurant', 'fast food'],
      lng: 126.98,
      lat: 37.57,
      country: 'South Korea',
      id: 'coco-seoul',
    }),
    { source: 'mapbox' },
  );
  assert.equal(coco.badge, '식당');
  const decision = resolveSearchResultSelect(coco);
  assert.match(decision?.href || '', /^https:\/\/map\.naver\.com\//);
});

test('Mapbox tourist_attraction only — 명소 유지', () => {
  const sight = featureToSuggestion(
    mapboxPoiFeature({
      name: 'Tokyo Tower',
      placeFormatted: 'Minato, Tokyo, Japan',
      categoryIds: ['tourist_attraction'],
      categories: ['tourist attraction'],
      lng: 139.74,
      lat: 35.66,
      id: 'tower',
    }),
    { source: 'mapbox' },
  );
  assert.equal(sight.badge, '명소');
  assert.equal(isExploreRestaurantItem(sight), false);
});

test('Google place_types — restaurant 판별', () => {
  assert.equal(
    isExploreRestaurantItem({
      name: 'ICHIRAN Brooklyn',
      place_types: ['restaurant', 'food', 'point_of_interest'],
      country: 'United States',
      lat: 40.68,
      lng: -73.98,
    }),
    true,
  );
  const stamped = stampExploreRestaurantSuggestion({
    name: 'ICHIRAN Brooklyn',
    place_types: ['restaurant', 'food'],
    country: 'United States',
    country_en: 'United States',
    lat: 40.68,
    lng: -73.98,
    source: 'geocode',
  });
  assert.match(String(stamped.restaurantMapSearchUrl), /^https:\/\/www\.google\.com\/maps\/search\//);
});

test('Kakao category_group_code FD6 — restaurant', () => {
  assert.equal(
    isExploreRestaurantItem({
      name: '강릉 순두부 맛집',
      category_group_code: 'FD6',
      addr1: '강원특별자치도 강릉시',
      lat: 37.75,
      lng: 128.9,
    }),
    true,
  );
  const cats = collectPoiCategoryTokens({ category_group_code: 'FD6' });
  assert.equal(isPoiCategoryRestaurant(cats), true);
});

test('collectExploreRestaurantKeywordMatches — 강릉 순두부 regional mock TourAPI', async () => {
  const rows = await collectExploreRestaurantKeywordMatches('강릉 순두부', {
    lookupItems: async () => [
      {
        title: '강릉해변 순두부',
        contentId: '399001',
        contentTypeId: '39',
        cat1: 'A05',
        addr1: '강원특별자치도 강릉시',
        mapy: 37.76,
        mapx: 128.9,
      },
      {
        title: '속초 순두부',
        contentId: '399002',
        contentTypeId: '39',
        cat1: 'A05',
        addr1: '강원특별자치도 속초시',
        mapy: 38.2,
        mapx: 128.6,
      },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, '강릉해변 순두부');
  assert.equal(rows[0].badge, '식당');
  const decision = resolveSearchResultSelect(rows[0]);
  assert.equal(decision?.type, 'external');
  assert.match(decision?.href || '', /^https:\/\/map\.naver\.com\//);
});
