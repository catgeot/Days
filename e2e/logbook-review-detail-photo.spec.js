import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/logbook-review-detail-photo-reviews.json'), 'utf8'),
);

const HUB_PATH =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=domestic';
const HWASEONG_REVIEW_ID = 'a9e7d546-7b70-47ce-bea1-362f36d12156';
const NO_PHOTO_ID = 'e2e-hwaseong-no-photo';

function fulfillPlaceReviews(route, rows = REVIEW_ROWS) {
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

async function openHub(page) {
  await page.goto(HUB_PATH, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 30_000 });
}

async function assertHubCardTwoLines(page) {
  const item = page.getByTestId('logbook-official-review-hub-item').first();
  await expect(item).toBeVisible();
  await expect(item.getByTestId('logbook-official-review-hub-card-summary')).toHaveCount(0);
  const textRows = await item.evaluate((el) => {
    const body = el.querySelector('.flex.min-w-0.flex-1');
    if (!body) return null;
  const kids = [...body.children].filter((node) => node.getBoundingClientRect().height > 0);
    return kids.length;
  });
  expect(textRows).toBeLessThanOrEqual(2);
}

test.describe('LogBook review detail photo @mocked', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test('390 WebKit — hub card 2 lines + review detail hero', async ({ page }) => {
    test.skip(!test.info().project.name.includes('webkit'), 'WebKit matrix row');
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    await assertHubCardTwoLines(page);

    const card = page.locator(
      `[data-testid="logbook-official-review-hub-item"][data-review-id="${HWASEONG_REVIEW_ID}"]`,
    );
    await expect(card).toBeVisible();
    await card.tap();
    await page.waitForURL(new RegExp(`/place/hwaseong-fortress/reviews.*review=${HWASEONG_REVIEW_ID}`), {
      timeout: 60_000,
    });
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });

    const reviewCard = page.locator(`[data-review-id="${HWASEONG_REVIEW_ID}"]`);
    const hero = reviewCard.getByTestId('logbook-editorial-review-detail-hero');
    await expect(hero).toBeVisible();
    const photo = reviewCard.getByTestId('logbook-editorial-review-detail-hero-photo');
    const fallback = reviewCard.getByTestId('logbook-editorial-review-detail-hero-fallback');
    await expect
      .poll(async () => (await photo.isVisible()) || (await fallback.isVisible()))
      .toBeTruthy();

    const credit = reviewCard.getByTestId('logbook-editorial-review-detail-hero-credit');
    await expect(credit).toBeVisible();
    const creditBox = await credit.boundingBox();
    const heroBox = await hero.boundingBox();
    expect(creditBox && heroBox).toBeTruthy();
    expect(creditBox.y).toBeGreaterThan(heroBox.y);

    await expect(reviewCard.locator('p:has-text("Photo by")')).toHaveCount(1);
  });

  test('1280 Chromium — hero layout + no-photo fallback', async ({ page }) => {
    test.skip(!test.info().project.name.includes('1280'), '1280 Chromium matrix row');
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHub(page);
    await assertHubCardTwoLines(page);

    const noPhotoUrl = `/place/hwaseong-fortress/reviews?review=${NO_PHOTO_ID}&logbook_review_hub=1&logbook_filter=1`;
    await page.goto(noPhotoUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
    const noPhotoCard = page.locator(`[data-review-id="${NO_PHOTO_ID}"]`);
    await expect(noPhotoCard.getByTestId('logbook-editorial-review-detail-hero')).toBeVisible();
    await expect(noPhotoCard.getByTestId('logbook-editorial-review-detail-hero-fallback')).toBeVisible();
    await expect(noPhotoCard.getByTestId('logbook-editorial-review-detail-hero-photo')).toHaveCount(0);

    await page.goto(
      `/place/hwaseong-fortress/reviews?review=${HWASEONG_REVIEW_ID}&logbook_review_hub=1&logbook_filter=1`,
      { waitUntil: 'domcontentloaded' },
    );
    const hwaseongCard = page.locator(`[data-review-id="${HWASEONG_REVIEW_ID}"]`);
    await expect(hwaseongCard.getByTestId('logbook-editorial-review-detail-hero')).toBeVisible({
      timeout: 60_000,
    });
    await expect
      .poll(
        async () =>
          (await hwaseongCard.getByTestId('logbook-editorial-review-detail-hero-photo').isVisible()) ||
          (await hwaseongCard.getByTestId('logbook-editorial-review-detail-hero-fallback').isVisible()),
        { timeout: 60_000 },
      )
      .toBeTruthy();
    const layout = await hwaseongCard.getByTestId('logbook-editorial-review-detail-hero').evaluate((el) => {
      const row = el.querySelector('.md\\:flex-row');
      if (!row) return null;
      const kids = [...row.children];
      const rects = kids.map((c) => c.getBoundingClientRect());
      if (rects.length < 2) return null;
      return { sideBySide: rects[0].top === rects[1].top, photoLeft: rects[0].x < rects[1].x };
    });
    expect(layout?.sideBySide).toBe(true);
    expect(layout?.photoLeft).toBe(true);
  });

  test('1280 EN — hub card copy without missing keys', async ({ page }) => {
    test.skip(!test.info().project.name.includes('1280'), '1280 Chromium matrix row');
    await page.goto(
      '/blog?tab=public&lang=en&logbook_review_hub=1&logbook_filter=1&region=overseas',
      { waitUntil: 'domcontentloaded' },
    );
    await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
    await page.getByTestId('logbook-official-review-hub-toggle').click();
    const toggleText = await page.getByTestId('logbook-official-review-hub-toggle').innerText();
    expect(toggleText).toMatch(/GATEO reviewer reviews/i);
    const err = page.locator('text=/missing.*translation|i18n key/i');
    await expect(err).toHaveCount(0);
  });
});