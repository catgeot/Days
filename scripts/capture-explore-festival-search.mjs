/**
 * Explore search festival hits — 390px popover captures (before PROD / after preview).
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const QUERIES = ['진주 유등', '마산 국화', '산천어', '강릉'];
const WIDTH = 390;
const HEIGHT = 844;
const OUT_ROOT = process.env.CAPTURE_OUT || '/opt/cursor/artifacts/explore-festival-search';

function slugQuery(q) {
  return q.replace(/\s+/g, '-');
}

async function captureBase(page, baseUrl, tag) {
  const outDir = join(OUT_ROOT, tag);
  await mkdir(outDir, { recursive: true });
  await page.setViewportSize({ width: WIDTH, height: HEIGHT });

  for (const query of QUERIES) {
    await page.goto(`${baseUrl}/explore`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
    await input.waitFor({ state: 'visible', timeout: 120_000 });
    await input.fill('');
    await input.fill(query);
    await page.waitForTimeout(400);
    const popover = page.locator('[data-search-popover]');
    await popover.waitFor({ state: 'visible', timeout: 30_000 }).catch(() => {});
    if (tag === 'after-preview') {
      await page
        .locator('[data-search-popover]')
        .getByText(/^축제$/)
        .first()
        .waitFor({ state: 'visible', timeout: 45_000 })
        .catch(() => {});
      await page.waitForTimeout(300);
    } else {
      await page.waitForTimeout(500);
    }
    const file = join(outDir, `${slugQuery(query)}.png`);
    await page.screenshot({ path: file, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    console.log('saved', file);
  }
}

async function main() {
  const afterBase = process.env.PLAYWRIGHT_BASE_URL || 'https://127.0.0.1:4173';
  const beforeBase = process.env.PROD_BASE_URL || 'https://www.gateo.kr';
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  await captureBase(page, beforeBase, 'before-main');
  await captureBase(page, afterBase, 'after-preview');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
