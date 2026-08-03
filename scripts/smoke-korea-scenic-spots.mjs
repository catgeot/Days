/**
 * 명승지 runtime resolve 스모크 — 샘플 5건 hub → place slug.
 *
 *   npm run smoke:korea-scenic-spots
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
const JSON_PATH = join(__dirname, '../src/pages/Home/data/koreaScenicSpots.json');

const SAMPLE_IDS = [
  'gyeongbokgung',
  'nami-island',
  'jeonju-hanok',
  'haeinsa',
  'cheonjiyeon',
];

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
const byId = new Map(spots.map((s) => [s.id, s]));

assert(spots.length >= 12 && spots.length <= 24, `count 12–24 (got ${spots.length})`);
assert(data.meta?.curation === 'GATEO', 'GATEO curation label');

for (const id of SAMPLE_IDS) {
  const spot = byId.get(id);
  assert(Boolean(spot), `sample present: ${id}`);
  if (!spot) continue;

  const hub = resolveCityAttractionHub(spot.hubId);
  assert(Boolean(hub), `${id} hub resolve: ${spot.hubId}`);

  const hit = resolveHubAttraction(spot.attractionName);
  assert(Boolean(hit), `${id} attraction resolve: ${spot.attractionName}`);
  assert(hit?.hub?.hubId === spot.hubId, `${id} attraction hubId === ${spot.hubId}`);

  const slug = placeUrlSlug(hit?.attraction?.name_en, hit?.attraction?.name);
  assert(slug === spot.placeSlug, `${id} placeSlug runtime === ${spot.placeSlug}`);

  const fromSlug = resolveHubPlaceFromSlug(spot.placeSlug);
  assert(Boolean(fromSlug), `${id} resolveHubPlaceFromSlug(${spot.placeSlug})`);
  assert(
    fromSlug?.name === spot.attractionName,
    `${id} slug hydrates attraction ${spot.attractionName}`,
  );
}

if (failed) {
  console.error(`\n${failed} smoke assertion(s) failed`);
  process.exit(1);
}
console.log('\nkorea-scenic-spots SMOKE OK');
