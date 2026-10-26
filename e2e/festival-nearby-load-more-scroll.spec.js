import { test, expect, devices } from '@playwright/test';
import {
  dispatchFestivalNearbyLoadMore,
  ensureFestivalNearbyMoreButtonVisible,
  fingerSwipeDialogDown,
  nearbyLoadMoreScrollDeltaAcceptable,
  tapFestivalNearbyLoadMore,
  waitFestivalNearbyAttractionsReady,
  waitFestivalNearbyMoreButtonEnabled,
} from '../scripts/lib/festival-nearby-load-more-qa.mjs';

const FESTIVAL_ID = process.env.FESTIVAL_NEARBY_LOAD_MORE_ID || '4133567';
const HAS_LIVE =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  !String(process.env.VITE_SUPABASE_URL).includes('example.supabase.co');

test.describe('Festival nearby load-more scroll — WebKit 390 touch', () => {
  test.skip(!HAS_LIVE, 'needs production VITE_SUPABASE_* at build time (not CI placeholder)');

  test.use({
    ...devices['iPhone 12'],
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
  });

  test('tap 더보기 ×3 keeps scrollTop within 20px after settle', async ({ page }) => {
    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
    await waitFestivalNearbyAttractionsReady(page);
    await ensureFestivalNearbyMoreButtonVisible(page);

    const dialog = page.locator('[role="dialog"]');
    for (let i = 0; i < 3; i += 1) {
      await waitFestivalNearbyMoreButtonEnabled(page);
      await ensureFestivalNearbyMoreButtonVisible(page);
      const before = await dialog.evaluate((el) => el.scrollTop);
      await tapFestivalNearbyLoadMore(page);
      await page.waitForTimeout(40);
      const afterImmediate = await dialog.evaluate((el) => el.scrollTop);
      await waitFestivalNearbyMoreButtonEnabled(page);
      await page.waitForTimeout(200);
      const afterSettle = await dialog.evaluate((el) => el.scrollTop);
      expect(nearbyLoadMoreScrollDeltaAcceptable(before, afterSettle)).toBe(true);
      expect(nearbyLoadMoreScrollDeltaAcceptable(before, afterImmediate)).toBe(true);
    }
  });

  test('user finger swipe ~300px within 0.5s after tap is not blocked by pin', async ({ page }) => {
    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
    await waitFestivalNearbyMoreButtonEnabled(page);
    await ensureFestivalNearbyMoreButtonVisible(page);

    const dialog = page.locator('[role="dialog"]');
    await tapFestivalNearbyLoadMore(page);
    await page.waitForTimeout(100);

    const beforeSwipe = await dialog.evaluate((el) => el.scrollTop);
    await fingerSwipeDialogDown(page, 300);
    await page.waitForTimeout(150);
    const afterSwipe = await dialog.evaluate((el) => el.scrollTop);
    const moved = Math.abs(afterSwipe - beforeSwipe);
    expect(moved).toBeGreaterThanOrEqual(260);
    expect(moved).toBeLessThanOrEqual(340);
  });
});

test.describe('Festival nearby load-more scroll — dispatch QA', () => {
  test.skip(!HAS_LIVE, 'needs production VITE_SUPABASE_* at build time (not CI placeholder)');

  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
  });

  test('dispatch 더보기 keeps dialog scrollTop within 20px per click', async ({ page }) => {
    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
    await waitFestivalNearbyAttractionsReady(page);

    const dialog = page.locator('[role="dialog"]');
    let clicks = 0;
    while (clicks < 16) {
      const more = page.locator('[data-festival-near-scenic-more]:not([disabled])');
      if (!(await more.count())) break;
      const before = await dialog.evaluate((el) => el.scrollTop);
      await dispatchFestivalNearbyLoadMore(page);
      await waitFestivalNearbyAttractionsReady(page);
      await page.waitForTimeout(200);
      const after = await dialog.evaluate((el) => el.scrollTop);
      expect(nearbyLoadMoreScrollDeltaAcceptable(before, after)).toBe(true);
      clicks += 1;
    }
    expect(clicks).toBeGreaterThan(1);
  });
});
