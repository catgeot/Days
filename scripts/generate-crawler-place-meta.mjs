#!/usr/bin/env node
/**
 * Crawler meta — Edge middleware SSOT (hub + tier1 place gallery/planner/base).
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
import { getLocalizedPlaceName } from '../src/components/PlaceCard/common/locationDisplay.js';
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';

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

function readLocaleBundle(locale) {
  const file = join(dirname(fileURLToPath(import.meta.url)), '..', 'src/i18n/locales', `${locale}.json`);
  return JSON.parse(readFileSync(file, 'utf8'));
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const placeOutFile = join(root, 'src/edge/crawlerPlaceMeta.generated.js');
const hubOutFile = join(root, 'src/edge/crawlerHubMeta.generated.js');
const TABS = ['gallery', 'planner'];
const LOCALES = ['ko', 'en'];
const HUB_PATHS = ['/', '/korea'];

/** tier1 전수 + tier2 pop≥80 (#11) + tier2 pop70–79 상위 40 (#12). 잔여 tier2는 후속 세션. */
const TIER2_CRAWLER_BATCH1_MIN_POP = 80;
const TIER2_CRAWLER_BATCH2_POP_MIN = 70;
const TIER2_CRAWLER_BATCH2_POP_MAX = 79;
const TIER2_CRAWLER_BATCH2_LIMIT = 40;

const tier2Batch2Slugs = new Set(
  TRAVEL_SPOTS.filter(
    (s) =>
      s.tier === 2 &&
      (s.popularity ?? 0) >= TIER2_CRAWLER_BATCH2_POP_MIN &&
      (s.popularity ?? 0) <= TIER2_CRAWLER_BATCH2_POP_MAX,
  )
    .sort(
      (a, b) =>
        (b.popularity ?? 0) - (a.popularity ?? 0) ||
        String(a.slug).localeCompare(String(b.slug)),
    )
    .slice(0, TIER2_CRAWLER_BATCH2_LIMIT)
    .map((s) => s.slug),
);

function isCrawlerPlaceSpot(spot) {
  if (spot.tier === 1) return true;
  const pop = spot.popularity ?? 0;
  if (pop >= TIER2_CRAWLER_BATCH1_MIN_POP) return true;
  return tier2Batch2Slugs.has(spot.slug);
}

const crawlerSpots = TRAVEL_SPOTS.filter(isCrawlerPlaceSpot).sort((a, b) =>
  String(a.slug).localeCompare(String(b.slug)),
);
const tier1Count = crawlerSpots.filter((s) => s.tier === 1).length;
const tier2Batch1Count = crawlerSpots.filter(
  (s) => s.tier === 2 && (s.popularity ?? 0) >= TIER2_CRAWLER_BATCH1_MIN_POP,
).length;
const tier2Batch2Count = crawlerSpots.filter((s) => s.tier === 2 && tier2Batch2Slugs.has(s.slug)).length;

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
      const ogImage = getPlaceOgImageUrl(spot);
      const entry = {
        title,
        description,
        keywords,
        canonicalUrl: buildLocalePageUrl(pathname, locale),
        hreflangAlternates: buildHreflangAlternates(pathname),
        ogImage,
        placeName,
      };
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
  for (const locale of LOCALES) {
    const bundle = readLocaleBundle(locale);
    if (hubPath === '/') {
      hubMeta[hubPath][locale] = {
        title: stripSiteSuffix(bundle.seo.defaultTitle),
        description: bundle.seo.defaultDescription,
        keywords: bundle.seo.defaultKeywords,
        canonicalUrl: buildLocalePageUrl('/', locale),
        hreflangAlternates: buildHreflangAlternates('/'),
      };
    } else {
      hubMeta[hubPath][locale] = {
        title: bundle.korea.festival.title,
        description: bundle.korea.festival.seoDescription,
        keywords: bundle.seo.defaultKeywords,
        canonicalUrl: buildLocalePageUrl('/korea', locale),
        hreflangAlternates: buildHreflangAlternates('/korea'),
      };
    }
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

console.log('generate:crawler-place-meta');
console.log(
  `  crawler slugs  ${crawlerSpots.length} (tier1 ${tier1Count} + tier2 pop≥${TIER2_CRAWLER_BATCH1_MIN_POP}: ${tier2Batch1Count} + pop${TIER2_CRAWLER_BATCH2_POP_MIN}–${TIER2_CRAWLER_BATCH2_POP_MAX} top${TIER2_CRAWLER_BATCH2_LIMIT}: ${tier2Batch2Count})`,
);
console.log(`  place entries ${crawlerSpots.length * TABS.length * LOCALES.length}`);
console.log(`  hub entries   ${HUB_PATHS.length * LOCALES.length}`);
console.log(`  place output  ${placeOutFile}`);
console.log(`  hub output    ${hubOutFile}`);
