import fs from 'fs';
import path from 'path';

const distAssets = path.join(process.cwd(), 'dist', 'assets');
const jsFiles = fs.readdirSync(distAssets).filter((file) => file.endsWith('.js'));

const indexFiles = jsFiles.filter((file) => file.startsWith('index-')).sort();
if (indexFiles.length === 0) {
  console.error('[verify-globe-engine] dist/assets/index-*.js not found. Run npm run build first.');
  process.exit(1);
}

/** Index entry chunks + any asset that embeds Mapbox token or gateo map layers. */
const relevantFiles = new Set(indexFiles);
for (const file of jsFiles) {
  const text = fs.readFileSync(path.join(distAssets, file), 'utf8');
  if (
    text.includes('pk.ey') ||
    text.includes('gateo-spots-dot') ||
    text.includes('gateo-spots-label')
  ) {
    relevantFiles.add(file);
  }
}

const sortedRelevant = [...relevantFiles].sort();
const bundle = sortedRelevant
  .map((file) => fs.readFileSync(path.join(distAssets, file), 'utf8'))
  .join('\n');

const hasMapboxToken = bundle.includes('pk.ey');
const hasBrokenMobileBranch = /useMemo\(\(\)=>\{try\{const \w=window\.navigator\?\.userAgent[^]*?return"legacy"/.test(
  bundle,
);
// Vite/esbuild minify varies across resolver refactors.
const hasProdFirstResolver =
  /return t\?i\?"mapbox"/.test(bundle) ||
  /return t\?a\?"mapbox"/.test(bundle) ||
  /useMemo\(\(\)=>"mapbox"/.test(bundle) ||
  (/mapboxToken:\w+,isProd:\w+=!0/.test(bundle) && /return \w+\?\w+\?"mapbox"/.test(bundle)) ||
  /if\(!\w+\)return"legacy";if\(\w+\)return"mapbox"/.test(bundle);

if (hasMapboxToken && hasBrokenMobileBranch) {
  console.error('[verify-globe-engine] Production bundle selects legacy globe on mobile UA.');
  process.exit(1);
}

if (hasMapboxToken && !hasProdFirstResolver) {
  console.error(
    '[verify-globe-engine] Mapbox token is present but production resolver is missing prod-first mapbox path.',
  );
  process.exit(1);
}

const hasGateoMarkerLayers = bundle.includes('gateo-spots-dot') || bundle.includes('gateo-spots-label');
if (hasMapboxToken && !hasGateoMarkerLayers) {
  console.error('[verify-globe-engine] Mapbox token present but gateo symbol layers missing from bundle.');
  process.exit(1);
}

console.log(`[verify-globe-engine] OK (${sortedRelevant.join(', ')})`);
