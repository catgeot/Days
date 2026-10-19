#!/usr/bin/env node
/** Yanggu img count evidence: gallery place-img vs page total at 390/1280, prod vs local. */
import { webkit } from 'playwright';

const PROD = 'https://www.gateo.kr/';
const LOCAL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');

async function openYanggu(page, base) {
  await page.goto(`${base}?lang=ko`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await page.getByRole('button', { name: /여행지 검색|여행지 탐색/i }).first().click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  await page.locator('input[placeholder]:visible').first().fill('양구');
  await page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: '양구' })
    .first()
    .click();
  await page.waitForURL(/\/place\//, { timeout: 60_000 });
}

async function loadGallery(page) {
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  const loadMore = page.getByRole('button', { name: /더 많은 사진/ });
  for (let i = 0; i < 3; i++) {
    if (!(await loadMore.isVisible().catch(() => false))) break;
    await loadMore.click().catch(() => {});
    await page.waitForTimeout(1200);
  }
  for (let i = 0; i < 14; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(300);
  }
  await page.waitForTimeout(5000);
}

async function counts(page) {
  return page.evaluate(() => {
    const all = [...document.querySelectorAll('img')];
    const gallery = all.filter((img) => String(img.alt || '').startsWith('place-img-'));
    const travelogue = document.querySelectorAll('[data-place-travelogue-card] img').length;
    const sum = (list) => {
      let broken = 0;
      let loading = 0;
      let ok = 0;
      for (const img of list) {
        if (!img.complete) loading += 1;
        else if (img.naturalWidth === 0) broken += 1;
        else ok += 1;
      }
      return { total: list.length, broken, loading, ok };
    };
    return {
      page: sum(all),
      gallery: sum(gallery),
      travelogueImgs: travelogue,
      loadMoreVisible: !!document.querySelector('button')?.textContent?.includes('더 많은 사진'),
    };
  });
}

async function run(base, label, width) {
  const browser = await webkit.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width, height: width === 390 ? 844 : 900 },
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  await openYanggu(page, base);
  await loadGallery(page);
  const c = await counts(page);
  await browser.close();
  return { label, width, ...c };
}

async function main() {
  const rows = [];
  for (const base of [PROD, LOCAL]) {
    const env = base.includes('gateo') ? 'main' : 'fix';
    for (const w of [390, 1280]) {
      rows.push(await run(base, env, w));
    }
  }
  console.log(JSON.stringify(rows, null, 2));
}

main();
