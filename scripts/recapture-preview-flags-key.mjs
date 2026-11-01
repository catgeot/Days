#!/usr/bin/env node
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const PROD = 'https://www.gateo.kr';
const ON = (process.env.PREVIEW_BASE_URL || 'https://127.0.0.1:4173').replace(/\/$/, '');
const OUT = '/opt/cursor/artifacts';

const VIEWPORTS = [
  { tag: '390', width: 390, height: 844 },
  { tag: '1280', width: 1280, height: 800 },
];

async function shot(page, name, vp) {
  await page.screenshot({
    path: join(OUT, name),
    clip: { x: 0, y: 0, width: vp.width, height: vp.height },
  });
  console.log('OK', name);
}

async function capturePair(key, path, prepare) {
  for (const vp of VIEWPORTS) {
    for (const [base, mode] of [[PROD, 'off'], [ON, 'on']]) {
      const browser = await chromium.launch({ headless: true });
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        locale: 'ko-KR',
        ignoreHTTPSErrors: true,
      });
      const page = await ctx.newPage();
      await page.goto(`${base}${path}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
      await prepare(page, base);
      await shot(page, `${key}-${mode}-${vp.tag}.png`, vp);
      await browser.close();
    }
  }
}

await mkdir(OUT, { recursive: true });

await capturePair(
  'scenic',
  '/korea/theme/scenic?hub=gangneung&spot=gyeongpodae',
  async (page) => {
    await page.waitForTimeout(6000);
    await page.locator('[data-theme-spot-place-card-cta]').scrollIntoViewIfNeeded().catch(() => {});
  },
);

await capturePair(
  'nearby',
  '/korea/?festival=825295',
  async (page) => {
    await page.getByRole('dialog').waitFor({ timeout: 120_000 });
    await page.waitForTimeout(12000);
    const section = page.locator('[data-festival-section="nearAttractions"]');
    await section.scrollIntoViewIfNeeded();
  },
);

await capturePair(
  'photo-credit',
  '/place/cairo/gallery',
  async (page) => {
    await page.locator('img[alt^="place-img-"]').first().waitFor({ timeout: 120_000 });
    const g = page.locator('[data-place-gallery-scroll]').first();
    await g.evaluate((el) => {
      el.scrollTop = 900;
    });
    await page.waitForTimeout(1500);
  },
);

const reviewId = '58509340-ae7f-44be-ba59-f746335e61fa';
await capturePair(
  'review-deeplink',
  `/place/cairo/reviews?review=${reviewId}&lang=ko`,
  async (page) => {
    await page.waitForTimeout(6000);
  },
);

await capturePair(
  'freshness',
  '/place/paris?lang=ko',
  async (page, base) => {
    await page.waitForTimeout(4000);
    const facts = page.getByRole('button', { name: /현지 정보|Local info/i }).first();
    await facts.waitFor({ state: 'visible', timeout: 60_000 });
    await facts.click();
    const row = page.locator('[data-local-info-row="entry"]:visible').first();
    await row.waitFor({ timeout: 60_000 });
    await row.locator('button').first().click();
    await page.waitForTimeout(800);
  },
);
