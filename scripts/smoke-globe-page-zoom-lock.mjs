#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  isMultiTouchMapEvent,
  shouldLockHomeGlobePageZoom,
} from '../src/pages/Home/lib/homeGlobePageZoomLock.js';
import {
  PAGE_ZOOM_SCALE_EPSILON,
  VIEWPORT_PAGE_ZOOM_LOCK_SUFFIX,
  applyViewportPageZoomLock,
  isViewportPageZoomLocked,
  isVisualViewportPageZoomed,
  releaseViewportPageZoomLock,
  stripViewportPageZoomLock,
  withViewportPageZoomLock,
} from '../src/shared/lib/mobileViewport.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.equal(shouldLockHomeGlobePageZoom('/'), true, 'home locks page zoom');
assert.equal(shouldLockHomeGlobePageZoom('/explore'), true, 'explore overlay still locks');
assert.equal(shouldLockHomeGlobePageZoom('/explore/europe/city'), true, 'explore nested locks');
assert.equal(shouldLockHomeGlobePageZoom('/place/paris'), false, 'place page keeps pinch');
assert.equal(shouldLockHomeGlobePageZoom('/place/paris/gallery'), false, 'gallery pinch kept');
assert.equal(shouldLockHomeGlobePageZoom('/korea'), false, 'korea hub is not home globe');
assert.equal(shouldLockHomeGlobePageZoom(''), false, 'empty path does not lock');

assert.equal(PAGE_ZOOM_SCALE_EPSILON, 0.02);
assert.equal(isVisualViewportPageZoomed(1), false);
assert.equal(isVisualViewportPageZoomed(1.01), false);
assert.equal(isVisualViewportPageZoomed(1.05), true, 'page zoomed in');
assert.equal(isVisualViewportPageZoomed(0.9), true, 'page zoomed out');
assert.equal(isVisualViewportPageZoomed(undefined), false);

assert.equal(
  stripViewportPageZoomLock('width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no'),
  'width=device-width, initial-scale=1.0, viewport-fit=cover',
);
assert.equal(
  withViewportPageZoomLock('width=device-width, initial-scale=1.0, viewport-fit=cover'),
  `width=device-width, initial-scale=1.0, viewport-fit=cover, ${VIEWPORT_PAGE_ZOOM_LOCK_SUFFIX}`,
);

assert.equal(isMultiTouchMapEvent({ originalEvent: { touches: [{}, {}] } }), true);
assert.equal(isMultiTouchMapEvent({ originalEvent: { touches: [{}] } }), false);
assert.equal(isMultiTouchMapEvent({ points: [{}, {}] }), true);
assert.equal(isMultiTouchMapEvent({ point: { x: 1, y: 1 } }), false);

const prevDocument = globalThis.document;
const meta = {
  content: 'width=device-width, initial-scale=1.0, viewport-fit=cover',
  getAttribute(name) {
    return name === 'content' ? this.content : null;
  },
  setAttribute(name, value) {
    if (name === 'content') this.content = value;
  },
};
globalThis.document = {
  querySelector(selector) {
    return selector === 'meta[name="viewport"]' ? meta : null;
  },
};
try {
  assert.equal(isViewportPageZoomLocked(), false);
  applyViewportPageZoomLock();
  assert.equal(isViewportPageZoomLocked(), true);
  assert.match(meta.content, /maximum-scale=1\.0/);
  assert.match(meta.content, /user-scalable=no/);
  releaseViewportPageZoomLock();
  assert.equal(isViewportPageZoomLocked(), false);
  assert.equal(meta.content, 'width=device-width, initial-scale=1.0, viewport-fit=cover');
} finally {
  if (prevDocument === undefined) delete globalThis.document;
  else globalThis.document = prevDocument;
}

const home = readFileSync(join(root, 'src/pages/Home/index.jsx'), 'utf8');
assert.match(home, /useHomeGlobePageZoomLock/, 'Home arms the globe page-zoom lock');
assert.match(home, /shouldLockHomeGlobePageZoom/, 'Home uses pathname lock policy');

const mapbox = readFileSync(join(root, 'src/pages/Home/components/HomeGlobeMapbox.jsx'), 'utf8');
assert.match(mapbox, /touch-none/, 'Mapbox globe wrapper blocks browser pinch');
assert.match(mapbox, /resetVisualViewportPageZoom/, '우주 복귀 also resets page zoom');

const space = readFileSync(join(root, 'src/pages/Home/lib/globeSpaceHitTest.js'), 'utf8');
assert.match(space, /isMultiTouchMapEvent/, 'space drag guard lets pinch through');

const css = readFileSync(join(root, 'src/index.css'), 'utf8');
assert.match(css, /\.gateo-globe-map/, 'globe canvas has touch-action none');

const vercel = readFileSync(join(root, 'vercel.json'), 'utf8');
assert.match(vercel, /\/qa\/globe-frame-zoom/, 'vercel.json has /qa/globe-frame-zoom');
assert.match(
  vercel,
  /days-git-cursor-globe-frame-zoom-7106-catgeots-projects\.vercel\.app/,
  'qa/globe-frame-zoom points at this Preview',
);

const qa = readFileSync(join(root, 'src/shared/cloudPreview/cloudQaShareLinks.js'), 'utf8');
assert.match(qa, /slug:\s*'globe-frame-zoom'/, 'qa share slug is globe-frame-zoom');
assert.match(qa, /branch:\s*'cursor\/globe-frame-zoom-7106'/, 'qa share branch is globe-frame-zoom');

console.log('smoke:globe-page-zoom-lock PASS');
