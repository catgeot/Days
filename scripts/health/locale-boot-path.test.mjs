import test from 'node:test';
import assert from 'node:assert/strict';

import { GATEO_ENV_FLAG_NAMES } from '../../src/shared/gateoFeatureFlags.js';
import { resolveLocaleBootPathname } from '../../src/i18n/localeBootPath.js';

function withViteEnv(patch, fn) {
  const prev = { ...globalThis.__VITE_ENV__ };
  globalThis.__VITE_ENV__ = { ...prev, ...patch };
  try {
    return fn();
  } finally {
    globalThis.__VITE_ENV__ = prev;
  }
}

test('known shell paths keep pathname', () => {
  withViteEnv({ [GATEO_ENV_FLAG_NAMES.SELF_REELS]: '' }, () => {
    assert.equal(resolveLocaleBootPathname('/'), '/');
    assert.equal(resolveLocaleBootPathname('/korea'), '/korea');
    assert.equal(resolveLocaleBootPathname('/explore/asia/paradise'), '/explore/asia/paradise');
    assert.equal(resolveLocaleBootPathname('/place/tokyo'), '/place/tokyo');
    assert.equal(resolveLocaleBootPathname('/blog'), '/blog');
  });
});

test('/reels without route flag normalizes to home', () => {
  withViteEnv({ [GATEO_ENV_FLAG_NAMES.SELF_REELS]: '' }, () => {
    assert.equal(resolveLocaleBootPathname('/reels'), '/');
  });
});

test('/reels keeps pathname when self reels flag is on', () => {
  withViteEnv({ [GATEO_ENV_FLAG_NAMES.SELF_REELS]: '1' }, () => {
    assert.equal(resolveLocaleBootPathname('/reels'), '/reels');
  });
});
