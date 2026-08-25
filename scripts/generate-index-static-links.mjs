#!/usr/bin/env node
/**
 * index.html — tier1 × staticLinkTier intent KO crawler links.
 * @see plans/en-seo-followup-plan.md #8
 *
 *   npm run generate:index-static-links
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  PLACE_SEARCH_INTENTS,
  formatPlaceSearchTemplate,
  getPlaceSearchTabTitle,
} from '../src/data/placeSearchIntent.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const indexPath = join(root, 'index.html');

const START = '<!-- GATEO_STATIC_KO_LINKS:START -->';
const END = '<!-- GATEO_STATIC_KO_LINKS:END -->';

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

const staticIntents = PLACE_SEARCH_INTENTS.filter((i) => i.staticLinkTier === 1);

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function getKoStaticLinkLabel(spot, intent) {
  const name = spot.name || spot.slug;
  if (intent.koTitle) {
    return formatPlaceSearchTemplate(intent.koTitle, name);
  }
  if (intent.intentId === 'travel') {
    return `${name} 여행`;
  }
  return getPlaceSearchTabTitle(
    { ...spot, name, name_en: spot.name_en || name },
    'ko',
    intent.tab,
  );
}

function buildKoLinksHtml() {
  const items = [];
  for (const spot of tier1) {
    for (const intent of staticIntents) {
      const href = `/place/${spot.slug}/${intent.tab}`;
      const label = getKoStaticLinkLabel(spot, intent);
      items.push(
        `          <li><a href="${href}">${escapeHtml(label)}</a></li>`,
      );
    }
  }
  items.push('          <li><a href="/korea">한국 축제</a></li>');
  return items.join('\n');
}

const indexHtml = readFileSync(indexPath, 'utf8');
if (!indexHtml.includes(START) || !indexHtml.includes(END)) {
  console.error('FAIL  index.html missing GATEO_STATIC_KO_LINKS markers');
  process.exit(1);
}

const block = [
  START,
  '        <h3 lang="ko">인기 여행지 — 지명+여행·갤러리·플래너</h3>',
  '        <ul lang="ko">',
  buildKoLinksHtml(),
  '        </ul>',
  `        ${END}`,
].join('\n');

const pattern = new RegExp(
  `${START.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?${END.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
);
const nextHtml = indexHtml.replace(pattern, block);
writeFileSync(indexPath, nextHtml);

const linkCount = tier1.length * staticIntents.length;
console.log(`OK    index.html static KO links: ${tier1.length} tier1 × ${staticIntents.length} intents = ${linkCount}`);
console.log('      GSC baseline: npm run generate:gsc-baseline');
