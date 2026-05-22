import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOT_TRANSPORT_OVERRIDES } from './data/travel-spot-transport-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/travelSpotTransport.json');

const spots = {};
for (const [slug, entry] of Object.entries(TRAVEL_SPOT_TRANSPORT_OVERRIDES)) {
  spots[slug] = {
    ...entry,
    source: 'curated-override',
  };
}

const output = {
  meta: {
    generatedAt: new Date().toISOString(),
    spotCount: Object.keys(spots).length,
    source: 'travel-spot-transport-overrides.mjs',
  },
  spots,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');

console.log(`Wrote ${OUTPUT_PATH} (${output.meta.spotCount} spots)`);
