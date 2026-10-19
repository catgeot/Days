/**
 * WebKit 390 — place video card with metadata-stripped cache (id-only, i18n fallback).
 * Usage: npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort
 *   VITE_SUPABASE_URL=https://mock-supa.invalid node scripts/capture-youtube-metadata-stripped-390.mjs --base https://127.0.0.1:4173
 */
import { webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  createHarnessNetworkState,
  ensureHarnessPreviewBuild,
  installDefaultSupabaseHarnessMocks,
  installSupabaseHarnessGuard,
  reportHarnessNetworkViolations,
} from './youtube-harness-supabase-guard.mjs';

const OUT_DIR = '/opt/cursor/artifacts/youtube-30d-hardening';
const VIEWPORT = { width: 390, height: 844 };
const VIDEO_ID = 'my_7f-tY1tA';

function parseBase() {
  const args = process.argv.slice(2);
  let base = process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173';
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[i + 1].replace(/\/$/, '');
      i += 1;
    }
  }
  return base.replace(/\/$/, '');
}

const base = parseBase();
ensureHarnessPreviewBuild();
const harnessNetwork = createHarnessNetworkState();

await mkdir(OUT_DIR, { recursive: true });

async function captureLocale(locale, label) {
  let edgeCalls = 0;
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: locale === 'ko' ? 'ko-KR' : 'en-US',
  });
  await context.addInitScript((loc) => {
    window.localStorage.setItem('gateo.locale', loc);
    window.sessionStorage.clear();
  }, locale);

  const page = await context.newPage();
  await installSupabaseHarnessGuard(page, harnessNetwork);
  await installDefaultSupabaseHarnessMocks(page);

  const dbRow = {
    videos: [{ id: VIDEO_ID, title: 'SHOULD NOT SHOW', channelTitle: 'hidden' }],
    last_updated: '2020-01-01T00:00:00.000Z',
    next_retry_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    fail_count: 2,
    last_error: 'quotaExceeded',
  };

  await page.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify(dbRow),
    });
  });
  await page.route('**/rest/v1/rpc/increment_place_stats**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
  });
  await page.route('**/rest/v1/place_stats**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
    edgeCalls += 1;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, videos: [{ id: VIDEO_ID }], nextPageToken: null }),
    });
  });
  await page.route('**/functions/v1/pexels-proxy**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"photos":[]}' });
  });

  await page.goto(`${base}/place/sapa/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2500);

  const fallback = locale === 'ko' ? 'YouTube 영상' : 'YouTube video';
  const err = page.getByText(/Couldn't load videos|영상을 불러오지 못했/);
  if (await err.count()) {
    await page.screenshot({ path: path.join(OUT_DIR, `debug-error-${label}.png`) });
    reportHarnessNetworkViolations(harnessNetwork);
    console.error('FAIL  video panel error state');
    process.exit(1);
  }

  await page.waitForSelector(`img[src*="/vi/${VIDEO_ID}/"]`, { timeout: 45000 });
  const openList = page.getByRole('button', { name: locale === 'ko' ? '영상 더 보기' : /more videos/i });
  if (await openList.count()) {
    await openList.click({ timeout: 15000 });
    await page.waitForTimeout(600);
  }
  await page.getByText(fallback, { exact: true }).first().waitFor({ state: 'visible', timeout: 20000 });

  if (edgeCalls > 0) {
    console.error(`FAIL  fetch-place-videos called ${edgeCalls} times (expected 0 during backoff)`);
    process.exit(1);
  }

  const bodyText = await page.evaluate(() => document.body.innerText);
  if (bodyText.includes('SHOULD NOT SHOW') || bodyText.includes('undefined')) {
    console.error('FAIL  stale title or undefined in UI');
    process.exit(1);
  }

  const file = path.join(OUT_DIR, `place-video-metadata-stripped-${label}-390.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log(`OK    ${file}`);
  await browser.close();
}

await captureLocale('ko', 'ko');
await captureLocale('en', 'en');
console.log('Done metadata-stripped captures');
