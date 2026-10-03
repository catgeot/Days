/**
 * YouTube 얕은 수정 회귀 스모크 — Chromium 1280 + WebKit 390 스크린샷
 * Usage: node scripts/smoke-youtube-section-shallow.mjs --base http://127.0.0.1:4173
 */
import { chromium, webkit } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';

const OUT_DIR = '/opt/cursor/artifacts/youtube-section-shallow';
const DEFAULT_BASE = 'https://127.0.0.1:4173';

function parseArgs() {
  const args = process.argv.slice(2);
  let base = DEFAULT_BASE;
  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === '--base' && args[i + 1]) {
      base = args[i + 1].replace(/\/$/, '');
      i += 1;
    }
  }
  return { base };
}

const { base } = parseArgs();

await mkdir(OUT_DIR, { recursive: true });

const mockVideos = [
  { id: 'dQw4w9WgXcQ', title: 'Paris travel vlog', ai_context: { tags: ['#paris'], timeline: [] } },
  { id: '9bZkp7q19f0', title: 'Second clip', ai_context: { tags: ['#paris'], timeline: [] } },
];

async function setupRoutes(page) {
  await page.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([{ videos: mockVideos }]),
    });
  });
  await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
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
}

async function runViewport(browserType, name, viewport) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(String(e)));

  await setupRoutes(page);
  await page.goto(`${base}/place/paris/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(1500);

  const shot = path.join(OUT_DIR, `${name}-paris-video.png`);
  await page.screenshot({ path: shot, fullPage: false });

  await page.getByRole('button', { name: /GALLERY|갤러리/i }).first().click({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /VIDEO|영상/i }).first().click({ timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(500);

  await browser.close();
  return { errors, shot };
}

async function runErrorState(browserType, name, viewport) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({ viewport, ignoreHTTPSErrors: true });
  const page = await context.newPage();
  await page.route('**/rest/v1/place_videos**', async (route) => {
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await page.route('**/functions/v1/fetch-place-videos**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, error: 'mock edge failure' }),
    });
  });
  await page.goto(`${base}/place/paris/video`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  const shot = path.join(OUT_DIR, `${name}-paris-video-error.png`);
  await page.screenshot({ path: shot, fullPage: false });
  await browser.close();
  return shot;
}

const chromiumResult = await runViewport(chromium, 'chromium-1280', { width: 1280, height: 800 });
const webkitResult = await runViewport(webkit, 'webkit-390', { width: 390, height: 844 });
const errorShot = await runErrorState(chromium, 'chromium-1280', { width: 1280, height: 800 });
console.log(`OK    error state screenshot — ${errorShot}`);

let failed = 0;
for (const [label, res] of [
  ['chromium', chromiumResult],
  ['webkit', webkitResult],
]) {
  if (res.errors.length) {
    failed += 1;
    console.error(`FAIL  ${label} pageerror:`, res.errors);
  } else {
    console.log(`OK    ${label} pageerror 0 — ${res.shot}`);
  }
}

if (failed > 0) process.exit(1);
console.log('Smoke screenshots saved to', OUT_DIR);
