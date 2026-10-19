#!/usr/bin/env node
/**
 * Mobile 390 + desktop 1280 screenshots for overseas KTO fix QA.
 *   SMOKE_SITE_URL=https://… node scripts/capture-overseas-kto-gallery-qa.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = '/opt/cursor/artifacts';
const SLUGS = ['cairo', 'rio-de-janeiro', 'bangkok', 'paris', 'jeju'];

async function shot(page, name) {
  const width = page.viewportSize()?.width || 390;
  const height = page.viewportSize()?.height || 844;
  await page.screenshot({
    path: join(OUT, name),
    clip: { x: 0, y: 0, width, height },
  });
}

async function waitGalleryReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 120_000 });
  const marker = page
    .locator('[data-local-info="gallery"]')
    .or(page.getByText(/더 많은 사진|Unsplash|사진:/))
    .first();
  await marker.waitFor({ state: 'visible', timeout: 120_000 });
}

async function captureViewport(viewport, suffix) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  for (const slug of SLUGS) {
    await page.goto(`${baseURL}place/${slug}?lang=ko`, { timeout: 120_000 });
    await waitGalleryReady(page);
    await page.evaluate(() => window.scrollTo(0, Math.max(0, document.body.scrollHeight * 0.45)));
    await page.waitForTimeout(1000);
    await shot(page, `overseas-kto-${slug}-${suffix}.png`);
  }
  await browser.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await captureViewport({ width: 1280, height: 800 }, '1280');
  await captureViewport({ width: 390, height: 844 }, '390');
  console.log(`screenshots in ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
