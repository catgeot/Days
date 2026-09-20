#!/usr/bin/env node
/**
 * essential_guide / essential_guide_en locale 분기 (#22).
 * 네트워크 없음. Usage: node scripts/smoke-essential-guide-locale.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    process.exit(1);
  }
}

const KO_GUIDE = {
  journey_timeline: [{ step: 1, title: '인천 출발', duration: '7시간' }],
  categories: { flight: { advice: '한글 항공 팁' } },
};

const EN_GUIDE = {
  journey_timeline: [{ step: 1, title: 'Depart ICN', duration: '7h' }],
  categories: { flight: { advice: 'English flight tips' } },
};

const { resolveEssentialGuideRaw, getEssentialGuide, hasUsableToolkitForLocation } = await load(
  'src/utils/toolkitPlaceIdResolve.js',
);

const rowBoth = { place_id: 'bali', essential_guide: KO_GUIDE, essential_guide_en: EN_GUIDE };
const rowKoOnly = { place_id: 'bali', essential_guide: KO_GUIDE };
const location = { slug: 'bali', name: '발리', lat: -8.4095, lng: 115.1889 };

assert(resolveEssentialGuideRaw(rowBoth, 'en') === EN_GUIDE, 'en locale prefers essential_guide_en');
assert(resolveEssentialGuideRaw(rowBoth, 'ko') === KO_GUIDE, 'ko locale uses essential_guide');
assert(
  resolveEssentialGuideRaw(rowKoOnly, 'en') === KO_GUIDE,
  'en locale falls back to ko when en column empty',
);
assert(
  getEssentialGuide(rowBoth, location, 'en')?.categories?.flight?.advice === 'English flight tips',
  'getEssentialGuide en',
);
assert(
  getEssentialGuide(rowKoOnly, location, 'en')?.categories?.flight?.advice === '한글 항공 팁',
  'getEssentialGuide en ko fallback',
);
assert(hasUsableToolkitForLocation(rowKoOnly, location, 'en'), 'ko fallback counts as usable');

console.log('smoke-essential-guide-locale: PASS');
