#!/usr/bin/env node
import { mkdirSync, writeFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { SEA_BASINS_OVERRIDES } from './data/sea-basins-overrides.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, '../src/pages/Home/data/seaBasins.json');

const basins = SEA_BASINS_OVERRIDES.map((b) => ({
  id: b.id,
  name: b.name,
  name_en: b.name_en,
  parentOcean: b.parentOcean,
  tier: b.tier,
  center: b.center,
  bbox: b.bbox,
  aliases: Array.isArray(b.aliases) ? [...b.aliases] : [],
}));

const output = {
  meta: {
    generatedAt: new Date().toISOString(),
    basinCount: basins.length,
    source: 'scripts/data/sea-basins-overrides.mjs',
  },
  basins,
};

mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
console.log(`Wrote ${OUTPUT_PATH} (${output.meta.basinCount} basins)`);
