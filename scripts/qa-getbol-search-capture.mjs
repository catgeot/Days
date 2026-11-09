#!/usr/bin/env node
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });
const base = process.env.QA_PREVIEW_BASE || 'https://127.0.0.1:4173';

async function clipShot(page, width, name) {
  const height = width >= 1000 ? 900 : 844;
  await page.setViewportSize({ width, height });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: join(OUT, name),
    clip: { x: 0, y: 0, width, height },
  });
}

async function openExploreSearch(page) {
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForTimeout(2000);
  const searchBtn = page
    .getByRole('button', { name: /3D 지구본|여행지 검색|여행지 탐색|Search destinations/i })
    .first();
  await searchBtn.click({ timeout: 60000 });
  await page.waitForURL(/\/explore/, { timeout: 30000 });
  await page.waitForTimeout(800);
  return page.locator('input:visible').first();
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const clicks = [];

  try {
    const ctx = await browser.newContext({ locale: 'ko-KR', ignoreHTTPSErrors: true });
    await ctx.addInitScript(() => {
      try {
        localStorage.setItem('gateo.locale', 'ko');
      } catch (_) {}
    });
    const page = await ctx.newPage();
    const input = await openExploreSearch(page);
    await input.fill('갯벌');
    await page.waitForTimeout(1500);
    await clipShot(page, 390, 'getbol-search-390.png');
    await clipShot(page, 1280, 'getbol-search-1280.png');

    const buttons = page.locator('[data-search-popover] button').filter({ hasNotText: 'MOONi' });
    const count = await buttons.count();
    const cardNames = [];
    for (let i = 0; i < Math.min(count, 6); i++) {
      cardNames.push((await buttons.nth(i).innerText()).replace(/\s+/g, ' ').trim().slice(0, 80));
    }

    if (count !== 3) {
      throw new Error(`expected 3 UNESCO cards, got ${count}`);
    }

    for (let i = 0; i < count; i++) {
      const label = cardNames[i] || `card-${i}`;
      await buttons.nth(i).click();
      await page.waitForTimeout(2500);
      const url = page.url();
      const path = new URL(url).pathname;
      if (!path.startsWith('/place/')) {
        throw new Error(`card ${i} navigated to ${path}, expected /place/...`);
      }
      clicks.push({ card: label, url, path });
      await openExploreSearch(page);
      const searchInput = page.locator('input:visible').first();
      await searchInput.fill('갯벌');
      await page.waitForTimeout(1200);
    }

    writeFileSync(
      join(OUT, 'getbol-search-click-urls.json'),
      JSON.stringify({ query: '갯벌', cards: cardNames, clicks, base }, null, 2),
    );
    console.log('PASS qa-getbol-search-capture', cardNames);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
