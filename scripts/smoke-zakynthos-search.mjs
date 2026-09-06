#!/usr/bin/env node
/**
 * 자킨토스 검색 #1 — SSOT·오타 별칭·탐색 제안 영문명
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import { resolveTravelSpotFromSearchQuery } from '../src/utils/travelSpotResolve.js';
import { getPlaceTitleLines } from '../src/components/PlaceCard/common/locationDisplay.js';
import {
  resolveExploreSearchAlias,
  buildMapboxSearchQueries,
} from '../src/pages/Home/lib/exploreSearchAliases.js';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const spot = TRAVEL_SPOTS.find((s) => s.slug === 'zakynthos');
assert.ok(spot, 'zakynthos in TRAVEL_SPOTS');
assert.equal(spot.name, '자킨토스');
assert.equal(spot.name_en, 'Zakynthos');
assert.equal(spot.country, '그리스');
assert.equal(spot.country_en, 'Greece');

for (const q of ['자킨토스', 'Zakynthos', 'zakynthos', '자킨토시', '잔테', 'Zante']) {
  const hit = resolveTravelSpotFromSearchQuery(q);
  assert.ok(hit, `${q} → SSOT`);
  assert.equal(hit.slug, 'zakynthos', `${q} slug`);
  assert.equal(hit.name_en, 'Zakynthos', `${q} name_en`);
}

const titles = getPlaceTitleLines(spot);
assert.equal(titles.primaryName, '자킨토스');
assert.equal(titles.secondaryName, 'Zakynthos');

const suggestionsSrc = readFileSync(
  join(root, 'src/pages/Home/lib/searchSuggestions.js'),
  'utf8',
);
assert.match(
  suggestionsSrc,
  /officialSpot = resolveTravelSpotFromSearchQuery\(q\)/,
  'local suggestions resolve official aliases first',
);

const alias = resolveExploreSearchAlias('자킨토시');
assert.ok(alias?.romanized?.includes('Zakynthos'), '자킨토시 romanized');
const mapboxQueries = buildMapboxSearchQueries('자킨토시');
assert.ok(mapboxQueries.includes('자킨토스'), '자킨토시 mapbox canonical');
assert.ok(
  mapboxQueries.some((q) => /zakynthos/i.test(q)),
  '자킨토시 mapbox romanized',
);

const zth = RENTAL_AIRPORT_HUBS.find((h) => h.iata === 'ZTH');
assert.ok(zth, 'ZTH rental hub');
assert.match(zth.officialKo, /자킨토스/);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug:\s*'zakynthos'/);
const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/zakynthos/);

console.log('PASS zakynthos-search (SSOT + 자킨토시/잔테/Zante + 여행지 영문명)');
