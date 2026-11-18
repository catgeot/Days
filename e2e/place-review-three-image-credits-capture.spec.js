/** Evidence screenshots — mock only, not CI-gated alone. */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = '/opt/cursor/artifacts';
const FIXTURE_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-three-image-credits.json'), 'utf8'),
);
const REVIEWS_URL =
  '/place/khao-lak/reviews?lang=ko&logbook_review_hub=1&logbook_filter=1';
const THREE_PHOTO_ID = 'e2e-khao-lak-three-photos';

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

test('capture review credits 390 and 1280', async ({ page }) => {
  test.skip(Boolean(process.env.CI), 'local capture only');
  await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(REVIEWS_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  const card = page.locator(`[data-review-id="${THREE_PHOTO_ID}"]`);
  await card.getByRole('button', { name: '더보기', exact: true }).click();
  await expect(card.getByTestId('editorial-review-image-credit')).toHaveCount(3);
  await page.screenshot({
    path: join(OUT, 'review-tab-credits-expanded-390x844.png'),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(REVIEWS_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  const cardWide = page.locator(`[data-review-id="${THREE_PHOTO_ID}"]`);
  await cardWide.getByRole('button', { name: '더보기', exact: true }).click();
  await expect(cardWide.getByTestId('editorial-review-image-credit')).toHaveCount(3);
  await page.screenshot({
    path: join(OUT, 'review-tab-credits-expanded-1280x800.png'),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });
});