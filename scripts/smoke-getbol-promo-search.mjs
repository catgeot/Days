#!/usr/bin/env node
import assert from 'node:assert/strict';
import { buildKoreaGetbolCollectiveSearchSuggestions } from '../src/pages/Home/lib/exploreKoreaGetbolCollectiveSearch.js';

const collective = buildKoreaGetbolCollectiveSearchSuggestions('한국의 갯벌');
assert.equal(collective.length, 4, '한국의 갯벌 UNESCO 4구성');

const plain = buildKoreaGetbolCollectiveSearchSuggestions('갯벌');
assert.equal(plain.length, 4, '갯벌 UNESCO 4구성');
assert.ok(
  plain.some((r) => String(r.name || '').includes('서천갯벌') || String(r.name || '').includes('유부도')),
  '서천 구성',
);
assert.ok(plain.some((r) => String(r.name || '').includes('고창')), '고창 구성');
assert.ok(plain.some((r) => String(r.name || '').includes('신안')), '신안 구성');
assert.ok(
  plain.some((r) => String(r.name || '').includes('순천만') && r.name.includes('보성')),
  '보성·순천 구성',
);

const seocheon = buildKoreaGetbolCollectiveSearchSuggestions('서천갯벌');
assert.equal(seocheon.length, 1);
assert.match(String(seocheon[0].name), /서천갯벌/);

const sinan = buildKoreaGetbolCollectiveSearchSuggestions('신안갯벌');
assert.equal(sinan.length, 1);
assert.match(String(sinan[0].name), /증도/);

assert.ok(plain.every((r) => r.badge === '자연유산'), 'badge');

console.log('PASS smoke-getbol-promo-search');
