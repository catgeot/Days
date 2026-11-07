/** Branch-only Paris/Tokyo/Jeju 390+1280 — minimal settle (matches manual QA). */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { webkit } from '@playwright/test';

const BASE = process.env.BR373_BRANCH_BASE || 'https://127.0.0.1:4173';
const OUT = path.join(process.cwd(), 'artifacts/pr373-r7');
const OUT_ART = '/opt/cursor/artifacts/pr373-r7';

const FLOWS = [
  { key: 'paris', query: '파리', name: /파리|Paris/ },
  { key: 'tokyo', query: '도쿄', name: /도쿄|Tokyo/ },
  { key: 'jeju', query: '제주', name: /제주|Jeju/ },
];
const SIZES = [
  { tag: '390', width: 390, height: 844 },
  { tag: '1280', width: 1280, height: 800 },
];

async function run(browser, flow, size) {
  const ctx = await browser.newContext({
    viewport: { width: size.width, height: size.height },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
    locale: 'ko-KR',
  });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/?gateoGlobeQa=1`, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first().click();
  await page.waitForURL(/\/explore/);
  await page.locator('input[placeholder]:visible').first().fill(flow.query);
  await page.locator('[data-search-popover] button').filter({ hasNotText: 'MOONi' }).filter({ hasText: flow.name }).first().click();
  await page.waitForTimeout(2500);
  await page.getByRole('button', { name: /홈으로 이동|Go to home/i }).first().click();
  await page.waitForURL((u) => new URL(u).pathname === '/', { timeout: 30_000 });
  await page.waitForTimeout(8000);
  const name = `branch-${flow.key}-${size.tag}-after-home-settled.jpg`;
  for (const dir of [OUT, OUT_ART]) {
    await mkdir(dir, { recursive: true });
    await page.screenshot({
      path: path.join(dir, name),
      type: 'jpeg',
      quality: 55,
      clip: { x: 0, y: 0, width: size.width, height: size.height },
    });
  }
  const summaryOpen = await page.evaluate(() => Boolean(document.querySelector('.place-summary-card')));
  await ctx.close();
  return { flow: flow.key, size: size.tag, prefix: 'branch-', summaryOpen };
}

async function main() {
  const browser = await webkit.launch();
  const runs = [];
  for (const size of SIZES) {
    for (const flow of FLOWS) {
      runs.push(await run(browser, flow, size));
    }
  }
  await browser.close();
  if (runs.some((r) => r.summaryOpen)) {
    console.error('FAIL summary open', runs.filter((r) => r.summaryOpen));
    process.exit(1);
  }
  console.log('verify PASS', runs);
}

main();
