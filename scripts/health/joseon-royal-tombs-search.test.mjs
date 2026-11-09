import assert from 'node:assert/strict';
import test from 'node:test';

import { getPlaceUrlParam } from '../../src/pages/Home/lib/formatUrlName.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import {
  buildJoseonRoyalTombsCollectiveSuggestions,
  correctJoseonRoyalTombsHub,
  resolveJoseonRoyalTombsCatalogSlugPin,
  resolveJoseonRoyalTombsOfficePlaceRoute,
} from '../../src/pages/Home/lib/joseonRoyalTombsSearch.js';

test('조선왕릉 집합 검색 — 안정 slug·contentId', () => {
  const rows = buildJoseonRoyalTombsCollectiveSuggestions('조선왕릉');
  assert.ok(rows.length >= 3, rows.map((r) => r.name).join(', '));
  const dong = rows.find((r) => /동구릉/.test(r.name));
  assert.ok(dong);
  const pin = { ...dong, lat: dong.lat, lng: dong.lng, uiPlace: true, source: dong.source || 'hub' };
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'donggureung-royal-tombs');
  assert.notEqual(getPlaceUrlParam(decision.spot), 'seoul');
});

test('중부지구 — 동구릉·홍유릉·사릉만 (경찰서 아님)', () => {
  const rows = buildJoseonRoyalTombsCollectiveSuggestions('중부지구');
  assert.ok(rows.length >= 3);
  assert.ok(!rows.some((r) => /경찰/.test(r.name)));
  assert.ok(rows.some((r) => /동구릉/.test(r.name)));
});

test('관리소 Mapbox — search- 대신 대표 왕릉 slug', () => {
  const office = {
    id: 'mapbox-joseon-tombs-office',
    name: '문화재청 궁능유적본부 조선왕릉중부지구관리소',
    lat: 37.4768,
    lng: 127.0045,
    source: 'mapbox',
    country: '대한민국',
    country_en: 'South Korea',
    uiPlace: true,
    parentCity: '서울',
    hubId: 'seoul',
    slug: 'seoul',
    name_en: 'Seoul',
  };
  const route = resolveJoseonRoyalTombsOfficePlaceRoute(office);
  assert.ok(route?.param);
  assert.ok(!route.param.startsWith('search-'));
  assert.notEqual(route.param, 'seoul');

  const decision = resolveSearchResultSelect(office);
  assert.equal(decision?.type, 'place');
  assert.equal(decision.param, route.param);
});

test('hubId 서울 오연결 보정', () => {
  const fixed = correctJoseonRoyalTombsHub({
    name: '국가유산청 궁능유적본부 조선왕릉서부지구관리소, 서오릉관리소',
    hubId: 'seoul',
    parentCity: '서울',
  });
  assert.equal(fixed.hubId, 'goyang');
  assert.equal(fixed.parentCity, '고양');
});

test('donggureung-royal-tombs hydrate — scenic contentId', () => {
  const pin = resolveJoseonRoyalTombsCatalogSlugPin('donggureung-royal-tombs');
  assert.ok(pin);
  assert.equal(String(pin.contentId), '125545');
  assert.equal(pin.hubId, 'guri');
});
