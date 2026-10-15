import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  readGateoEnvFlag,
  isGateoPlaceCrosslinkEnabled,
} from '../src/shared/gateoFeatureFlags.js';

test('readGateoEnvFlag reads VITE_GATEO_* under node test harness (import.meta.env → __VITE_ENV__)', () => {
  const key = GATEO_ENV_FLAG_NAMES.PLACE_CROSSLINK;
  const prev = globalThis.__VITE_ENV__[key];
  globalThis.__VITE_ENV__[key] = '1';
  assert.equal(readGateoEnvFlag(key), true);
  assert.equal(isGateoPlaceCrosslinkEnabled(), true);
  globalThis.__VITE_ENV__[key] = '';
  assert.equal(readGateoEnvFlag(key), false);
  globalThis.__VITE_ENV__[key] = prev;
});
