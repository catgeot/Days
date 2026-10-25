// Paris safety freshness bands — WebKit 390, injected KST today via __GATEO_FRESHNESS_TODAY__.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = process.env.FRESHNESS_SHOT_DIR || '/opt/cursor/artifacts/local-info-freshness-390';
const VIEWPORT = { width: 390, height: 844 };

const BANDS = [
  { id: 'fresh', today: '2026-10-25', tier: 'fresh' },
  { id: 'warn', today: '2026-11-01', tier: 'warn' },
  { id: 'hidden', today: '2026-11-15', tier: 'hidden' },
];

test.use({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
});

async function openParisSafetyRow(page, today, lang = 'ko') {
  await page.addInitScript((injectedToday) => {
    globalThis.__GATEO_FRESHNESS_TODAY__ = injectedToday;
  }, today);
  await page.goto(`/place/paris?lang=${lang}`);
  await expect(page.getByText(lang === 'en' ? 'Paris' : '파리').first()).toBeVisible({ timeout: 60_000 });
  const factsHeader = page.getByRole('button', { name: lang === 'en' ? /Local info/i : /현지 정보/ }).first();
  await expect(factsHeader).toBeVisible({ timeout: 30_000 });
  await factsHeader.click();
  const safetyRow = page.locator('[data-local-info-row="safety"]:visible');
  await expect(safetyRow).toBeVisible();
  await safetyRow.locator('button').first().click();
  await expect(page.locator('[data-fact-freshness-tier]').first()).toHaveAttribute('data-fact-freshness-tier', /.+/);
}

async function clipShot(page, filename) {
  mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({
    path: join(OUT_DIR, filename),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

test.describe('place local info freshness — WebKit 390 screenshots', () => {
  for (const band of BANDS) {
    test(`ko paris safety ${band.id} (${band.today})`, async ({ page }) => {
      await openParisSafetyRow(page, band.today, 'ko');
      await expect(page.locator(`[data-fact-freshness-tier="${band.tier}"]`).first()).toBeVisible();
      if (band.tier === 'fresh') {
        await expect(page.locator('[data-fact-freshness-chip]').first()).toBeVisible();
      }
      if (band.tier === 'warn') {
        await expect(page.locator('[data-fact-freshness-warn]').first()).toBeVisible();
      }
      if (band.tier === 'hidden') {
        await expect(page.locator('[data-fact-freshness-hidden]').first()).toBeVisible();
        await expect(page.locator('[data-fact-value]').first()).toHaveCount(0);
      }
      await clipShot(page, `paris-safety-${band.id}-ko-390.png`);
    });
  }

  test('en paris safety warn band', async ({ page }) => {
    await openParisSafetyRow(page, '2026-11-01', 'en');
    await expect(page.locator('[data-fact-freshness-warn]').first()).toBeVisible();
    await clipShot(page, 'paris-safety-warn-en-390.png');
  });
});
