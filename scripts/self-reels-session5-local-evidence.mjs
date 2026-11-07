/**
 * Session5 local evidence only (no shared Preview).
 * Builds OFF / empty / fixture play(+fail reuse) captures at 390 & 1280.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = '/opt/cursor/artifacts/self-reels-session5';
const FIXTURE_MP4 = fs.readFileSync(path.join(ROOT, 'e2e/fixtures/self-reels-fixture.mp4'));

function run(cmd, env = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, {
      cwd: ROOT,
      env: { ...process.env, ...env, BROWSER: 'none', DEV_SSL: '0' },
      shell: true,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let out = '';
    child.stdout.on('data', (d) => {
      out += d;
    });
    child.stderr.on('data', (d) => {
      out += d;
    });
    child.on('exit', (code) => {
      if (code === 0) resolve(out);
      else reject(new Error(`${cmd}\n${out.slice(-4000)}`));
    });
  });
}

async function waitHttp(url, ms = 120_000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status > 0) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`timeout ${url}`);
}

async function startPreview(outDir, port) {
  const child = spawn(
    `npx vite preview --host 127.0.0.1 --port ${port} --strictPort --outDir ${outDir}`,
    { cwd: ROOT, env: { ...process.env, BROWSER: 'none', DEV_SSL: '0' }, shell: true, stdio: 'ignore' },
  );
  await waitHttp(`http://127.0.0.1:${port}/`);
  return child;
}

async function shot(page, file, width, height) {
  await page.setViewportSize({ width, height });
  const dest = path.join(OUT, file);
  await page.screenshot({ path: dest, clip: { x: 0, y: 0, width, height } });
  return dest;
}

async function stubVideos(page) {
  await page.route('https://fixture.invalid/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'video/mp4',
      body: FIXTURE_MP4,
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    });
  });
}

async function stubFailAllow(page) {
  await page.route('https://fixture.invalid/**', async (route) => {
    const url = route.request().url();
    if (url.includes('fixture-allow')) {
      await route.abort('failed');
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'video/mp4',
      body: FIXTURE_MP4,
      headers: { 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' },
    });
  });
}

fs.mkdirSync(OUT, { recursive: true });

const results = [];

// Parallel builds: default OFF, shell empty (page ON, fixture OFF), fixture ON
const viteClientEnv = {
  VITE_MAPBOX_TOKEN: process.env.VITE_MAPBOX_TOKEN || '',
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || '',
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || '',
};

await Promise.all([
  run('npx vite build --outDir dist-s5-off --emptyOutDir', { ...viteClientEnv }),
  run('npx vite build --outDir dist-s5-empty --emptyOutDir', {
    ...viteClientEnv,
    VITE_GATEO_SELF_REELS: '1',
  }),
  run('npx vite build --outDir dist-s5-fixture --emptyOutDir', {
    ...viteClientEnv,
    VITE_GATEO_SELF_REELS: '1',
    VITE_GATEO_SELF_REELS_FIXTURE: '1',
  }),
]);

const browser = await chromium.launch();
const previews = [];

try {
  const offProc = await startPreview('dist-s5-off', 5201);
  previews.push(offProc);
  const emptyProc = await startPreview('dist-s5-empty', 5202);
  previews.push(emptyProc);
  const fixProc = await startPreview('dist-s5-fixture', 5203);
  previews.push(fixProc);

  // ① OFF → /reels lands home (URL / alone is NOT home PASS — wait for real home cues)
  {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5201/reels', { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForFunction(
      () =>
        /GATEO/i.test(document.title || '') &&
        (Boolean(document.querySelector('.mapboxgl-canvas, .mapboxgl-map, [data-search-bar-anchor]')) ||
          /검색|search/i.test(document.body?.innerText || '')),
      null,
      { timeout: 45_000 },
    );
    results.push(await shot(page, 'off-reels-home-390.png', 390, 844));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:5201/reels', { waitUntil: 'domcontentloaded' });
    await page.waitForURL((url) => url.pathname === '/' || url.pathname === '');
    await page.waitForFunction(() => document.readyState === 'complete');
    await page.waitForFunction(
      () =>
        /GATEO/i.test(document.title || '') &&
        (Boolean(document.querySelector('.mapboxgl-canvas, .mapboxgl-map, [data-search-bar-anchor]')) ||
          /검색|search/i.test(document.body?.innerText || '')),
      null,
      { timeout: 45_000 },
    );
    results.push(await shot(page, 'off-reels-home-1280.png', 1280, 800));
    await page.close();
  }

  // ② ON + fixture OFF → empty + noindex
  {
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5202/reels', { waitUntil: 'domcontentloaded' });
    await page.getByText('확인할 영상이 없어요.').waitFor({ timeout: 30_000 });
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    if (robots !== 'noindex') throw new Error(`expected noindex, got ${robots}`);
    results.push(await shot(page, 'empty-noindex-390.png', 390, 844));
    results.push(await shot(page, 'empty-noindex-1280.png', 1280, 800));
    await page.close();
  }

  // ③ fixture play
  {
    const page = await browser.newPage();
    await stubVideos(page);
    await page.goto('http://127.0.0.1:5203/reels', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-self-reels-feed="1"]').waitFor({ timeout: 30_000 });
    await page.getByText('테스트 장소 하나').waitFor({ timeout: 20_000 });
    await page.waitForFunction(() => {
      const v = document.querySelector('video[data-reel-video="fixture-allow"]');
      return v && !v.paused;
    }, null, { timeout: 20_000 });
    results.push(await shot(page, 'fixture-play-390.png', 390, 844));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:5203/reels', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-self-reels-feed="1"]').waitFor({ timeout: 30_000 });
    await page.waitForFunction(() => {
      const v = document.querySelector('video[data-reel-video="fixture-allow"]');
      return v && !v.paused;
    }, null, { timeout: 20_000 });
    results.push(await shot(page, 'fixture-play-1280.png', 1280, 800));
    await page.close();
  }

  // ④ fixture fail (retry+next)
  {
    const page = await browser.newPage();
    await stubFailAllow(page);
    await page.goto('http://127.0.0.1:5203/reels', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-reel-failure="fixture-allow"]').waitFor({ timeout: 20_000 });
    await page.locator('[data-reel-retry="fixture-allow"]').click();
    await page.locator('[data-reel-next="fixture-allow"]').waitFor({ timeout: 20_000 });
    await page.getByText('테스트 장소 하나').waitFor();
    results.push(await shot(page, 'fixture-fail-390.png', 390, 844));
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('http://127.0.0.1:5203/reels', { waitUntil: 'domcontentloaded' });
    await page.locator('[data-reel-failure="fixture-allow"]').waitFor({ timeout: 20_000 });
    await page.locator('[data-reel-retry="fixture-allow"]').click();
    await page.locator('[data-reel-next="fixture-allow"]').waitFor({ timeout: 20_000 });
    results.push(await shot(page, 'fixture-fail-1280.png', 1280, 800));
    await page.close();
  }
} finally {
  await browser.close();
  for (const p of previews) {
    try {
      p.kill('SIGTERM');
    } catch {
      // ignore
    }
  }
}

const manifest = {
  head: process.env.EVIDENCE_HEAD || 'unknown',
  createdAtKst: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Seoul' }),
  sharedPreview: '미발급 (vercel.json git.deploymentEnabled cursor/* = false; 이번 회차 배포 변경 없음)',
  scenarios: [
    { id: 'off', flags: { SELF_REELS: '0', FIXTURE: '0' }, files: ['off-reels-home-390.png', 'off-reels-home-1280.png'] },
    { id: 'empty', flags: { SELF_REELS: '1', FIXTURE: '0' }, files: ['empty-noindex-390.png', 'empty-noindex-1280.png'] },
    { id: 'fixture-play', flags: { SELF_REELS: '1', FIXTURE: '1' }, files: ['fixture-play-390.png', 'fixture-play-1280.png'] },
    { id: 'fixture-fail', flags: { SELF_REELS: '1', FIXTURE: '1', failAllow: true }, files: ['fixture-fail-390.png', 'fixture-fail-1280.png'] },
  ],
  files: results,
};
fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest, null, 2));
