/**
 * 390px screenshots — EN nationwide list + social promo row.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const OUT = '/opt/cursor/artifacts/screenshots';
const PORT = Number(process.env.COS_QA_PREVIEW_PORT || 4174);
const BASE = `https://127.0.0.1:${PORT}`;

async function waitPreview() {
  for (let i = 0; i < 120; i++) {
    try {
      if ((await fetch(`${BASE}/korea/`)).ok) return;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('preview down');
}

async function main() {
  await mkdir(OUT, { recursive: true });
  await waitPreview();
  const browser = await chromium.launch();
  const page = await (
    await browser.newContext({ ignoreHTTPSErrors: true, locale: 'en-US' })
  ).newPage();
  await page.setViewportSize({ width: 390, height: 900 });
  await page.goto(`${BASE}/korea/?lang=en&bust=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.waitForLoadState('networkidle', { timeout: 120_000 }).catch(() => {});
  const header = page.locator('h2').first();
  await header.waitFor({ state: 'visible', timeout: 60_000 });
  await page.screenshot({
    path: path.join(OUT, 'bundle-en-nationwide-heading-390.png'),
    clip: { x: 0, y: 0, width: 390, height: 200 },
  });
  const promo = page.locator('[data-social-promo-festival-row]');
  if (await promo.count()) {
    await promo.first().scrollIntoViewIfNeeded();
    const box = await promo.first().boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(OUT, 'bundle-en-social-promo-390.png'),
        clip: {
          x: 0,
          y: Math.max(0, box.y - 8),
          width: 390,
          height: Math.min(220, box.height + 16),
        },
      });
    }
  }
  await page.goto(`${BASE}/korea/?festival=2930716&lang=ko&bust=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });
  await page.locator('[data-nearby-heading]').waitFor({ state: 'visible', timeout: 120_000 });
  await page.waitForTimeout(500);
  const below = page.locator('[data-festival-below-loading]');
  if (await below.count()) {
    await below.first().scrollIntoViewIfNeeded();
    const box = await below.first().boundingBox();
    if (box) {
      await page.screenshot({
        path: path.join(OUT, 'bundle-ko-near-sections-loading-390.png'),
        clip: {
          x: 0,
          y: Math.max(0, box.y - 40),
          width: 390,
          height: 120,
        },
      });
    }
  }
  await browser.close();
  console.log('saved bundle screenshots to', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
