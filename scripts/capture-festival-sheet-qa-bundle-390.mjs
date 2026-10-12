/**
 * 390px screenshots — nationwide EN/KO, EN promo, Gangneung nearby list.
 */
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const OUT = '/opt/cursor/artifacts/screenshots';
const PORT = Number(process.env.COS_QA_PREVIEW_PORT || 4174);
const BASE = `https://127.0.0.1:${PORT}`;

async function dismissLocationPrompt(page) {
  const hint = page.locator('p').filter({
    hasText: /위치 허용이 없어|Showing nationwide festivals without location/i,
  });
  if (!(await hint.count())) return;
  const banner = hint.first().locator('xpath=ancestor::div[1]');
  const close = banner.getByRole('button', { name: /^(닫기|Close)$/i });
  if (await close.count()) {
    await close.first().click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(300);
  }
}

async function waitNationwideHeading(page) {
  await page
    .locator('h2')
    .filter({ hasText: /Nationwide|전국/ })
    .first()
    .waitFor({ state: 'visible', timeout: 90_000 });
}

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
  const context = await browser.newContext({ ignoreHTTPSErrors: true });
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120_000);
  page.setDefaultTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 900 });

  await page.goto(`${BASE}/korea/?lang=en&bust=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });
  await dismissLocationPrompt(page);
  await waitNationwideHeading(page);
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

  await page.goto(`${BASE}/korea/?lang=ko&bust=${Date.now()}`, {
    waitUntil: 'domcontentloaded',
  });
  await dismissLocationPrompt(page);
  await waitNationwideHeading(page);
  await page.screenshot({
    path: path.join(OUT, 'bundle-ko-nationwide-heading-390.png'),
    clip: { x: 0, y: 0, width: 390, height: 200 },
  });

  await page.goto(`${BASE}/korea/?festival=2930716&lang=ko&bust=${Date.now()}`, {
    waitUntil: 'commit',
  });
  await page.waitForLoadState('domcontentloaded', { timeout: 120_000 }).catch(() => {});
  const nearbyHeading = page.locator('[data-nearby-heading]');
  await nearbyHeading.waitFor({ state: 'visible', timeout: 120_000 });
  await nearbyHeading.scrollIntoViewIfNeeded();
  const ojuk = page.locator('li', { hasText: '오죽헌' }).first();
  await ojuk.waitFor({ state: 'visible', timeout: 120_000 }).catch(() => {});
  if (await ojuk.count()) {
    await ojuk.click({ force: true });
    await page.waitForTimeout(200);
    await ojuk.evaluate((el) => {
      if (el instanceof HTMLElement) el.blur();
      const btn = el.querySelector('button');
      btn?.blur();
    });
  }
  const list = nearbyHeading.locator('xpath=ancestor::div[1]').locator('ul').first();
  const listBox = await list.boundingBox();
  const headBox = await nearbyHeading.boundingBox();
  if (listBox && headBox) {
    const y = Math.max(0, headBox.y - 4);
    await page.screenshot({
      path: path.join(OUT, 'bundle-gangneung-nearby-390.png'),
      clip: { x: 0, y, width: 390, height: Math.min(520, listBox.y + listBox.height - y) },
    });
  }

  await browser.close();
  console.log('saved bundle screenshots to', OUT);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
