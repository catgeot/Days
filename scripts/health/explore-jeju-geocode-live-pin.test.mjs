import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import {
  attachKoreaTourContentToExplorePin,
  normalizeExploreSelectionPin,
  resolveDomesticMapboxAdminHub,
  shouldRouteDomesticExplorePinToPlace,
} from '../../src/pages/Home/lib/explorePlaceNav.js';
import { getPlaceUrlParam } from '../../src/pages/Home/lib/formatUrlName.js';

/** LIVE gateo.kr «제주특별자치도» 첫 행 — Geocoding v5 merge (2026-11 Playwright 캡처) */
export const LIVE_JEJU_DO_GEOCODE_PIN = {
  id: 'geocode-region.115836',
  kind: 'city',
  badge: '장소',
  name: '제주특별자치도',
  name_en: 'Jeju-do',
  country: '대한민국',
  country_en: 'South Korea',
  lat: 33.499829,
  lng: 126.53139,
  mapboxId: 'region.115836',
  source: 'mapbox-geocode',
  uiPlace: true,
  slug: 'jeju-do',
};

test('LIVE Jeju-do geocode pin — /place/jeju (not home globe)', () => {
  const pin = LIVE_JEJU_DO_GEOCODE_PIN;
  assert.equal(resolveDomesticMapboxAdminHub(pin)?.hubId, 'jeju');
  assert.equal(shouldRouteDomesticExplorePinToPlace(pin), true);
  const normalized = normalizeExploreSelectionPin(pin);
  assert.equal(getPlaceUrlParam(normalized), 'jeju');
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'jeju');
});

test('LIVE Jeju-do geocode pin — country 비어도 좌표로 /place/jeju', () => {
  const pin = { ...LIVE_JEJU_DO_GEOCODE_PIN, country: '', country_en: '' };
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'jeju');
});

test('LIVE Jeju-do — suggestion tap chain (attach·normalize·resolve)', async () => {
  let pin = LIVE_JEJU_DO_GEOCODE_PIN;
  pin = await attachKoreaTourContentToExplorePin(pin);
  pin = normalizeExploreSelectionPin(pin);
  const decision = resolveSearchResultSelect(pin);
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'jeju');
});
