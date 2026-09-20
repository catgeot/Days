#!/usr/bin/env node
/**
 * GSC URL Inspection baseline CSV template.
 * @see plans/en-seo-followup-plan.md #8 · #19
 *
 *   npm run generate:gsc-baseline
 *
 * Human workflow:
 *   cp scripts/data/gsc-seo-baseline-template.csv scripts/outputs/gsc-seo-baseline.csv
 *   fill checked_at · gsc_index_status · gsc_last_crawl (GSC URL Inspection)
 *   npm run audit:gsc-baseline
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { PLACE_SEARCH_INTENTS } from '../src/data/placeSearchIntent.js';
import { EXPLORE_CATEGORY_FEATURED_LINKS } from '../src/pages/Home/lib/exploreCategorySeo.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const outPath = join(root, 'scripts/data/gsc-seo-baseline-template.csv');
const ORIGIN = 'https://www.gateo.kr';

const travelSpotsContent = readFileSync(
  join(root, 'src/pages/Home/data/travelSpots.js'),
  'utf8',
);
const travelSpotsMatch = travelSpotsContent.match(/export const TRAVEL_SPOTS = \[([\s\S]*?)\];/);
if (!travelSpotsMatch) {
  console.error('FAIL  TRAVEL_SPOTS not found');
  process.exit(1);
}

const spots = JSON.parse(`[${travelSpotsMatch[1]}]`);
const tier1 = spots
  .filter((s) => s.tier === 1)
  .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.slug.localeCompare(b.slug));
const tier2Pop80 = spots
  .filter((s) => s.tier === 2 && (s.popularity ?? 0) >= 80)
  .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));
const tier2Pop70 = spots
  .filter((s) => s.tier === 2 && (s.popularity ?? 0) >= 70 && (s.popularity ?? 0) < 80)
  .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

const staticIntents = PLACE_SEARCH_INTENTS.filter((i) => i.staticLinkTier === 1);
const rows = [];
const seenUrls = new Set();

function pushRow({ path, slug = '', intent = '', tab = '', notes = '' }) {
  const url = `${ORIGIN}${path}`;
  if (seenUrls.has(url)) return;
  seenUrls.add(url);
  rows.push({
    url,
    slug,
    intent,
    tab,
    checked_at: '',
    gsc_index_status: '',
    gsc_last_crawl: '',
    notes,
  });
}

for (const spot of tier1) {
  for (const intent of staticIntents) {
    pushRow({
      path: `/place/${spot.slug}/${intent.tab}`,
      slug: spot.slug,
      intent: intent.intentId,
      tab: intent.tab,
      notes: 'tier1',
    });
  }
}

for (const spot of tier2Pop80.slice(0, 10)) {
  for (const intent of staticIntents) {
    pushRow({
      path: `/place/${spot.slug}/${intent.tab}`,
      slug: spot.slug,
      intent: intent.intentId,
      tab: intent.tab,
      notes: 'tier2-pop80-sample',
    });
  }
}

for (const slug of ['hamburg', 'bohol', 'seychelles', 'phuket']) {
  const spot = spots.find((s) => s.slug === slug);
  if (!spot) continue;
  pushRow({
    path: `/place/${slug}/gallery?crawler=1`,
    slug,
    intent: 'gallery',
    tab: 'gallery',
    notes: 'tier2-crawler-view-source',
  });
  pushRow({
    path: `/place/${slug}/wiki?crawler=1`,
    slug,
    intent: 'wiki',
    tab: 'wiki',
    notes: 'wiki-crawler',
  });
}

const hubPaths = [
  { path: '/', intent: 'home', notes: 'hub-crawler' },
  { path: '/korea', intent: 'korea', notes: 'hub-crawler' },
  { path: '/korea/theme/scenic', intent: 'korea-scenic', notes: 'hub-crawler-#15' },
  { path: '/explore', intent: 'explore', notes: 'hub-crawler-#15' },
  { path: '/explore/asia/paradise', intent: 'explore-category', notes: 'explore-#18' },
  { path: '/explore/europe/culture?lang=en', intent: 'explore-category', notes: 'explore-en-#18' },
  { path: '/blog', intent: 'blog', notes: 'logbook-#16' },
  { path: '/blog/curation', intent: 'curation', notes: 'curation-#16' },
];

for (const hub of hubPaths) {
  const path = hub.path.includes('?') ? hub.path : `${hub.path}?crawler=1`;
  pushRow({
    path,
    slug: '',
    intent: hub.intent,
    tab: '',
    notes: hub.notes,
  });
}

for (const slug of ['seoul', 'bohol', 'samoa', 'iceland', 'palawan']) {
  const spot = spots.find((s) => s.slug === slug);
  if (!spot) continue;
  pushRow({
    path: `/place/${slug}/gallery?lang=en`,
    slug,
    intent: 'gallery',
    tab: 'gallery',
    notes: 'tier2-pop70-en-batch4',
  });
}

for (const { continent, category } of EXPLORE_CATEGORY_FEATURED_LINKS.slice(0, 3)) {
  pushRow({
    path: `/explore/${continent}/${category}?crawler=1`,
    slug: '',
    intent: 'explore-category',
    tab: '',
    notes: `explore-ssot-${continent}/${category}`,
  });
}

pushRow({
  path: '/place/tokyo/planner?crawler=1',
  slug: 'tokyo',
  intent: 'flight-route',
  tab: 'planner',
  notes: 'ICN→HND-#14',
});
pushRow({
  path: '/place/phuket/planner?crawler=1',
  slug: 'phuket',
  intent: 'flight-route',
  tab: 'planner',
  notes: 'ICN→HKT-#14',
});

const header = 'url,slug,intent,tab,checked_at,gsc_index_status,gsc_last_crawl,notes';
const csvLines = [
  header,
  ...rows.map((r) =>
    [r.url, r.slug, r.intent, r.tab, r.checked_at, r.gsc_index_status, r.gsc_last_crawl, r.notes].join(','),
  ),
];

writeFileSync(outPath, `${csvLines.join('\n')}\n`);

console.log(`OK    GSC baseline template: ${rows.length} URLs`);
console.log(`      tier1 place intents: ${tier1.length * staticIntents.length}`);
console.log(`      tier2 pop80 sample: ${Math.min(10, tier2Pop80.length) * staticIntents.length}`);
console.log(`      → ${outPath.replace(`${root}/`, '')}`);
