/**
 * CEO / real-data captures on Vercel git preview (flag via query only).
 *
 * CAPTURE_BASE_URL — e.g. https://days-git-cursor-logbook-review-filter-94a4-….vercel.app
 * CAPTURE_OUT_DIR — default /opt/cursor/artifacts/logbook-review-filter-vercel
 */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/logbook-review-filter-vercel';
const baseHost = String(process.env.CAPTURE_BASE_URL || '').replace(/\/$/, '');
if (!baseHost) {
  console.error('capture-logbook-review-filter-vercel: set CAPTURE_BASE_URL');
  process.exit(1);
}

const flagQuery = 'tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1';

mkdirSync(outDir, { recursive: true });

async function waitForHubReady(page) {
  const loginGate = page.getByText(/log in to vercel|sign in/i);
  if ((await loginGate.count()) > 0) {
    throw new Error('Vercel Deployment Protection login gate detected');
  }
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 120_000 });
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 30_000 });
  await page.getByTestId('logbook-review-filter').waitFor({ timeout: 20_000 });
  await page.getByTestId('logbook-official-review-hub-card-grid').waitFor({ timeout: 20_000 });
  const hasFixtureLeak = await page.evaluate(() =>
    document.body.innerText.includes('도시0'),
  );
  if (hasFixtureLeak) {
    throw new Error('Fixture placeholder 도시0 visible — expected real Supabase data');
  }
}

async function shot(page, file, width, height) {
  await page.setViewportSize({ width, height });
  await page.evaluate(() => document.fonts?.ready);
  await page.waitForTimeout(400);
  const path = join(outDir, file);
  await page.screenshot({ path, clip: { x: 0, y: 0, width, height } });
  console.log('shot', path);
  return path;
}

async function captureScenario(browser, { width, height, major, tag }) {
  const ctx = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  const region = major === 'overseas' ? '&region=overseas' : '&region=all';
  const url = `${baseHost}/blog?${flagQuery}${region}`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await waitForHubReady(page);
  if (major === 'overseas') {
    await page.getByTestId('logbook-review-filter-major-overseas').click();
    await page.getByTestId('logbook-review-filter-city-row').waitFor({ timeout: 10_000 });
  }
  await shot(page, `${tag}-${width}x${height}.png`, width, height);
  await ctx.close();
}

const browser = await chromium.launch({ headless: true });
await captureScenario(browser, { width: 390, height: 844, major: 'all', tag: 'vercel-all' });
await captureScenario(browser, { width: 1280, height: 900, major: 'all', tag: 'vercel-all' });
await captureScenario(browser, { width: 390, height: 844, major: 'overseas', tag: 'vercel-overseas' });
await captureScenario(browser, { width: 1280, height: 900, major: 'overseas', tag: 'vercel-overseas' });
await browser.close();
console.log('capture-logbook-review-filter-vercel OK');