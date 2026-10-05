/**
 * 만료된 place_videos 행은 Chromium·WebKit 모두에서 엣지를 정확히 1번 부른다.
 * 만료 전에는 빈 상태를 보여주고 엣지를 부르지 않는다.
 *
 *   VITE_SUPABASE_URL=https://mock-supa.invalid node scripts/test-place-video-retry-engines.mjs
 */
import { chromium, webkit } from '@playwright/test';
import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';
import {
  createHarnessNetworkState,
  ensureHarnessPreviewBuild,
  installDefaultSupabaseHarnessMocks,
  installSupabaseHarnessGuard,
} from './youtube-harness-supabase-guard.mjs';

const base = 'https://127.0.0.1:4173';

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = createConnection({ port, host: '127.0.0.1' }, () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

ensureHarnessPreviewBuild();

if (!(await portOpen(4173))) {
  const child = spawn('npx', ['vite', 'preview', '--host', '127.0.0.1', '--port', '4173', '--strictPort'], {
    stdio: 'ignore',
    detached: true,
  });
  child.unref();
  for (let i = 0; i < 40; i += 1) {
    if (await portOpen(4173)) break;
    await new Promise((r) => setTimeout(r, 250));
  }
  if (!(await portOpen(4173))) {
    console.error('FAIL  preview did not start');
    process.exit(1);
  }
}

const harnessNetwork = createHarnessNetworkState();

async function countEdgeCalls(browserType, label, row) {
  const browser = await browserType.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 }, ignoreHTTPSErrors: true });
  let calls = 0;
  await installSupabaseHarnessGuard(page, harnessNetwork);
  await installDefaultSupabaseHarnessMocks(page);
  await page.route('**/rest/v1/rpc/increment_place_stats**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await page.route('**/rest/v1/place_stats**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/functions/v1/pexels-proxy**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"photos":[]}' });
  });
  await page.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([row]),
    });
  });
  await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
    calls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        videos: [{ id: 'dQw4w9WgXcQ', title: 'retry clip', ai_context: { tags: [], timeline: [] } }],
        nextPageToken: null,
      }),
    });
  });
  await page.goto(`${base}/place/paris/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  await browser.close();
  return { label, calls };
}

const expired = { videos: [], next_retry_at: new Date(Date.now() - 60_000).toISOString() };
const freshEmpty = { videos: [], next_retry_at: new Date(Date.now() + 86_400_000).toISOString() };

let failed = 0;
for (const [browserType, name] of [[chromium, 'chromium'], [webkit, 'webkit']]) {
  const hit = await countEdgeCalls(browserType, `${name} expired`, expired);
  if (hit.calls !== 1) {
    failed += 1;
    console.error(`FAIL  ${hit.label} edge calls ${hit.calls} (expected 1)`);
  } else {
    console.log(`OK    ${hit.label} edge calls 1`);
  }
  const hold = await countEdgeCalls(browserType, `${name} future empty`, freshEmpty);
  if (hold.calls !== 0) {
    failed += 1;
    console.error(`FAIL  ${hold.label} edge calls ${hold.calls} (expected 0)`);
  } else {
    console.log(`OK    ${hold.label} edge calls 0`);
  }
}

if (failed) process.exit(1);
console.log('\nboth engines passed');
