#!/usr/bin/env node
/**
 * Run gate (a) on pre-fix vs fix ChatModal. Requires preview on MOONI_E2E_PREVIEW_URL.
 */
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';

const PRE_FIX = '8f6c730e';
const PREVIEW = process.env.MOONI_E2E_PREVIEW_URL || 'https://127.0.0.1:4176/';
const chatModal = 'src/pages/Home/components/ChatModal.jsx';
const backup = '/tmp/ChatModal.fix.jsx';

function runPlaywright(project) {
  return (
    spawnSync(
      'npx',
      [
        'playwright',
        'test',
        '--config=playwright.config.mooni-chip.js',
        '--project',
        project,
        'e2e/korea-mooni-festival-chip-race.spec.js',
        '-g',
        '(a) stale refresh',
      ],
      {
        cwd: '/workspace',
        stdio: 'inherit',
        env: { ...process.env, PLAYWRIGHT_BASE_URL: PREVIEW },
      },
    ).status === 0
  );
}

function build() {
  return spawnSync('npm', ['run', 'build:e2e-mooni'], {
    cwd: '/workspace',
    stdio: 'inherit',
  }).status === 0;
}

copyFileSync(chatModal, backup);

const out = { preFix: {}, fix: {} };
const projects = ['webkit-iphone', 'chromium-mobile'];

console.log('\n=== PRE-FIX', PRE_FIX, '===');
writeFileSync(
  chatModal,
  spawnSync('git', ['show', `${PRE_FIX}:${chatModal}`], { encoding: 'utf8' }).stdout,
);
if (!build()) process.exit(1);
for (const p of projects) out.preFix[p] = runPlaywright(p);

writeFileSync(chatModal, readFileSync(backup));
console.log('\n=== FIX (branch) ===');
if (!build()) process.exit(1);
for (const p of projects) out.fix[p] = runPlaywright(p);

console.log('\n=== GATE (a) RESULTS ===');
console.log(JSON.stringify(out, null, 2));
