#!/usr/bin/env node
/**
 * 해역명 → travelSpot 큐레이션 스모크
 */
import assert from 'node:assert/strict';
import {
  resolveSeaBasinFromQuery,
  pickSeaBasinCurationSpot,
  listChipSeaBasins,
} from '../src/pages/Home/lib/seaBasinResolve.js';

const aegean = resolveSeaBasinFromQuery('에게해');
assert.ok(aegean, '에게해 resolve');
assert.equal(aegean.basin.id, 'aegean');
assert.ok(aegean.spots.length >= 2, '에게해 spots ≥2');

const coral = resolveSeaBasinFromQuery('Coral Sea');
assert.ok(coral, 'Coral Sea resolve');
assert.equal(coral.basin.id, 'coral-sea');
assert.ok(coral.spots.length >= 2, '산호해 spots ≥2');

const mexico = resolveSeaBasinFromQuery('멕시코만');
assert.ok(mexico, '멕시코만 resolve');
assert.equal(mexico.basin.id, 'gulf-of-mexico');
assert.ok(mexico.spots.length >= 2, '멕시코만 spots ≥2');

const pin = pickSeaBasinCurationSpot('산호해');
assert.ok(pin?.slug, '산호해 curation pin');
assert.equal(pin.seaBasinId, 'coral-sea');

const sargasso = resolveSeaBasinFromQuery('사르가소해');
assert.equal(sargasso, null, '사르가소해 has no coast spots → null');

const chips = listChipSeaBasins(1);
assert.ok(chips.length >= 20, `chip basins ≥20 got ${chips.length}`);
assert.ok(!chips.some((b) => b.id === 'sargasso'), 'sargasso not chip');

console.log(`PASS sea-basin-search (${chips.length} chip basins)`);
