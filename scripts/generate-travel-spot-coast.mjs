#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { TRAVEL_SPOT_COAST_OVERRIDES } from './data/travel-spot-coast-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/travelSpotCoast.json');

const COAST_KINDS = new Set(['island', 'archipelago', 'coastal-city', 'reef', 'peninsula']);

const spots = {};
for (const [slug, entry] of Object.entries(TRAVEL_SPOT_COAST_OVERRIDES)) {
  const seaPrimary = entry.seaPrimary;
  const seaIds = Array.isArray(entry.seaIds) && entry.seaIds.length
    ? [...new Set([seaPrimary, ...entry.seaIds])]
    : [seaPrimary];
  spots[slug] = {
    coastKind: entry.coastKind,
    seaPrimary,
    seaIds,
    source: 'curated-override',
  };
  if (!COAST_KINDS.has(entry.coastKind)) {
    throw new Error(`Invalid coastKind for ${slug}: ${entry.coastKind}`);
  }
}

const output = {
  meta: {
    generatedAt: new Date().toISOString(),
    spotCount: Object.keys(spots).length,
    source: 'scripts/data/travel-spot-coast-overrides.mjs',
  },
  spots,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${OUTPUT_PATH} (${output.meta.spotCount} spots)`);
