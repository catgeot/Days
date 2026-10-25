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

function fulfillPlaceReviews(route) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/place_reviews')) {
    return route.continue();
  }
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  const filtered = REVIEW_ROWS.filter((row) => row.place_slug === slug);
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(filtered),
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

test.describe('place visit story → reviews focus (WebKit 390, fixtures)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', fulfillPlaceReviews);
  });

  test('tapping a visit story review scrolls the review into view', async ({ page }) => {
    await openCairoFromSearch(page);

    const storiesHeader = page.getByRole('button', { name: /다녀온 이야기/ }).first();
    await expect(storiesHeader).toBeVisible({ timeout: 30_000 });
    await storiesHeader.click();

    const focusStory = page
      .locator('[data-visit-story-kind="review"]')
      .filter({ hasText: 'E2E visit story — target review' })
      .first();
    await expect(focusStory).toBeVisible({ timeout: 20_000 });
    await focusStory.click();

    await expect(page).toHaveURL(new RegExp(`/place/cairo/reviews\\?review=${FOCUS_ID}`), {
      timeout: 30_000,
    });

    const reviewCard = page.locator(`#${FOCUS_ANCHOR_ID}`);
    await expect(reviewCard).toBeVisible({ timeout: 30_000 });
    await expect(reviewCard).toHaveClass(/place-review-focus-highlight/);

    await expect.poll(async () => {
      return page.evaluate(() => {
        const card = document.getElementById('place-review-e2e-visit-story-review-focus');
        const root = document.querySelector('[data-place-reviews-scroll-root]');
        if (!card || !root) return { ok: false, scrollTop: 0 };
        const rootRect = root.getBoundingClientRect();
        const cardRect = card.getBoundingClientRect();
        const inView = cardRect.top >= rootRect.top + 8 && cardRect.top < rootRect.bottom - 48;
        return { ok: inView, scrollTop: root.scrollTop };
      });
    }, { timeout: 8000 }).toMatchObject({ ok: true });
  });
});
