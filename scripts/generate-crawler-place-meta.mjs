#!/usr/bin/env node
/**
 * Crawler meta — Edge middleware SSOT (hub + all TRAVEL_SPOTS place gallery/planner/wiki/base).
 *
 *   npm run generate:crawler-place-meta
 *
 * Output:
 *   src/edge/crawlerPlaceMeta.generated.js
 *   src/edge/crawlerHubMeta.generated.js
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  getPlaceSeoKeywords,
  getPlaceTabSeoDescription,
  getPlaceTabSeoTitle,
} from '../src/pages/Home/lib/placeSeoText.js';
import {
  getPlaceOgImageUrl,
} from '../src/pages/Home/lib/placeSeoOg.js';
import {
  getLocalizedCountryName,
  getLocalizedPlaceName,
} from '../src/components/PlaceCard/common/locationDisplay.js';
import { getPlaceFlightRouteSeoOd } from '../src/pages/Home/lib/placeFlightRouteSeo.js';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';
import {
  getExploreCategorySeoBundle,
  listExploreCategoryPaths,
} from '../src/pages/Home/lib/exploreCategorySeo.js';

const SITE_ORIGIN = 'https://www.gateo.kr';

function buildLocalePageUrl(path = '/', locale = 'ko') {
  const normalized = !path || path === '/' ? '/' : path.startsWith('/') ? path : `/${path}`;
  const base = `${SITE_ORIGIN}${normalized === '/' ? '' : normalized}`;
  if (locale === 'en') {
    return normalized === '/' ? `${SITE_ORIGIN}/?lang=en` : `${base}?lang=en`;
  }
  return normalized === '/' ? `${SITE_ORIGIN}/` : base;
}

function buildHreflangAlternates(path = '/') {
  return [
    { hreflang: 'ko', href: buildLocalePageUrl(path, 'ko') },
    { hreflang: 'en', href: buildLocalePageUrl(path, 'en') },
    { hreflang: 'x-default', href: buildLocalePageUrl(path, 'ko') },
  ];
}

function stripSiteSuffix(title) {
  return String(title || '')
    .replace(/^GATEO\s*\|\s*/i, '')
    .replace(/\s*\|\s*GATEO\s*$/i, '')
    .trim();
}

function getLocaleValue(bundle, keyPath) {
  return String(keyPath.split('.').reduce((obj, key) => obj?.[key], bundle) || '').trim();
}

function readLocaleBundle(locale) {
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/i18n/locales', `${locale}.json`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const placeOutFile = join(root, 'src/edge/crawlerPlaceMeta.generated.js');
const hubOutFile = join(root, 'src/edge/crawlerHubMeta.generated.js');
const TABS = ['gallery', 'planner', 'wiki'];
const LOCALES = ['ko', 'en'];
/** Hub crawler paths — sync with resolveCrawlerMeta HUB_PATHS + middleware matcher (#15·#16). */
const HUB_PATHS = ['/', '/korea', '/korea/theme/scenic', '/explore', '/blog', '/blog/curation', '/world-events'];

const HUB_LOCALE_KEYS = {
  '/': {
    title: 'seo.defaultTitle',
    description: 'seo.defaultDescription',
    keywords: 'seo.defaultKeywords',
    stripTitle: true,
  },
  '/korea': {
    title: 'korea.festival.title',
    description: 'korea.festival.seoDescription',
    keywords: 'seo.defaultKeywords',
  },
  '/korea/theme/scenic': {
    title: 'korea.theme.scenicTitle',
    description: 'korea.theme.scenicSeoDescription',
    keywords: 'seo.defaultKeywords',
  },
  '/explore': {
    title: 'seo.defaultTitle',
    description: 'seo.defaultDescription',
    keywords: 'seo.defaultKeywords',
    stripTitle: true,
  },
  '/blog': {
    title: 'logbook.seo.title',
    description: 'logbook.seo.description',
    keywords: 'logbook.seo.keywords',
  },
  '/blog/curation': {
    title: 'logbook.curationPage.seoTitle',
    description: 'logbook.curationPage.seoDescription',
    keywords: 'logbook.curationPage.seoKeywords',
  },
  '/world-events': {
    title: 'worldEventsHub.seoTitle',
    description: 'worldEventsHub.seoDescription',
    keywords: 'seo.defaultKeywords',
  },
};

const crawlerSpots = TRAVEL_SPOTS.filter((s) => s?.slug).sort((a, b) =>
  String(a.slug).localeCompare(String(b.slug)),
);
const EXPECTED_TRAVEL_SPOT_COUNT = 274;

const t = (key, opts = {}) => {
  if (key === 'place.fallback.destination') return 'Destination';
  if (key.startsWith('place.tab.')) {
    const name = opts.name || 'Destination';
    if (key.endsWith('.desc')) return `${name} travel guide on GATEO.`;
  }
  return key;
};

/** @type {Record<string, Record<string, Record<string, object>>>} */
const meta = {};

for (const spot of crawlerSpots) {
  meta[spot.slug] = {};
  for (const tab of TABS) {
    meta[spot.slug][tab] = {};
    for (const locale of LOCALES) {
      const pathname = `/place/${spot.slug}/${tab}`;
      const title = getPlaceTabSeoTitle(spot, locale, tab);
      const description = getPlaceTabSeoDescription(spot, locale, tab, t);
      const keywords = getPlaceSeoKeywords(spot, locale, tab);
      const placeName =
        getLocalizedPlaceName(spot, locale) || spot.name_en || spot.name || spot.slug;
      const countryName = getLocalizedCountryName(spot, locale) || '';
      const destIata = getPlaceFlightRouteSeoOd(spot)?.destIata || '';
      const ogImage = getPlaceOgImageUrl(spot);
      const entry = {
        title,
        description,
        keywords,
        canonicalUrl: buildLocalePageUrl(pathname, locale),
        hreflangAlternates: buildHreflangAlternates(pathname),
        ogImage,
        placeName,
        countryName,
        slug: spot.slug,
        tab,
      };
      if (destIata) entry.destIata = destIata;
      if (tab === 'gallery') {
        entry.galleryImages = [
          {
            urls: { regular: ogImage },
            alt_description:
              locale === 'en' ? `${placeName} travel photo` : `${placeName} 여행 사진`,
          },
        ];
      }
      meta[spot.slug][tab][locale] = entry;
    }
  }
}

/** @type {Record<string, Record<string, object>>} */
const hubMeta = {};

for (const hubPath of HUB_PATHS) {
  hubMeta[hubPath] = {};
  const source = HUB_LOCALE_KEYS[hubPath];
  for (const locale of LOCALES) {
    const bundle = readLocaleBundle(locale);
    const rawTitle = getLocaleValue(bundle, source.title);
    hubMeta[hubPath][locale] = {
      title: source.stripTitle ? stripSiteSuffix(rawTitle) : rawTitle,
      description: getLocaleValue(bundle, source.description),
      keywords: getLocaleValue(bundle, source.keywords),
      canonicalUrl: buildLocalePageUrl(hubPath, locale),
      hreflangAlternates: buildHreflangAlternates(hubPath),
    };
  }
}

for (const explorePath of listExploreCategoryPaths()) {
  hubMeta[explorePath] = {};
  const segments = explorePath.split('/').filter(Boolean);
  const continent = segments[1];
  const category = segments[2];
  for (const locale of LOCALES) {
    const seo = getExploreCategorySeoBundle(continent, category, locale);
    hubMeta[explorePath][locale] = {
      title: seo.title,
      description: seo.description,
      keywords: seo.keywords,
      canonicalUrl: buildLocalePageUrl(explorePath, locale),
      hreflangAlternates: buildHreflangAlternates(explorePath),
    };
  }
}

mkdirSync(dirname(placeOutFile), { recursive: true });
writeFileSync(
  placeOutFile,
  `// Generated by scripts/generate-crawler-place-meta.mjs — do not edit.\nexport default ${JSON.stringify(meta, null, 2)};\n`,
);
writeFileSync(
  hubOutFile,
  `// Generated by scripts/generate-crawler-place-meta.mjs — do not edit.\nexport default ${JSON.stringify(hubMeta, null, 2)};\n`,
);

if (crawlerSpots.length !== EXPECTED_TRAVEL_SPOT_COUNT) {
  console.warn(
    `generate:crawler-place-meta warn — expected ${EXPECTED_TRAVEL_SPOT_COUNT} TRAVEL_SPOTS, got ${crawlerSpots.length}`,
  );
}

console.log('generate:crawler-place-meta');
console.log(`  crawler slugs  ${crawlerSpots.length} (TRAVEL_SPOTS all)`);
console.log(`  place entries ${crawlerSpots.length * TABS.length * LOCALES.length}`);
console.log(`  hub entries   ${Object.keys(hubMeta).length * LOCALES.length} (${HUB_PATHS.length} hubs + ${listExploreCategoryPaths().length} explore categories)`);
console.log(`  place output  ${placeOutFile}`);
console.log(`  hub output    ${hubOutFile}`);
