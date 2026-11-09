import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

test('cursor branches do not auto-deploy and main stays at the Vercel default', () => {
  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  assert.equal(vercel.git.deploymentEnabled['cursor/*'], false);
  assert.equal(vercel.git.deploymentEnabled['cursor/auth-session-persist-3163'], true);
  assert.equal(vercel.git.deploymentEnabled['cursor/festival-access-promo-5b7f'], true);
  assert.equal(vercel.git.deploymentEnabled['cursor/explore-search-fix-bfa1'], true);
  assert.equal(vercel.git.deploymentEnabled['cursor/explore-cards-d0e2'], true);
  const allowed = Object.entries(vercel.git.deploymentEnabled).filter(([, on]) => on === true);
  assert.deepEqual(allowed, [
    ['cursor/auth-session-persist-3163', true],
    ['cursor/festival-access-promo-5b7f', true],
    ['cursor/explore-search-fix-bfa1', true],
    ['cursor/explore-cards-d0e2', true],
  ]);
  assert.equal(Object.hasOwn(vercel.git.deploymentEnabled, 'main'), false);
  assert.equal(vercel.git.deploymentEnabled !== false, true);
  assert.equal(vercel.ignoreCommand, undefined);
  assert.equal(readFileSync(join(root, 'vercel.json'), 'utf8').includes('ignoreCommand'), false);
  assert.ok(Array.isArray(vercel.redirects) && vercel.redirects.length > 0);
  assert.ok(Array.isArray(vercel.rewrites) && vercel.rewrites.length > 0);
});
