#!/usr/bin/env node
/**
 * Venice + Dubai photo credit: PROD (main) vs local fix, search path, WebKit 390/1280.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { webkit } from 'playwright';

const PROD = 'https://www.gateo.kr/';
const LOCAL = (process.env.SMOKE_SITE_URL || 'https://127.0.0.1:4173').replace(/\/?$/, '/');
const OUT = process.env.PR511_QA_OUT || '/opt/cursor/artifacts/pr511-qa';

const CASES = [
  { slug: 'venice', query: '베니스', result: '베니스' },
  { slug: 'dubai', query: '두바이', result: '두바이' },
];

async function openFromSearch(page, base, query, resultText) {
  await page.goto(`${base}?lang=ko`, { waitUntil: 'networkidle', timeout: 120_000 });
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await search.waitFor({ state: 'visible', timeout: 120_000 });
  await search.click();
  await page.waitForURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
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

async function shotCredit(page, fileName) {
  const credit = page.locator('[data-gallery-photo-credit]').or(page.getByText(/^사진:/)).first();
  await credit.waitFor({ state: 'attached', timeout: 120_000 });
  await credit.scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);
  const width = page.viewportSize()?.width || 390;
  const height = page.viewportSize()?.height || 844;
  await page.screenshot({
    path: join(OUT, fileName),
    clip: { x: 0, y: 0, width, height },
  });
  return (await credit.innerText()).trim();
}

async function main() {
  await mkdir(OUT, { recursive: true });
  for (const width of [390, 1280]) {
    const height = width === 390 ? 844 : 800;
    const suffix = `${width}-webkit`;
    const browser = await webkit.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width, height },
      locale: 'ko-KR',
      ignoreHTTPSErrors: true,
    });
    const page = await context.newPage();
    for (const c of CASES) {
      const prodText = await (async () => {
        await openFromSearch(page, PROD, c.query, c.result);
        return shotCredit(page, `pr511-${c.slug}-photo-credit-prod-main-${suffix}.png`);
      })();
      const localText = await (async () => {
        await openFromSearch(page, LOCAL, c.query, c.result);
        return shotCredit(page, `pr511-${c.slug}-photo-credit-local-fix-${suffix}.png`);
      })();
      console.log(`${c.slug}@${width} prod: ${prodText.slice(0, 60)}`);
      console.log(`${c.slug}@${width} local: ${localText.slice(0, 60)}`);
    }
    await browser.close();
  }
  console.log(`artifacts: ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
