#!/usr/bin/env node
/**
 * /blog archive — paired before (local main) / after (PR preview), 390/1280/1440.
 * Metadata in capture-summary.json (no on-image overlay).
 *
 *   CAPTURE_LABEL=before CAPTURE_BASE_URL=https://127.0.0.1:4173/ CAPTURE_HEAD_SHA=<main-sha> node scripts/capture-blog-grid-archive.mjs
 *   CAPTURE_LABEL=after CAPTURE_BASE_URL=https://127.0.0.1:4173/ CAPTURE_HEAD_SHA=9f11d60a… node scripts/capture-blog-grid-archive.mjs
 */
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const HEAD_SHA = (process.env.CAPTURE_HEAD_SHA || 'unknown').slice(0, 40);
const OUT_DIR =
  process.env.CAPTURE_OUT_DIR ||
  join('/cursor/stores/self/blog-grid', HEAD_SHA);
const LABEL = process.env.CAPTURE_LABEL === 'after' ? 'after' : 'before';
const BASE = (process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173/').replace(/\/?$/, '/');
const WIDTHS = [390, 1280, 1440];
const BLOG_PATH = process.env.CAPTURE_BLOG_PATH || '/blog?tab=public&lang=ko';
const SUMMARY_PATH = join(OUT_DIR, 'capture-summary.json');

async function waitForFeed(page) {
  await page.waitForFunction(
    () => !/동기화하는 중|Syncing/i.test(document.body?.innerText || ''),
    null,
    { timeout: 120_000 },
  );
  const feed = page.locator(
    '[data-logbook-main-scroll] [data-logbook-feed-grid], [data-logbook-main-scroll] .max-w-7xl div.flex-1 > div.grid, [data-logbook-main-scroll] .max-w-7xl div.flex-1 > div.flex.flex-col.gap-3, [data-logbook-main-scroll] .max-w-7xl div.flex-1 > div.flex.flex-col.gap-5',
  ).first();
  await feed.waitFor({ state: 'visible', timeout: 120_000 });
}

async function collectMetrics(page, width) {
  return page.evaluate((viewportWidth) => {
    const de = document.documentElement;
<<<<<<< HEAD
    const grid = document.querySelector('[data-logbook-feed-grid]');
    const sticky = document.querySelector('[data-logbook-feed-grid]')?.closest('.overflow-hidden')?.querySelector('.sticky');
=======
    const grid =
      document.querySelector('[data-logbook-main-scroll] [data-logbook-feed-grid]') ||
      document.querySelector('[data-logbook-main-scroll] .max-w-7xl div.flex-1 > div.grid');
    const sticky = document
      .querySelector('[data-logbook-main-scroll] [data-logbook-feed-grid]')
      ?.closest('.overflow-hidden')
      ?.querySelector('.sticky');
>>>>>>> c06e4ed1 (fix(qa): scope blog archive capture to main scroll feed)
    const hub = document.querySelector('[data-testid="logbook-official-review-hub"]');
    const rect = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return {
        left: Math.round(r.left),
        right: Math.round(r.right),
        width: Math.round(r.width),
      };
    };
    const vw = window.innerWidth;
    const gridRect = rect(grid);
    const stickyRect = rect(sticky);
    return {
      viewportWidth,
      innerWidth: vw,
      scrollWidth: de.scrollWidth,
      documentOverflowPx: de.scrollWidth - vw,
      feedView: grid?.getAttribute('data-logbook-feed-view') || null,
      feedCols: grid?.getAttribute('data-logbook-feed-cols') || null,
      grid: gridRect,
      feedToolbar: stickyRect,
      gridWithinViewport: gridRect ? gridRect.right <= vw : null,
      toolbarWithinViewport: stickyRect ? stickyRect.right <= vw : null,
      reviewHubPresent: Boolean(hub),
      reviewHubCount: hub?.querySelector('[data-testid="logbook-official-review-hub-count"]')?.textContent?.trim() || null,
    };
  }, width);
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
  await page.goto(`${BASE}${BLOG_PATH.startsWith('/') ? '' : '/'}${BLOG_PATH}`, {
    waitUntil: 'networkidle',
    timeout: 120_000,
  });
  await waitForFeed(page);
  await page.waitForTimeout(1200);

  const metrics = await collectMetrics(page, width);
  const vp = page.viewportSize();
  const shotWidth = vp?.width ?? width;
  const shotHeight = Math.min(vp?.height ?? height, height);

  const fileName = `blog-archive-${LABEL}-chromium-${width}.png`;
  const outPath = join(OUT_DIR, fileName);
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width: shotWidth, height: shotHeight },
  });

  const pngMeta = await readFile(outPath).then((buf) => {
    if (buf.length < 24 || buf.toString('ascii', 12, 16) !== 'IHDR') return { pngWidth: null, pngHeight: null };
    return {
      pngWidth: buf.readUInt32BE(16),
      pngHeight: buf.readUInt32BE(20),
    };
  });

  await browser.close();

  return {
    fileName,
    outPath,
    baseUrl: `${BASE}${BLOG_PATH}`,
    label: LABEL,
    headSha: HEAD_SHA,
    ...metrics,
    ...pngMeta,
  };
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  let summary = [];
  try {
    const raw = await readFile(SUMMARY_PATH, 'utf8');
    summary = JSON.parse(raw);
    if (!Array.isArray(summary)) summary = [];
  } catch {
    summary = [];
  }

  for (const width of WIDTHS) {
    const row = await captureWidth(width);
    summary = summary.filter((e) => !(e.label === LABEL && e.viewportWidth === width));
    summary.push(row);
    await copyFile(row.outPath, join(OUT_DIR, row.fileName));
    console.log(`${row.fileName} ${row.pngWidth}x${row.pngHeight} overflow=${row.documentOverflowPx}px hub=${row.reviewHubPresent}`);
  }

  summary.sort((a, b) => {
    if (a.label !== b.label) return a.label === 'before' ? -1 : 1;
    return a.viewportWidth - b.viewportWidth;
  });
  await writeFile(SUMMARY_PATH, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');
  console.log(`blog-grid capture OK (${LABEL}) → ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
