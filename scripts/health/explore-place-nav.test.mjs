import assert from 'node:assert/strict';
import test from 'node:test';

import { getPlaceUrlParam, koreaTourContentPlaceParam } from '../../src/pages/Home/lib/formatUrlName.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';
import { shouldRouteDomesticExplorePinToPlace } from '../../src/pages/Home/lib/explorePlaceNav.js';
import { buildExploreSearchLocationLine, getLocalizedParentCityLabel } from '../../src/components/PlaceCard/common/locationDisplay.js';

test('koreaTourContentPlaceParam — contentId별 고유 URL', () => {
  assert.equal(koreaTourContentPlaceParam('127982'), 'tour-127982');
  assert.equal(getPlaceUrlParam({ contentId: '127982', country_en: 'South Korea', name: '고산사' }), 'tour-127982');
});

test('resolveSearchResultSelect — 국내 Mapbox 한글 POI는 /place (홈 금지)', () => {
  const decision = resolveSearchResultSelect({
    id: 'mapbox-gosansa-jangheung',
    name: '고산사',
    lat: 34.6415,
    lng: 126.7842,
    source: 'mapbox',
    country: '대한민국',
    country_en: 'South Korea',
    uiPlace: true,
  });
  assert.equal(decision?.type, 'place');
  assert.ok(decision?.param?.startsWith('search-') || decision?.param?.startsWith('tour-'));
  assert.notEqual(decision?.param, 'south-korea');
});

test('resolveSearchResultSelect — contentId tourapi는 tour slug', () => {
  const decision = resolveSearchResultSelect({
    id: 'tour-attr-127982',
    name: '홍성 고산사 대웅전',
    lat: 36.4544,
    lng: 126.6608,
    source: 'tourapi',
    contentId: '127982',
    country: '대한민국',
    country_en: 'South Korea',
  });
  assert.equal(decision?.type, 'place');
  assert.equal(decision?.param, 'tour-127982');
});

test('shouldRouteDomesticExplorePinToPlace — 해외 Mapbox는 false', () => {
  assert.equal(
    shouldRouteDomesticExplorePinToPlace({
      name: 'Hallstatt',
      lat: 47.56,
      lng: 13.65,
      source: 'mapbox',
      country_en: 'Austria',
    }),
    false,
  );
});

test('getLocalizedParentCityLabel — Jangheung → 장흥', () => {
  assert.equal(getLocalizedParentCityLabel('Jangheung', 'ko'), '장흥');
});

test('buildExploreSearchLocationLine — hubId 홍성군 라벨', () => {
  const line = buildExploreSearchLocationLine(
    {
      name: '홍성 고산사 대웅전',
      hubId: 'hongseong',
      kind: 'attraction',
      uiPlace: true,
      country: '대한민국',
    },
    'ko',
  );
  assert.match(line, /홍성/);
});
