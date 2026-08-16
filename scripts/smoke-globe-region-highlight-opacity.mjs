#!/usr/bin/env node
/**
 * 나라 포커스 fill — settleZoom·줌 아웃 시 불투명도 유지.
 * Usage: node scripts/smoke-globe-region-highlight-opacity.mjs
 */
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function load(rel) {
  return import(pathToFileURL(join(root, rel)).href);
}

const {
  sampleOpacityAtZoom,
  FILL_PEAK_OPACITY,
} = await load('src/pages/Home/lib/globeRegionHighlightOpacity.js');

let failed = 0;

function assert(cond, msg) {
  if (!cond) {
    console.error(`FAIL: ${msg}`);
    failed += 1;
  } else {
    console.log(`OK: ${msg}`);
  }
}

const peak = FILL_PEAK_OPACITY;

{
  const settle = 4.2;
  assert(sampleOpacityAtZoom(settle, peak, 4.2) === peak, 'KR settle zoom at peak');
  assert(sampleOpacityAtZoom(settle, peak, 1.2) === peak, 'KR zoom-out to globe keeps peak fill');
  assert(sampleOpacityAtZoom(settle, peak, 6.8) === 0, 'KR zoom-in past fade window → 0');
}

{
  const settle = 1.05;
  assert(sampleOpacityAtZoom(settle, peak, 1.05) === peak, 'RU low settle zoom at peak');
  assert(sampleOpacityAtZoom(settle, peak, 1.0) === peak, 'RU zoom-out floor keeps peak fill');
}

if (failed > 0) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}

console.log('\nAll region highlight opacity checks passed');
