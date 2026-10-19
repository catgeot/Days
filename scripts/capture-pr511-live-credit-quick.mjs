#!/usr/bin/env node
/** Quick prod/local credit for one slug: node scripts/capture-pr511-live-credit-quick.mjs venice 베니스 베니스 */
import { webkit } from 'playwright';

const [slug, query, result] = process.argv.slice(2);
const prod = 'https://www.gateo.kr/';
const local = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');

async function openSearch(page, base) {
  await page.goto(`${base}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
  await page.getByRole('button', { name: /여행지 검색|여행지 탐색/i }).first().click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  await page.locator('input[placeholder]:visible').first().fill(query);
  await page.locator('[data-search-popover] button').filter({ hasNotText: 'MOONi' }).filter({ hasText: result }).first().click();
  await page.waitForURL(/\/place\//, { timeout: 60_000 });
}

async function credit(page) {
  const el = page.locator('[data-gallery-photo-credit], p').filter({ hasText: /^사진:|Unsplash/ }).first();
  await el.waitFor({ state: 'visible', timeout: 90_000 });
  await el.scrollIntoViewIfNeeded();
  const text = (await el.innerText()).trim();
  return { text, kto: /한국관광공사/.test(text) };
}

const browser = await webkit.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
await openSearch(page, prod);
const p = await credit(page);
await openSearch(page, local);
const l = await credit(page);
await browser.close();
console.log(JSON.stringify({ slug, prod: p, local: l }));
