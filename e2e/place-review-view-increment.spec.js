/**
 * 리뷰 조회수 — 마운트 증가 금지, 더보기·?review= 딥링크만 (일반 UA, mocked Supabase).
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';
import { installNormalGateoTraffic } from './normalTrafficInit.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const REVIEW_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-review-view-increment.json'), 'utf8'),
);
const LONG_REVIEW_ID = 'e2e-review-view-long';

test.use({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
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

test.describe('Place review view increment @mocked', () => {
  let incrementRpcCalls = 0;

  test.beforeEach(async ({ context, page }) => {
    incrementRpcCalls = 0;
    await installNormalGateoTraffic(page);
    await context.route('**/rest/v1/place_reviews**', (route) => fulfillPlaceReviews(route));
    await context.route('**/rest/v1/rpc/increment_review_view**', async (route) => {
      incrementRpcCalls += 1;
      await route.fulfill({ status: 204, body: '' });
    });
  });

  test('collapsed list — 0 increment RPC', async ({ page }) => {
    await page.goto('/place/cairo/reviews?lang=ko', { waitUntil: 'domcontentloaded' });
    const card = page.locator(`[data-review-id="${LONG_REVIEW_ID}"]`);
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card.locator('[data-review-expand-toggle]')).toBeVisible();
    await page.waitForTimeout(800);
    expect(incrementRpcCalls).toBe(0);
  });

  test('expand toggle — 1 increment RPC', async ({ page }) => {
    await page.goto('/place/cairo/reviews?lang=ko', { waitUntil: 'domcontentloaded' });
    const card = page.locator(`[data-review-id="${LONG_REVIEW_ID}"]`);
    await expect(card).toBeVisible({ timeout: 60_000 });
    const expand = card.locator('[data-review-expand-toggle]');
    await expect(expand).toBeVisible();
    await expand.click();
    await expect(expand).toHaveAttribute('aria-expanded', 'true');
    await expect.poll(() => incrementRpcCalls, { timeout: 15_000 }).toBe(1);
  });

  test('?review= deep link — 1 increment RPC', async ({ page }) => {
    await page.goto(`/place/cairo/reviews?review=${LONG_REVIEW_ID}&lang=ko`, {
      waitUntil: 'domcontentloaded',
    });
    const card = page.locator(`[data-review-id="${LONG_REVIEW_ID}"]`);
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect.poll(() => incrementRpcCalls, { timeout: 15_000 }).toBe(1);
  });
});