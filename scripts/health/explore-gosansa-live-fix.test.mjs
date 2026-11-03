import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import {
  isDomesticMapboxAdminAreaPin,
  normalizeExploreSelectionPin,
  resolveDomesticMapboxAdminHub,
} from '../../src/pages/Home/lib/explorePlaceNav.js';
import { getPlaceUrlParam } from '../../src/pages/Home/lib/formatUrlName.js';
import {
  isKoreaProvinceLevelTourResult,
  isMapboxRegionFeatureAdminPin,
} from '../../src/pages/Home/lib/koreaExploreProvincePlace.js';

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
