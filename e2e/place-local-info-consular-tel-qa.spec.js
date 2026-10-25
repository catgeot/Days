import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';

const OUT_DIR = process.env.CONSULAR_TEL_SHOT_DIR || '/opt/cursor/artifacts/local-info-consular-tel';

async function injectToday(page, today) {
  await page.addInitScript((injectedToday) => {
    globalThis.__GATEO_FRESHNESS_TODAY__ = injectedToday;
  }, today);
}

async function openLocalInfoGallery(page, slug, { today, lang = 'ko' } = {}) {
  if (today) await injectToday(page, today);
  const placeLabel = lang === 'en'
    ? (slug === 'paris' ? 'Paris' : 'Cairo')
    : (slug === 'paris' ? '파리' : '카이로');
  await page.goto(`/place/${slug}?lang=${lang}`);
  await expect(page.getByText(placeLabel).first()).toBeVisible({ timeout: 60_000 });
  const factsLabel = lang === 'en' ? /Local info/i : /현지 정보/;
  const factsHeader = page.getByRole('button', { name: factsLabel }).first();
  await expect(factsHeader).toBeVisible({ timeout: 30_000 });
  await factsHeader.click();
  const gallery = page.locator('[data-local-info="gallery"]:visible').first();
  await expect(gallery).toBeVisible();
  return gallery;
}

async function clipShot(page, filename, width, height = 900) {
  mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({
    path: join(OUT_DIR, filename),
    clip: { x: 0, y: 0, width, height },
  });
}

test.describe('consular tel QA @desktop', () => {
  test.use({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });

  for (const slug of ['cairo', 'paris']) {
    test(`${slug} local-info gallery 1280`, async ({ page }) => {
      const gallery = await openLocalInfoGallery(page, slug, { today: '2026-10-25' });
      const safetyRow = gallery.locator('[data-local-info-row="safety"]:visible');
      await expect(safetyRow).toBeVisible();
      await safetyRow.locator('button').first().click();
      await expect(safetyRow.locator('[data-fact-consular-phone]').first()).toHaveAttribute(
        'href',
        'tel:+82232100404',
      );
      await clipShot(page, `${slug}-local-info-gallery-1280.png`, 1280, 900);
    });
  }
});

test.describe('consular tel QA @webkit', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    ignoreHTTPSErrors: true,
  });

  test('cairo safety fresh tel link 390', async ({ page, browserName }) => {
    test.skip(browserName !== 'webkit', 'WebKit mobile capture only');
    const gallery = await openLocalInfoGallery(page, 'cairo', { today: '2026-11-10' });
    const safetyRow = gallery.locator('[data-local-info-row="safety"]:visible');
    await safetyRow.locator('button').first().click();
    await expect(safetyRow.locator('[data-fact-freshness-tier="fresh"]').first()).toBeVisible();
    const tel = safetyRow.locator('[data-fact-consular-phone]').first();
    await expect(tel).toBeVisible();
    await expect(tel).toHaveAttribute('href', 'tel:+82232100404');
    await clipShot(page, 'cairo-safety-fresh-tel-390.png', 390, 844);
  });
});
