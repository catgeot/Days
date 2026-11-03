import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import {
  isDomesticMapboxAdminAreaPin,
  normalizeExploreSelectionPin,
  resolveDomesticMapboxAdminHub,
  shouldRouteDomesticExplorePinToPlace,
} from '../../src/pages/Home/lib/explorePlaceNav.js';
import { getPlaceUrlParam } from '../../src/pages/Home/lib/formatUrlName.js';
import {
  isKoreaProvinceLevelTourResult,
  isMapboxRegionFeatureAdminPin,
} from '../../src/pages/Home/lib/koreaExploreProvincePlace.js';
import { tourRowTitleMatchesCompactQuery } from '../../src/pages/Home/lib/koreaTourAttractionTitleMatch.js';
import { collectKoreaTourTitleSearchCandidates } from '../../src/pages/Home/lib/exploreKoreaTourTitleCandidates.js';

test('Mapbox region feature — 고산사 오분류는 admin 아님 (홈 튕김 방지)', () => {
  const pin = {
    id: 'mapbox-gosansa-misregion',
    name: '고산사',
    lat: 34.6415,
    lng: 126.7842,
    source: 'mapbox',
    feature_type: 'region',
    country_en: 'South Korea',
    uiPlace: true,
  };
  assert.equal(isMapboxRegionFeatureAdminPin(pin), false);
  assert.equal(isDomesticMapboxAdminAreaPin(pin), false);
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.notEqual(decision?.param, '/');
});

test('Mapbox place feature — 제주특별자치도·Jeju-do → /place/jeju', () => {
  for (const name of ['제주특별자치도', 'Jeju-do']) {
    const pin = {
      id: `mapbox-jeju-${name}`,
      name,
      lat: 33.4996,
      lng: 126.5312,
      source: 'mapbox',
      feature_type: 'place',
      country_en: 'South Korea',
      uiPlace: true,
    };
    assert.ok(isDomesticMapboxAdminAreaPin(pin), name);
    assert.equal(resolveDomesticMapboxAdminHub(pin)?.hubId, 'jeju', name);
    const normalized = normalizeExploreSelectionPin(pin);
    assert.equal(getPlaceUrlParam(normalized), 'jeju', name);
    const decision = resolveSearchResultSelect(pin);
    assert.equal(decision?.type, 'place', name);
    assert.equal(decision?.param, 'jeju', name);
  }
});

test('TourAPI 시·도명 — 강원도·강원특별자치도는 /place/tour-* 금지·홈', () => {
  for (const name of ['강원특별자치도', '강원도']) {
    const pin = {
      id: 'tour-gw',
      name,
      source: 'tourapi',
      contentId: '2714533',
      lat: 37.8,
      lng: 128.5,
      country_en: 'South Korea',
      uiPlace: true,
    };
    assert.ok(isKoreaProvinceLevelTourResult(pin), name);
    const decision = resolveSearchResultSelect(pin);
    assert.equal(decision?.type, 'home', name);
  }
});

test('tourRowTitleMatchesCompactQuery — 고산사(홍성) exact·역방향·홍성 고산사', () => {
  const row = { title: '고산사(홍성)', name: '고산사(홍성)' };
  assert.ok(tourRowTitleMatchesCompactQuery(row, '고산사(홍성)'));
  assert.ok(tourRowTitleMatchesCompactQuery(row, '고산사'));
  assert.ok(tourRowTitleMatchesCompactQuery(row, '홍성 고산사'));
  assert.equal(tourRowTitleMatchesCompactQuery(row, '고산사(장흥)'), false);
});

test('collectKoreaTourTitleSearchCandidates — 고산사(홍성) Enter · 코스 2677792 미포함', async () => {
  const rows = await collectKoreaTourTitleSearchCandidates('고산사(홍성)', {
    lookupRows: async () => [
      {
        title: '고산사(홍성)',
        name: '고산사(홍성)',
        contentId: '125901',
        lat: 36.55,
        lng: 126.54,
        addr1: '충청남도 홍성군',
      },
      {
        title: '홍성 고산사 대웅전',
        name: '홍성 고산사 대웅전',
        contentId: '2677792',
        lat: 36.6,
        lng: 126.66,
        addr1: '충청남도 홍성군',
      },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.contentId, '125901');
  assert.equal(rows[0]?.slug, 'tour-125901');
});

test('collectKoreaTourTitleSearchCandidates — 홍성 고산사 → 125901', async () => {
  const rows = await collectKoreaTourTitleSearchCandidates('홍성 고산사', {
    lookupRows: async () => [
      {
        title: '고산사(홍성)',
        name: '고산사(홍성)',
        contentId: '125901',
        lat: 36.55,
        lng: 126.54,
        addr1: '충청남도 홍성군',
      },
    ],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.contentId, '125901');
});

test('shouldRouteDomesticExplorePinToPlace — 제주 place feature 허브 우선(홈 금지)', () => {
  const pin = {
    id: 'mapbox-jeju-place',
    name: '제주특별자치도 Jeju-do',
    lat: 33.4996,
    lng: 126.5312,
    source: 'mapbox',
    feature_type: 'place',
    country_en: 'South Korea',
  };
  assert.equal(shouldRouteDomesticExplorePinToPlace(pin), true);
  const normalized = normalizeExploreSelectionPin(pin);
  assert.equal(getPlaceUrlParam(normalized), 'jeju');
});
