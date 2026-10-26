import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.PREVIEW_URL || 'https://127.0.0.1:4174';
const OUT_TAG = process.env.OUT_TAG || 'after';
const SLUG = process.env.WORLD_EVENT_SLUG || 'rio-carnival-2027';
const OUT = `/opt/cursor/artifacts/festival-strip-peek-390/${OUT_TAG}`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });
  await page.goto(`${BASE}/world-events/${SLUG}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  const row = page.locator('section').filter({ has: page.getByText(/숙소|Stays/i) }).locator('[class*="overflow-x-auto"]').first();
  await row.waitFor({ state: 'visible', timeout: 120_000 });
  await row.scrollIntoViewIfNeeded();
  await page.waitForTimeout(500);
  const path = join(OUT, `world-events-${SLUG}-stay.png`);
  await page.screenshot({ path, clip: { x: 0, y: 0, width: 390, height: 844 } });
  console.log('saved', path);
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
