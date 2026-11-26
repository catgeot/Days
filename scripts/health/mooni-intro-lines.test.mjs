import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pickIntroLine, getMooniIntroLinePool } from '../../src/pages/Home/lib/mooniLines.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '../..');

test('pickIntroLine honors __GATEO_MOONI_INTRO_INDEX__ for E2E', () => {
  const pool = getMooniIntroLinePool();
  assert.ok(pool.length >= 2);
  globalThis.__GATEO_MOONI_INTRO_INDEX__ = 1;
  try {
    const { text, index } = pickIntroLine();
    assert.equal(index, 1);
    assert.equal(text, pool[1]);
  } finally {
    delete globalThis.__GATEO_MOONI_INTRO_INDEX__;
  }
});

test('home-monthly mooni intro e2e wires deterministic intro hook', () => {
  const spec = readFileSync(join(root, 'e2e/home-monthly-mooni-intro-bubble.spec.js'), 'utf8');
  assert.match(spec, /__GATEO_MOONI_INTRO_INDEX__/);
  assert.match(spec, /MOONI_INTRO_LINES_KO/);
  assert.match(spec, /sessionStorage\.removeItem\('gateo_mooni_intro_seen'\)/);
});