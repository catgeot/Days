#!/usr/bin/env node
/**
 * 파리 교통 본문 — 나비고 주간권(Navigo Semaine) 클릭→구글 검색 스마트 링크.
 *   npm run smoke:paris-transit-planner-links
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizePlannerSmartLinkPhrases } from '../src/components/PlaceCard/tabs/planner/plannerSmartLinkPhrases.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

const sample =
  '월~일 일정의 여행자라면 나비고 주간권(Navigo Semaine) 구매가 유리합니다.';
const out = normalizePlannerSmartLinkPhrases(sample, 'transport');
assert.match(out, /\[@나비고 주간권 Navigo Semaine@\]/, 'Navigo phrase becomes smart link token');
assert.equal(normalizePlannerSmartLinkPhrases(sample, 'visa'), sample, 'non-transport unchanged');

const copyable = read('src/components/PlaceCard/common/CopyableText.jsx');
assert.match(copyable, /normalizePlannerSmartLinkPhrases/, 'CopyableText applies phrase normalization');

const utilsSrc = read('src/components/PlaceCard/tabs/planner/utils.js');
assert.doesNotMatch(utilsSrc, /navigoPurchase|PARIS_NAVIGO/, 'no extra Navigo CTA buttons');

console.log('smoke-paris-transit-planner-links: OK');
