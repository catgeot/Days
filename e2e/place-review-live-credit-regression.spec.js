/**
 * Live-shaped place_reviews credit regression (read-only DB snapshot fixtures).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-live-credit-regression.json'), 'utf8'),
);

const SLOW_WALK_ID = '5f9cc144-1af2-432f-8dc9-05353bfb8bd8';
const SLOW_WALK_FIXED_ID = 'e2e-khao-lak-slow-walk-emma-fixed';
const FOOD_ID = 'bf8d3588-fbf4-4869-8ba4-52d9279cd4ff';
const COPENHAGEN_ID = 'dc2a621f-493d-438e-a4fb-f6758014dbb4';
const SEVILLE_ID = '45fcae82-f643-4155-a7d9-ea3e9f18fe70';
const REVIEWS_URL =
  '/place/khao-lak/reviews?lang=ko&logbook_review_hub=1&logbook_filter=1';

function fulfillPlaceReviews(route, rows = FIXTURE_ROWS) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = rows.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

async function openReviews(page, slug = 'khao-lak') {
  await page.goto(
  slug === 'khao-lak'
      ? REVIEWS_URL
      : `/place/${slug}/reviews?lang=ko&logbook_review_hub=1&logbook_filter=1`,
    { waitUntil: 'domcontentloaded' },
  );
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
}

test.describe('Place review live credit regression @mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test('느린산책 — no borrowed Kir Shu on 2nd thumb or lightbox 2/2', async ({ page }) => {
    await openReviews(page);
    const card = page.locator(`[data-review-id="${SLOW_WALK_ID}"]`);
    await expect(card.getByTestId('logbook-editorial-review-detail-hero-credit')).toContainText('Kir Shu');

    await card.getByRole('button', { name: '더보기', exact: true }).click();
    const galleryCredits = card.getByTestId('editorial-review-image-credit');
    await expect(galleryCredits).toHaveCount(0);

    await card.getByRole('button', { name: /review img 1/i }).click();
    const lightboxCredit = page.getByTestId('gateo-review-lightbox-credit');
    await expect(lightboxCredit).toHaveCount(0);
    await page.keyboard.press('Escape');
  });

  test('느린산책 — distinct Emma credit on 2nd asset when metadata is correct', async ({ page }) => {
    await page.unroute('**/rest/v1/place_reviews**');
    await page.route('**/rest/v1/place_reviews**', (route) => {
      const rows = FIXTURE_ROWS.filter(
        (row) => row.id !== SLOW_WALK_ID && row.id !== SLOW_WALK_FIXED_ID,
      );
      rows.push(FIXTURE_ROWS.find((r) => r.id === SLOW_WALK_FIXED_ID));
      return fulfillPlaceReviews(route, rows);
    });
    await openReviews(page);
    const card = page.locator(`[data-review-id="${SLOW_WALK_FIXED_ID}"]`);
    await card.getByRole('button', { name: '더보기', exact: true }).click();
    const credit = card.getByTestId('editorial-review-image-credit');
    await expect(credit).toHaveCount(1);
    await expect(credit).toContainText('Emma Hynnä');
    await expect(credit).not.toContainText('Kir Shu');
  });

  test('미식갑니다 — distinct credits on hero and 2nd/3rd thumbs', async ({ page }) => {
    await openReviews(page);
    const card = page.locator(`[data-review-id="${FOOD_ID}"]`);
    await expect(card.getByTestId('logbook-editorial-review-detail-hero-credit')).toContainText('Karelj');
    await card.getByRole('button', { name: '더보기', exact: true }).click();
    const credits = card.getByTestId('editorial-review-image-credit');
    await expect(credits).toHaveCount(2);
    await expect(credits.nth(0)).toContainText('Design4business');
    await expect(credits.nth(1)).toContainText('Vietnam Hidden Light');
  });

  test('코펜하겐·세비야 — Wikimedia plain credits on hero', async ({ page }) => {
    await openReviews(page, 'copenhagen');
    const cph = page.locator(`[data-review-id="${COPENHAGEN_ID}"]`);
    await expect(cph.getByTestId('logbook-editorial-review-detail-hero-credit')).toContainText(
      'Hans Christian Hansen',
    );

    await openReviews(page, 'seville');
    const sev = page.locator(`[data-review-id="${SEVILLE_ID}"]`);
    await expect(sev.getByTestId('logbook-editorial-review-detail-hero-credit')).toContainText(
      'Alberto-g-rovi',
    );
  });
});