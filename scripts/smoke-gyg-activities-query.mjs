#!/usr/bin/env node
/**
 * GYG Manual Activities data-gyg-q 회귀 — 아이투타키→아유타야 오탐 등.
 * 네트워크 없음. Usage: node scripts/smoke-gyg-activities-query.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

const { buildGygActivitiesSearchQuery, getGygLocationIdByLocation } = await load(
  'src/components/PlaceCard/tabs/planner/locationRules.js'
);
const { resolveGygLocale } = await load('src/utils/gygPartnerLocale.js');

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    process.exitCode = 1;
  } else {
    console.log(`PASS: ${msg}`);
  }
}

const aitutaki = {
  slug: 'aitutaki',
  name: '아이투타키',
  name_en: 'Aitutaki',
  country: '쿡 제도',
  country_en: 'Cook Islands',
};

const ayutthaya = {
  slug: 'ayutthaya',
  name: '아유타야',
  name_en: 'Ayutthaya',
  country: '태국',
  country_en: 'Thailand',
};

const rarotonga = {
  slug: 'rarotonga',
  name: '라로통가',
  name_en: 'Rarotonga',
  country: '쿡 제도',
  country_en: 'Cook Islands',
};

const miyakojima = {
  slug: 'miyakojima',
  name: '미야코지마',
  name_en: 'Miyakojima',
  country: '일본',
  country_en: 'Japan',
};

const aitQ = buildGygActivitiesSearchQuery(aitutaki);
assert(aitQ === 'Rarotonga, Cook Islands', 'aitutaki q → Rarotonga, Cook Islands');
assert(!/ayutthaya/i.test(String(aitQ)), 'aitutaki q ≠ Ayutthaya');
assert(!/^Aitutaki$/i.test(String(aitQ)), 'aitutaki q ≠ bare Aitutaki');
assert(getGygLocationIdByLocation(aitutaki) === '2689', 'aitutaki City id → Rarotonga 2689');

assert(
  buildGygActivitiesSearchQuery(ayutthaya) === 'Ayutthaya',
  'ayutthaya q stays Ayutthaya'
);
assert(
  buildGygActivitiesSearchQuery(rarotonga) === 'Rarotonga',
  'rarotonga q stays city-only Rarotonga'
);
assert(
  buildGygActivitiesSearchQuery(miyakojima) === 'Miyakojima',
  'miyakojima q stays city-only (no , Japan)'
);

assert(resolveGygLocale('en') === 'en-US', 'GYG locale en → en-US');
assert(resolveGygLocale('ko') === 'ko-KR', 'GYG locale ko → ko-KR');
assert(resolveGygLocale('en-US') === 'en-US', 'GYG locale en-US → en-US');

if (process.exitCode) {
  console.error('\nsmoke-gyg-activities-query: FAIL');
  process.exit(1);
}
console.log('\nsmoke-gyg-activities-query: OK');
