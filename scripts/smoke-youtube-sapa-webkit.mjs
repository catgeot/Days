/**
 * WebKit 390 — Sapa place video tab screenshots (playlist UI + empty/unplayable).
 * Usage: VITE_SUPABASE_URL=https://example.supabase.co VITE_SUPABASE_ANON_KEY=test \
 *   node scripts/smoke-youtube-sapa-webkit.mjs --base https://127.0.0.1:4173
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

const OUT_DIR = '/opt/cursor/artifacts/youtube-sapa-webkit';
const SLUG = 'sapa';
const VIEWPORT = { width: 390, height: 844 };

const mockVideos = [
  { id: 'dQw4w9WgXcQ', title: 'Sapa travel vlog', ai_context: { tags: ['#sapa'], timeline: [] } },
  { id: '9bZkp7q19f0', title: 'Sapa second clip', ai_context: { tags: ['#sapa'], timeline: [] } },
];

function parseBase() {
  const i = process.argv.indexOf('--base');
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1].replace(/\/$/, '');
  return 'https://127.0.0.1:4173';
}

const base = parseBase();
ensureHarnessPreviewBuild();
const harnessNetwork = createHarnessNetworkState();

await mkdir(OUT_DIR, { recursive: true });

async function withPage(routes) {
  const browser = await webkit.launch({ headless: true });
  const context = await browser.newContext({
    viewport: VIEWPORT,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  await context.addInitScript(() => {
    window.localStorage.setItem('gateo.locale', 'ko');
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));
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
  if (routes) await routes(page);
  return { browser, page, errors };
}

async function shot(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`OK    ${name}`);
  return file;
}

const { browser, page, errors } = await withPage(async (p) => {
  await p.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ videos: mockVideos }]),
    });
  });
  await p.route('**/functions/v1/fetch-place-videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        videos: mockVideos,
        nextPageToken: 'mock-token',
      }),
    });
  });
});

await page.goto(`${base}/place/${SLUG}/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(1500);
await shot(page, 'webkit-390-sapa-closed.png');
await page.getByRole('button', { name: '영상 더 보기' }).click({ timeout: 15000 });
await page.waitForTimeout(500);
await shot(page, 'webkit-390-sapa-playlist-open.png');
const seeMore = page.getByRole('button', { name: '더 보기' });
if (await seeMore.isVisible().catch(() => false)) {
  await seeMore.click({ timeout: 10000 });
  await page.waitForTimeout(800);
}
await shot(page, 'webkit-390-sapa-after-see-more.png');
await browser.close();

const { browser: b2, page: p2, errors: e2 } = await withPage(async (p) => {
  await p.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify({ videos: [] }),
    });
  });
  await p.route('**/functions/v1/fetch-place-videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, videos: [], nextPageToken: null }),
    });
  });
});
await p2.goto(`${base}/place/${SLUG}/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await p2.waitForTimeout(2000);
await p2.getByRole('heading', { name: '아직 등록된 영상이 없습니다' }).waitFor({ timeout: 15000 });
await shot(p2, 'webkit-390-sapa-empty.png');
await b2.close();

const unplayableIds = mockVideos.map((v) => v.id);
const { browser: b3, page: p3, errors: e3 } = await withPage(async (p) => {
  await p.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/vnd.pgrst.object+json',
      body: JSON.stringify({ videos: mockVideos }),
    });
  });
  await p.route('**/functions/v1/fetch-place-videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, videos: [], nextPageToken: null }),
    });
  });
});
await p3.addInitScript((ids) => {
  localStorage.setItem(
    'gateo.yt.unplayable.v1',
    JSON.stringify({ ids, updatedAt: Date.now() }),
  );
}, unplayableIds);
await p3.goto(`${base}/place/${SLUG}/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await p3.waitForTimeout(2000);
await p3.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).waitFor({ timeout: 15000 });
await shot(p3, 'webkit-390-sapa-unplayable.png');
await b3.close();

let failed = 0;
for (const [label, list] of [['happy', errors], ['empty', e2], ['unplayable', e3]]) {
  if (list.length) {
    failed += 1;
    console.error(`FAIL  ${label} pageerror:`, list);
  }
}
failed += reportHarnessNetworkViolations(harnessNetwork);
if (failed > 0) process.exit(1);
console.log('Sapa WebKit screenshots saved to', OUT_DIR);
