#!/usr/bin/env node
/**
 * English place SEO — overrides, meta helpers, sitemap hreflang.
 *
 *   npm run smoke:place-seo-en
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

import { PLACE_SEO_EN_OVERRIDES } from '../src/data/placeSeoEnOverrides.js';
import {
  getLocalizedPlaceDesc,
  getPlaceSeoKeywords,
  getPlaceTabSeoDescription,
} from '../src/pages/Home/lib/placeSeoText.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    failed += 1;
    console.error(`FAIL  ${msg}`);
    return false;
  }
  console.log(`OK    ${msg}`);
  return true;
}

const travelSpotsContent = readFileSync(
  join(root, 'src/pages/Home/data/travelSpots.js'),
  'utf8',
);
const travelSpotsMatch = travelSpotsContent.match(/export const TRAVEL_SPOTS = \[([\s\S]*?)\];/);
const spots = JSON.parse(`[${travelSpotsMatch[1]}]`);

const phuket = spots.find((s) => s.slug === 'phuket');
const galapagos = spots.find((s) => s.slug === 'galapagos');
const angkor = spots.find((s) => s.slug === 'angkor-wat');

assert(Object.keys(PLACE_SEO_EN_OVERRIDES).length >= 66, 'place SEO EN overrides loaded');

const phuketDesc = getLocalizedPlaceDesc(phuket, 'en');
assert(!/[\u3131-\u318e\uac00-\ud7a3]/.test(phuketDesc), 'phuket EN desc has no Hangul');
assert(/phuket|thailand|beach|island/i.test(phuketDesc), 'phuket EN desc mentions travel context');

const galapagosDesc = getLocalizedPlaceDesc(galapagos, 'en');
assert(/galapagos|darwin|wildlife|ecuador/i.test(galapagosDesc), 'galapagos EN desc is search-relevant');

const angkorGallery = getPlaceTabSeoDescription(angkor, 'en', 'gallery', (k) => k);
assert(/photo|angkor/i.test(angkorGallery), 'angkor gallery SEO leads with photo intent');

const angkorKeywords = getPlaceSeoKeywords(angkor, 'en');
assert(/Angkor Wat/i.test(angkorKeywords), 'angkor keywords include destination name');

const seoJs = readFileSync(join(root, 'src/components/SEO/index.jsx'), 'utf8');
assert(seoJs.includes('meta name="keywords"'), 'SEO component renders keywords meta');

const enJson = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
assert(Boolean(enJson.seo?.defaultKeywords), 'en locale has default SEO keywords');

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
assert(indexHtml.includes('Phuket travel guide'), 'index.html hidden EN links for Phuket');
assert(indexHtml.includes('Angkor Wat photos'), 'index.html hidden EN links for Angkor Wat');

const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8');
assert(
  sitemap.includes('/place/phuket') && sitemap.includes('/place/phuket?lang=en'),
  'sitemap phuket has hreflang en (regenerate sitemap if FAIL)',
);

const t = (key, opts) => {
  if (key === 'place.fallback.destination') return 'Destination';
  return key;
};
const koDesc = getLocalizedPlaceDesc(phuket, 'ko');
assert(/푸켓|안다만해/.test(koDesc), 'phuket KO desc unchanged');

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll place SEO EN smoke checks passed.');
