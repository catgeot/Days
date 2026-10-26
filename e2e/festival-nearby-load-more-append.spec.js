import { test, expect, devices } from '@playwright/test';
import {
  ensureFestivalNearbyMoreButtonVisible,
  tapFestivalNearbyLoadMore,
  waitFestivalNearbyAttractionsReady,
  waitFestivalNearbyMoreButtonEnabled,
} from '../scripts/lib/festival-nearby-load-more-qa.mjs';
import { analyzeNearbyRestAppend } from '../scripts/lib/festival-nearby-append-report.mjs';
import {
  E2E_NEARBY_APPEND_FESTIVAL_ID,
  installFestivalNearbyLoadMoreAppendFixtures,
} from './festival-nearby-load-more-append-fixture.js';

async function readNearbyRestQa(page) {
  return page.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"]');
    if (!sheet?.dataset?.nearbyRestJson) {
      return { rest: [], visibleCount: 5 };
    }
    return {
      rest: JSON.parse(sheet.dataset.nearbyRestJson),
      visibleCount: Number(sheet.dataset.nearbyRestVisible) || 5,
    };
  });
}

test.use({
  ...devices['iPhone 12'],
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  hasTouch: true,
  isMobile: true,
  locale: 'ko-KR',
  timezoneId: 'Asia/Seoul',
});

test.describe('Festival nearby load-more append — WebKit 390 mocked', () => {
  test.beforeEach(async ({ context }) => {
    await installFestivalNearbyLoadMoreAppendFixtures(context);
  });

  test('더보기 next-nearest: keeps rest prefix and appends 4 by distance', async ({ page }) => {
    await page.goto(`/korea/?festival=${E2E_NEARBY_APPEND_FESTIVAL_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
    await waitFestivalNearbyAttractionsReady(page);
    await ensureFestivalNearbyMoreButtonVisible(page);

    const beforeQa = await readNearbyRestQa(page);
    expect(beforeQa.rest.length).toBeGreaterThanOrEqual(5);

    await waitFestivalNearbyMoreButtonEnabled(page);
    await tapFestivalNearbyLoadMore(page);

    await page.waitForFunction(
      () => Number(document.querySelector('[role="dialog"]')?.dataset?.nearbyRestVisible || 0) >= 9,
      { timeout: 15_000 },
    );

    const afterQa = await readNearbyRestQa(page);
    const analysis = analyzeNearbyRestAppend(
      beforeQa.rest,
      afterQa.rest,
      beforeQa.visibleCount,
    );

    expect(analysis.prefixOk).toBe(true);
    expect(analysis.appendedNextNearestOk).toBe(true);
    expect(analysis.actualAppended).toHaveLength(4);
    expect(analysis.skippedNearerCandidates).toHaveLength(0);
  });
});
