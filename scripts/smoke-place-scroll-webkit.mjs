#!/usr/bin/env node
/**
 * WebKit 390 place gallery scroll smoke (asserting JSON on stdout).
 * Usage: PLAYWRIGHT_BASE_URL=https://www.gateo.kr node scripts/smoke-place-scroll-webkit.mjs
 */
import { webkit, devices } from '@playwright/test';

import { mkdirSync } from 'node:fs';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://www.gateo.kr';
const shotDir = process.env.PLACE_SCROLL_SHOT_DIR || '/opt/cursor/artifacts';
const tag = baseURL.includes('127.0.0.1') ? 'after-preview' : 'before-live';
mkdirSync(shotDir, { recursive: true });
const results = [];

function record(name, ok, detail) {
  results.push({ name, ok, ...detail });
  if (!ok) process.exitCode = 1;
}

async function openCairo(page) {
  await page.goto(`${baseURL}/?lang=ko`, { waitUntil: 'domcontentloaded' });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 60_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill('카이로');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: '카이로여행지' })
    .first();
  await row.waitFor({ state: 'visible', timeout: 20_000 });
  await row.click();
  await page.waitForURL(/\/place\/cairo/, { timeout: 30_000 });
}

const browser = await webkit.launch();
const context = await browser.newContext({
  ...devices['iPhone 13'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  hasTouch: true,
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

try {
  await openCairo(page);
  const gallery = page.locator('[data-place-gallery-scroll]');
  await gallery.waitFor({ state: 'visible', timeout: 60_000 });

  await gallery.evaluate((el) => {
    el.scrollTop = 0;
    el.removeAttribute('data-gallery-last-scroll');
  });
  await page.evaluate(() => sessionStorage.setItem('gateo:place-gallery-scroll:cairo', '1500'));
  const tile = gallery.locator('img').first();
  await tile.waitFor({ state: 'visible', timeout: 60_000 });
  await tile.evaluate((img) => {
    const root = img.closest('.break-inside-avoid') || img;
    root.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  });
  await page.locator('[data-place-lightbox]').waitFor({ state: 'visible', timeout: 15_000 });
  await page.goBack({ waitUntil: 'commit' });
  await page.locator('[data-place-lightbox]').waitFor({ state: 'hidden', timeout: 15_000 });
  await page.waitForTimeout(2500);
  const lightboxTop = await gallery.evaluate((el) => ({
    scrollTop: el.scrollTop,
    bodyOverflow: document.body.style.overflow,
    bodyTouchAction: document.body.style.touchAction,
  }));
  record('lightbox-back-at-top-scroll', lightboxTop.scrollTop < 40, lightboxTop);
  await page.screenshot({
    path: `${shotDir}/place-scroll-webkit-390-${tag}-lightbox-back.png`,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });

  await openCairo(page);
  await gallery.waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByRole('button', { name: /다녀온 이야기/ }).first().click();
  await gallery.evaluate((el) => {
    el.scrollTop = 320;
    el.setAttribute('data-gallery-last-scroll', '320');
  });
  const beforeReviews = await gallery.evaluate((el) => el.scrollTop);
  const story = page.locator('[data-visit-story-kind="review"]').first();
  await story.click();
  await page.waitForURL(/\/reviews/, { timeout: 30_000 });
  await page.waitForTimeout(1500);
  await page.goBack({ waitUntil: 'commit' });
  await page.waitForTimeout(3500);
  const afterReviewsBack = await gallery.evaluate((el, b) => ({
    scrollTop: el.scrollTop,
    beforeReviews: b,
    delta: el.scrollTop - b,
  }), beforeReviews);
  record('reviews-back-restore', afterReviewsBack.scrollTop >= beforeReviews - 24, afterReviewsBack);
  await page.screenshot({
    path: `${shotDir}/place-scroll-webkit-390-${tag}-reviews-back.png`,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
} finally {
  await browser.close();
}

console.log(JSON.stringify({ baseURL, results }, null, 2));
