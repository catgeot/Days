#!/usr/bin/env node
import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRestaurantMapSearchUrl } from '../../src/shared/search/restaurantMapSearchUrl.js';
import {
  buildRestaurantMapOutboundCueCopy,
  detectRestaurantMapProviderFromHref,
  resolveRestaurantMapProvider,
} from '../../src/shared/search/restaurantMapProvider.js';
import { isExploreRestaurantItem } from '../../src/shared/search/tourRestaurantDetect.js';
import { tourRestaurantToExploreSuggestion } from '../../src/pages/Home/lib/tourRestaurantExploreSuggestion.js';

const tKo = (key, opts = {}) => {
  const dict = {
    'home.explore.restaurantMapReviewsCta': '지도·리뷰 보기 ↗',
    'home.explore.restaurantMapProviderNaver': '네이버 지도',
    'home.explore.restaurantMapProviderGoogle': 'Google 지도',
  };
  if (key === 'home.explore.restaurantMapReviewsAria') {
    return `${opts.name} — 새 탭에서 ${opts.provider} 열기`;
  }
  return dict[key] ?? opts.defaultValue ?? key;
};

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

test('resolveRestaurantMapProvider — href and domestic item', () => {
  const naver = 'https://map.naver.com/p/search/foo';
  const google = 'https://www.google.com/maps/search/?api=1&query=foo';
  assert.equal(detectRestaurantMapProviderFromHref(naver), 'naver');
  assert.equal(detectRestaurantMapProviderFromHref(google), 'google');
  assert.equal(resolveRestaurantMapProvider({ addr1: '서울특별시' }, naver), 'naver');
  assert.equal(resolveRestaurantMapProvider({ country: 'Japan' }, google), 'google');
  assert.equal(resolveRestaurantMapProvider({ country: 'Japan' }), 'google');
});

test('buildRestaurantMapOutboundCueCopy — CTA·aria·provider 문구', () => {
  const domestic = buildRestaurantMapSearchUrl({
    name: '전주 비빔밥',
    region: '전주',
    domestic: true,
  });
  const domesticCopy = buildRestaurantMapOutboundCueCopy(tKo, {
    name: '전주 한옥비빔밥',
    href: domestic,
    item: { addr1: '전북특별자치도 전주시' },
  });
  assert.equal(domesticCopy.cta, '지도·리뷰 보기 ↗');
  assert.equal(domesticCopy.providerLabel, '네이버 지도');
  assert.match(domesticCopy.aria, /새 탭에서 네이버 지도 열기/);

  const overseasUrl = buildRestaurantMapSearchUrl({
    name: 'Ichiran Ramen',
    city: 'Tokyo',
    domestic: false,
  });
  const overseasCopy = buildRestaurantMapOutboundCueCopy(tKo, {
    name: 'Ichiran Ramen',
    href: overseasUrl,
    item: { country: 'Japan' },
  });
  assert.equal(overseasCopy.providerLabel, 'Google 지도');
  assert.match(overseasCopy.aria, /Google 지도/);
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
