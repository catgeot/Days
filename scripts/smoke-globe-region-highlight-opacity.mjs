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
  resolveHighlightZoomInFadeStops,
  FILL_PEAK_OPACITY,
  HIGHLIGHT_ZOOM_IN_FADE_END_OFFSET,
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
  const [, , fadeStart, , fadeEnd] = resolveHighlightZoomInFadeStops(settle);
  assert(fadeEnd === settle + HIGHLIGHT_ZOOM_IN_FADE_END_OFFSET, 'KR fade end offset widened');
  assert(sampleOpacityAtZoom(settle, peak, fadeStart) < peak, 'KR zoom-in past fade start thins fill');
  assert(sampleOpacityAtZoom(settle, peak, fadeEnd + 0.1) === 0, 'KR zoom-in past fade window → 0');
  assert(sampleOpacityAtZoom(settle, peak, 6.8) > 0, 'KR zoom 6.8 still has fill (was 0 at 6.6 before)');
}

{
  const settle = 5;
  const [, , , , fadeEnd] = resolveHighlightZoomInFadeStops(settle);
  assert(fadeEnd === 9.5, 'settle 5 → fill gone at zoom 9.5 (was ~7.4)');
  assert(sampleOpacityAtZoom(settle, peak, 7.4) > 0, 'settle 5 zoom 7.4 still has fill');
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
