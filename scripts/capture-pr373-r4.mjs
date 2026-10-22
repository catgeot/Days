/**
 * PR #373 r4 — WebKit globe QA (390 + 1280). HTTPS preview on 4173.
 * Usage: node scripts/capture-pr373-r4.mjs
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { chromium, webkit } from '@playwright/test';

const BASE = process.env.PR373_BASE_URL || 'https://127.0.0.1:4173';
const OUT_REPO = path.join(process.cwd(), 'artifacts/pr373-r4');
const OUT_ART = '/opt/cursor/artifacts/pr373-r4';

const CITIES = [
  { key: 'paris', query: '파리', name: /파리|Paris/ },
  { key: 'tokyo', query: '도쿄', name: /도쿄|Tokyo/ },
];

const SIZES = [
  { tag: '390', width: 390, height: 844, dpr: 1 },
  { tag: '1280', width: 1280, height: 800, dpr: 1 },
];

async function shot(page, fileBase, size) {
  const name = `${fileBase}.jpg`;
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    const full = path.join(dir, name);
    await page.screenshot({
      path: full,
      type: 'jpeg',
      quality: 58,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    });
  }
}

async function openCityOnHome(page, city) {
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 60_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill(city.query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: city.name })
    .first();
  await row.waitFor({ state: 'visible', timeout: 20_000 });
  await row.click();
  await page.waitForTimeout(1500);
}

async function clickHomeFromCard(page) {
  const home = page.getByRole('button', { name: /홈으로 이동|Go to home/ }).first();
  if (await home.isVisible().catch(() => false)) {
    await home.click();
    return 'place-header';
  }
  const summary = page.locator('.place-summary-card');
  if (await summary.isVisible().catch(() => false)) {
    return 'summary-only';
  }
  throw new Error('No home button or summary');
}

async function runCity(browser, city, size) {
  const context = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: size.dpr,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await context.newPage();
  await openCityOnHome(page, city);
  await shot(page, `${city.key}-${size.tag}-01-card-open`, size);

  const from = await clickHomeFromCard(page);
  if (from === 'place-header') {
    await page.waitForURL(/\/(\?.*)?$/, { timeout: 30_000 }).catch(() => {});
  }

  await page.waitForTimeout(4000);
  const summaryVisible = await page.locator('.place-summary-card').isVisible().catch(() => false);
  await shot(page, `${city.key}-${size.tag}-02-after-home-4s`, size);

  await context.close();
  return { city: city.key, size: size.tag, from, summaryVisibleAfter4s: summaryVisible };
}

async function runDprCap(browser) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(8000);
  const metrics = await page.evaluate(() => {
    const canvas = document.querySelector('.mapboxgl-canvas');
    const cssW = canvas?.clientWidth ?? 390;
    const backingRatio = canvas && cssW > 0 ? canvas.width / cssW : null;
    return {
      windowDpr: window.devicePixelRatio,
      canvasBackingRatio: backingRatio,
      canvasW: canvas?.width ?? null,
      cssW,
    };
  });
  await shot(page, 'dpr3-cap-390', { tag: 'dpr3', width: 390, height: 844, dpr: 3 });
  await context.close();
  return metrics;
}

async function main() {
  const browser = await webkit.launch();
  const notes = { base: BASE, cities: [], dpr3: null, capturedAt: new Date().toISOString() };

  for (const size of SIZES) {
    for (const city of CITIES) {
      notes.cities.push(await runCity(browser, city, size));
    }
  }
  notes.dpr3 = await runDprCap(browser);
  await browser.close();

  const json = JSON.stringify(notes, null, 2);
  for (const dir of [OUT_REPO, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await writeFile(path.join(dir, 'notes.json'), json);
  }
  console.log(json);
  const bad = notes.cities.filter((r) => r.summaryVisibleAfter4s);
  if (bad.length) {
    console.error('FAIL: summary still visible after home:', bad);
    process.exit(1);
  }
  if (!notes.dpr3.canvasBackingRatio || notes.dpr3.canvasBackingRatio > 2.05) {
    console.error('FAIL: globe canvas backing ratio should cap at 2 (got', notes.dpr3, ')');
    process.exit(1);
  }
  if (notes.dpr3.windowDpr > 2.05) {
    console.error('FAIL: window DPR should be capped to 2 while globe mounted', notes.dpr3);
    process.exit(1);
  }
  notes.dpr3.playwrightContextDpr = 3;
  console.log('capture-pr373-r4 PASS');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
