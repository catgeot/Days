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
assert(layersSrc.includes('GATEO_LABEL_HI_OVERLAP_LAYER_ID'), 'needs hi-overlap label layer');
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
const annotated = annotateLabelOverlapEligibility(majors);
assert(annotated.every((m) => m.labelOverlapEligible), 'phuket/khao-lak overlap-eligible pair');

const seoul = TRAVEL_SPOTS.find((s) => s.slug === 'seoul');
const tokyo = TRAVEL_SPOTS.find((s) => s.slug === 'tokyo');
if (seoul && tokyo) {
  const farPair = annotateLabelOverlapEligibility([
    { ...seoul, type: 'major' },
    { ...tokyo, type: 'major' },
  ]);
  assert(!farPair[0].labelOverlapEligible && !farPair[1].labelOverlapEligible, 'seoul/tokyo not eligible');
}

assert(areMarkerCoordsNear(phuket, khao, 1.1), 'sanity near box');

console.log('smoke-globe-gateo-label-layers: PASS');
