#!/usr/bin/env node
/**
 * PR #511 QA evidence — search path, section toggles, photo credit line.
 *   SMOKE_SITE_URL=https://127.0.0.1:4173 node scripts/capture-pr511-qa-evidence.mjs
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium, webkit } from 'playwright';

const baseURL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PR511_QA_OUT || '/opt/cursor/artifacts/pr511-qa';

const OVERSEAS = [
  { slug: 'cairo', query: '카이로', result: '카이로여행지', expectKto: false },
  { slug: 'rio-de-janeiro', query: '리우', result: '리우데자네이루', expectKto: false },
  { slug: 'bangkok', query: '방콕', result: '방콕', expectKto: false },
  { slug: 'paris', query: '파리', result: '파리', expectKto: false },
  { slug: 'dubai', query: '두바이', result: '두바이', expectKto: false },
];

const DOMESTIC = { slug: 'jeju', query: '제주', result: '제주', expectKto: true };

async function openFromSearch(page, query, resultText) {
  await page.goto(`${baseURL}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 120_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.waitFor({ state: 'visible' });
  await input.fill(query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: resultText })
    .first();
  await row.waitFor({ state: 'visible', timeout: 30_000 });
  await row.click();
  await page.waitForURL(/\/place\//, { timeout: 60_000 });
}

async function viewportShot(page, fileName) {
  const width = page.viewportSize()?.width || 390;
  const height = page.viewportSize()?.height || 844;
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
}

async function scrollPhotoCreditIntoView(page) {
  const credit = page.locator('[data-gallery-photo-credit]').first();
  await credit.waitFor({ state: 'attached', timeout: 120_000 });
  await credit.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600);
}

async function captureCairoSectionToggles(page, slug, suffix) {
  for (const [label, key] of [
    [/현지 정보/, 'local-info'],
    [/다녀온 이야기/, 'visit-stories'],
  ]) {
    const header = page.getByRole('button', { name: label }).first();
    if (!(await header.isVisible().catch(() => false))) continue;
    await viewportShot(page, `pr511-${slug}-${key}-expanded-${suffix}.png`);
    await header.click();
    await page.waitForTimeout(500);
    await viewportShot(page, `pr511-${slug}-${key}-collapsed-${suffix}.png`);
    await header.click();
    await page.waitForTimeout(500);
  }
}

async function capturePlace(browserType, viewport, engineTag, place) {
  const browser = await browserType.launch({ headless: true });
  const context = await browser.newContext({
    viewport,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  const suffix = `${viewport.width}-${engineTag}`;

  await openFromSearch(page, place.query, place.result);
  await scrollPhotoCreditIntoView(page);
  const creditText = await page.locator('[data-gallery-photo-credit]').first().innerText();
  const hasKto = /한국관광공사|Korea Tourism/i.test(creditText);
  if (place.expectKto && !hasKto) {
    console.warn(`WARN ${place.slug}: expected KTO credit, got: ${creditText}`);
  }
  if (!place.expectKto && hasKto) {
    throw new Error(`${place.slug}: unexpected KTO credit: ${creditText}`);
  }
  await viewportShot(page, `pr511-${place.slug}-photo-credit-${suffix}.png`);

  if (place.slug === 'cairo') {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await captureCairoSectionToggles(page, place.slug, suffix);
  }

  await browser.close();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const all = [...OVERSEAS, DOMESTIC];
  for (const width of [390, 1280]) {
    const height = width === 390 ? 844 : 800;
    const engine = webkit;
    const tag = 'webkit';
    for (const place of all) {
      await capturePlace(engine, { width, height }, tag, place);
      console.log(`OK ${place.slug} @${width} ${tag}`);
    }
  }
  console.log(`artifacts: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
