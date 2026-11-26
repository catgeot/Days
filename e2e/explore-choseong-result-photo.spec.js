import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';
import { installExploreMapboxGosansaMock } from './explore-mapbox-gosansa-mock.js';

const CHOSEONG = 'ㅅㅇ';
const OUT_DIR = '/opt/cursor/artifacts/explore-choseong-result-photo';

async function boot(context) {
  await installExploreGeminiMock(context);
  await installExploreTourapiMock(context);
  await installExploreMapboxGosansaMock(context);
}

async function countResultCardPhotos(page) {
  return page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll('[data-search-result-card]'));
    let withPhoto = 0;
    let empty = 0;
    for (const card of cards) {
      const img = card.querySelector('img[src]');
      const emptyMark = card.querySelector('[data-search-thumb-empty="gradient"]');
      if (img && img.complete && img.naturalWidth > 0) withPhoto += 1;
      else if (emptyMark) empty += 1;
    }
    return { total: cards.length, withPhoto, empty };
  });
}

for (const viewport of [
  { width: 390, height: 844, label: '390' },
  { width: 1280, height: 800, label: '1280' },
]) {
  test(`ㅅㅇ Enter result cards show hub-linked photos @${viewport.label}`, async ({ page, context }) => {
    mkdirSync(OUT_DIR, { recursive: true });
    await boot(context);
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/explore?lang=ko');
    const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
    await expect(input).toBeVisible({ timeout: 60_000 });
    await input.fill(CHOSEONG);
    await input.press('Enter');
    await expect(page.locator('[data-search-result-card]').first()).toBeVisible({ timeout: 30_000 });
    const seoulCard = page
      .locator('[data-search-result-card][data-search-result-name="서울"]')
      .first();
    await expect(seoulCard).toBeVisible();
    const seoulImg = seoulCard.locator('img[src]').first();
    await expect(seoulImg).toBeVisible({ timeout: 25_000 });
    await expect
      .poll(
        async () =>
          seoulImg.evaluate((img) => Boolean(img.complete && img.naturalWidth > 0)),
        { timeout: 25_000 },
      )
      .toBe(true);
    await expect(seoulCard.locator('[data-search-thumb-empty="gradient"]')).toHaveCount(0);
    const counts = await countResultCardPhotos(page);
    await page.screenshot({
      path: join(OUT_DIR, `choseong-results-${viewport.label}.png`),
      clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
    });
    await test.info().attach(`choseong-photo-counts-${viewport.label}.json`, {
      body: JSON.stringify(counts),
      contentType: 'application/json',
    });
    expect(counts.withPhoto).toBeGreaterThanOrEqual(1);
  });
}