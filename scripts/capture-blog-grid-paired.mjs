#!/usr/bin/env node
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const HEAD_SHA = process.env.CAPTURE_HEAD_SHA || 'unknown';
const STORE = process.env.CAPTURE_OUT_DIR || join('/cursor/stores/self/blog-grid', HEAD_SHA);
const BASE = (process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:4173').replace(/\/$/, '');
const LABEL = process.env.CAPTURE_LABEL === 'before' ? 'before' : 'after';
const WIDTHS = [390, 1280, 1440];
const PATH = '/blog?tab=public&lang=ko';

async function metrics(page, width) {
  return page.evaluate((viewportWidth) => {
    const de = document.documentElement;
    const grid =
      document.querySelector('[data-logbook-main-scroll] [data-logbook-feed-grid]') ||
      document.querySelector('[data-logbook-main-scroll] .max-w-7xl div.flex-1 > div.grid');
    const sticky = grid?.closest('.overflow-hidden')?.querySelector('.sticky');
    const hub = document.querySelector('[data-testid="logbook-official-review-hub"]');
    const box = (el) => {
      if (!el) return null;
      const r = el.getBoundingClientRect();
      return { left: Math.round(r.left), right: Math.round(r.right), width: Math.round(r.width) };
    };
    const vw = window.innerWidth;
    const g = box(grid);
    const t = box(sticky);
    return {
      viewportWidth,
      innerWidth: vw,
      documentOverflowPx: de.scrollWidth - vw,
      feedView: grid?.getAttribute('data-logbook-feed-view') || (grid?.className.includes('grid-cols-1') && !grid?.className.includes('lg:grid-cols') ? 'column' : 'grid'),
      feedCols: grid?.getAttribute('data-logbook-feed-cols') || null,
      grid: g,
      feedToolbar: t,
      gridWithinViewport: g ? g.right <= vw : null,
      toolbarWithinViewport: t ? t.right <= vw : null,
      reviewHubPresent: Boolean(hub),
      reviewHubCount: hub?.querySelector('[data-testid="logbook-official-review-hub-count"]')?.textContent?.trim() || null,
    };
  }, width);
}

async function shot(width) {
  const height = width === 390 ? 844 : 900;
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  await ctx.addInitScript(() => {
    try {
      localStorage.removeItem('gateo:logbook-feed-view');
    } catch {
      // ignore
    }
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}${PATH}`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page.waitForFunction(
    () => {
      const g =
        document.querySelector('[data-logbook-main-scroll] [data-logbook-feed-grid]') ||
        document.querySelector('[data-logbook-main-scroll] .max-w-7xl div.flex-1 > div.grid');
      return Boolean(g && g.getBoundingClientRect().width > 40);
    },
    null,
    { timeout: 120_000 },
  );
  const meta = await metrics(page, width);
  const fileName = `blog-archive-${LABEL}-chromium-${width}.png`;
  const outPath = join(STORE, fileName);
  await page.screenshot({
    path: outPath,
    clip: { x: 0, y: 0, width, height },
  });
  const buf = await readFile(outPath);
  await browser.close();
  return {
    fileName,
    label: LABEL,
    headSha: HEAD_SHA,
    baseUrl: `${BASE}${PATH}`,
    pngWidth: buf.readUInt32BE(16),
    pngHeight: buf.readUInt32BE(20),
    ...meta,
  };
}

await mkdir(STORE, { recursive: true });
let summary = [];
try {
  summary = JSON.parse(await readFile(join(STORE, 'capture-summary.json'), 'utf8'));
} catch {
  summary = [];
}
for (const width of WIDTHS) {
  const row = await shot(width);
  summary = summary.filter((e) => !(e.label === LABEL && e.viewportWidth === width));
  summary.push(row);
  console.log(`${row.fileName} ${row.pngWidth}x${row.pngHeight} hub=${row.reviewHubPresent} gridRight=${row.grid?.right}`);
}
summary.sort((a, b) => (a.label === b.label ? a.viewportWidth - b.viewportWidth : a.label === 'before' ? -1 : 1));
await writeFile(join(STORE, 'capture-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
console.log(`OK ${LABEL} → ${STORE}`);
