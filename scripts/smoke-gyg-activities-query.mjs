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
const { resolveGygLocale, resolveGygCurrency } = await load('src/utils/gygPartnerLocale.js');
const { getGygHomeUrl, buildGygSearchUrl } = await load('src/utils/gygAffiliateLinks.js');

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

const timbuktu = {
  slug: 'timbuktu',
  name: '팀북투',
  name_en: 'Timbuktu',
  country: '말리',
  country_en: 'Mali',
};

const tbilisi = {
  slug: 'tbilisi',
  name: '트빌리시',
  name_en: 'Tbilisi',
  country: '조지아',
  country_en: 'Georgia',
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

const timQ = buildGygActivitiesSearchQuery(timbuktu);
assert(timQ === 'Timbuktu, Mali', 'timbuktu q → Timbuktu, Mali');
assert(!/tbilisi/i.test(String(timQ)), 'timbuktu q ≠ Tbilisi');
assert(
  buildGygActivitiesSearchQuery(tbilisi) === 'Tbilisi',
  'tbilisi q stays city-only Tbilisi'
);

assert(resolveGygLocale('en') === 'en-US', 'GYG locale en → en-US');
assert(resolveGygLocale('ko') === 'ko-KR', 'GYG locale ko → ko-KR');
assert(resolveGygLocale('en-US') === 'en-US', 'GYG locale en-US → en-US');
assert(resolveGygCurrency('en') === 'USD', 'GYG currency en → USD');
assert(resolveGygCurrency('ko') === 'KRW', 'GYG currency ko → KRW');

const enSearch = buildGygSearchUrl('Timbuktu, Mali', { locale: 'en', cmp: 'gateo_planer_timbuktu' });
assert(enSearch.includes('locale_code=en-US'), 'GYG search URL has en-US locale_code');
assert(enSearch.includes('currency=USD'), 'GYG search URL has USD currency');
assert(enSearch.includes('q=Timbuktu'), 'GYG search URL has q param');

const enHome = getGygHomeUrl({ locale: 'en' });
assert(enHome.startsWith('https://www.getyourguide.com/en-us/'), 'GYG home EN path');
assert(enHome.includes('locale_code=en-US'), 'GYG home EN locale_code');

if (process.exitCode) {
  console.error('\nsmoke-gyg-activities-query: FAIL');
  process.exit(1);
}
console.log('\nsmoke-gyg-activities-query: OK');
