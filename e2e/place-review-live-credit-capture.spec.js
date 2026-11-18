/** Evidence — live regression mock, non-CI */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const OUT = '/opt/cursor/artifacts';
const FIXTURE_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-live-credit-regression.json'), 'utf8'),
);
const SLOW_WALK_ID = '5f9cc144-1af2-432f-8dc9-05353bfb8bd8';
const REVIEWS_URL =
  '/place/khao-lak/reviews?lang=ko&logbook_review_hub=1&logbook_filter=1';

function fulfillPlaceReviews(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) return route.continue();
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(FIXTURE_ROWS.filter((row) => row.place_slug === slug)),
  });
}

test('capture live regression slow-walk credits 390+1280', async ({ page }) => {
  test.skip(Boolean(process.env.CI), 'local capture only');
  await page.route('**/rest/v1/place_reviews**', fulfillPlaceReviews);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(REVIEWS_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  const card = page.locator(`[data-review-id="${SLOW_WALK_ID}"]`);
  await card.getByRole('button', { name: '더보기', exact: true }).click();
  await page.screenshot({
    path: join(OUT, 'review-live-slow-walk-credits-390x844.png'),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });

  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(REVIEWS_URL, { waitUntil: 'domcontentloaded' });
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  const cardWide = page.locator(`[data-review-id="${SLOW_WALK_ID}"]`);
  await cardWide.getByRole('button', { name: '더보기', exact: true }).click();
  await page.screenshot({
    path: join(OUT, 'review-live-slow-walk-credits-1280x800.png'),
    clip: { x: 0, y: 0, width: 1280, height: 800 },
  });
});