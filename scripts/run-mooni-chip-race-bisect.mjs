#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';

const PRE_FIX_SHA = '8f6c730e';
const PREVIEW = process.env.MOONI_E2E_PREVIEW_URL || 'https://127.0.0.1:4176/';
const chatModal = 'src/pages/Home/components/ChatModal.jsx';
const backup = '/tmp/ChatModal.fix.jsx';

function run(cmd, args, env = {}) {
  return spawnSync(cmd, args, {
    stdio: 'inherit',
    cwd: '/workspace',
    env: { ...process.env, PLAYWRIGHT_BASE_URL: PREVIEW, ...env },
  }).status === 0;
}

function buildE2e() {
  return run('npm', ['run', 'build:e2e-mooni']);
}

function playwright(project) {
  return run('npx', [
    'playwright',
    'test',
    '--config=playwright.config.mooni-chip.js',
    '--project',
    project,
    'e2e/korea-mooni-festival-chip-race.spec.js',
  ]);
}

copyFileSync(chatModal, backup);

const results = { preFix: {}, fix: {} };

console.log('\n=== PRE-FIX ChatModal @', PRE_FIX_SHA, '===');
const oldModal = spawnSync('git', ['show', `${PRE_FIX_SHA}:${chatModal}`], {
  cwd: '/workspace',
  encoding: 'utf8',
});
if (oldModal.status !== 0) {
  console.error(oldModal.stderr);
  process.exit(1);
}
writeFileSync(chatModal, oldModal.stdout);
if (!buildE2e()) process.exit(1);
for (const p of ['chromium-mobile', 'webkit-iphone']) {
  results.preFix[p] = playwright(p);
}

writeFileSync(chatModal, readFileSync(backup));
console.log('\n=== FIX ChatModal (current branch) ===');
if (!buildE2e()) process.exit(1);
for (const p of ['chromium-mobile', 'webkit-iphone']) {
  results.fix[p] = playwright(p);
}

console.log('\n=== RACE BISECT RESULTS ===');
console.log(JSON.stringify(results, null, 2));
console.log('Expected: preFix all false (FAIL), fix all true (PASS)');
