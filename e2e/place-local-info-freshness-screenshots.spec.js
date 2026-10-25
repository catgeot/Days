// Paris (event) + Cairo (standing safety) freshness — WebKit 390, injected KST today.
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = process.env.FRESHNESS_SHOT_DIR || '/opt/cursor/artifacts/local-info-freshness-390';
const VIEWPORT = { width: 390, height: 844 };

const PARIS_BANDS = [
  { id: 'fresh', today: '2026-10-25', tier: 'fresh' },
  { id: 'warn', today: '2026-11-01', tier: 'warn' },
  { id: 'hidden', today: '2026-11-15', tier: 'hidden' },
];

const CAIRO_BANDS = [
  { id: 'fresh', today: '2026-11-10', tier: 'fresh' },
  { id: 'warn', today: '2026-11-11', tier: 'warn' },
  { id: 'hidden', today: '2027-01-10', tier: 'hidden' },
];

test.use({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
});

async function injectToday(page, today) {
  await page.addInitScript((injectedToday) => {
    globalThis.__GATEO_FRESHNESS_TODAY__ = injectedToday;
  }, today);
}

async function openFactRow(page, { slug, slotId, today, lang }) {
  await injectToday(page, today);
  const placeLabel = lang === 'en'
    ? (slug === 'paris' ? 'Paris' : 'Cairo')
    : (slug === 'paris' ? '파리' : '카이로');
  await page.goto(`/place/${slug}?lang=${lang}`);
  await expect(page.getByText(placeLabel).first()).toBeVisible({ timeout: 60_000 });
  const factsLabel = lang === 'en' ? /Local info/i : /현지 정보/;
  const factsHeader = page.getByRole('button', { name: factsLabel }).first();
  await expect(factsHeader).toBeVisible({ timeout: 30_000 });
  await factsHeader.click();
  const row = page.locator(`[data-local-info-row="${slotId}"]:visible`);
  await expect(row).toBeVisible();
  await row.locator('button').first().click();
  const tierHost = row.locator('[data-fact-freshness-tier]').first();
  await expect(tierHost).toHaveAttribute('data-fact-freshness-tier', /.+/);
  return row;
}

async function clipShot(page, filename) {
  mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({
    path: join(OUT_DIR, filename),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

async function assertBand(row, tier) {
  await expect(row.locator(`[data-fact-freshness-tier="${tier}"]`).first()).toBeVisible();
  if (tier === 'fresh') {
    await expect(row.locator('[data-fact-freshness-chip]').first()).toBeVisible();
  }
  if (tier === 'warn') {
    await expect(row.locator('[data-fact-freshness-warn]').first()).toBeVisible();
    await expect(row.locator('[data-fact-mofa-link]').first()).toHaveAttribute('href', 'https://www.0404.go.kr/');
  }
  if (tier === 'hidden') {
    await expect(row.locator('[data-fact-freshness-hidden]').first()).toBeVisible();
    await expect(row.locator('[data-fact-value]')).toHaveCount(0);
    await expect(row.locator('[data-fact-consular-phone]').first()).toHaveAttribute('href', 'tel:+82232100404');
  }
}

test.describe('place local info freshness — WebKit 390 screenshots', () => {
  for (const lang of ['ko', 'en']) {
    for (const band of PARIS_BANDS) {
      test(`paris safety ${band.id} ${lang} (${band.today})`, async ({ page }) => {
        const row = await openFactRow(page, {
          slug: 'paris',
          slotId: 'safety',
          today: band.today,
          lang,
        });
        await assertBand(row, band.tier);
        await clipShot(page, `paris-safety-${band.id}-${lang}-390.png`);
      });
    }
    for (const band of CAIRO_BANDS) {
      test(`cairo safety ${band.id} ${lang} (${band.today})`, async ({ page }) => {
        const row = await openFactRow(page, {
          slug: 'cairo',
          slotId: 'safety',
          today: band.today,
          lang,
        });
        await assertBand(row, band.tier);
        await clipShot(page, `cairo-safety-${band.id}-${lang}-390.png`);
      });
    }
  }
});
