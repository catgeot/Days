/**
 * 축제 카드보기 C안 — 390/1280 실제 UI 캡처 (로컬 preview).
 * SMOKE_SITE_URL 기본 http://127.0.0.1:5173
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join('/opt/cursor/artifacts');
const baseUrl = (process.env.SMOKE_SITE_URL || 'http://127.0.0.1:5173').replace(/\/$/, '');

mkdirSync(outDir, { recursive: true });

function pngWidth(path) {
  return readFileSync(path).readUInt32BE(16);
}

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$/ })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* */
  }
}

async function waitGridSettled(page) {
  await page
    .locator('[data-festival-grid]')
    .waitFor({ state: 'visible', timeout: 90_000 });
  await page
    .waitForFunction(
      () => {
        const grid = document.querySelector('[data-festival-grid]');
        if (!grid) return false;
        const cards = grid.querySelectorAll('[data-festival-grid-card]');
        return cards.length >= 4;
      },
      null,
      { timeout: 60_000 },
    )
    .catch(() => {});
  await page
    .waitForFunction(
      () => {
        const imgs = [
          ...document.querySelectorAll(
            '[data-festival-grid] [data-festival-grid-thumb-frame] img',
          ),
        ];
        if (!imgs.length) return true;
        return imgs.every((img) => img.complete);
      },
      null,
      { timeout: 25_000 },
    )
    .catch(() => {});
  await page.evaluate(() => document.fonts?.ready);
}

async function shotViewport(page, width, filename) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height, deviceScaleFactor: 1 });
  await page.waitForTimeout(400);
  const path = join(outDir, filename);
  if (width === 390) {
    await page.screenshot({
      path,
      clip: { x: 0, y: 0, width: 390, height: Math.min(height, 1200) },
    });
    if (pngWidth(path) !== 390) throw new Error(`${filename} width !== 390`);
  } else {
    await page.screenshot({ path, fullPage: false });
  }
  console.log('saved', path);
}

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${baseUrl}/korea`, { waitUntil: 'networkidle', timeout: 120_000 });
  await page
    .locator('[data-festival-list-heading], [data-festival-grid], main')
    .first()
    .waitFor({ state: 'visible', timeout: 120_000 });
  await dismissLocHint(page);
  const listLink = page.locator('[data-festival-grid-list-link]');
  if (await listLink.isVisible().catch(() => false)) {
    await listLink.click();
    const cardLink = page.locator('[data-festival-grid-card-link]');
    await cardLink.waitFor({ state: 'visible', timeout: 15_000 });
    await cardLink.click();
  }
  await waitGridSettled(page);
  await shotViewport(page, 1280, 'festival-card-grid-c-1280.png');
  await shotViewport(page, 390, 'festival-card-grid-c-390.png');
} finally {
  await browser.close();
}
