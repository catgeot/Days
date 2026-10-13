/**
 * Festival sheet QA bundle smoke — static gates + optional preview overlap.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildFestivalPanelListMetaSegments } from '../src/pages/Korea/festivalPanelListMeta.js';
import { festivalIndexTimePhrase } from '../src/pages/Korea/festivalIndexHeadline.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function ok(msg) {
  console.log(`OK    ${msg}`);
}

function t(key, opts = {}) {
  if (key === 'korea.common.countUnit') return String(opts.count);
  if (key === 'korea.festival.panelNationwideScope') return 'Nationwide';
  if (key === 'korea.festival.panelNationwideGroup') return 'By province';
  if (key === 'korea.common.nationwide') return 'Nationwide';
  if (key === 'korea.common.regionGroup') return 'By region';
  return opts.defaultValue || key;
}

const meta = buildFestivalPanelListMetaSegments({
  areaCode: 'all',
  cityName: 'all',
  count: 182,
  t,
  locale: 'en',
});
const metaPlain = meta.map((s) => s.text).join(' · ');
assert.equal(metaPlain, 'Nationwide · 182 · By province');
ok(`EN nationwide meta: ${metaPlain}`);

const monthScope = 'Nationwide';
const monthTime = festivalIndexTimePhrase('en', 'thisMonth', [], t);
assert.equal(`${monthScope} · ${monthTime}`, 'Nationwide · This month\'s festivals');
ok(`EN nationwide headline parts: ${monthScope} · ${monthTime}`);

const monthHeadline = festivalIndexTimePhrase('en', 'thisMonth', [], t);
assert.equal(monthHeadline, "This month's festivals");
ok(`EN month headline: ${monthHeadline}`);

const sheet = readFileSync(join(root, 'src/pages/Korea/FestivalDetailSheet.jsx'), 'utf8');
assert.match(sheet, /nearSectionsLoading/);
assert.match(sheet, /stayStripStatus === 'loading'/);
ok('lodging reserve through stay fetch');

const promo = readFileSync(join(root, 'src/pages/Korea/SocialPromoFestivalRow.jsx'), 'utf8');
assert.match(promo, /festivalListDisplayTitleLines/);
assert.match(promo, /FestivalListThumbBox/);
assert.match(promo, /normalizeFestivalItemImages/);
ok('social promo EN title + image normalize');

console.log('\nfestival-sheet-qa-bundle SMOKE OK');
