/**
 * WebKit 390 — QA r5: playlist tap failure shows tapped video fallback; list −1.
 * Usage: npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort
 *   node scripts/capture-youtube-qa-r5-webkit.mjs --base https://127.0.0.1:4173
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

const OUT_DIR = '/opt/cursor/artifacts/youtube-sapa-webkit';
const VIEWPORT = { width: 390, height: 844 };

const MOCK_VIDEOS = [
  { id: 'my_7f-tY1tA', title: 'Sapa travel 1', ai_context: { tags: [], timeline: [] } },
  { id: 'RSgPFcRdWig', title: 'Sapa travel 2', ai_context: { tags: [], timeline: [] } },
  { id: 'lBrg_Y8vVkQ', title: 'Sapa travel 3', ai_context: { tags: [], timeline: [] } },
  { id: 'dQw4w9WgXcQ', title: 'Sapa travel 4', ai_context: { tags: [], timeline: [] } },
  { id: '9bZkp7q19f0', title: 'Sapa travel 5', ai_context: { tags: [], timeline: [] } },
];

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

async function shot(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`OK    ${name}`);
  return file;
}

async function injectEmbedError150(page) {
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe[src*="youtube.com/embed"]');
    if (!iframe?.contentWindow) throw new Error('YouTube iframe not found');
    window.dispatchEvent(
      new MessageEvent('message', {
        data: JSON.stringify({ event: 'onError', info: 150 }),
        origin: 'https://www.youtube.com',
        source: iframe.contentWindow,
      }),
    );
  });
}

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
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
await page.route('**/rest/v1/place_videos**', async (route) => {
  await route.fulfill({
    status: 200,
    contentType: 'application/vnd.pgrst.object+json',
    body: JSON.stringify({ videos: MOCK_VIDEOS }),
  });
});
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
    body: JSON.stringify({
      success: true,
      videos: MOCK_VIDEOS,
      nextPageToken: null,
    }),
  });
});
await page.route('**/functions/v1/pexels-proxy**', async (route) => {
  await route.fulfill({ status: 200, contentType: 'application/json', body: '{"photos":[]}' });
});

await page.goto(`${base}/place/sapa/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
await page.waitForTimeout(1500);

const tappedId = 'RSgPFcRdWig';
const openList = page.getByRole('button', { name: '영상 더 보기' });
await openList.waitFor({ state: 'visible', timeout: 30000 });
await openList.click({ timeout: 15000 });
const playlistHeading = page.getByRole('heading', { name: /재생 목록 \(\d+\)/ });
await playlistHeading.waitFor({ state: 'visible', timeout: 20000 });
const countBefore = Number((await playlistHeading.textContent())?.match(/\((\d+)\)/)?.[1] ?? 0);

await page.waitForFunction(
  (id) => Boolean(document.querySelector(`img[src*="/vi/${id}/"]`)),
  tappedId,
  { timeout: 20000 },
);
await page.evaluate((id) => {
  const img = document.querySelector(`img[src*="/vi/${id}/"]`);
  const btn = img?.closest('button');
  if (!btn) throw new Error('playlist item not found');
  btn.click();
}, tappedId);
await page.waitForSelector(`iframe[src*="youtube.com/embed/${tappedId}"]`, { timeout: 25000 });
await injectEmbedError150(page);
await page.waitForTimeout(2200);

const iframeCount = await page.locator('iframe[src*="youtube.com/embed"]').count();
if (iframeCount !== 0) {
  console.error('FAIL  expected no iframe after tap failure');
  process.exit(1);
}

const unplayableRaw = await page.evaluate(() => localStorage.getItem('gateo.yt.unplayable.v1'));
const parsed = JSON.parse(unplayableRaw || '{}');
if (parsed.ids?.length !== 1 || parsed.ids[0] !== tappedId) {
  console.error('FAIL  unplayable storage should list only tapped id:', parsed);
  process.exit(1);
}
if (countBefore !== MOCK_VIDEOS.length) {
  console.error(`FAIL  expected ${MOCK_VIDEOS.length} videos before tap, got ${countBefore}`);
  process.exit(1);
}

const ytHref = await page.getByRole('link', { name: /YouTube/ }).first().getAttribute('href');
if (!ytHref?.includes(tappedId)) {
  console.error('FAIL  YouTube link not for tapped video:', ytHref);
  process.exit(1);
}

const mainThumb = await page.locator('.aspect-video img[src*="/vi/"]').first().getAttribute('src');
if (!mainThumb?.includes(tappedId)) {
  console.error('FAIL  fallback thumbnail not tapped video:', mainThumb);
  process.exit(1);
}

const shotPath = await shot(page, 'webkit-390-sapa-tap-fail-fallback.png');
await browser.close();
console.log('QA r5 WebKit tap-fail shot:', shotPath);
