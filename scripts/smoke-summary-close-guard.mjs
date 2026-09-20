#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  GLOBE_MAP_HIT_SELECTOR,
  OVERLAY_CLICK_GUARD_MS,
  eventTargetIsGlobeMap,
  isGlobeClickSuppressed,
  nextOverlayClickGuardUntil,
} from '../src/pages/Home/lib/globeOverlayClickGuard.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(OVERLAY_CLICK_GUARD_MS, 500, 'ghost-click window covers Android 300ms click');
assert.equal(nextOverlayClickGuardUntil(1_000, 500), 1_500);
assert.equal(isGlobeClickSuppressed(1_499, 1_500), true, 'click during guard is suppressed');
assert.equal(isGlobeClickSuppressed(1_500, 1_500), false, 'click at expiry is allowed');

const mapRoot = {
  contains(node) {
    return node === this.child;
  },
};
mapRoot.child = { id: 'canvas' };
const queryRoot = {
  querySelector(selector) {
    assert.equal(selector, GLOBE_MAP_HIT_SELECTOR);
    return mapRoot;
  },
};
assert.equal(eventTargetIsGlobeMap(mapRoot.child, queryRoot), true, 'map canvas is a globe hit');
assert.equal(eventTargetIsGlobeMap({ id: 'summary-x' }, queryRoot), false, 'summary X is not a globe hit');

const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
assert.match(home, /suppressOverlayClick/, 'summary dismiss arms the globe click guard first');

const summary = readFileSync(join(root, 'src/components/PlaceCard/modes/PlaceCardSummary.jsx'), 'utf8');
assert.match(summary, /stopImmediatePropagation/, 'summary X stops the pointer from reaching Mapbox');
assert.match(summary, /onPointerDown=\{\(e\) => \{/, 'Chrome hit-box still closes on pointerdown');

const mapbox = readFileSync(join(root, 'src/pages/Home/components/HomeGlobeMapbox.jsx'), 'utf8');
assert.match(mapbox, /suppressOverlayClick/, 'Mapbox globe exposes overlay click suppress');
assert.match(mapbox, /addEventListener\('click', block, true\)/, 'capture-phase click is blocked on the globe');

const adapter = readFileSync(join(root, 'src/pages/Home/components/HomeGlobeAdapter.jsx'), 'utf8');
assert.match(adapter, /suppressOverlayClick/, 'adapter forwards overlay click suppress');

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/summary-close/, 'vercel.json has /qa/summary-close');
assert.match(
  vercel,
  /days-git-cursor-summary-close-1030-catgeots-projects\.vercel\.app/,
  'qa/summary-close points at this Preview',
);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug:\s*'summary-close'/, 'qa share slug is summary-close');
assert.match(qa, /branch:\s*'cursor\/summary-close-1030'/, 'qa share branch is summary-close');

console.log('smoke:summary-close-guard PASS');
