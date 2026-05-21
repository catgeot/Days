/**
 * travelSpots-list + reconcile 규칙 → Edge Function용 slug→canonical place_id JSON
 *
 *   node scripts/generate-canonical-place-id-map.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { PLACE_TOOLKIT_RECONCILE_RULES } from './data/place-toolkit-reconcile-rules.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const listPath = join(root, 'src/pages/Home/data/travelSpots-list.json');
const outDir = join(root, 'supabase/functions/_shared');
const outPath = join(outDir, 'canonicalPlaceIdMap.json');

const list = JSON.parse(readFileSync(listPath, 'utf8'));
/** @type {Record<string, string>} */
const map = {};

/** slug-first: Edge·DB place_id = slug (identity map for isKnownTravelSpotSlug) */
for (const spot of list) {
  if (spot.slug) map[spot.slug] = spot.slug;
}

for (const rule of PLACE_TOOLKIT_RECONCILE_RULES) {
  for (const slug of rule.slugs || []) {
    if (slug) map[slug] = slug;
  }
}

mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(map)}\n`, 'utf8');
console.log(`Wrote ${Object.keys(map).length} slug→place_id entries → ${outPath}`);
