/**
 * WebKit 390 — place summary 3D tour button label (before/after).
 * Usage: CAPTURE_BASE_URL=https://www.gateo.kr/ node scripts/capture-3d-tour-button-390.mjs before
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { webkit } from 'playwright';

const phase = process.argv[2] === 'after' ? 'after' : 'before';
const baseUrl = process.env.CAPTURE_BASE_URL || 'https://www.gateo.kr/';
const OUT = join(process.cwd(), 'docs/qa/pr-3d-tour-label');
const file = `3d-tour-button-${phase}-webkit-390`;

mkdirSync(OUT, { recursive: true });

const browser = await webkit.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  locale: 'ko-KR',
  ignoreHTTPSErrors: true,
});
await page.goto(baseUrl.replace(/\/?$/, '/'), { waitUntil: 'domcontentloaded', timeout: 90_000 });
const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
await search.waitFor({ state: 'visible', timeout: 60_000 });
await search.click();
await page.waitForURL(/\/explore/, { timeout: 30_000 });
const input = page.locator('input[placeholder]:visible').first();
await input.fill('롬블론');
const row = page
  .locator('[data-search-popover] button')
  .filter({ hasNotText: 'MOONi' })
  .filter({ hasText: /롬블론/ })
  .first();
await row.waitFor({ state: 'visible', timeout: 25_000 });
await row.click();
const card = page.locator('.place-summary-card');
await card.waitFor({ state: 'visible', timeout: 25_000 });
const tourBtn = card.getByRole('button', { name: /3D/i }).first();
await tourBtn.waitFor({ state: 'visible', timeout: 15_000 });
const text = (await tourBtn.innerText()).replace(/\s+/g, ' ').trim();
writeFileSync(join(OUT, `${file}.label.txt`), `${phase}\n${text}\n`, 'utf8');
await card.screenshot({ path: join(OUT, `${file}.png`) });
await browser.close();
console.log(phase, text, join(OUT, `${file}.png`));
