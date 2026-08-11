/**
 * 10대 절경 runtime resolve 스모크 — hub attraction → place slug 10건.
 *
 *   npm run smoke:korea-top10-scenic
 */
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import {
  placeUrlSlug,
  resolveCityAttractionHub,
  resolveHubAttraction,
  resolveHubPlaceFromSlug,
} from '../src/pages/Home/lib/cityAttractionHubs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaTop10Scenic.json');

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

const data = JSON.parse(readFileSync(JSON_PATH, 'utf8'));
const spots = data.spots || [];

assert(spots.length === 10, 'exactly 10 spots');
assert(data.meta?.curation === 'GATEO', 'GATEO curation label');

for (const spot of spots) {
  const hub = resolveCityAttractionHub(spot.hubId);
  assert(Boolean(hub), `#${spot.rank} hub resolve: ${spot.hubId}`);

  const hit = resolveHubAttraction(spot.attractionName);
  assert(Boolean(hit), `#${spot.rank} attraction resolve: ${spot.attractionName}`);
  assert(hit?.hub?.hubId === spot.hubId, `#${spot.rank} attraction hubId === ${spot.hubId}`);

  const slug = placeUrlSlug(hit?.attraction?.name_en, hit?.attraction?.name);
  assert(slug === spot.placeSlug, `#${spot.rank} placeSlug runtime === ${spot.placeSlug}`);

  const fromSlug = resolveHubPlaceFromSlug(spot.placeSlug);
  assert(Boolean(fromSlug), `#${spot.rank} resolveHubPlaceFromSlug(${spot.placeSlug})`);
  assert(
    fromSlug?.name === spot.attractionName,
    `#${spot.rank} slug hydrates attraction ${spot.attractionName}`,
  );
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-top10-scenic SMOKE OK');
