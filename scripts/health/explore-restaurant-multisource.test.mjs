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
  assert.equal(isPlacePlannerEligible(ichiran), true);
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

test('Tokyo Tower — restaurant+food+tourist 혼합 카테고리면 식당 아님', () => {
  const tower = featureToSuggestion(
    mapboxPoiFeature({
      name: 'Tokyo Tower',
      placeFormatted: 'Minato, Tokyo, Japan',
      categoryIds: ['tourist_attraction', 'restaurant', 'food'],
      categories: ['tourist attraction', 'restaurant', 'food'],
      lng: 139.7454,
      lat: 35.6586,
      id: 'tower-mix',
    }),
    { source: 'mapbox' },
  );
  assert.equal(tower.badge, '명소');
  assert.equal(tower.kind, 'attraction');
  assert.equal(isExploreRestaurantItem(tower), false);
});

test('Tokyo Tower — food만 있어도 식당 아님', () => {
  const tower = featureToSuggestion(
    mapboxPoiFeature({
      name: 'Tokyo Tower',
      placeFormatted: 'Minato, Tokyo, Japan',
      categoryIds: ['food'],
      categories: ['food'],
      lng: 139.7454,
      lat: 35.6586,
      id: 'tower-food-only',
    }),
    { source: 'mapbox' },
  );
  assert.equal(tower.badge, '명소');
  assert.equal(isExploreRestaurantItem(tower), false);
});

test('허브·Tour 명소(12) — Mapbox 식당 카테고리로 덮어쓰지 않음', () => {
  const hubPin = stampExploreRestaurantSuggestion({
    name: '경복궁',
    slug: 'gyeongbokgung-palace',
    source: 'hub',
    badge: '명소',
    kind: 'attraction',
    lat: 37.5796,
    lng: 126.977,
    poi_category_ids: ['restaurant', 'food'],
  });
  assert.equal(hubPin.badge, '명소');
  assert.equal(isExploreRestaurantItem(hubPin), false);
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

const MAPBOX_TOKEN =
  typeof process !== 'undefined'
    ? String(process.env.VITE_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN || '').trim()
    : '';

test(
  'LIVE Mapbox forward — Tokyo Tower 식당 아님 · Ichiran·강릉 순두부 식당(토큰 있을 때만)',
  { skip: !MAPBOX_TOKEN },
  async () => {
    const { searchBoxForward } = await import('../../src/pages/Home/lib/mapboxSearchBox.js');
    const towerHits = await searchBoxForward('Tokyo Tower', { limit: 6, language: 'en' });
    const tower = (towerHits || []).find((h) => /tokyo tower/i.test(String(h?.name || '')));
    if (!tower) {
      console.log(
        '# LIVE Mapbox — Tokyo Tower 히트 없음(토큰·지역 제한으로 스킵):',
        (towerHits || []).map((h) => h.name).join(', '),
      );
      return;
    }
    assert.equal(isExploreRestaurantItem(tower), false, `Tokyo Tower가 식당으로 분류됨: ${tower.badge}`);
    assert.equal(tower.badge, '명소');

    const ichiranEn = await searchBoxForward('Ichiran Ramen', {
      limit: 8,
      language: 'en',
      proximity: [139.7, 35.66],
    });
    const ichiranHit = (ichiranEn || []).find(
      (h) => isExploreRestaurantItem(h) && /ichiran/i.test(String(h?.name || '')),
    );
    if (ichiranHit) {
      assert.equal(ichiranHit.badge, '식당');
    } else {
      console.log(
        '# LIVE Ichiran Ramen — 일치 히트 없음(스킵):',
        (ichiranEn || []).map((h) => `${h.name}/${h.badge}`).join(', '),
      );
    }

    const sundubuHits = await searchBoxForward('순두부', {
      limit: 8,
      language: 'ko',
      country: 'kr',
      proximity: [128.896, 37.751],
    });
    const sundubuRestaurant = (sundubuHits || []).filter((h) => isExploreRestaurantItem(h));
    if (sundubuRestaurant.length) {
      for (const row of sundubuRestaurant) assert.equal(row.badge, '식당');
    } else {
      console.log(
        '# LIVE 강릉 근처 순두부 — 식당 카테고리 히트 없음(스킵):',
        (sundubuHits || []).map((h) => `${h.name}/${h.badge}`).join(', '),
      );
    }
  },
);
