#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyHomeGlobeFlyOutcome,
  shouldResumeAutoRotateAfterHomeFly,
} from '../src/pages/Home/lib/homeGlobeFlySession.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const mapboxSrc = readFileSync(
  join(root, 'src/pages/Home/components/HomeGlobeMapbox.jsx'),
  'utf8',
);

assert.equal(classifyHomeGlobeFlyOutcome({ lat: 35.67, lng: 139.7 }, { lat: 35.67, lng: 139.7 }), 'arrived');
assert.equal(classifyHomeGlobeFlyOutcome({ lat: 10, lng: 80 }, { lat: 35.67, lng: 139.7 }), 'short');
assert.equal(shouldResumeAutoRotateAfterHomeFly('arrived'), false);
assert.equal(shouldResumeAutoRotateAfterHomeFly('short'), true);
assert.equal(shouldResumeAutoRotateAfterHomeFly('interrupted'), true);
assert.equal(shouldResumeAutoRotateAfterHomeFly('repress'), true);

assert.match(mapboxSrc, /releaseHomeGlobeFlySession/);
assert.match(mapboxSrc, /homeGlobeFlySession\.js/);
assert.match(mapboxSrc, /onHomeGlobeFlySettled/);

console.log('smoke:home-globe-fly-session PASS');
