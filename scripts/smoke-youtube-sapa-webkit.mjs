/**
 * WebKit 390 — Sapa video tab with live place_videos (no mock thumbnails).
 * Usage: npm run build && npx vite preview … then
 *   node scripts/smoke-youtube-sapa-webkit.mjs --base https://127.0.0.1:4173
 * QA embed errors (Preview/dev): ?ytForceError=1 or localStorage gateo.yt.forceEmbedError=1
 */
import { webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = '/opt/cursor/artifacts/youtube-sapa-webkit';
const SLUG = 'sapa';
const VIEWPORT = { width: 390, height: 844 };

function parseArgs() {
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

const base = parseArgs();

await mkdir(OUT_DIR, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`OK    ${name}`);
  return file;
}

async function waitVideoReady(page) {
  await page.goto(`${base}/place/${SLUG}/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByText('관련 영상을 불러오는 중').waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

async function openPlaylist(page) {
  const heading = page.getByRole('heading', { name: /재생 목록 \(\d+\)/ });
  if (!(await heading.isVisible().catch(() => false))) {
    await page.getByRole('button', { name: /영상 더 보기|More videos/i }).click({ timeout: 20000 });
  }
  await heading.waitFor({ state: 'visible', timeout: 20000 });
}

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
const notePageError = (e) => {
  const msg = String(e);
  if (msg.includes('access control checks')) return;
  errors.push(msg);
};
page.on('pageerror', notePageError);

await waitVideoReady(page);
await shot(page, 'webkit-390-sapa-closed.png');
await openPlaylist(page);
await page.waitForTimeout(400);
await shot(page, 'webkit-390-sapa-playlist-open.png');
const seeMore = page.getByRole('button', { name: /^더 보기$|^See more$/i });
if (await seeMore.isVisible().catch(() => false)) {
  await seeMore.click({ timeout: 15000 });
  await page.waitForTimeout(1500);
}
await shot(page, 'webkit-390-sapa-after-see-more.png');

const videoIds = await page.evaluate(() => {
  const ids = new Set();
  document.querySelectorAll('img[src*="img.youtube.com/vi/"]').forEach((img) => {
    const m = img.src.match(/\/vi\/([^/]+)\//);
    if (m) ids.add(m[1]);
  });
  return [...ids];
});

await browser.close();
if (errors.length) {
  console.error('FAIL  page errors:', errors);
  process.exit(1);
}

if (videoIds.length === 0) {
  console.error('FAIL  no YouTube thumbnail ids found for unplayable shot');
  process.exit(1);
}

const browser2 = await webkit.launch({ headless: true });
const context2 = await browser2.newContext({
  viewport: VIEWPORT,
  ignoreHTTPSErrors: true,
  locale: 'ko-KR',
});
await context2.addInitScript(() => {
  window.localStorage.setItem('gateo.locale', 'ko');
});
await context2.addInitScript((ids) => {
  localStorage.setItem(
    'gateo.yt.unplayable.v1',
    JSON.stringify({ ids, updatedAt: Date.now() }),
  );
}, videoIds);
const page2 = await context2.newPage();
await waitVideoReady(page2);
await page2.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).waitFor({ timeout: 30000 });
await shot(page2, 'webkit-390-sapa-unplayable.png');
const retry = page2.getByRole('button', { name: '다시 시도' });
await retry.click({ timeout: 10000 });
await page2.waitForTimeout(800);
const stillEmpty = await page2.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).isVisible();
if (stillEmpty) {
  console.error('FAIL  retry on unplayable did not restore playable list');
  process.exit(1);
}
console.log('OK    unplayable retry restores videos');

await browser2.close();

const browser2b = await webkit.launch({ headless: true });
const context2b = await browser2b.newContext({
  viewport: VIEWPORT,
  ignoreHTTPSErrors: true,
  locale: 'ko-KR',
});
await context2b.addInitScript(() => {
  window.localStorage.setItem('gateo.locale', 'ko');
});
await context2b.addInitScript((ids) => {
  sessionStorage.setItem('gateo.yt.retryExhausted:/place/sapa/video', '1');
  localStorage.setItem(
    'gateo.yt.unplayable.v1',
    JSON.stringify({ ids, updatedAt: Date.now() }),
  );
}, videoIds);
const page2b = await context2b.newPage();
await waitVideoReady(page2b);
await page2b.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).waitFor({ timeout: 30000 });
await page2b.waitForTimeout(400);
const retryAfterExhausted = page2b.getByRole('button', { name: '다시 시도' });
if (await retryAfterExhausted.isVisible().catch(() => false)) {
  console.error('FAIL  retry still visible after probe exhausted');
  process.exit(1);
}
await shot(page2b, 'webkit-390-sapa-unplayable-after-retry.png');
await browser2b.close();

const browser3 = await webkit.launch({ headless: true });
const context3 = await browser3.newContext({
  viewport: VIEWPORT,
  ignoreHTTPSErrors: true,
  locale: 'en-US',
});
await context3.addInitScript(() => {
  window.localStorage.setItem('gateo.locale', 'en');
});
await context3.addInitScript((ids) => {
  localStorage.setItem(
    'gateo.yt.unplayable.v1',
    JSON.stringify({ ids, updatedAt: Date.now() }),
  );
}, videoIds);
const page3 = await context3.newPage();
await waitVideoReady(page3);
await page3.getByRole('heading', { name: 'No playable videos' }).waitFor({ timeout: 30000 });
const href = await page3.getByRole('link', { name: /Watch on YouTube/i }).first().getAttribute('href');
const decodedHref = href ? decodeURIComponent(href) : '';
if (!decodedHref.includes('Sapa')) {
  console.error('FAIL  EN YouTube link missing Sapa:', href);
  process.exit(1);
}
if (!decodedHref.includes('Vietnam')) {
  console.error('FAIL  EN YouTube link missing Vietnam:', href);
  process.exit(1);
}
if (decodeURIComponent(href).includes('사파')) {
  console.error('FAIL  EN YouTube link still uses Korean place name');
  process.exit(1);
}
console.log('OK    EN YouTube search uses Sapa');
await browser3.close();

console.log('Sapa WebKit live screenshots saved to', OUT_DIR);
