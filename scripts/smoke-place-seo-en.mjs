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
  PLACE_SEARCH_INTENTS,
  getPlaceSearchQuerySuffixes,
  getPrimaryPlaceSearchIntent,
} from '../src/data/placeSearchIntent.js';
import {
  getLocalizedPlaceDesc,
  getPlaceSeoKeywords,
  getPlaceTabSeoDescription,
  getPlaceTabSeoTitle,
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

assert(Object.keys(PLACE_SEO_EN_OVERRIDES).length >= 106, 'place SEO EN overrides loaded (tier1 + batch1 tier2)');

assert(PLACE_SEARCH_INTENTS.length >= 6, 'place search intent SSOT loaded');
assert(
  PLACE_SEARCH_INTENTS.some((i) => i.intentId === 'gallery' && i.tab === 'gallery'),
  'gallery intent maps to gallery tab',
);
assert(
  PLACE_SEARCH_INTENTS.filter((i) => i.tab === 'planner').length >= 2,
  'planner tab has travel + planner intents',
);
const galleryPrimary = getPrimaryPlaceSearchIntent('gallery');
assert(Boolean(galleryPrimary?.koTitle && galleryPrimary?.enTitle), 'gallery primary title templates');
const gallerySuffixKo = getPlaceSearchQuerySuffixes('gallery', 'ko');
assert(gallerySuffixKo.includes('갤러리') && gallerySuffixKo.includes('사진'), 'gallery KO query suffixes');

const phuketDesc = getLocalizedPlaceDesc(phuket, 'en');
assert(!/[\u3131-\u318e\uac00-\ud7a3]/.test(phuketDesc), 'phuket EN desc has no Hangul');
assert(/phuket|thailand|beach|island/i.test(phuketDesc), 'phuket EN desc mentions travel context');

const galapagosDesc = getLocalizedPlaceDesc(galapagos, 'en');
assert(/galapagos|darwin|wildlife|ecuador/i.test(galapagosDesc), 'galapagos EN desc is search-relevant');

const angkorGallery = getPlaceTabSeoDescription(angkor, 'en', 'gallery', (k) => k);
assert(/photo|angkor/i.test(angkorGallery), 'angkor gallery SEO leads with photo intent');

const angkorKeywords = getPlaceSeoKeywords(angkor, 'en', 'gallery');
assert(/Angkor Wat/i.test(angkorKeywords), 'angkor keywords include destination name');
assert(/travel photos|gallery/i.test(angkorKeywords), 'angkor gallery keywords include photo intent');

const phuketTitleKo = getPlaceTabSeoTitle(phuket, 'ko', 'gallery');
assert(/푸켓/.test(phuketTitleKo) && /갤러리|사진/.test(phuketTitleKo), 'phuket KO gallery title for external search');
const phuketPlannerKo = getPlaceTabSeoTitle(phuket, 'ko', 'planner');
assert(/푸켓/.test(phuketPlannerKo) && /여행/.test(phuketPlannerKo), 'phuket KO planner title for 「푸켓 여행」');

const phuketKwKo = getPlaceSeoKeywords(phuket, 'ko', 'gallery');
assert(/푸켓.*갤러리|푸켓.*여행/.test(phuketKwKo.replace(/\s/g, '')), 'phuket KO gallery keywords compound');

const tajMahal = spots.find((s) => s.slug === 'taj-mahal');
const tajDesc = getLocalizedPlaceDesc(tajMahal, 'en');
assert(!/[\u3131-\u318e\uac00-\ud7a3]/.test(tajDesc), 'taj-mahal tier2 batch EN desc has no Hangul');
assert(/taj mahal|agra|mughal/i.test(tajDesc), 'taj-mahal EN desc is search-relevant');

const seoJs = readFileSync(join(root, 'src/components/SEO/index.jsx'), 'utf8');
assert(seoJs.includes('meta name="keywords"'), 'SEO component renders keywords meta');

const enJson = JSON.parse(readFileSync(join(root, 'src/i18n/locales/en.json'), 'utf8'));
assert(Boolean(enJson.seo?.defaultKeywords), 'en locale has default SEO keywords');

const indexHtml = readFileSync(join(root, 'index.html'), 'utf8');
assert(indexHtml.includes('Phuket travel photos'), 'index.html hidden EN links for Phuket');
assert(indexHtml.includes('Angkor Wat photos'), 'index.html hidden EN links for Angkor Wat');
assert(
  indexHtml.includes('<!-- GATEO_STATIC_KO_LINKS:START -->'),
  'index.html has static KO link markers',
);
const koGalleryLinks = (indexHtml.match(/href="\/place\/[^"]+\/gallery">[^<]+갤러리/g) || []).length;
assert(koGalleryLinks >= 64, `index.html tier1 KO gallery links (got ${koGalleryLinks})`);
assert(
  indexHtml.includes('/place/tokyo/gallery') && indexHtml.includes('도쿄 여행 사진'),
  'index.html tokyo KO gallery static link',
);
assert(
  indexHtml.includes('/place/bangkok/planner') && indexHtml.includes('방콕 여행</a>'),
  'index.html bangkok KO travel static link',
);

const sitemap = readFileSync(join(root, 'public/sitemap.xml'), 'utf8');
assert(
  sitemap.includes('/place/phuket/gallery') && sitemap.includes('/place/phuket/planner'),
  'sitemap includes phuket gallery and planner tab URLs',
);
assert(
  sitemap.includes('/place/phuket/gallery?lang=en'),
  'sitemap phuket gallery has hreflang en (regenerate sitemap if FAIL)',
);
assert(
  sitemap.includes('href="https://www.gateo.kr/explore?lang=en"'),
  'sitemap explore has hreflang en',
);
assert(
  sitemap.includes('href="https://www.gateo.kr/korea/theme?lang=en"'),
  'sitemap korea/theme has hreflang en',
);
assert(
  sitemap.includes('href="https://www.gateo.kr/korea/theme/courses?lang=en"'),
  'sitemap korea/theme/courses has hreflang en',
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
