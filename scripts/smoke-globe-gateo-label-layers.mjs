#!/usr/bin/env node
/**
 * Gateo Mapbox label layers — static SSOT (no zoom expression on text-allow-overlap).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const layersSrc = readFileSync(join(root, 'src/pages/Home/lib/globeMarkerLayers.js'), 'utf8');
assert(!layersSrc.includes("['step', ['zoom']"), 'text-allow-overlap must not use zoom step expressions');
assert(layersSrc.includes('GATEO_LABEL_OVERLAP_LAYER_ID'), 'overlap companion layer');
assert(layersSrc.includes('LABEL_PRIMARY_FILTER'), 'zoom filter split without maxzoom gap');
assert(!/maxzoom:\s*GLOBE_LABEL/.test(layersSrc), 'no label maxzoom split');
assert(!layersSrc.includes('GATEO_LABEL_HI_OVERLAP_LAYER_ID'), 'legacy hi-overlap layer removed');
assert(layersSrc.includes('console.error(\'[gateo] setupGateoMarkerLayers failed\''), 'setup failures must log');

const { annotateLabelOverlapEligibility, areMarkerCoordsNear } = await import(
  new URL('../src/pages/Home/lib/globeMarkerLabelOverlap.js', import.meta.url).href
);
const { TRAVEL_SPOTS } = await import(
  new URL('../src/pages/Home/data/travelSpots.js', import.meta.url).href
);

const phuket = TRAVEL_SPOTS.find((s) => s.slug === 'phuket');
const khao = TRAVEL_SPOTS.find((s) => s.slug === 'khao-lak');
assert(phuket && khao, 'fixtures phuket/khao-lak');
const majors = [phuket, khao].map((s) => ({ ...s, type: 'major' }));
const annotated = annotateLabelOverlapEligibility(majors, 2.7);
assert(annotated.find((m) => m.slug === 'khao-lak')?.labelOverlapEligible, 'khao-lak eligible');
assert(!annotated.find((m) => m.slug === 'phuket')?.labelOverlapEligible, 'phuket not eligible');

const { GLOBE_LABEL_TIER2_BOUNDARY_ZOOM, GLOBE_MAJOR_LABEL_OVERLAP_MIN_ZOOM } = await import(
  new URL('../src/pages/Home/lib/globeZoomPolicy.js', import.meta.url).href
);
assert(GLOBE_LABEL_TIER2_BOUNDARY_ZOOM === GLOBE_MAJOR_LABEL_OVERLAP_MIN_ZOOM, 'label boundary SSOT equals overlap min zoom');
assert(layersSrc.includes('GLOBE_LABEL_TIER2_BOUNDARY_ZOOM'), 'label boundary SSOT');
assert(!layersSrc.includes('tier2 - 0.01'), 'no tier2-0.01 label gap');

const seoul = TRAVEL_SPOTS.find((s) => s.slug === 'seoul');
const tokyo = TRAVEL_SPOTS.find((s) => s.slug === 'tokyo');
if (seoul && tokyo) {
  const farPair = annotateLabelOverlapEligibility(
    [
      { ...seoul, type: 'major' },
      { ...tokyo, type: 'major' },
    ],
    2.6,
  );
  assert(!farPair[0].labelOverlapEligible && !farPair[1].labelOverlapEligible, 'seoul/tokyo not eligible');
}

assert(areMarkerCoordsNear(phuket, khao, 1.1), 'sanity near box');

console.log('smoke-globe-gateo-label-layers: PASS');
