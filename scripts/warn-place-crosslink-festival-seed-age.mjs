/**
 * Non-failing CI warning when place crosslink festival seed is stale (>30 days).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SEED_PATH = join(__dirname, '../src/pages/Home/data/placeCrosslinkFestivalSeed.json');
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

function main() {
  let raw;
  try {
    raw = JSON.parse(readFileSync(SEED_PATH, 'utf8'));
  } catch (err) {
    console.warn(`WARN place-crosslink-festival-seed: cannot read seed (${err.message})`);
    return;
  }
  const generatedAt = raw?.meta?.generatedAt;
  if (!generatedAt) {
    console.warn('WARN place-crosslink-festival-seed: meta.generatedAt missing — run npm run generate:place-crosslink-festival-seed');
    return;
  }
  const ts = Date.parse(generatedAt);
  if (!Number.isFinite(ts)) {
    console.warn(`WARN place-crosslink-festival-seed: invalid generatedAt ${generatedAt}`);
    return;
  }
  const ageMs = Date.now() - ts;
  if (ageMs > MAX_AGE_MS) {
    const days = Math.floor(ageMs / (24 * 60 * 60 * 1000));
    console.warn(
      `WARN place-crosslink-festival-seed: seed is ${days} days old (generatedAt=${generatedAt}). Regenerate with npm run generate:place-crosslink-festival-seed`,
    );
  } else {
    console.log(`place-crosslink-festival-seed age OK (generatedAt=${generatedAt})`);
  }
}

main();
