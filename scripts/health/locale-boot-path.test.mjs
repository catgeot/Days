import test from 'node:test';
import assert from 'node:assert/strict';

import { resolveLocaleBootPathname } from '../../src/i18n/localeBootPath.js';

test('known shell paths keep pathname', () => {
  assert.equal(resolveLocaleBootPathname('/'), '/');
  assert.equal(resolveLocaleBootPathname('/korea'), '/korea');
  assert.equal(resolveLocaleBootPathname('/explore/asia/paradise'), '/explore/asia/paradise');
  assert.equal(resolveLocaleBootPathname('/place/tokyo'), '/place/tokyo');
  assert.equal(resolveLocaleBootPathname('/blog'), '/blog');
});

test('/reels without registered route normalizes to home', () => {
  assert.equal(resolveLocaleBootPathname('/reels'), '/');
  assert.equal(resolveLocaleBootPathname('/reels/foo'), '/');
});

test('unknown paths normalize to home', () => {
  assert.equal(resolveLocaleBootPathname('/not-a-route'), '/');
});
