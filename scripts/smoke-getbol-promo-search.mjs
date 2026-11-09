#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildKoreaGetbolCollectiveSearchSuggestions } from '../src/pages/Home/lib/exploreKoreaGetbolCollectiveSearch.js';

const collective = buildKoreaGetbolCollectiveSearchSuggestions('한국의 갯벌');
assert.equal(collective.length, 2, '한국의 갯벌');

const plain = buildKoreaGetbolCollectiveSearchSuggestions('갯벌');
assert.equal(plain.length, 2, '갯벌 UNESCO 2건');

const seocheon = buildKoreaGetbolCollectiveSearchSuggestions('서천갯벌');
assert.equal(seocheon.length, 1);
assert.match(String(seocheon[0].name), /서천갯벌/);

const sinan = buildKoreaGetbolCollectiveSearchSuggestions('신안갯벌');
assert.equal(sinan.length, 1);
assert.match(String(sinan[0].name), /증도/);

assert.ok(plain.every((r) => r.badge === '자연유산'), 'badge');

console.log('PASS smoke-getbol-promo-search');
