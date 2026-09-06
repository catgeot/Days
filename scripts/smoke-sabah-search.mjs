#!/usr/bin/env node
/**
 * 자킨토스 검색 #4 — 사바섬 = 말레이시아 사바 여행지 + 카리브 동명 쿼리
 */
import assert from 'node:assert/strict';

import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { resolveTravelSpotFromSearchQuery } from '../src/utils/travelSpotResolve.js';
import {
  resolveExploreSearchAlias,
  buildMapboxSearchQueries,
} from '../src/pages/Home/lib/exploreSearchAliases.js';
import { isDistinctTravelPlace } from '../src/pages/Home/lib/travelSearchHomonyms.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';

const spot = TRAVEL_SPOTS.find((s) => s.slug === 'sabah');
assert.ok(spot, 'sabah in TRAVEL_SPOTS');
assert.equal(spot.name, '사바');
assert.equal(spot.name_en, 'Sabah');
assert.equal(spot.country, '말레이시아');
assert.equal(spot.country_en, 'Malaysia');

for (const q of ['사바', '사바섬', '사바 섬', '사바주', 'Sabah', 'sabah']) {
  const hit = resolveTravelSpotFromSearchQuery(q);
  assert.ok(hit, `${q} → SSOT`);
  assert.equal(hit.slug, 'sabah', `${q} slug`);
}

assert.equal(
  TRAVEL_SPOTS.some((s) => s.slug === 'zakynthos'),
  false,
  'zakynthos is not a travelSpots SSOT',
);

const alias = resolveExploreSearchAlias('사바섬');
assert.ok(alias?.romanized?.includes('Sabah, Malaysia'), '사바섬 romanized → Sabah Malaysia');
assert.ok(
  alias?.also?.some((q) => /Saba,\s*Caribbean Netherlands/i.test(q)),
  '사바섬 also → Caribbean Saba',
);
assert.equal(resolveExploreSearchAlias('사바'), null, 'bare 사바는 Mapbox 별칭 없음(SSOT 이름)');

const queries = buildMapboxSearchQueries('사바섬');
assert.ok(queries.includes('사바섬'), 'keep original');
assert.ok(queries.some((q) => /Sabah,\s*Malaysia/i.test(q)), 'Sabah Malaysia query');
assert.ok(
  queries.some((q) => /Saba,\s*Caribbean Netherlands/i.test(q)),
  'Caribbean Saba query',
);

const sabahPin = { lat: 5.9804, lng: 116.0735, country: '말레이시아', country_en: 'Malaysia' };
const caribbean = {
  name: 'Saba',
  lat: 17.635,
  lng: -63.232,
  country: 'Netherlands',
  country_en: 'Netherlands',
  kind: 'city',
  badge: '장소',
};
const temple = {
  name: '구르두와라 시리 싱 사바 사헤브',
  lat: 37.56,
  lng: 126.97,
  country: '한국',
  country_en: 'South Korea',
  kind: 'poi',
  badge: '명소',
};
const kk = {
  name: 'Kota Kinabalu',
  lat: 5.9804,
  lng: 116.0735,
  country: 'Malaysia',
  country_en: 'Malaysia',
  kind: 'city',
  badge: '도시',
};

assert.equal(isDistinctTravelPlace(caribbean, [sabahPin]), true, 'Caribbean Saba is distinct');
assert.equal(isDistinctTravelPlace(temple, [sabahPin]), false, 'Korean temple excluded');
assert.equal(isDistinctTravelPlace(kk, [sabahPin]), false, 'KK is the same region');

const bki = RENTAL_AIRPORT_HUBS.find((h) => h.iata === 'BKI');
assert.ok(bki?.aliases?.includes('사바섬'), 'BKI alias 사바섬');
assert.ok(bki?.aliases?.includes('sabah'), 'BKI alias sabah');

console.log('PASS sabah-search (Malaysia SSOT + Caribbean homonym queries · temple excluded)');
