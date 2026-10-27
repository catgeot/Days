/**
 * 390px Korean before (PROD) / after (local preview) for scenic ↔ place card linking.
 */
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { chromium } from 'playwright';

const OUT_DIR = process.env.SCENIC_PLACE_SHOT_DIR || '/opt/cursor/artifacts';
const AFTER_BASE = process.env.SCENIC_PLACE_AFTER_BASE || 'http://127.0.0.1:4173';
const BEFORE_BASE = process.env.SCENIC_PLACE_BEFORE_BASE || 'https://www.gateo.kr';

const VIEWPORT = { width: 390, height: 844, deviceScaleFactor: 1 };

async function clipPageScreenshot(page, filePath) {
  await page.screenshot({
    path: filePath,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

async function dismissCookieIfAny(page) {
  const btn = page.getByRole('button', { name: /동의|확인|닫기|Accept/i }).first();
  if (await btn.isVisible({ timeout: 1500 }).catch(() => false)) {
    await btn.click().catch(() => {});
  }
}

async function capturePyeongchangGallery(page, baseUrl, prefix) {
  await page.goto(`${baseUrl}/place/pyeongchang/gallery`, { waitUntil: 'domcontentloaded' });
  await dismissCookieIfAny(page);
  await page.waitForTimeout(2500);
  await clipPageScreenshot(page, join(OUT_DIR, `${prefix}-pyeongchang-gallery-home-390.png`));
}

async function captureOdaesanModal(page, baseUrl, prefix) {
  await page.goto(
    `${baseUrl}/korea/theme/scenic?hub=pyeongchang&spot=odaesan-seonjae-trail`,
    { waitUntil: 'domcontentloaded' },
  );
  await dismissCookieIfAny(page);
  await page.waitForSelector('[data-theme-spot-modal-scrim]', { timeout: 20000 });
  await page.waitForTimeout(1500);
  await clipPageScreenshot(page, join(OUT_DIR, `${prefix}-odaesan-seonjae-modal-390.png`));
}

async function captureOdaesanPlaceCard(page, baseUrl, prefix) {
  await page.goto(`${baseUrl}/place/odaesan-seonjae-trail/gallery`, {
    waitUntil: 'domcontentloaded',
  });
  await dismissCookieIfAny(page);
  await page.waitForTimeout(3500);
  await clipPageScreenshot(page, join(OUT_DIR, `${prefix}-odaesan-seonjae-place-card-390.png`));
}

async function runSet(browser, baseUrl, prefix) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    locale: 'ko-KR',
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();
  await capturePyeongchangGallery(page, baseUrl, prefix);
  await captureOdaesanModal(page, baseUrl, prefix);
  await captureOdaesanPlaceCard(page, baseUrl, prefix);
  await context.close();
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  try {
    await runSet(browser, BEFORE_BASE, 'before');
    await runSet(browser, AFTER_BASE, 'after');
    console.log(`Screenshots saved under ${OUT_DIR}`);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
