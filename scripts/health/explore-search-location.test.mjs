import assert from 'node:assert/strict';
import test from 'node:test';

import { attractionToSuggestion } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  resolveHubParentCityForPoiName,
  resolveCityAttractionHub,
} from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { buildExploreSearchLocationLine } from '../../src/components/PlaceCard/common/locationDisplay.js';
import { visitedRowToSearchSpot } from '../../src/pages/Home/lib/visitedPlaceSearch.js';

test('resolveHubParentCityForPoiName — 오대산 prefix → 평창', () => {
  assert.equal(resolveHubParentCityForPoiName('오대산'), '평창');
  assert.equal(resolveHubParentCityForPoiName('오대산 선재길'), '평창');
});

test('visited place_id seoul + 오대산 선재길 name uses 평창 parentCity', () => {
  const spot = visitedRowToSearchSpot({
    place_id: 'seoul',
    name_ko: '오대산 선재길',
    name_en: 'Seoul',
    lat: 37.7311846077,
    lng: 128.5925086732,
  });
  assert.equal(spot?.parentCity, '평창');
});

test('buildExploreSearchLocationLine — GATEO 오대산 선재길 shows 강원 평창 (ko)', () => {
  const hub = resolveCityAttractionHub('pyeongchang');
  const attraction = hub.attractions.find((a) => a.name === '오대산 선재길');
  assert.ok(attraction);
  const item = attractionToSuggestion(hub, attraction);
  const line = buildExploreSearchLocationLine(item, 'ko');
  assert.match(line, /강원/);
  assert.match(line, /평창/);
  assert.doesNotMatch(line, /서울|Seoul/i);
});

test('buildExploreSearchLocationLine — wrong parentCity Seoul corrected via hubId', () => {
  const hub = resolveCityAttractionHub('pyeongchang');
  const attraction = hub.attractions.find((a) => a.name === '오대산 선재길');
  const item = {
    ...attractionToSuggestion(hub, attraction),
    parentCity: 'Seoul',
  };
  const line = buildExploreSearchLocationLine(item, 'ko');
  assert.match(line, /평창/);
  assert.doesNotMatch(line, /서울/);
});
