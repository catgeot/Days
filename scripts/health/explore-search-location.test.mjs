import assert from 'node:assert/strict';
import test from 'node:test';

import { attractionToSuggestion } from '../../src/pages/Home/lib/cityAttractionHubs.js';
import {
  resolveHubParentCityForPoiName,
  resolveCityAttractionHub,
  hubParentCityFromExactAttractionMatches,
} from '../../src/pages/Home/lib/cityAttractionHubs.js';
import { buildExploreSearchLocationLine } from '../../src/components/PlaceCard/common/locationDisplay.js';
import { visitedRowToSearchSpot } from '../../src/pages/Home/lib/visitedPlaceSearch.js';

test('resolveHubParentCityForPoiName — exact 명칭만 (prefix 스냅 없음)', () => {
  assert.equal(resolveHubParentCityForPoiName('오대산'), '');
  assert.equal(resolveHubParentCityForPoiName('오대산 선재길'), '평창');
});

test('hubParentCityFromExactAttractionMatches — 동명이인은 좌표로 허브 선택', () => {
  const hubNear = { hubId: 'near', name: '가까운시', lat: 37, lng: 128 };
  const hubFar = { hubId: 'far', name: '먼시', lat: 33, lng: 126 };
  const matches = [
    { hub: hubNear, attraction: { name: '중앙시장', lat: 37.01, lng: 128.01 } },
    { hub: hubFar, attraction: { name: '중앙시장', lat: 33.01, lng: 126.01 } },
  ];
  assert.equal(
    hubParentCityFromExactAttractionMatches(matches, { lat: 37.05, lng: 128.05 }),
    '가까운시',
  );
  assert.equal(hubParentCityFromExactAttractionMatches(matches, {}), '');
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
