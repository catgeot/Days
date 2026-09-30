#!/usr/bin/env node
/**
 * Lists eager JS on `/` (index.html entry + modulepreload) with raw/gzip sizes.
 * Also flags GPUShaderStage in eager chunks and sizes lazy three/globe chunks.
 */
import { readFileSync, readdirSync, existsSync } from 'fs';
import { gzipSync } from 'zlib';
import { join } from 'path';

const root = new URL('..', import.meta.url).pathname;
const distDir = join(root, 'dist');
const assetsDir = join(distDir, 'assets');
const indexPath = join(distDir, 'index.html');

if (!existsSync(indexPath)) {
  console.error('dist/index.html missing — run npm run build first');
  process.exit(1);
}

function gzipSize(buf) {
  return gzipSync(buf).length;
}

const html = readFileSync(indexPath, 'utf8');
const eager = new Set();

for (const re of [
  /<script[^>]+src="\/assets\/([^"]+\.js)"/g,
  /modulepreload[^>]+href="\/assets\/([^"]+\.js)"/g,
]) {
  let m;
  while ((m = re.exec(html))) eager.add(m[1]);
}

const rows = [];
for (const file of [...eager].sort()) {
  const path = join(assetsDir, file);
  const raw = readFileSync(path);
  rows.push({
    file,
    raw: raw.length,
    gzip: gzipSize(raw),
    gpu: raw.includes('GPUShaderStage'),
  });
}

const totalGzip = rows.reduce((s, r) => s + r.gzip, 0);
console.log('Eager JS on / (entry + modulepreload)\n');
console.log('| file | raw | gzip | GPUShaderStage |');
console.log('|------|-----|------|----------------|');
for (const r of rows) {
  console.log(`| ${r.file} | ${r.raw} | ${r.gzip} | ${r.gpu ? 'YES' : 'no'} |`);
}
console.log(`\nTotal eager gzip: ${totalGzip}`);

const lazyRe = /^(?:three|globe|HomeGlobe)-/i;
console.log('\nLazy three/globe-related chunks:\n');
for (const file of readdirSync(assetsDir).filter((f) => f.endsWith('.js') && lazyRe.test(f))) {
  const raw = readFileSync(join(assetsDir, file));
  console.log(`  ${file}  raw=${raw.length}  gzip=${gzipSize(raw)}  eager=${eager.has(file)}`);
}

const bad = rows.filter((r) => r.gpu);
if (bad.length) {
  console.error('\nFAIL: GPUShaderStage in eager chunk(s):', bad.map((r) => r.file).join(', '));
  process.exit(1);
}
console.log('\nOK: no GPUShaderStage in eager chunks');
