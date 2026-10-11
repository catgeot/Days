#!/usr/bin/env node
/**
 * Cos gate matrix: main WebKit wipe proof + branch WebKit/Chromium (a)(b).
 * Requires: npm run build:e2e-mooni, preview on MOONI_E2E_PREVIEW_URL (default 4176).
 */
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const PREVIEW = process.env.MOONI_E2E_PREVIEW_URL || 'https://127.0.0.1:4176/';
const env = { ...process.env, PLAYWRIGHT_BASE_URL: PREVIEW };

function run(cmd, args, extraEnv = {}) {
  const r = spawnSync(cmd, args, {
    cwd: '/workspace',
    stdio: 'inherit',
    env: { ...env, ...extraEnv },
  });
  return r.status === 0;
}

function build() {
  return run('npm', ['run', 'build:e2e-mooni']);
}

function swap(mode) {
  return run('node', ['scripts/swap-mooni-chatmodal-for-gate.mjs', mode]) && build();
}

const results = {};

console.log('\n=== MAIN baseline (WebKit) — gate (a) must FAIL / wipe proof must PASS ===');
if (!swap('main')) process.exit(1);
results.main_gate_a_fix_spec = run(
  'npx',
  [
    'playwright',
    'test',
    '--config=playwright.config.mooni-chip.js',
    '--project=webkit-iphone',
    'e2e/korea-mooni-festival-chip-race.spec.js',
    '-g',
    'stale refresh during',
  ],
  {},
)
  ? 'PASS (unexpected — fix already on main?)'
  : 'FAIL (expected — answer wiped)';

results.main_wipe_proof = run(
  'npx',
  [
    'playwright',
    'test',
    '--config=playwright.config.mooni-chip.js',
    '--project=webkit-iphone',
    'e2e/korea-mooni-festival-chip-main-baseline.spec.js',
  ],
  { MOONI_CHIP_MAIN_BASELINE: '1' },
)
  ? 'PASS (expected — reproduces wipe)'
  : 'FAIL (unexpected)';

console.log('\n=== FIX branch — gate (a)(b) WebKit + Chromium ===');
if (!swap('fix')) process.exit(1);

for (const project of ['webkit-iphone', 'chromium-mobile']) {
  const tag = project.replace(/[^a-z0-9-]+/gi, '-');
  results[`fix_${tag}_gate_a`] = run(
    'npx',
    [
      'playwright',
      'test',
      '--config=playwright.config.mooni-chip.js',
      `--project=${project}`,
      'e2e/korea-mooni-festival-chip-race.spec.js',
      '-g',
      'stale refresh during',
    ],
  )
    ? 'PASS'
    : 'FAIL';
  results[`fix_${tag}_gate_b`] = run(
    'npx',
    [
      'playwright',
      'test',
      '--config=playwright.config.mooni-chip.js',
      `--project=${project}`,
      'e2e/korea-mooni-festival-chip-race.spec.js',
      '-g',
      'trip missing',
    ],
  )
    ? 'PASS'
    : 'FAIL';
}

writeFileSync('/opt/cursor/artifacts/mooni-cos-gate-results.json', JSON.stringify(results, null, 2));
console.log('\n=== RESULTS ===\n', JSON.stringify(results, null, 2));
