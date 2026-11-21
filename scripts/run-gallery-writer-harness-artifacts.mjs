#!/usr/bin/env node
/**
 * PR 브랜치 갤러리 하네스 빌드 + 아티팩트 스크린샷만 (단일 spec).
 */
import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PROD_HOST = 'phdjnbfitvmrguqzverm';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const env = {
  ...process.env,
  VITE_SUPABASE_URL: 'https://gallery-writer-mock.invalid',
  VITE_SUPABASE_ANON_KEY: 'mock-anon-key-not-prod',
  VITE_UNSPLASH_ACCESS_KEY: 'mock-unsplash-key',
  VITE_PEXELS_API_KEY: 'mock-pexels-key',
  VITE_GALLERY_WRITER_HARNESS: '1',
  DEV_SSL: '0',
};

if (!env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL.includes(PROD_HOST)) {
  console.error(`ABORT: effective VITE_SUPABASE_URL points at ${PROD_HOST}`);
  process.exit(1);
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { cwd: root, env, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

await run('npx', ['vite', 'build', '--outDir', 'dist/gallery-writer-harness']);
await run('npx', ['playwright', 'test', '--config=playwright.gallery-artifacts.config.js']);
