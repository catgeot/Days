#!/usr/bin/env node
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const distDir = resolve(root, 'dist');
const assetsDir = resolve(distDir, 'assets');
const recoveryFile = readdirSync(assetsDir).find(
  (name) => name.startsWith('staleBundleRecovery-') && name.endsWith('.js'),
);
if (!recoveryFile) {
  console.error('inject-stale-bundle-recovery-script: recovery chunk missing');
  process.exit(1);
}
const recoverySrc = `/assets/${recoveryFile}`;
const indexPath = resolve(distDir, 'index.html');
let html = readFileSync(indexPath, 'utf8');
const recoveryScriptNeedle = `<script type="module" crossorigin src="${recoverySrc}"></script>`;
if (html.includes(recoveryScriptNeedle)) {
  console.log('inject-stale-bundle-recovery-script: already present');
  process.exit(0);
}
const tag = `<script type="module" crossorigin src="${recoverySrc}"></script>\n    `;
html = html.replace(
  /(<script type="module" crossorigin src="\/assets\/index-[^"]+\.js"><\/script>)/,
  `${tag}$1`,
);
if (!html.includes(recoverySrc)) {
  console.error('inject-stale-bundle-recovery-script: failed to patch index.html');
  process.exit(1);
}
writeFileSync(indexPath, html);
console.log('inject-stale-bundle-recovery-script: OK', recoverySrc);
