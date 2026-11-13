#!/usr/bin/env node
/**
 * Vercel Edge middleware must bundle without import attributes / app data graph.
 *
 *   npm run verify:edge-middleware-bundle
 */
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outFile = join(root, '.cache/edge-middleware-bundle.mjs');
const esbuildBin = join(root, 'node_modules/esbuild/bin/esbuild');

assert.ok(existsSync(esbuildBin), 'esbuild required');

mkdirSync(dirname(outFile), { recursive: true });
rmSync(outFile, { force: true });

execFileSync(
  esbuildBin,
  [
    join(root, 'middleware.js'),
    '--bundle',
    '--platform=neutral',
    '--format=esm',
    `--outfile=${outFile}`,
    '--log-level=warning',
  ],
  { stdio: 'inherit', cwd: root },
);

const source = readFileSync(outFile, 'utf8');
const bytes = Buffer.byteLength(source, 'utf8');

assert.ok(!source.includes("with { type: 'json' }"), 'edge bundle must not contain JSON import attributes');
assert.ok(!source.includes('cityAttractionHubs.js'), 'edge bundle must not pull cityAttractionHubs');
assert.ok(!source.includes('koreaLocalScenicLists.js'), 'edge bundle must not pull koreaLocalScenicLists');

const maxBytes = 4 * 1024 * 1024;
assert.ok(bytes <= maxBytes, `edge middleware bundle ${bytes} bytes exceeds ${maxBytes}`);

console.log('verify:edge-middleware-bundle PASS');
console.log(`  bytes ${bytes}`);
console.log(`  output ${outFile}`);
