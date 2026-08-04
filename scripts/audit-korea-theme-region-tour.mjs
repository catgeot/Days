/**
 * 방방곡곡 Tour contentId SSOT 감사
 *
 *   npm run audit:korea-theme-region-tour
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { KOREA_THEME_REGION_TOUR_OVERRIDES } from './data/korea-theme-region-tour-overrides.mjs';
import { listKoreaThemeAreas, listKoreaThemeRegionAttractions } from '../src/pages/Home/lib/koreaThemeRegions.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(
  __dirname,
  '../src/pages/Home/data/koreaThemeRegionTour.json',
);

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

const json = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const overrides = KOREA_THEME_REGION_TOUR_OVERRIDES.byAttractionId || {};
const jsonMap = json.byAttractionId || {};

assert(json.meta?.version === 1, 'meta.version === 1');
assert(typeof jsonMap === 'object', 'byAttractionId object');

const validIds = new Set();
for (const area of listKoreaThemeAreas()) {
  for (const a of listKoreaThemeRegionAttractions(area.areaCode)) {
    validIds.add(a.id);
  }
}

let overrideCount = 0;
for (const [key, entry] of Object.entries(overrides)) {
  overrideCount += 1;
  assert(validIds.has(key), `override key exists in regions: ${key}`);
  assert(
    /^\d{1,32}$/.test(String(entry?.contentId || '')),
    `override contentId numeric: ${key}`,
  );
  assert(
    jsonMap[key]?.contentId === String(entry.contentId),
    `json matches override: ${key}`,
  );
}

assert(overrideCount === Object.keys(jsonMap).length, 'override count == json count');
assert(
  json.meta.count === Object.keys(jsonMap).length,
  `meta.count matches (${json.meta.count})`,
);

const withId = [...validIds].filter((id) => jsonMap[id]?.contentId).length;
console.log(
  `\ncoverage  contentId ${withId}/${validIds.size} (${((withId / validIds.size) * 100).toFixed(1)}%)`,
);

if (failed) {
  console.error(`\n${failed} audit assertion(s) failed`);
  process.exit(1);
}
console.log('\naudit-korea-theme-region-tour: PASS');
