/**
 * rentalAirportHubs + airportsIndex → Edge 공유 좌표 JSON
 * (update-place-toolkit primary IATA 거리 검증용)
 *
 * npm run generate:toolkit-airport-coords
 */
import { readFileSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { RENTAL_AIRPORT_HUBS } from '../src/utils/rentalAirportHubs.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const INDEX_PATH = join(ROOT, 'src/pages/Home/data/airportsIndex.json');
const OUTPUT_PATH = join(ROOT, 'supabase/functions/_shared/toolkitAirportCoords.json');

const dryRun = process.argv.includes('--dry-run');

/** @type {Record<string, { lat: number, lng: number }>} */
const byIata = {};

for (const hub of RENTAL_AIRPORT_HUBS) {
  const iata = String(hub?.iata ?? '')
    .trim()
    .toUpperCase();
  const lat = Number(hub?.lat);
  const lng = Number(hub?.lng);
  if (!/^[A-Z]{3}$/.test(iata) || !Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  byIata[iata] = { lat, lng };
}

const hubCount = Object.keys(byIata).length;

const index = JSON.parse(readFileSync(INDEX_PATH, 'utf8'));
const indexEntries = index?.byIata ?? {};
let indexAdded = 0;
for (const [code, row] of Object.entries(indexEntries)) {
  const iata = String(code ?? '')
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}$/.test(iata) || byIata[iata]) continue;
  const lat = Number(row?.lat);
  const lng = Number(row?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
  byIata[iata] = { lat, lng };
  indexAdded += 1;
}

const payload = {
  generatedAt: new Date().toISOString(),
  hubCount,
  indexAdded,
  count: Object.keys(byIata).length,
  /** hub 좌표가 index보다 우선 */
  hubPreferred: true,
  byIata,
};

console.log(
  `toolkitAirportCoords: hub=${hubCount} + index=${indexAdded} → total=${payload.count}`
);

if (dryRun) {
  console.log('(dry-run) skip write');
  process.exit(0);
}

writeFileSync(OUTPUT_PATH, `${JSON.stringify(payload)}\n`, 'utf8');
console.log(`wrote ${OUTPUT_PATH}`);
