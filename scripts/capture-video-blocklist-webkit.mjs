/**
 * WebKit 390 (ko) — blocklisted YouTube IDs absent from place + world-event lists.
 * Usage: npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort
 *   node scripts/capture-video-blocklist-webkit.mjs --base https://127.0.0.1:4173
 */
import { webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import {
  createHarnessNetworkState,
  ensureHarnessPreviewBuild,
  installDefaultSupabaseHarnessMocks,
  installSupabaseHarnessGuard,
} from './youtube-harness-supabase-guard.mjs';
import { BLOCKED_VIDEO_IDS } from '../supabase/functions/_shared/videoBlocklist.mjs';

const OUT_DIR = '/opt/cursor/artifacts/video-blocklist-webkit';
const BLOCKED = [...BLOCKED_VIDEO_IDS].slice(0, 4);
const GOOD = ['Np0eKdDkGYA', 'EIYEHTJZeAE', 'gBbZrxwGAXg', 'ZzkcSegkuy0'];

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

function mockVideos() {
  const blocked = BLOCKED.map((id, i) => ({
    id,
    title: `BLOCKED ${i} accident #horror #shorts`,
    ai_context: { tags: [], timeline: [] },
  }));
  const good = GOOD.map((id, i) => ({
    id,
    title: `발리 여행 브이로그 ${i + 1}`,
    ai_context: { tags: [], timeline: [] },
  }));
  return [...blocked, ...good];
}

const base = parseBase();
ensureHarnessPreviewBuild();
const harnessNetwork = createHarnessNetworkState();
const videos = mockVideos();

await mkdir(OUT_DIR, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({
    path: file,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
  console.log(`OK    ${name}`);
  return file;
}

async function assertNoBlockedThumbs(page, label) {
  for (const id of BLOCKED) {
    const n = await page.locator(`img[src*="/vi/${id}/"]`).count();
    if (n > 0) {
      console.error(`FAIL  ${label}: blocked thumb still visible for ${id}`);
      process.exit(1);
    }
  }
  const goodVisible = await page.locator(`img[src*="/vi/${GOOD[0]}/"]`).count();
  if (goodVisible < 1) {
    console.error(`FAIL  ${label}: expected at least one allowed video thumb`);
    process.exit(1);
  }
}

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
  locale: 'ko-KR',
});
await context.addInitScript(() => {
  window.localStorage.setItem('gateo.locale', 'ko');
  window.localStorage.removeItem('gateo.yt.unplayable.v1');
  window.sessionStorage.clear();
});

const page = await context.newPage();
await installSupabaseHarnessGuard(page, harnessNetwork);
await installDefaultSupabaseHarnessMocks(page);

const fulfillVideos = async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/vnd.pgrst.object+json',
    body: JSON.stringify({ videos, next_retry_at: null, last_updated: new Date().toISOString() }),
  });
};

await page.route('**/rest/v1/place_videos**', fulfillVideos);
await page.route('**/rest/v1/rpc/increment_place_stats**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: 'null' });
});
await page.route('**/rest/v1/place_stats**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
});
await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true, videos, nextPageToken: null }),
  });
});
await page.route('**/functions/v1/pexels-proxy**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"photos":[]}' });
});

await page.goto(`${base}/place/porto/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(2000);
await assertNoBlockedThumbs(page, 'porto');
await shot(page, 'webkit-390-porto-place-videos-blocklist.png');

await page.goto(`${base}/world-events/bali-galungan-season-2026`, {
  waitUntil: 'domcontentloaded',
  timeout: 120000,
});
const ytSection = page.getByRole('heading', { name: /관련 영상|Related videos/i });
await ytSection.scrollIntoViewIfNeeded();
await page.waitForTimeout(2000);
for (const id of BLOCKED) {
  const link = page.locator(`a[href*="watch?v=${id}"]`);
  if (await link.count() > 0) {
    console.error(`FAIL  bali galungan: blocked link for ${id}`);
    process.exit(1);
  }
}
const allowedLink = page.locator(`a[href*="watch?v=${GOOD[0]}"]`);
if (await allowedLink.count() < 1) {
  console.error('FAIL  bali galungan: no allowed video link');
  process.exit(1);
}
await shot(page, 'webkit-390-bali-galungan-festival-videos-blocklist.png');

await browser.close();
console.log('Video blocklist WebKit captures OK:', OUT_DIR);
