/** Recapture mobile + jeonju + paris after layout fix. */
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { chromium } from '@playwright/test';

const BASE_ON = (process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4174').replace(/\/$/, '');
const BASE_OFF = (process.env.PLAYWRIGHT_BASE_URL_OFF || 'http://127.0.0.1:4175').replace(/\/$/, '');
const OUT = process.env.PLACE_LEFT_INFO_SHOT_DIR || '/opt/cursor/artifacts/place-desktop-left-info';

async function waitCairoMobileReady(page) {
  await page.waitForFunction(() => {
    if (window.matchMedia('(min-width: 1024px)').matches) return true;
    return (
      document.querySelectorAll('#facts').length === 1
      && Boolean(document.querySelector('#stories'))
      && Boolean(document.querySelector('[aria-label*="뒤로"], [aria-label*="Back"]'))
    );
  }, { timeout: 45_000 });
}

async function shot(page, name) {
  mkdirSync(OUT, { recursive: true });
  const path = join(OUT, name);
  await page.screenshot({ path, fullPage: false });
  console.log('wrote', path);
}

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ locale: 'ko-KR' });

  for (const [w, h, tag, base] of [
    [390, 844, 'cairo-mobile-390-flag-on', BASE_ON],
    [768, 1024, 'cairo-mobile-768-flag-on', BASE_ON],
    [390, 844, 'cairo-mobile-390-flag-off', BASE_OFF],
    [768, 1024, 'cairo-mobile-768-flag-off', BASE_OFF],
  ]) {
    await page.setViewportSize({ width: w, height: h });
    await page.goto(`${base}/place/cairo?lang=ko`, { waitUntil: 'networkidle' });
    await page.getByText('카이로').first().waitFor({ timeout: 60_000 });
    await waitCairoMobileReady(page);
    await page.waitForTimeout(400);
    await shot(page, `${tag}.png`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE_ON}/place/jeonju?lang=ko`, { waitUntil: 'networkidle' });
  await page.getByText(/Jeonju|전주/i).first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, 'jeonju-1440.png');

  await page.goto(`${BASE_ON}/place/paris?lang=ko`, { waitUntil: 'networkidle' });
  await page.getByText(/파리|Paris/i).first().waitFor({ timeout: 60_000 });
  await page.waitForTimeout(800);
  await shot(page, 'paris-long-overview-1440.png');

  await browser.close();
}

main();
