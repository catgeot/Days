#!/usr/bin/env node
/**
 * 자킨토스 검색 #5 — 사바섬 = 말레이시아 사바 여행지 앞 + 카리브 Saba 둘째
 */
import assert from 'node:assert/strict';

import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { resolveTravelSpotFromSearchQuery } from '../src/utils/travelSpotResolve.js';
import {
  resolveExploreSearchAlias,
  buildMapboxSearchQueries,
} from '../src/pages/Home/lib/exploreSearchAliases.js';
import {
  CARIBBEAN_SABA_HOMONYM,
  collectKnownTravelHomonyms,
  homonymIdentityKey,
  isDistinctTravelPlace,
  relabelHomonymDisplay,
} from '../src/pages/Home/lib/travelSearchHomonyms.js';
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

const known = collectKnownTravelHomonyms('사바섬', [spot]);
assert.equal(known.length, 1, '사바섬 seeds Caribbean Saba');
assert.equal(known[0].name_en, 'Saba');
assert.equal(known[0].name, '사바섬');
assert.equal(known[0].country_en, 'Caribbean Netherlands');
assert.equal(collectKnownTravelHomonyms('사바', [spot]).length, 0, 'bare 사바 does not seed Caribbean');
assert.equal(collectKnownTravelHomonyms('사바 섬', [spot]).length, 1, '사바 섬 also seeds Caribbean');

const collidingMapbox = relabelHomonymDisplay(
  { name: '사바', name_en: 'Saba', lat: 17.635, lng: -63.232, country: 'Netherlands' },
  [spot],
);
assert.equal(collidingMapbox.name, 'Saba', 'Hangul 사바 collision uses official Saba');
assert.notEqual(
  homonymIdentityKey(spot),
  homonymIdentityKey(CARIBBEAN_SABA_HOMONYM),
  'Sabah and Caribbean Saba are different pins',
);

const enterCards = [spot, ...known];
assert.equal(enterCards[0]?.slug, 'sabah', 'Enter 1 = Malaysia Sabah');
assert.equal(enterCards[1]?.name_en, 'Saba', 'Enter 2 = Caribbean Saba');
assert.equal(enterCards[1]?.country, '네덜란드');
assert.equal(
  enterCards.some((item) => /사헤브|gurdwara|시크/i.test(`${item.name} ${item.desc || ''}`)),
  false,
  'no Korean temple on Enter cards',
);

assert.equal(
  resolveTravelSpotFromSearchQuery('자킨토스'),
  null,
  '자킨토스 still not SSOT',
);

const bki = RENTAL_AIRPORT_HUBS.find((h) => h.iata === 'BKI');
assert.ok(bki?.aliases?.includes('사바섬'), 'BKI alias 사바섬');
assert.ok(bki?.aliases?.includes('sabah'), 'BKI alias sabah');

console.log('PASS sabah-search (Malaysia first + Caribbean Saba second · temple excluded)');
