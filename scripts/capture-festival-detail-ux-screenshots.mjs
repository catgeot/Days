/**
 * One-off UX evidence — `node scripts/capture-festival-detail-ux-screenshots.mjs`
 * Requires: `npm run build` + `npx vite preview --port 4173 --host 127.0.0.1`
 */
import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const BASE = process.env.PREVIEW_URL || 'https://127.0.0.1:5183';
const OUT = '/opt/cursor/artifacts/festival-detail-ux';
const FESTIVAL_QUERY = process.env.FESTIVAL_ID || '790124';

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function shot(page, name, width) {
  await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
  await page.waitForTimeout(400);
  const path = join(OUT, `${name}-${width}.png`);
  await page.screenshot({ path, fullPage: false });
  console.log('saved', path);
}

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();

  await page.goto(`${BASE}/korea/`, { waitUntil: 'networkidle', timeout: 120_000 });
  await dismissLocHint(page);
  await page
    .getByRole('heading', { name: /한국의 축제|Korea festivals/i })
    .waitFor({ state: 'visible', timeout: 120_000 })
    .catch(() => {});

  const festivalCard = page
    .getByRole('main')
    .getByRole('button')
    .filter({ has: page.locator('img[alt]') })
    .first();
  if (await festivalCard.count()) {
    await festivalCard.click({ timeout: 30_000 });
  } else {
    await page.goto(`${BASE}/korea/?festival=${FESTIVAL_QUERY}`, {
      waitUntil: 'networkidle',
      timeout: 120_000,
    });
  }

  const dialog = page.getByRole('dialog').first();
  const hasDialog = await dialog
    .waitFor({ state: 'visible', timeout: 120_000 })
    .then(() => true)
    .catch(() => false);

  if (!hasDialog) {
    for (const w of [1280, 390]) {
      await shot(page, '00-korea-without-dialog', w);
    }
    await browser.close();
    console.warn('Festival dialog did not open — saved fallback shots only');
    return;
  }

  await dialog.evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  await page.waitForTimeout(800);

  for (const w of [1280, 390]) {
    await shot(page, '01-festival-bottom-sections', w);
  }

  const courseBtn = dialog.getByText(/인근 여행코스|Nearby travel courses/i).locator('..').getByRole('button').first();
  if (await courseBtn.count()) {
    await courseBtn.click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(600);
    for (const w of [1280, 390]) {
      await shot(page, '02-course-modal-footer', w);
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(400);
  }

  const mooniBtn = dialog.getByRole('button', { name: /무니|MOONi/i }).first();
  if (await mooniBtn.count()) {
    await mooniBtn.click();
    await page.waitForTimeout(1200);
    for (const w of [1280, 390]) {
      await shot(page, '04-mooni-festival-opening', w);
    }
    const accessChip = page.getByRole('button', { name: /가는 방법|How to get/i }).first();
    if (await accessChip.count()) {
      await accessChip.click();
      await page.waitForTimeout(500);
      for (const w of [1280, 390]) {
        await shot(page, '05-mooni-origin-row', w);
      }
    }
  }

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
