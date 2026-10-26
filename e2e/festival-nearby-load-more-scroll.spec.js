import { test, expect } from '@playwright/test';
import {
  dispatchFestivalNearbyLoadMore,
  nearbyLoadMoreScrollDeltaAcceptable,
  waitFestivalNearbyAttractionsReady,
} from '../scripts/lib/festival-nearby-load-more-qa.mjs';

const FESTIVAL_ID = process.env.FESTIVAL_NEARBY_LOAD_MORE_ID || '4133567';
const HAS_LIVE =
  Boolean(process.env.VITE_SUPABASE_URL) &&
  !String(process.env.VITE_SUPABASE_URL).includes('example.supabase.co');

test.describe('Festival nearby load-more scroll — WebKit 390', () => {
  test.skip(!HAS_LIVE, 'needs production VITE_SUPABASE_* at build time (not CI placeholder)');

  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
  });

  test('더보기 keeps dialog scrollTop within 20px per click', async ({ page }) => {
    await page.goto(`/korea/?festival=${FESTIVAL_ID}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
    await waitFestivalNearbyAttractionsReady(page);

    const dialog = page.locator('[role="dialog"]');
    const moreClicks = [];
    let clicks = 0;
    while (clicks < 16) {
      const more = page.locator('[data-festival-near-scenic-more]:not([disabled])');
      if (!(await more.count())) break;
      const before = await dialog.evaluate((el) => el.scrollTop);
      await dispatchFestivalNearbyLoadMore(page);
      await waitFestivalNearbyAttractionsReady(page);
      await page.waitForTimeout(200);
      const after = await dialog.evaluate((el) => el.scrollTop);
      moreClicks.push({ before, after });
      expect(nearbyLoadMoreScrollDeltaAcceptable(before, after)).toBe(true);
      clicks += 1;
    }
    expect(moreClicks.length).toBeGreaterThan(1);
  });
});
