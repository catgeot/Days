import assert from 'node:assert/strict';
import test from 'node:test';

import { getPlaceUrlParam } from '../../src/pages/Home/lib/formatUrlName.js';
import {
  listCityAttractionHubs,
  attractionToSuggestion,
  hubToSuggestion,
  placeUrlSlug,
} from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import {
  normalizeExploreSelectionPin,
  isDomesticMapboxCountryOrProvincePin,
  resolveDomesticMapboxAdminHub,
} from '../../src/pages/Home/lib/explorePlaceNav.js';

test('허브 명소 — getPlaceUrlParam이 SSOT slug 유지 (tour-* 덮어쓰기 0건 / main 대비)', () => {
  let total = 0;
  let tourOverwrite = 0;
  let slugMismatch = 0;
  const samples = [];
  for (const hub of listCityAttractionHubs()) {
    for (const attraction of hub.attractions || []) {
      total += 1;
      const expected = placeUrlSlug(attraction.name_en, attraction.name);
      assert.ok(expected, `missing slug: ${hub.hubId}/${attraction.name}`);
      const row = attractionToSuggestion(hub, attraction);
      const param = getPlaceUrlParam(normalizeExploreSelectionPin(row));
      if (param.startsWith('tour-') && !String(expected).startsWith('tour-')) {
        tourOverwrite += 1;
        samples.push({ hubId: hub.hubId, name: attraction.name, expected, param });
      }
      if (param !== expected) {
        slugMismatch += 1;
        if (samples.length < 8) samples.push({ hubId: hub.hubId, name: attraction.name, expected, param });
      }
    }
  }
  assert.equal(tourOverwrite, 0, `tour URL overwrite: ${JSON.stringify(samples)}`);
  assert.equal(slugMismatch, 0, `slug mismatch ${slugMismatch}/${total}: ${JSON.stringify(samples)}`);
  assert.ok(total >= 4000, `expected ~4291 hub attractions, got ${total}`);
});

test('허브 도시 카드 — hubId slug 유지 (contentId 있어도 tour-* 금지)', () => {
  const drift = [];
  for (const hub of listCityAttractionHubs()) {
    const row = hubToSuggestion(hub);
    if (!row?.contentId) continue;
    const decision = resolveSearchResultSelect(row);
    const expected = String(hub.hubId || row.slug || '').trim();
    if (decision?.param !== expected) {
      drift.push({ hubId: hub.hubId, expected, got: decision?.param });
    }
  }
  assert.equal(drift.length, 0, JSON.stringify(drift.slice(0, 8)));
});

test('고산사 tour attach — Mapbox+tourapi는 tour-127982·127937 유지', () => {
  const hongseong = normalizeExploreSelectionPin({
    name: '홍성 고산사 대웅전',
    source: 'tourapi',
    contentId: '127982',
    lat: 36.4544,
    lng: 126.6608,
  });
  assert.equal(getPlaceUrlParam(hongseong), 'tour-127982');

  const jangheung = normalizeExploreSelectionPin({
    name: '고산사',
    source: 'tourapi',
    contentId: '127937',
    exploreTourAttached: true,
    lat: 34.6415,
    lng: 126.7842,
  });
  assert.equal(getPlaceUrlParam(jangheung), 'tour-127937');
});

test('국내 Mapbox 나라·무매칭 도 — 홈 유지 (mapbox-* URL 금지)', () => {
  assert.equal(
    isDomesticMapboxCountryOrProvincePin({
      id: 'mapbox-country-kr',
      name: 'South Korea',
      lat: 36.5,
      lng: 127.9,
      source: 'mapbox',
      feature_type: 'country',
      country_en: 'South Korea',
    }),
    true,
  );
  assert.equal(
    resolveDomesticMapboxAdminHub({
      id: 'mapbox-gw',
      name: '강원특별자치도',
      lat: 37.8,
      lng: 128.5,
      source: 'mapbox',
      feature_type: 'region',
      country_en: 'South Korea',
    }),
    null,
  );
});

test('Mapbox region 제주특별자치도 — 허브 slug /place/jeju', () => {
  assert.equal(resolveDomesticMapboxAdminHub({ name: '제주특별자치도', source: 'mapbox', feature_type: 'region' })?.hubId, 'jeju');
  const decision = resolveSearchResultSelect({
    id: 'mapbox-jeju-do',
    name: '제주특별자치도',
    lat: 33.4996,
    lng: 126.5312,
    source: 'mapbox',
    feature_type: 'region',
    country: '대한민국',
    country_en: 'South Korea',
    uiPlace: true,
  });
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'jeju');
  assert.ok(!String(decision?.param || '').startsWith('mapbox-'));
});

test('Mapbox country South Korea — 홈 (허브 없음)', () => {
  const decision = resolveSearchResultSelect({
    id: 'mapbox-country-kr',
    name: 'South Korea',
    lat: 36.5,
    lng: 127.9,
    source: 'mapbox',
    feature_type: 'country',
    country_en: 'South Korea',
    uiPlace: true,
  });
  assert.equal(decision?.type, 'home');
});
