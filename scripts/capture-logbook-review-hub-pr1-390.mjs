/**
 * WebKit 390×844 — Logbook official review hub PR-1 captures.
 * CAPTURE_BASE_URL — dev/preview (default http://127.0.0.1:5195)
 * CAPTURE_OUT_DIR — default /opt/cursor/artifacts/logbook-review-hub-pr1
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { webkit } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = process.env.CAPTURE_OUT_DIR || '/opt/cursor/artifacts/logbook-review-hub-pr1';
const onUrl = process.env.CAPTURE_BASE_URL || 'https://127.0.0.1:5195';
const mode = process.env.CAPTURE_MODE || 'flag-on';

mkdirSync(outDir, { recursive: true });

async function shoot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log(`shot ${path}`);
}

const browser = await webkit.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
  ignoreHTTPSErrors: true,
});
const page = await context.newPage();

await page.goto(`${onUrl}/blog?tab=public`, { waitUntil: 'domcontentloaded' });
await page.waitForLoadState('networkidle', { timeout: 60_000 }).catch(() => {});

if (mode === 'flag-off') {
  const hub = page.getByTestId('logbook-official-review-hub');
  const hubVisible = await hub.isVisible().catch(() => false);
  if (hubVisible) {
    throw new Error('Hub card visible with flag off — expected hidden');
  }
  await shoot(page, '05-feed-flag-off-unchanged.png');
  await browser.close();
  console.log('capture-logbook-review-hub-pr1-390 flag-off OK');
  process.exit(0);
}

const hub = page.getByTestId('logbook-official-review-hub');
await hub.waitFor({ state: 'visible', timeout: 90_000 });
const hubVisible = await hub.isVisible().catch(() => false);

if (hubVisible) {
  await shoot(page, '01-feed-hub-collapsed-flag-on.png');
  await hub.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
  await shoot(page, '02-feed-hub-expanded-list.png');

  const more = page.getByTestId('logbook-official-review-hub-more');
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.waitForTimeout(400);
    await shoot(page, '03-feed-hub-more.png');
  }

  const firstItem = page.getByTestId('logbook-official-review-hub-item').first();
  await firstItem.click();
  await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 30_000 });
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1200);
  await shoot(page, '04-place-reviews-from-hub-item.png');
} else {
  writeFileSync(join(outDir, 'NOTE-flag-off-or-empty.txt'), 'Hub card not visible — check VITE_GATEO_LOGBOOK_REVIEW_HUB=1');
  await shoot(page, '00-feed-flag-off-or-empty.png');
}

await browser.close();
console.log('capture-logbook-review-hub-pr1-390 OK');
