import assert from 'node:assert/strict';
import { test } from 'node:test';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test('node --check passes for all health scripts', () => {
  const files = fs.readdirSync(__dirname).filter((f) => f.endsWith('.mjs') || f.endsWith('.cjs'));
  assert.ok(files.length >= 5);
  for (const file of files) {
    if (file.endsWith('.test.mjs') || file.endsWith('.test.cjs')) continue;
    execFileSync(process.execPath, ['--check', path.join(__dirname, file)], { stdio: 'pipe' });
  }
});
