#!/usr/bin/env node
/**
 * Swap ChatModal.jsx for gate matrix (main pre-fix vs fix branch).
 * Usage: node scripts/swap-mooni-chatmodal-for-gate.mjs main|fix
 */
import { copyFileSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';

const mode = process.argv[2];
const chatModal = 'src/pages/Home/components/ChatModal.jsx';
const backup = '/tmp/ChatModal.mooni-gate-fix.jsx';

if (mode === 'fix') {
  if (!existsSync(backup)) {
    console.error('No backup — run `main` first or commit fix ChatModal.');
    process.exit(1);
  }
  writeFileSync(chatModal, readFileSync(backup));
  console.log('Restored fix ChatModal.jsx');
  process.exit(0);
}

if (mode !== 'main') {
  console.error('Usage: swap-mooni-chatmodal-for-gate.mjs main|fix');
  process.exit(1);
}

copyFileSync(chatModal, backup);
const mainSrc = spawnSync('git', ['show', 'origin/main:src/pages/Home/components/ChatModal.jsx'], {
  encoding: 'utf8',
});
if (mainSrc.status !== 0) {
  console.error(mainSrc.stderr);
  process.exit(1);
}
writeFileSync(chatModal, mainSrc.stdout);
console.log('Swapped ChatModal.jsx to origin/main (pre #431 hydrate guard)');
