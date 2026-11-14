/**
 * Poster prior-edition label — WebKit 390, mocked TourAPI (1095732-shaped).
 */
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import {
  FESTIVAL_POSTER_E2E_ID,
  buildFestivalPoster1095732Images,
  installFestivalPoster1095732Fixtures,
} from './festival-poster-1095732-fixture.js';

const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const OPEN_TIMEOUT_MS = IS_CI ? 45_000 : 90_000;

function festivalSheet(page) {
  return page.locator('[role="dialog"][aria-labelledby="korea-festival-sheet-title"]');
}

test.describe('festival poster prior edition — WebKit 390 mocked', () => {
  test.describe.configure({ timeout: IS_CI ? 120_000 : 180_000 });

  test.beforeEach(async ({ context }) => {
    await installFestivalPoster1095732Fixtures(context);
  });

  test('sheet mounts; yearless hero has no label; 2025 slide shows label in credit + lightbox', async ({
    page,
  }) => {
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
    await page.goto(`/korea/?festival=${FESTIVAL_POSTER_E2E_ID}`, {
      waitUntil: 'domcontentloaded',
    });

    const sheet = festivalSheet(page);
    await expect(sheet).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
    await expect(sheet.locator('#korea-festival-sheet-title')).toContainText('서울빛초롱축제', {
      timeout: OPEN_TIMEOUT_MS,
    });

    await expect(sheet.getByText(/청계천/)).toBeVisible({ timeout: OPEN_TIMEOUT_MS });

    const scroller = sheet.locator('[data-festival-hero-thumbs-scroller]');
    await expect(scroller).toBeVisible({ timeout: 30_000 });
    const thumbs = scroller.locator('button[role="option"]');
    await expect(thumbs).toHaveCount(4, { timeout: 30_000 });
    await expect(sheet.locator('[data-festival-hero-expand="ready"]')).toBeVisible({
      timeout: 30_000,
    });

    await expect(sheet.locator('[data-festival-prior-poster]').first()).toHaveAttribute(
      'data-festival-prior-poster',
      '0',
    );

    expect(buildFestivalPoster1095732Images().items.some((row) => /2025/.test(row.imgname))).toBe(
      true,
    );
    // common hero first, then gallery — 2025 poster is thumb index 3 (0-based)
    await thumbs.nth(3).click();
    await expect(thumbs.nth(3)).toHaveAttribute('aria-selected', 'true', { timeout: 10_000 });
    await expect(
      sheet.locator('[data-festival-prior-poster]').first(),
    ).toHaveAttribute('data-festival-prior-poster', '1', { timeout: 15_000 });

    const credit = sheet.locator('[data-festival-photo-credit]');
    await expect(credit).toBeVisible({ timeout: 20_000 });
    await expect(credit).toContainText(/예년 포스터|posterPriorEdition/i, { timeout: 5_000 });

    await sheet.getByRole('button', { name: /사진 확대보기/ }).click();
    const lightbox = page.getByRole('dialog', { name: '사진 확대보기' });
    await expect(lightbox).toBeVisible({ timeout: 15_000 });
    await expect(lightbox.locator('[data-festival-lightbox-caption]')).toContainText(
      /예년 포스터|posterPriorEdition/i,
    );
  });
});