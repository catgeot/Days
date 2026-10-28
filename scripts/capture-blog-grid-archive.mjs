#!/usr/bin/env node
/**
 * /blog archive layout — before (main PROD) vs after (Preview/local), 390/1280/1440 + overlay.
 *
 *   CAPTURE_LABEL=before CAPTURE_BASE_URL=https://www.gateo.kr/ node scripts/capture-blog-grid-archive.mjs
 *   CAPTURE_LABEL=after CAPTURE_BASE_URL=http://127.0.0.1:4173/ node scripts/capture-blog-grid-archive.mjs
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT_DIR = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/blog-grid';
const STORE_DIRS = (process.env.CAPTURE_STORE_DIRS || '/cursor/stores/self/blog-grid')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const LABEL = process.env.CAPTURE_LABEL === 'after' ? 'after' : 'before';
const BASE = (process.env.CAPTURE_BASE_URL || 'https://www.gateo.kr/').replace(/\/?$/, '/');
const WIDTHS = [390, 1280, 1440];
const BLOG_PATH = '/blog?tab=public';

async function paintOverlay(page, { label, width }) {
  await page.evaluate(
    ({ label, width }) => {
      const id = 'gateo-capture-overlay';
      document.getElementById(id)?.remove();
      const bar = document.createElement('div');
      bar.id = id;
      bar.style.cssText =
        'position:fixed;top:0;left:0;right:0;z-index:999999;background:rgba(15,23,42,0.88);color:#f8fafc;padding:10px 14px;font:600 13px/1.35 ui-sans-serif,system-ui,sans-serif;pointer-events:none;letter-spacing:-0.01em';
      const grid =
        document.querySelector('[data-logbook-feed-grid]') ||
        document.querySelector('.p-5.sm\\:p-6.flex-1 .grid, .p-5.sm\\:p-6.flex-1 .flex.flex-col');
      const view =
        grid?.getAttribute('data-logbook-feed-view') ||
        document.querySelector('[role="group"] button[aria-pressed="true"]')?.getAttribute('aria-label') ||
        '?';
      let cols = grid?.getAttribute('data-logbook-feed-cols');
      if (!cols && grid) {
        const cls = grid.className || '';
        if (/grid-cols-1/.test(cls) && !/lg:grid-cols/.test(cls)) cols = '1';
        else if (/lg:grid-cols-4/.test(cls)) cols = '2-4';
        else if (/sm:grid-cols-2/.test(cls)) cols = '1-2';
        else cols = '?';
      }
      bar.textContent = `${label} · ${width}px · view=${view} · cols=${cols || '?'} · ${location.pathname}${location.search}`;
      document.body.appendChild(bar);
    },
    { label, width },
  );
}

async function waitForFeed(page) {
  const feed = page.locator(
    '[data-logbook-feed-grid], div.flex-1 div.grid, div.flex-1 div.flex.flex-col.gap-3, div.flex-1 div.flex.flex-col.gap-5',
  ).first();
  await feed.waitFor({ state: 'visible', timeout: 120_000 });
}

async function clipShot(page, filePath, width, height) {
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width, height: Math.min(height, 900) },
  });
}

async function captureWidth(width) {
  const height = width === 390 ? 844 : 900;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
  });
  await context.addInitScript(() => {
    try {
      localStorage.removeItem('gateo:logbook-feed-view');
    } catch {
      // ignore
    }
  });
  const page = await context.newPage();
  await page.goto(`${BASE.replace(/\/?$/, '')}${BLOG_PATH}`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });
  await waitForFeed(page);
  await page.waitForTimeout(1500);
  await paintOverlay(page, { label: LABEL, width });
  const fileName = `blog-archive-${LABEL}-chromium-${width}.png`;
  const outPath = join(OUT_DIR, fileName);
  await clipShot(page, outPath, width, height);
  await browser.close();
  return { fileName, outPath };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const storeDir of STORE_DIRS) {
    await mkdir(storeDir, { recursive: true });
  }

  const saved = [];
  for (const width of WIDTHS) {
    const row = await captureWidth(width);
    saved.push(row);
    for (const storeDir of STORE_DIRS) {
      await copyFile(row.outPath, join(storeDir, row.fileName));
    }
    console.log(`${row.fileName} ← ${BASE}${BLOG_PATH}`);
  }
  console.log(`blog-grid capture OK (${LABEL}) → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
