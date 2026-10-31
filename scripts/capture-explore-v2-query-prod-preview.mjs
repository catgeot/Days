#!/usr/bin/env node
/**
 * Production dist + vite preview — /explore?explore_v2=1 at 390·1280.
 * Asserts Preview debug chrome strings are absent from the bundle path.
 */
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir =
  process.env.GATEO_CAPTURE_OUT ||
  join('/opt/cursor/artifacts', 'explore-v2-query-prod-preview');
const port = Number(process.env.GATEO_PREVIEW_PORT || 4177);
const baseURL = `http://127.0.0.1:${port}`;

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, { stdio: 'inherit', cwd: root, ...opts });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(' ')} exited ${code}`));
    });
  });
}

async function waitForUrl(url, timeoutMs = 60_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`timeout waiting for ${url}`);
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  await run('npm', ['run', 'build'], {
    env: { ...process.env, VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://example.supabase.co', VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'e2e-anon-placeholder' },
  });

  const preview = spawn(
    'npx',
    ['vite', 'preview', '--host', '127.0.0.1', '--port', String(port)],
    {
      cwd: root,
      stdio: 'pipe',
      env: { ...process.env, DEV_SSL: '0', BROWSER: 'none' },
    },
  );

  try {
    await waitForUrl(`${baseURL}/explore`);
    const browser = await chromium.launch();
    const contexts = [
      { width: 390, height: 844, name: '390' },
      { width: 1280, height: 720, name: '1280' },
    ];

    for (const { width, height, name } of contexts) {
      const context = await browser.newContext({
        viewport: { width, height },
        deviceScaleFactor: 1,
        locale: 'ko-KR',
      });
      const page = await context.newPage();
      await page.goto(`${baseURL}/explore?explore_v2=1`, {
        waitUntil: 'domcontentloaded',
        timeout: 90_000,
      });
      await page.getByTestId('explore-v2-monthly-section').waitFor({
        state: 'visible',
        timeout: 45_000,
      });
      const widgetLog = await page.getByText('모바일 위젯 로그').count();
      const workLog = await page.getByText('작업 로그').count();
      if (widgetLog !== 0 || workLog !== 0) {
        throw new Error(`debug chrome visible on prod preview (${name}): widget=${widgetLog} work=${workLog}`);
      }
      if (name === '390') {
        await page.screenshot({
          path: join(outDir, `explore-v2-query-${name}.png`),
          clip: { x: 0, y: 0, width: 390, height: 844 },
        });
      } else {
        await page.screenshot({
          path: join(outDir, `explore-v2-query-${name}.png`),
          fullPage: false,
        });
      }
      await context.close();
    }
    await browser.close();
    writeFileSync(join(outDir, 'README.txt'), `base=${baseURL}/explore?explore_v2=1\n`);
    console.log(`OK  captures in ${outDir}`);
  } finally {
    preview.kill('SIGTERM');
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
