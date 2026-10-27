#!/usr/bin/env node
/**
 * 390px Korean UI — scenic modal carousel + explore search 오대산 (before/after).
 * Usage:
 *   BASE_URL=https://www.gateo.kr node scripts/capture-scenic-search-bugfix-390.mjs before
 *   BASE_URL=http://127.0.0.1:4173 node scripts/capture-scenic-search-bugfix-390.mjs after
 */
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const phase = process.argv[2] || 'after';
const baseUrl = (process.env.BASE_URL || 'http://127.0.0.1:4173').replace(/\/$/, '');
const outDir =
  process.env.ARTIFACT_DIR ||
  '/opt/cursor/artifacts/scenic-search-bugfix-390';

mkdirSync(outDir, { recursive: true });

const viewport = { width: 390, height: 844 };

async function clipShot(page, name) {
  const path = join(outDir, `${phase}-${name}.png`);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log('wrote', path);
}

async function setKoreanLocale(page, context) {
  await context.addCookies([
    {
      name: 'gateo_locale',
      value: 'ko',
      domain: new URL(baseUrl).hostname,
      path: '/',
    },
  ]);
  await page.goto(`${baseUrl}/explore`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
}

async function captureExploreSearch(page) {
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await input.waitFor({ state: 'visible', timeout: 60_000 });
  await input.fill('오대산');
  await page.waitForTimeout(600);
  await clipShot(page, 'explore-search-odaesan-suggestions');
}

async function captureScenicModal(page) {
  const url = `${baseUrl}/korea/theme/scenic?hub=pyeongchang&spot=odaesan-seonjae-trail`;
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.waitForTimeout(2500);
  const modal = page.locator('[role="dialog"]').filter({ hasText: '오대산 선재길' }).first();
  await modal.waitFor({ state: 'visible', timeout: 90_000 }).catch(() => {});
  await clipShot(page, 'scenic-modal-odaesan-carousel');
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

try {
  await setKoreanLocale(page, context);
  await captureExploreSearch(page);
  await captureScenicModal(page);
} finally {
  await browser.close();
}
