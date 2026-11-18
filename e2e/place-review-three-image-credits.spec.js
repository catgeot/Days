/**
 * Editorial place reviews — per-image credit (hero + inline + gallery thumb + lightbox).
 * Mocked place_reviews only.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-three-image-credits.json'), 'utf8'),
);

const THREE_PHOTO_ID = 'e2e-khao-lak-three-photos';
const FOOD_THUMBS_ID = 'e2e-khao-lak-food-thumbs';
const FIRST_IMAGE_CREDIT = 'ⓒ한국관광공사-송재근 / 포토코리아 · 공공누리 제1유형';
const REVIEWS_URL =
  '/place/khao-lak/reviews?lang=ko&logbook_review_hub=1&logbook_filter=1';

function fulfillPlaceReviews(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = FIXTURE_ROWS.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

async function openReviews(page) {
  await page.goto(REVIEWS_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
}

test.describe('Place review per-image credits @mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test('all three inline credits when expanded (hub detail layout)', async ({ page }) => {
    await openReviews(page);
    const card = page.locator(`[data-review-id="${THREE_PHOTO_ID}"]`);
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card.getByTestId('logbook-editorial-review-detail-hero')).toBeVisible();

    await card.getByRole('button', { name: '더보기', exact: true }).click();
    await expect(card.getByTestId('logbook-editorial-review-detail-hero-credit')).toContainText(
      '한국관광공사',
    );
    await expect(card.getByTestId('logbook-editorial-review-detail-hero-note')).toHaveCount(0);
    await expect(card.getByTestId('editorial-review-image-note')).toHaveCount(1);
    await expect(card.getByText(FIRST_IMAGE_CREDIT, { exact: true })).toHaveCount(1);

    const credits = card.getByTestId('editorial-review-image-credit');
    await expect(credits).toHaveCount(2);
    await expect(credits.nth(0)).toContainText('문화재청');
    await expect(credits.nth(1)).toContainText('Himmel S');
    await expect(credits.nth(1).getByRole('link', { name: 'Unsplash' })).toBeVisible();
  });

  test('lightbox shows credit for second and third slides', async ({ page }) => {
    await openReviews(page);
    const card = page.locator(`[data-review-id="${THREE_PHOTO_ID}"]`);
    await card.getByRole('button', { name: '더보기', exact: true }).click();
    await card.getByRole('button', { name: /review img 0/i }).click();

    const lightboxCredit = page.getByTestId('gateo-review-lightbox-credit');
    await expect(lightboxCredit).toBeVisible();
    await expect(lightboxCredit).toContainText('한국관광공사');

    await page.keyboard.press('ArrowRight');
    await expect(lightboxCredit).toContainText('문화재청');

    await page.keyboard.press('ArrowRight');
    await expect(lightboxCredit).toContainText('Himmel S');
    await expect(page.getByTestId('gateo-review-lightbox-note')).toContainText('텔레포트를 믿으며');
  });

  test('hero and lightbox show human photo note', async ({ page }) => {
    await openReviews(page);
    const card = page.locator(`[data-review-id="${FOOD_THUMBS_ID}"]`);
    await card.getByRole('button', { name: '더보기', exact: true }).click();
    await expect(card.getByTestId('editorial-review-image-note').first()).toContainText(
      '방니앙 시장 촬영 아님',
    );
    await card.getByRole('button', { name: /review img 1/i }).click();
    await expect(page.getByTestId('gateo-review-lightbox-note')).toContainText('방니앙 시장');
  });

  test('collapsed gallery thumbs each show credit line', async ({ page }) => {
    await openReviews(page);
    const card = page.locator(`[data-review-id="${FOOD_THUMBS_ID}"]`);
    await expect(card).toBeVisible({ timeout: 60_000 });

    await card.getByRole('button', { name: '더보기', exact: true }).click();
    const credits = card.getByTestId('editorial-review-image-credit');
    await expect(credits).toHaveCount(3);
    await expect(credits.nth(0)).toContainText('Red Shuheart');
    await expect(credits.nth(1)).toContainText('생선구이');
    await expect(credits.nth(2)).toContainText('Vietnam Hidden Light');
    await expect(credits.nth(2).getByRole('link', { name: 'Pexels' })).toHaveAttribute(
      'href',
      /pexels\.com\/photo\/deliciously-braised-pork-belly/,
    );
  });
});