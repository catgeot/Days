#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRestaurantMapSearchUrl } from '../../src/shared/search/restaurantMapSearchUrl.js';
import { isExploreRestaurantItem } from '../../src/shared/search/tourRestaurantDetect.js';
import { tourRestaurantToExploreSuggestion } from '../../src/pages/Home/lib/tourRestaurantExploreSuggestion.js';

test('buildRestaurantMapSearchUrl — domestic Naver', () => {
  const url = buildRestaurantMapSearchUrl({
    name: '갯벌의조개 성수역점',
    region: '서울',
    domestic: true,
  });
  assert.match(url, /^https:\/\/map\.naver\.com\/p\/search\//);
  assert.ok(url.includes(encodeURIComponent('갯벌의조개 성수역점 서울')));
});

test('buildRestaurantMapSearchUrl — overseas Google', () => {
  const url = buildRestaurantMapSearchUrl({
    name: 'Tidal Flats Bistro',
    city: 'Tokyo',
    domestic: false,
  });
  assert.match(url, /^https:\/\/www\.google\.com\/maps\/search\/\?api=1&query=/);
});

test('isExploreRestaurantItem — contentTypeId 39 and cat1 A05', () => {
  assert.equal(isExploreRestaurantItem({ contentTypeId: '39' }), true);
  assert.equal(isExploreRestaurantItem({ cat1: 'A05', cat3: 'A05020100' }), true);
  assert.equal(isExploreRestaurantItem({ contentTypeId: '12', cat1: 'A02' }), false);
});

const GETBOL_RESTAURANT_FIXTURES = [
  {
    name: '갯벌의조개 성수역점',
    contentId: '2599001',
    contentTypeId: '39',
    cat1: 'A05',
    cat3: 'A05020100',
    addr1: '서울특별시 성동구 성수동',
    mapy: 37.544,
    mapx: 127.055,
  },
  {
    name: '갯벌의진주',
    contentId: '2599002',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구 무교동',
    mapy: 37.568,
    mapx: 126.982,
  },
  {
    name: '무교동원조낙지전문점 갯벌',
    contentId: '2599003',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 중구 무교동',
    mapy: 37.568,
    mapx: 126.98,
  },
  {
    name: '갯벌낙지수제비',
    contentId: '2599004',
    contentTypeId: '39',
    cat1: 'A05',
    addr1: '서울특별시 강남구',
    mapy: 37.5,
    mapx: 127.03,
  },
];

test('갯벌 대표 식당 4곳 — 식당 배지·외부 URL', () => {
  for (const row of GETBOL_RESTAURANT_FIXTURES) {
    assert.equal(isExploreRestaurantItem(row), true);
    const suggestion = tourRestaurantToExploreSuggestion(
      {
        ...row,
        title: row.name,
        content_id: row.contentId,
        first_image: '',
      },
      { query: '갯벌' },
    );
    assert.equal(suggestion?.badge, '식당');
    assert.equal(suggestion?.kind, 'restaurant');
    assert.match(String(suggestion?.restaurantMapSearchUrl || ''), /^https:\/\/map\.naver\.com\//);
    assert.equal(suggestion?.groupTitle, undefined);
  }
});
