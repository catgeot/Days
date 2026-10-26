import { test, expect, devices } from '@playwright/test';
import {
  ensureFestivalNearbyMoreButtonVisible,
  tapFestivalNearbyLoadMore,
  waitFestivalNearbyAttractionsReady,
  waitFestivalNearbyMoreButtonEnabled,
} from '../scripts/lib/festival-nearby-load-more-qa.mjs';
import {
  E2E_NEARBY_APPEND_FESTIVAL_ID,
  installFestivalNearbyLoadMoreAppendFixtures,
} from './festival-nearby-load-more-append-fixture.js';

async function nearbyRowSnapshots(page) {
  return page.evaluate(() => {
    const list = document.querySelector('[data-nearby-list]');
    if (!list) return [];
    return [...list.querySelectorAll('[data-nearby-attraction-row]')].map((el) => {
      const id = el.getAttribute('data-nearby-row-key') || '';
      const title = el.querySelector('.text-sm.font-bold')?.textContent?.trim() || '';
      const distChip = el.querySelector('.rounded-full.bg-stone-100');
      const distText = distChip?.textContent?.trim() || '';
      const m = distText.match(/([\d.]+)\s*km/i);
      return {
        id,
        title,
        distanceKm: m ? Number(m[1]) : null,
        distanceLabel: distText,
      };
    });
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

  test('더보기 keeps list prefix and appends 4 nearest-by-distance rows', async ({ page }) => {
    await page.goto(`/korea/?festival=${E2E_NEARBY_APPEND_FESTIVAL_ID}`, {
      waitUntil: 'domcontentloaded',
      timeout: 120_000,
    });
    await page.waitForSelector('#korea-festival-sheet-title', { timeout: 120_000 });
    await waitFestivalNearbyAttractionsReady(page);
    await ensureFestivalNearbyMoreButtonVisible(page);

    const before = await nearbyRowSnapshots(page);
    expect(before.length).toBe(5);

    const beforeIds = before.map((row) => row.id);

    await waitFestivalNearbyMoreButtonEnabled(page);
    await tapFestivalNearbyLoadMore(page);

    await expect
      .poll(async () => (await nearbyRowSnapshots(page)).length, { timeout: 15_000 })
      .toBe(9);

    const after = await nearbyRowSnapshots(page);
    expect(after.length).toBe(9);

    for (let i = 0; i < before.length; i += 1) {
      expect(after[i].id).toBe(beforeIds[i]);
      expect(after[i].distanceKm).toBe(before[i].distanceKm);
    }

    const appended = after.slice(before.length);
    expect(appended).toHaveLength(4);

    const newFixtureRows = appended.filter(
      (row) => row.id.startsWith('e2e-near-') && !beforeIds.includes(row.id),
    );
    expect(newFixtureRows.length).toBeGreaterThanOrEqual(3);
    expect(Number(newFixtureRows[0].id.replace('e2e-near-', ''))).toBeGreaterThanOrEqual(
      before.length + 1,
    );

    const dists = appended.map((row) => row.distanceKm).filter((n) => Number.isFinite(n));
    expect(dists).toHaveLength(4);
    for (let i = 1; i < dists.length; i += 1) {
      expect(dists[i]).toBeGreaterThanOrEqual(dists[i - 1] - 0.05);
    }
  });
});
