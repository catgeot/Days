#!/usr/bin/env node
/**
 * 파리 플래너 교통 카드 — 나비고 공식 구매 + Klook Paris Visite 제휴 링크.
 *   node scripts/smoke-paris-transit-planner-links.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  PARIS_NAVIGO_PURCHASE_OFFICIAL_URL,
  KLOOK_PARIS_VISITE_ACTIVITY_SLUG,
  isParisTransportPassLocation,
} from '../src/components/PlaceCard/tabs/planner/locationRules.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function read(rel) {
  return readFileSync(join(root, rel), 'utf8');
}

assert.equal(
  isParisTransportPassLocation({ slug: 'paris', name: '파리' }),
  true,
  'paris slug matches',
);
assert.equal(
  isParisTransportPassLocation({ slug: 'london', name: '런던' }),
  false,
  'non-paris excluded',
);

const utilsSrc = read('src/components/PlaceCard/tabs/planner/utils.js');
assert.match(utilsSrc, /PARIS_NAVIGO_PURCHASE_OFFICIAL_URL/, 'utils uses Navigo official URL');
assert.match(utilsSrc, /KLOOK_PARIS_VISITE_ACTIVITY_SLUG/, 'utils uses Klook Paris Visite slug');
assert.match(utilsSrc, /isParisTransportPassLocation/, 'utils gates Paris transport links');

assert.ok(PARIS_NAVIGO_PURCHASE_OFFICIAL_URL.startsWith('https://www.iledefrance-mobilites.fr'));
assert.match(KLOOK_PARIS_VISITE_ACTIVITY_SLUG, /^13722-paris-visite/);

console.log('smoke-paris-transit-planner-links: OK');
