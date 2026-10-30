import assert from 'node:assert/strict';
import test from 'node:test';

import {
  GATEO_ENV_FLAG_NAMES,
  isGateoLocalInfoRolloutEnabled,
} from '../../src/shared/gateoFeatureFlags.js';

test('VITE_GATEO_LOCAL_INFO_ROLLOUT defaults on and turns off for 0', () => {
  const key = GATEO_ENV_FLAG_NAMES.LOCAL_INFO_ROLLOUT;
  const prev = globalThis.__VITE_ENV__[key];
  try {
    delete globalThis.__VITE_ENV__[key];
    assert.equal(isGateoLocalInfoRolloutEnabled(), true);
    globalThis.__VITE_ENV__[key] = '0';
    assert.equal(isGateoLocalInfoRolloutEnabled(), false);
  } finally {
    if (prev === undefined) delete globalThis.__VITE_ENV__[key];
    else globalThis.__VITE_ENV__[key] = prev;
  }
});
