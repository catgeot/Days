// Paris local-info safety row — KO/EN at 390 and 1280 (local dev with rollout default on).
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = process.env.PARIS_CARD_SHOT_DIR || '/opt/cursor/artifacts/paris-local-info-card';
const TODAY = '2026-10-30';

test.use({ ignoreHTTPSErrors: true, deviceScaleFactor: 1 });

async function injectToday(page) {
  await page.addInitScript((injectedToday) => {
    globalThis.__GATEO_FRESHNESS_TODAY__ = injectedToday;
  }, TODAY);
}

async function openParisSafetyCard(page, { lang, width, height }) {
  await injectToday(page);
  await page.setViewportSize({ width, height });
  await page.goto(`/place/paris?lang=${lang}`);
  const placeLabel = lang === 'en' ? 'Paris' : '파리';
  await expect(page.getByText(placeLabel).first()).toBeVisible({ timeout: 60_000 });
  const factsLabel = lang === 'en' ? /Local info/i : /현지 정보/;
  const factsHeader = page.getByRole('button', { name: factsLabel }).first();
  await expect(factsHeader).toBeVisible({ timeout: 30_000 });
  await factsHeader.click();
  const safety = page.locator('[data-local-info-row="safety"]:visible');
  await expect(safety).toBeVisible();
  await expect(safety).toHaveAttribute('data-local-info-open', 'true');
  if (lang === 'en') {
    await expect(safety.locator('[data-fact-value]:visible')).toContainText(/third nationwide protest/i);
  } else {
    await expect(safety.locator('[data-fact-value]:visible')).toContainText('3차 시위');
  }
  return safety;
}

async function clipCardShot(page, filename, width, height) {
  mkdirSync(OUT_DIR, { recursive: true });
  const facts = page.locator('[data-local-info="gallery"]:visible').first();
  await expect(facts).toBeVisible();
  const box = await facts.boundingBox();
  expect(box).toBeTruthy();
  await page.screenshot({
    path: join(OUT_DIR, filename),
    clip: {
      x: 0,
      y: Math.max(0, Math.floor(box.y - 8)),
      width,
      height: Math.min(height, Math.ceil(box.height + 16)),
    },
  });
}

for (const lang of ['ko', 'en']) {
  test(`paris local info card ${lang} 390`, async ({ page }) => {
    await openParisSafetyCard(page, { lang, width: 390, height: 844 });
    await clipCardShot(page, `paris-local-info-${lang}-390.png`, 390, 844);
  });

  test(`paris local info card ${lang} 1280`, async ({ page }) => {
    await openParisSafetyCard(page, { lang, width: 1280, height: 900 });
    await clipCardShot(page, `paris-local-info-${lang}-1280.png`, 1280, 900);
  });
}
