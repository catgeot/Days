import { mkdirSync } from 'node:fs';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';
import { installFestivalBackOverviewFixtures } from './festival-back-overview-fixture.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/festival-detail-reviews.json'), 'utf8'),
);

const OUT = '/opt/cursor/artifacts';
const VIEWPORT_390 = { width: 390, height: 844 };
const VIEWPORT_1280 = { width: 1280, height: 844 };
const FESTIVAL_WITH_REVIEW = '638576';
const FESTIVAL_NO_REVIEW = '637693';

test.use({
  ignoreHTTPSErrors: true,
  viewport: VIEWPORT_390,
  deviceScaleFactor: 1,
});

function fulfillPlaceReviews(route, rows = REVIEW_ROWS) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) {
    return route.continue();
  }
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = rows.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
  });
}

async function openFestival(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({ timeout: 60_000 });
  await expect(dialog.locator('[data-festival-detail-skeleton]')).toHaveCount(0, { timeout: 60_000 });
  return dialog;
}

test.describe('Korea festival detail — reviews section (WebKit)', () => {
  test.beforeAll(() => {
    mkdirSync(OUT, { recursive: true });
  });

  test.beforeEach(async ({ context }) => {
    await installFestivalBackOverviewFixtures(context);
    await context.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
    await context.route('**/rest/v1/rpc/increment_review_view**', (route) =>
      route.fulfill({ status: 204, body: '' }),
    );
  });

  test('hides reviews section when place_reviews empty', async ({ page }) => {
    const dialog = await openFestival(page, FESTIVAL_NO_REVIEW);
    await expect(dialog.locator('[data-festival-section="reviews"]')).toHaveCount(0, { timeout: 15_000 });
    await expect(dialog.locator('[data-festival-section="nearAttractions"]')).toBeVisible();
  });

  test('shows editorial review + disclosure at 390 and 1280', async ({ page }) => {
    const dialog = await openFestival(page, FESTIVAL_WITH_REVIEW);
    const section = dialog.locator('[data-festival-section="reviews"]');
    await expect(section).toBeVisible({ timeout: 20_000 });
    await expect(section.getByText(/AI 보조 작성/)).toBeVisible();
    await expect(section.getByText(/GATEO 리뷰어/)).toBeVisible();

    await page.screenshot({
      path: `${OUT}/festival-detail-review-with-disclosure-390.png`,
      clip: { x: 0, y: 0, width: VIEWPORT_390.width, height: VIEWPORT_390.height },
    });

    await page.setViewportSize(VIEWPORT_1280);
    await page.screenshot({
      path: `${OUT}/festival-detail-review-with-disclosure-1280.png`,
      clip: { x: 0, y: 0, width: VIEWPORT_1280.width, height: VIEWPORT_1280.height },
    });
  });
});
