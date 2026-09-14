#!/usr/bin/env node
/**
 * 탐색 드롭다운 MOONi 추천 카드 — 상단 고정 · 기존 목적지 세션 중첩 금지
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(join(root, rel), 'utf8');

const listSrc = read('src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx');
const moonIdx = listSrc.indexOf('{showMooni ? (');
const mapIdx = listSrc.indexOf('{items.map((item, index) => {');
const bottomIdx = listSrc.indexOf('{!moodFirst && showMooni');
assert.ok(moonIdx >= 0, 'MOONi row gated by showMooni');
assert.ok(mapIdx >= 0, 'place items still mapped');
assert.ok(moonIdx < mapIdx, 'MOONi row must render before place items');
assert.equal(bottomIdx, -1, 'MOONi row must not render again after place items');
assert.ok(listSrc.includes('sticky top-0'), 'popover MOONi row stays at dropdown top while scrolling');

const homeSrc = read('src/pages/Home/index.jsx');
const askIdx = homeSrc.indexOf('onAskMooni={(askQuery) => {');
assert.ok(askIdx >= 0, 'Home wires onAskMooni');
const askBlock = homeSrc.slice(askIdx, askIdx + 500);
assert.ok(askBlock.includes('freshSession: true'), 'ask-MOONi opens a fresh session');

const handlerSrc = read('src/pages/Home/hooks/useHomeHandlers.js');
const freshIdx = handlerSrc.indexOf('if (freshSession) {');
const resumeIdx = handlerSrc.indexOf('await resolveMooniResumeTrip');
assert.ok(freshIdx >= 0, 'handleStartChat honors freshSession');
assert.ok(resumeIdx >= 0, 'resume helper still present');
assert.ok(freshIdx < resumeIdx, 'freshSession returns before last-trip resume');
assert.ok(
  handlerSrc.includes("destination: 'MOONi'"),
  'fresh session draft destination is generic MOONi',
);

console.log('smoke-mooni-ask-bridge: PASS');
