#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildKoreaGetbolCollectiveSearchSuggestions } from '../../src/pages/Home/lib/exploreKoreaGetbolCollectiveSearch.js';
import { normalizeExploreSelectionPin } from '../../src/pages/Home/lib/explorePlaceNav.js';
import { resolveSearchResultSelect } from '../../src/pages/Home/lib/exploreRecentHistory.js';

function placeParam(item) {
  const pin = normalizeExploreSelectionPin(item);
  return resolveSearchResultSelect(pin);
}

function assertPlaceRoute(item, label) {
  const decision = placeParam(item);
  assert.equal(decision?.type, 'place', `${label} → /place`);
  assert.ok(
    /^tour-\d+$/.test(String(decision?.param || '')) || /^[a-z0-9-]+$/.test(String(decision?.param || '')),
    `${label} param`,
  );
}

for (const q of ['갯벌', '한국의 갯벌']) {
  const rows = buildKoreaGetbolCollectiveSearchSuggestions(q);
  assert.equal(rows.length, 3, `${q} → /place 3구성(서천 제외)`);
  assert.ok(rows.every((r) => r.badge === '자연유산'), `${q} badge`);
  for (const row of rows) {
    assertPlaceRoute(row, row.name);
  }
}

const collective = buildKoreaGetbolCollectiveSearchSuggestions('갯벌');
const gochang = collective.find((r) => String(r.name).includes('고창'));
const suncheon = collective.find((r) => String(r.name).includes('순천만'));
const sinan = collective.find((r) => String(r.name).includes('신안'));
assert.match(String(placeParam(gochang)?.param || ''), /^tour-2615234$/, '고창 tour-2615234');
assert.match(String(placeParam(suncheon)?.param || ''), /^tour-126730$/, '순천만 tour-126730');
assert.match(String(placeParam(sinan)?.param || ''), /^tour-575607$/, '신안 증도 tour-575607');

const seocheonOnly = buildKoreaGetbolCollectiveSearchSuggestions('서천갯벌');
assert.equal(seocheonOnly.length, 1, '서천갯벌 단독 팔경 카드 유지');
const sinanOnly = buildKoreaGetbolCollectiveSearchSuggestions('신안갯벌');
assert.equal(sinanOnly.length, 1, '신안갯벌 단독');
assert.equal(placeParam(sinanOnly[0])?.type, 'place', '신안갯벌 단독 /place');
assert.match(String(placeParam(sinanOnly[0])?.param || ''), /^tour-575607$/);

console.log('PASS explore-getbol-collective-search.test');
