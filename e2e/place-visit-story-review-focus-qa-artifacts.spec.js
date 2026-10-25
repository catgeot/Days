import { readFileSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const OUT = '/opt/cursor/artifacts';
const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-visit-story-reviews.json'), 'utf8'),
);
const FOCUS_ID = 'e2e-visit-story-review-focus';

test.use({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});

function makePlaceReviewsRouter(getDelayMs) {
  return async (route) => {
    const url = new URL(route.request().url());
    if (!url.pathname.includes('/rest/v1/place_reviews')) {
      await route.continue();
      return;
    }
    const slugParam = url.searchParams.get('place_slug');
    const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
    const filtered = REVIEW_ROWS.filter((row) => row.place_slug === slug);
    const body = JSON.stringify(filtered);
    const delayMs = getDelayMs();
    if (delayMs > 0) {
      await new Promise((resolve) => {
        setTimeout(resolve, delayMs);
      });
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body,
    });
  };
}

async function shot(page, name) {
  await page.screenshot({
    path: join(OUT, name),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

async function openCairoFromSearch(page) {
  await page.goto('/?lang=ko');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill('카이로');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: '카이로여행지' })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
}

async function tapVisitStoryFocusReview(page) {
  const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
  await expect(storiesHeader).toBeVisible({ timeout: 30_000 });
  await storiesHeader.click();
  const focusStory = page
    .locator('[data-visit-story-kind="review"]')
    .filter({ hasText: 'E2E visit story — target review' })
    .first();
  await expect(focusStory).toBeVisible({ timeout: 20_000 });
  await focusStory.click();
}

test.describe('place visit story review focus — WebKit 390 QA artifacts', () => {
  test('capture a–d screenshots', async ({ page }) => {
    await mkdir(OUT, { recursive: true });

    const reviewDelayMs = { value: 0 };
    await page.route('**/rest/v1/place_reviews**', makePlaceReviewsRouter(() => reviewDelayMs.value));

    reviewDelayMs.value = 0;
    await openCairoFromSearch(page);
    await tapVisitStoryFocusReview(page);
    await expect(page).toHaveURL(new RegExp(`review=${FOCUS_ID}`), { timeout: 30_000 });
    await expect(page.locator(`#place-review-${FOCUS_ID}`)).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => {
      return page.evaluate(() => {
        const card = document.getElementById('place-review-e2e-visit-story-review-focus');
        const root = document.querySelector('[data-place-reviews-scroll-root]');
        if (!card || !root) return false;
        const rootRect = root.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        return cardRect.bottom > rootRect.top + 12 && cardRect.top < rootRect.bottom - 32;
      });
    }, { timeout: 12_000 }).toBe(true);
    await page.waitForTimeout(400);
    await shot(page, 'place-review-focus-a-normal-jump-390.png');

    reviewDelayMs.value = 2000;
    await openCairoFromSearch(page);
    await tapVisitStoryFocusReview(page);
    await expect(page.locator(`#place-review-${FOCUS_ID}`)).toBeVisible({ timeout: 30_000 });
    await page.waitForTimeout(500);
    await shot(page, 'place-review-focus-b-slow-loading-390.png');

    reviewDelayMs.value = 0;
    await page.goto('/place/cairo/reviews?review=e2e-unknown-review-id&lang=ko', {
      waitUntil: 'domcontentloaded',
    });
    const root = page.locator('[data-place-reviews-scroll-root]');
    await expect(root).toBeVisible({ timeout: 30_000 });
    await root.evaluate((el) => {
      el.scrollTop = 240;
    });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    await page.waitForTimeout(400);
    await shot(page, 'place-review-focus-c-unknown-id-390.png');

    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await page.getByRole('button', { name: /다녀온 이야기/ }).first().click();
    await gallery.evaluate((el) => {
      el.scrollTop = 340;
    });
    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expect(page.locator(`#place-review-${FOCUS_ID}`)).toBeVisible({ timeout: 30_000 });
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    await page.goBack();
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 12_000 })
      .toBeGreaterThan(250);
    await page.waitForTimeout(500);
    await shot(page, 'place-review-focus-d-back-gallery-scroll-390.png');
  });
});
