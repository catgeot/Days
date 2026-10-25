import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const HUB_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/logbook-official-review-hub-index.json'), 'utf8'),
);
const JEJU_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/logbook-jeju-place-reviews.json'), 'utf8'),
);

const FOCUS_ID = 'e2e-logbook-hub-jeju-editorial';
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
  if (url.searchParams.get('is_editorial') === 'eq.true') {
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(HUB_ROWS),
    });
  }
  const slugParam = url.searchParams.get('place_slug');
  const slug = slugParam ? slugParam.replace(/^eq\./, '') : '';
  if (slug === 'jeju') {
    const sorted = [...JEJU_ROWS].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(sorted),
    });
  }
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify([]),
  });
}

async function waitForPublicFeed(page) {
  await page.waitForFunction(
    () => {
      const text = document.body?.innerText || '';
      if (/동기화하는 중/.test(text)) return false;
      return /공개 피드|피드|Public LogBook|기록/.test(text);
    },
    null,
    { timeout: 90_000 },
  );
}

async function measureReviewFocusMetrics(page, reviewId = FOCUS_ID) {
  return page.evaluate((id) => {
    const root = document.querySelector('[data-place-reviews-scroll-root]');
    const card =
      document.getElementById(`place-review-${id}`) ||
      document.querySelector(`[data-review-id="${id}"]`);
    if (!root || !card) {
      return { ok: false, reason: 'missing-root-or-card' };
    }
    const rootRect = root.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const chromeNodes = root.querySelectorAll('[data-place-reviews-scroll-chrome]');
    let chromeBottom = rootRect.top;
    chromeNodes.forEach((node) => {
      chromeBottom = Math.max(chromeBottom, node.getBoundingClientRect().bottom);
    });
    const gapUnderChrome = cardRect.top - chromeBottom;
    return {
      ok: true,
      gapUnderChrome,
      highlighted:
        card.classList.contains('place-review-focus-highlight') ||
        card.classList.contains('place-review-focus-highlight-static'),
      scrollTop: root.scrollTop,
    };
  }, reviewId);
}

test.describe('logbook official review hub (WebKit 390, flag ON fixtures)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/place_reviews**', fulfillPlaceReviews);
    await page.route('**/rest/v1/reports**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' }),
    );
  });

  test('hub tap opens LogBook review; back restores hub; place CTA aligns; direct ?review=', async ({
    page,
  }) => {
    await page.goto('/blog?tab=public&lang=ko', { waitUntil: 'domcontentloaded' });
    await waitForPublicFeed(page);

    const hub = page.getByTestId('logbook-official-review-hub');
    await expect(hub).toBeVisible({ timeout: 60_000 });

    await hub.getByTestId('logbook-official-review-hub-toggle').click();
    await expect(page.getByTestId('logbook-official-review-hub-panel')).toBeVisible();

    const moreBtn = page.getByTestId('logbook-official-review-hub-more');
    if (HUB_ROWS.length > 10) {
      await expect(moreBtn).toBeVisible();
      const moreBox = await moreBtn.boundingBox();
      expect(moreBox?.height ?? 0).toBeGreaterThanOrEqual(44);
    }

    const hubItem = page.locator('[data-testid="logbook-official-review-hub-item"]').first();
    await expect(hubItem).toBeVisible();
    await hubItem.click();

    await expect(page).toHaveURL(
      new RegExp(`/blog\\?.*tab=public.*review=${FOCUS_ID}`),
      { timeout: 30_000 },
    );
    await expect(page.getByTestId('logbook-official-review-hub-detail')).toBeVisible();
    await expect(page.getByTestId('logbook-official-review-hub-go-place-card')).toBeVisible();
    await expect(page.getByTestId('logbook-official-review-hub-editorial-notice')).toBeVisible();

    await page.getByTestId('logbook-official-review-hub-detail-back').click();
    await expect(page).toHaveURL(/\/blog\?tab=public/, { timeout: 30_000 });
    await expect(page.url()).not.toContain(`review=${FOCUS_ID}`);
    await expect(page.getByTestId('logbook-official-review-hub-panel')).toBeVisible({
      timeout: 15_000,
    });

    await hubItem.click();
    await expect(page.getByTestId('logbook-official-review-hub-detail')).toBeVisible();
    await page.getByTestId('logbook-official-review-hub-go-place-card').click();

    await expect(page).toHaveURL(
      new RegExp(`/place/jeju/reviews\\?review=${FOCUS_ID}`),
      { timeout: 30_000 },
    );

    const reviewCard = page.locator(`#${FOCUS_ANCHOR_ID}`);
    await expect(reviewCard).toBeVisible({ timeout: 30_000 });

    await expect
      .poll(() => measureReviewFocusMetrics(page), { timeout: 15_000 })
      .toMatchObject({ ok: true, highlighted: true });
    await expect
      .poll(async () => (await measureReviewFocusMetrics(page)).gapUnderChrome, { timeout: 15_000 })
      .toBeLessThanOrEqual(8);

    await page.goto(`/place/jeju/reviews?review=${FOCUS_ID}&lang=ko`, {
      waitUntil: 'domcontentloaded',
    });
    await expect(reviewCard).toBeVisible({ timeout: 30_000 });
    await expect
      .poll(() => measureReviewFocusMetrics(page), { timeout: 15_000 })
      .toMatchObject({ ok: true, highlighted: true });
    await expect
      .poll(async () => (await measureReviewFocusMetrics(page)).gapUnderChrome, { timeout: 15_000 })
      .toBeLessThanOrEqual(8);
  });
});
