#!/usr/bin/env node
/**
 * Production deploy build (CI `npm run build`) must not ship Preview-only debug UI strings.
 * Vercel Preview (`VERCEL_ENV=preview`)는 작업 로그 패널을 포함하므로 검증 생략.
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const FORBIDDEN = ['모바일 위젯 로그', '작업 로그 닫기', 'cloud-preview-work-log-panel'];

if (process.env.VERCEL_ENV === 'preview') {
  console.log('OK  preview debug chrome check skipped (Vercel Preview build)');
  process.exit(0);
}

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const assetsDir = join(root, 'dist/assets');

if (!existsSync(assetsDir)) {
  console.error('FAIL  dist/assets missing — run vite build first');
  process.exit(1);
}

const hits = [];
for (const name of readdirSync(assetsDir)) {
  if (!name.endsWith('.js')) continue;
  const content = readFileSync(join(assetsDir, name), 'utf8');
  for (const needle of FORBIDDEN) {
    if (content.includes(needle)) {
      hits.push({ file: name, needle });
    }
  }
}

if (hits.length > 0) {
  console.error('FAIL  Preview debug chrome strings in production dist/assets:');
  for (const { file, needle } of hits) {
    console.error(`  ${file}: "${needle}"`);
  }
  process.exit(1);
}

console.log(
  `OK  preview debug chrome absent from dist/assets (${FORBIDDEN.length} forbidden needles)`,
);
