import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');
const ssotPath = join(root, 'src/data/logbookEditorialPublished.json');
const scriptPath = join(root, 'scripts/prebuild-sync-logbook-editorial.mjs');

test('prebuild soft-sync: unreachable Supabase keeps SSOT and exits 0', () => {
  const before = readFileSync(ssotPath, 'utf8');
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://mock-supa.invalid',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
    },
    encoding: 'utf8',
  });

  assert.equal(result.status, 0, `expected exit 0, stderr=${result.stderr}`);
  const combined = `${result.stdout}\n${result.stderr}`;
  assert.match(combined, /WARN sync skipped/i, 'expected WARN on fetch failure');
  assert.equal(readFileSync(ssotPath, 'utf8'), before, 'SSOT JSON must be unchanged');
});

test('prebuild soft-sync: mock host build step exits 0', () => {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd: root,
    env: {
      ...process.env,
      VITE_SUPABASE_URL: 'https://mock-supa.invalid',
      VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock',
    },
    encoding: 'utf8',
  });
  assert.equal(result.status, 0);
});
