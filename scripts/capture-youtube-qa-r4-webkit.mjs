/**
 * WebKit 390 — QA r4 evidence: consecutive fail cap + retry playlist one-tap.
 * Usage: npm run build && npx vite preview --host 127.0.0.1 --port 4173 --strictPort
 *   node scripts/capture-youtube-qa-r4-webkit.mjs --base https://127.0.0.1:4173
 */
import { webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = '/opt/cursor/artifacts/youtube-sapa-webkit';
const VIEWPORT = { width: 390, height: 844 };

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
await mkdir(OUT_DIR, { recursive: true });

async function shot(page, name) {
  const file = path.join(OUT_DIR, name);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`OK    ${name}`);
}

async function waitVideoReady(page, url) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.getByText('관련 영상을 불러오는 중').waitFor({ state: 'hidden', timeout: 120000 }).catch(() => {});
  await page.waitForTimeout(1200);
}

const browser = await webkit.launch({ headless: true });
const context = await browser.newContext({
  viewport: VIEWPORT,
  ignoreHTTPSErrors: true,
  locale: 'ko-KR',
});

// (a) consecutive embed failures — force-error QA hook
const pageA = await context.newPage();
await context.addInitScript(() => {
  window.localStorage.setItem('gateo.locale', 'ko');
  window.localStorage.removeItem('gateo.yt.unplayable.v1');
  window.sessionStorage.clear();
});
await waitVideoReady(pageA, `${base}/place/sapa/video?ytForceError=1`);
await pageA.locator('.aspect-video').first().click({ timeout: 20000 });
await pageA.waitForTimeout(5000);
const iframeAfterCap = await pageA.locator('iframe[src*="youtube.com/embed"]').count();
if (iframeAfterCap !== 0) {
  console.error('FAIL  expected no iframe after consecutive failure cap');
  process.exit(1);
}
const ytOnFail = await pageA.getByRole('link', { name: /YouTube/ }).first().isVisible();
if (!ytOnFail) {
  console.error('FAIL  YouTube CTA missing after consecutive failures');
  process.exit(1);
}
await shot(pageA, 'webkit-390-sapa-consecutive-fail-stop.png');
await pageA.close();

// (b) after retry, one tap on playlist item starts playback
const pageB2 = await context.newPage();
await waitVideoReady(pageB2, `${base}/place/sapa/video`);
await pageB2.waitForFunction(
  () => document.querySelectorAll('img[src*="img.youtube.com/vi/"]').length >= 2,
  { timeout: 120000 },
);
const idsFromDom = await pageB2.evaluate(() => {
  const found = new Set();
  document.querySelectorAll('img[src*="img.youtube.com/vi/"]').forEach((img) => {
    const m = img.src.match(/\/vi\/([^/]+)\//);
    if (m) found.add(m[1]);
  });
  return [...found];
});
await pageB2.close();

if (idsFromDom.length < 2) {
  console.error('FAIL  need at least 2 videos for playlist one-tap shot');
  process.exit(1);
}

const pageC = await context.newPage();
await context.addInitScript((ids) => {
  window.localStorage.setItem('gateo.locale', 'ko');
  window.localStorage.setItem(
    'gateo.yt.unplayable.v1',
    JSON.stringify({ ids, updatedAt: Date.now() }),
  );
  window.sessionStorage.removeItem('gateo.yt.retryExhausted:/place/sapa/video');
  window.sessionStorage.removeItem('gateo.yt.retrySession:/place/sapa/video');
}, idsFromDom);
await waitVideoReady(pageC, `${base}/place/sapa/video`);
await pageC.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).waitFor({ timeout: 30000 });
await pageC.getByRole('button', { name: '다시 시도' }).click();
await pageC.getByRole('heading', { name: '재생 가능한 영상이 없어요' }).waitFor({ state: 'hidden', timeout: 20000 });
const secondId = idsFromDom[1];
const openList = pageC.getByRole('button', { name: /영상 더 보기|More videos/i });
if (await openList.isVisible().catch(() => false)) {
  await openList.click({ timeout: 15000 });
  await pageC.getByRole('heading', { name: /재생 목록/ }).waitFor({ timeout: 20000 });
}
await pageC.evaluate((vid) => {
  const img = document.querySelector(`img[src*="/vi/${vid}/"]`);
  const btn = img?.closest('button');
  if (!btn) throw new Error('playlist item not found');
  btn.click();
}, secondId);
await pageC.waitForSelector(`iframe[src*="youtube.com/embed/${secondId}"]`, { timeout: 25000 });
await pageC.waitForTimeout(600);
await shot(pageC, 'webkit-390-sapa-retry-playlist-one-tap.png');
await pageC.close();

await browser.close();
console.log('QA r4 WebKit shots saved to', OUT_DIR);
