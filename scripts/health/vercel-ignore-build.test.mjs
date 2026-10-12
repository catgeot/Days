import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const script = join(root, 'scripts/vercel-ignore-build.sh');

function exitCode(env) {
  const result = spawnSync('bash', [script], {
    env: { PATH: process.env.PATH, ...env },
    encoding: 'utf8',
  });
  assert.equal(result.error, undefined);
  return result.status;
}

test('cursor preview builds are skipped and production or main always build', () => {
  assert.equal(exitCode({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'main' }), 1);
  assert.equal(exitCode({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'main' }), 1);
  assert.equal(exitCode({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'cursor/foo' }), 0);
  assert.equal(exitCode({ VERCEL_ENV: 'preview', VERCEL_GIT_COMMIT_REF: 'feature/x' }), 1);
  assert.equal(exitCode({}), 1);
  assert.equal(exitCode({ VERCEL_ENV: 'production', VERCEL_GIT_COMMIT_REF: 'cursor/foo' }), 1);
  assert.equal(exitCode({ VERCEL_GIT_COMMIT_REF: '' }), 1);

  const vercel = JSON.parse(readFileSync(join(root, 'vercel.json'), 'utf8'));
  assert.equal(vercel.ignoreCommand, 'bash scripts/vercel-ignore-build.sh');
  assert.ok(Array.isArray(vercel.redirects) && vercel.redirects.length > 0);
  assert.ok(Array.isArray(vercel.rewrites) && vercel.rewrites.length > 0);
});
