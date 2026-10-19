#!/usr/bin/env node
/**
 * Recapture bangkok/rio with travelogue card visible (requires build with VITE_GATEO_PLACE_TRAVELOGUE_CARD=1).
 */
import { copyFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit } from 'playwright';

const OUT = process.env.PR511_QA_OUT || '/opt/cursor/artifacts/pr511-qa';
const STORE = '/cursor/stores/self/artifacts/pr511-qa';
const BASE = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');

const CASES = [
  { slug: 'bangkok', query: '방콕', result: '방콕', title: '붉게 물든 짜오프라야' },
  { slug: 'rio-de-janeiro', query: '리우', result: '리우데자네이루', title: '브라질 첫 케이블카를 타고' },
];

const VIEWPORTS = [
  { width: 390, height: 844, tag: '390' },
  { width: 1280, height: 900, tag: '1280' },
];

async function openFromSearch(page, query, resultText) {
  await page.goto(`${BASE}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('button', { name: /여행지 검색|여행지 탐색/i }).first().click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  await page.locator('input[placeholder]:visible').first().fill(query);
  await page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: resultText })
    .first()
    .click();
  await page.waitForURL(/\/place\//, { timeout: 60_000 });
}

async function loadFully(page) {
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  const card = page.locator('[data-place-travelogue-card]');
  await card.waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByText('GATEO 기행문').waitFor({ state: 'visible', timeout: 30_000 });
  const loadMore = page.getByRole('button', { name: /더 많은 사진/ });
  for (let i = 0; i < 3; i++) {
    if (!(await loadMore.isVisible().catch(() => false))) break;
    await loadMore.scrollIntoViewIfNeeded();
    await loadMore.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(1500);
  }
  for (let step = 0; step < 12; step++) {
    await page.evaluate(() => window.scrollBy(0, Math.max(400, window.innerHeight * 0.85)));
    await page.waitForTimeout(350);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(800);
  await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});
  await page.waitForTimeout(3000);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await mkdir(STORE, { recursive: true });
  const flagCheck = await fetch(`${BASE}?lang=ko`).then((r) => r.text()).catch(() => '');
  if (!flagCheck.includes('GATEO') && !process.env.SKIP_FLAG_SMOKE) {
    console.warn('Warning: could not verify travelogue in HTML — ensure VITE_GATEO_PLACE_TRAVELOGUE_CARD=1 at build time');
  }

  for (const vp of VIEWPORTS) {
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    for (const c of CASES) {
      await openFromSearch(page, c.query, c.result);
      await loadFully(page);
      const hasCard = await page.locator('[data-place-travelogue-card]').isVisible();
      const hasTitle = await page.getByText(c.title, { exact: false }).first().isVisible().catch(() => false);
      if (!hasCard) throw new Error(`${c.slug} ${vp.tag}: travelogue card missing — build without VITE_GATEO_PLACE_TRAVELOGUE_CARD=1?`);
      const name = `pr511-${c.slug}-fix-${vp.tag}-loaded.png`;
      await page.screenshot({
        path: join(OUT, name),
        clip: { x: 0, y: 0, width: vp.width, height: vp.height },
      });
      await copyFile(join(OUT, name), join(STORE, name));
      console.log(`${name}: card=${hasCard} title=${hasTitle}`);
    }
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
