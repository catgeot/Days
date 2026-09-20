#!/usr/bin/env node
/**
 * RSS feeds (KO/EN) and place canonical alignment smoke.
 *
 *   npm run smoke:rss-canonical
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const baseUrl = 'https://www.gateo.kr';

function buildLocalePageUrl(path = '/', locale = 'ko') {
  const normalized = !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  const urlBase = `${baseUrl}${normalized === '/' ? '' : normalized}`;
  if (locale === 'en') {
    return normalized === '/' ? `${baseUrl}/?lang=en` : `${urlBase}?lang=en`;
  }
  return normalized === '/' ? `${baseUrl}/` : urlBase;
}

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

function readRss(path) {
  return readFileSync(join(root, path), 'utf8');
}

function extractItemLinks(rss) {
  return [...rss.matchAll(/<item>[\s\S]*?<link>([^<]+)<\/link>/g)].map((m) => m[1]);
}

const rssKo = readRss('public/rss.xml');
const rssEn = readRss('public/rss-en.xml');

assert(rssKo.includes('<?xml version="1.0"'), 'rss.xml is XML');
assert(rssEn.includes('<?xml version="1.0"'), 'rss-en.xml is XML');
assert(rssKo.includes('<language>ko</language>'), 'rss.xml language ko');
assert(rssEn.includes('<language>en</language>'), 'rss-en.xml language en');

assert(
  rssKo.includes(`href="${baseUrl}/rss-en.xml"`) && rssKo.includes('hreflang="en"'),
  'rss.xml atom alternate links to rss-en.xml',
);
assert(
  rssEn.includes(`href="${baseUrl}/rss.xml"`) && rssEn.includes('hreflang="ko"'),
  'rss-en.xml atom alternate links to rss.xml',
);

const koLinks = extractItemLinks(rssKo);
const enLinks = extractItemLinks(rssEn);

assert(koLinks.length >= 50, `rss.xml has 50 item links (got ${koLinks.length})`);
assert(enLinks.length >= 50, `rss-en.xml has 50 item links (got ${enLinks.length})`);

assert(
  koLinks.every((href) => href.includes('/gallery') && !href.includes('lang=')),
  'rss.xml item links use gallery path without lang param',
);
assert(
  enLinks.every((href) => href.includes('/gallery') && href.includes('lang=en')),
  'rss-en.xml item links use gallery?lang=en',
);

assert(
  !koLinks.some((href) => /\/place\/[^/]+$/.test(href)),
  'rss.xml has no bare /place/:slug links (gallery canonical)',
);

const tokyoGalleryKo = buildLocalePageUrl('/place/tokyo/gallery', 'ko');
const tokyoGalleryEn = buildLocalePageUrl('/place/tokyo/gallery', 'en');
assert(koLinks.includes(tokyoGalleryKo), 'rss.xml tokyo gallery KO canonical URL');
assert(enLinks.includes(tokyoGalleryEn), 'rss-en.xml tokyo gallery EN canonical URL');

assert(
  rssEn.includes('AI Docent 3D World Travel') &&
    rssEn.includes('<description>Plan and record your travels'),
  'rss-en.xml channel title and description are English',
);
assert(rssKo.includes('English</a>'), 'rss.xml bilingual item links to EN gallery');
assert(rssEn.includes('hreflang="ko"'), 'rss-en.xml bilingual item links to KO gallery');

const placeCard = readFileSync(join(root, 'src/components/PlaceCard/index.jsx'), 'utf8');
assert(
  placeCard.includes('const seoPath = `/place/${slug}/${tabKey}`'),
  'PlaceCard canonical path includes tab segment',
);

const seoComponent = readFileSync(join(root, 'src/components/SEO/index.jsx'), 'utf8');
assert(
  seoComponent.includes('buildLocalePageUrl(pagePath, locale)'),
  'SEO canonical uses buildLocalePageUrl',
);

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log('\nAll RSS·canonical smoke checks passed.');
