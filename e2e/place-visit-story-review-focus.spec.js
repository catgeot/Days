import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-visit-story-reviews.json'), 'utf8'),
);
const FOCUS_ID = 'e2e-visit-story-review-focus';
const FOCUS_ANCHOR_ID = `place-review-${FOCUS_ID}`;

test.use({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});

function fulfillPlaceReviews(route, rows = REVIEW_ROWS, delayMs = 0) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) {
    return route.continue();
  }
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = rows.filter((row) => row.place_slug === slug);
  const body = JSON.stringify(filtered);
  if (delayMs > 0) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(route.fulfill({
          status: 200,
          contentType: 'application/json',
          body,
        }));
      }, delayMs);
    });
  }
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body,
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

async function expectReviewInScrollViewport(page) {
  await expect.poll(async () => {
    return page.evaluate(() => {
      const card = document.getElementById('place-review-e2e-visit-story-review-focus');
      const root = document.querySelector('[data-place-reviews-scroll-root]');
      if (!card || !root) return { ok: false };
      const rootRect = root.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const gapUnderHeader = cardRect.top - rootRect.top;
      const inView = cardRect.bottom > rootRect.top + 12 && cardRect.top < rootRect.bottom - 32;
      return { ok: inView, gapUnderHeader };
    });
  }, { timeout: 12_000 }).toMatchObject({ ok: true });
}

test.describe('place visit story → reviews focus (WebKit 390, fixtures)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
  });

  test('tapping a visit story review scrolls the review into view and consumes ?review=', async ({ page }) => {
    await openCairoFromSearch(page);
    await tapVisitStoryFocusReview(page);

    await expect(page).toHaveURL(new RegExp(`/place/cairo/reviews\\?review=${FOCUS_ID}`), {
      timeout: 30_000,
    });

    const reviewCard = page.locator(`#${FOCUS_ANCHOR_ID}`);
    await expect(reviewCard).toBeVisible({ timeout: 30_000 });
    await expect(reviewCard).toHaveClass(/place-review-focus-highlight/);
    await expectReviewInScrollViewport(page);

    await expect.poll(() => page.url(), { timeout: 15_000 }).toMatch(/\/place\/cairo\/reviews$/);
    await expect(page.url()).not.toContain('review=');
    await page.waitForTimeout(500);
    await expect(reviewCard).toHaveClass(/place-review-focus-highlight/);
  });

  test('slow loading still focuses after reviews arrive', async ({ page }) => {
    await page.unroute('**/rest/v1/place_reviews**');
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route, REVIEW_ROWS, 1800));

    await openCairoFromSearch(page);
    await tapVisitStoryFocusReview(page);
    await expect(page).toHaveURL(new RegExp(`review=${FOCUS_ID}`), { timeout: 30_000 });
    await expectReviewInScrollViewport(page);
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');
    await page.waitForTimeout(500);
    await expect(page.locator(`#${FOCUS_ANCHOR_ID}`)).toHaveClass(/place-review-focus-highlight/);
  });

  test('unknown review id times out without jumping to top', async ({ page }) => {
    await page.goto('/place/cairo/reviews?review=e2e-unknown-review-id&lang=ko', {
      waitUntil: 'domcontentloaded',
    });

    const root = page.locator('[data-place-reviews-scroll-root]');
    await expect(root).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('E2E padding review 1')).toBeVisible({ timeout: 30_000 });
    await root.evaluate((el) => {
      el.scrollTop = 220;
    });
    const beforeConsume = await root.evaluate((el) => el.scrollTop);
    expect(beforeConsume).toBeGreaterThan(180);

    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');

    const scrollTop = await root.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeGreaterThan(180);
    expect(scrollTop).toBe(beforeConsume);
    await expect(page.locator(`#place-review-e2e-unknown-review-id`)).toHaveCount(0);
  });

  test('user scroll during wait cancels auto-focus', async ({ page }) => {
    await page.unroute('**/rest/v1/place_reviews**');
    await page.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route, REVIEW_ROWS, 1600));

    await openCairoFromSearch(page);
    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await page.getByRole('button', { name: /다녀온 이야기/ }).first().click();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });

    await focusStory.click();
    await expect(page).toHaveURL(/\/place\/cairo\/reviews/, { timeout: 30_000 });
    const root = page.locator('[data-place-reviews-scroll-root]');
    await expect(root).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => {
      await root.evaluate((el) => {
        el.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true }));
      });
      return page.evaluate(() => {
        const card = document.getElementById('place-review-e2e-visit-story-review-focus');
        return !card?.classList.contains('place-review-focus-highlight');
      });
    }, { timeout: 4000, intervals: [120, 180, 240] }).toBe(true);

    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');

    await expect(page.getByText('E2E padding review 1')).toBeVisible({ timeout: 10_000 });

    const metrics = await page.evaluate(() => {
      const card = document.getElementById('place-review-e2e-visit-story-review-focus');
      const root = document.querySelector('[data-place-reviews-scroll-root]');
      if (!card || !root) return { scrollTop: root?.scrollTop ?? 0, highlighted: false, aligned: false };
      const rootRect = root.getBoundingClientRect();
      const cardRect = card.getBoundingClientRect();
      const aligned = Math.abs(cardRect.top - rootRect.top - 56) < 24;
      return {
        scrollTop: root.scrollTop,
        highlighted: card.classList.contains('place-review-focus-highlight'),
        aligned,
      };
    });
    expect(metrics.highlighted).toBe(false);
    expect(metrics.aligned).toBe(false);
  });

  test('browser back returns to gallery scroll position', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await storiesHeader.click();
    await gallery.evaluate((el) => {
      el.scrollTop = 320;
    });
    const before = await gallery.evaluate((el) => el.scrollTop);
    expect(before).toBeGreaterThan(250);

    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();
    await expectReviewInScrollViewport(page);
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('review=');

    await page.goBack();
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/reviews/);
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await expect.poll(async () => gallery.evaluate((el) => el.scrollTop), { timeout: 12_000 })
      .toBeGreaterThan(250);
    const afterBack = await gallery.evaluate((el) => el.scrollTop);
    expect(afterBack).toBeGreaterThanOrEqual(before - 8);
  });

  test('PUSH navigation does not apply armed gallery back scroll', async ({ page }) => {
    await openCairoFromSearch(page);
    const gallery = page.locator('[data-place-gallery-scroll]');
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    await gallery.evaluate((el) => {
      el.scrollTop = 300;
    });
    await page.evaluate(() => {
      sessionStorage.setItem('gateo:place-gallery-back-scroll:cairo', '300');
      sessionStorage.setItem('gateo:place-gallery-back-armed:cairo', '1');
    });
    await page.goto('/place/cairo?lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(gallery).toBeVisible({ timeout: 30_000 });
    const scrollTop = await gallery.evaluate((el) => el.scrollTop);
    expect(scrollTop).toBeLessThan(40);
  });
});
