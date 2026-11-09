#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildKoreaGetbolCollectiveSearchSuggestions } from '../../src/pages/Home/lib/exploreKoreaGetbolCollectiveSearch.js';
import { normalizeExploreSelectionPin } from '../../src/pages/Home/lib/explorePlaceNav.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';

function placeParam(item) {
  const pin = normalizeExploreSelectionPin(item);
  return resolveSearchResultSelect(pin);
}

for (const q of ['갯벌', '한국의 갯벌']) {
  const rows = buildKoreaGetbolCollectiveSearchSuggestions(q);
  assert.equal(rows.length, 4, `${q} → UNESCO 4구성`);
  assert.ok(rows.every((r) => r.badge === '자연유산'), `${q} badge`);
}

const collective = buildKoreaGetbolCollectiveSearchSuggestions('갯벌');
const gochang = collective.find((r) => String(r.name).includes('고창'));
const suncheon = collective.find((r) => String(r.name).includes('순천만'));
assert.equal(placeParam(gochang)?.type, 'place', '고창 /place');
assert.equal(placeParam(suncheon)?.type, 'place', '순천만 /place');
assert.match(String(placeParam(suncheon)?.param || ''), /^tour-126730$/, '순천만 contentId');

const seocheonOnly = buildKoreaGetbolCollectiveSearchSuggestions('서천갯벌');
assert.equal(seocheonOnly.length, 1, '서천갯벌 단독');
const sinanOnly = buildKoreaGetbolCollectiveSearchSuggestions('신안갯벌');
assert.equal(sinanOnly.length, 1, '신안갯벌 단독');
assert.equal(placeParam(sinanOnly[0])?.type, 'place', '신안갯벌 /place');

console.log('PASS explore-getbol-collective-search.test');
