import { test, expect } from '@playwright/test';
import {
  FESTIVAL_CHIP_MOCK_MARKER,
  installFestivalChipGeminiMock,
} from './mooni-festival-chip-mock.js';
import {
  enableMooniE2eLoggedIn,
  openFestivalMooni,
  simulateStaleSavedTripsRefresh,
  tapFestivalSightsChip,
} from './mooni-festival-chip-helpers.js';

/**
 * Requires preview built with VITE_MOONI_E2E=1 (see playwright.config.mooni-chip.js).
 * On pre-fix ChatModal (e.g. 8f6c730e): FAIL. On #431+: PASS.
 */
test.describe('festival MOONi stale savedTrips race (logged-in path)', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(600_000);

  test.beforeEach(async ({ context, page }) => {
    await enableMooniE2eLoggedIn(page);
    let tripRow = null;
    await context.route(/\/rest\/v1\/saved_trips/i, async (route) => {
      const method = route.request().method();
      if (method === 'GET') {
        const trips = tripRow ? [tripRow] : [];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          headers: { 'content-range': `0-${trips.length}/${trips.length}` },
          body: JSON.stringify(trips),
        });
        return;
      }
      if (method === 'POST') {
        const payload = route.request().postDataJSON();
        const row = Array.isArray(payload) ? payload[0] : payload;
        tripRow = {
          ...row,
          id: 'e2e-trip-stale-race',
          created_at: new Date().toISOString(),
          messages: row.messages || [],
        };
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([tripRow]),
        });
        return;
      }
      if (method === 'PATCH') {
        // Stale DB: model reply never persisted (Safari fetchData race).
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
        return;
      }
      await route.continue();
    });
    await installFestivalChipGeminiMock(context, { delayMs: 400 });
  });

  test('chip answer survives stale savedTrips refresh after model reply', async ({ page }) => {
    await openFestivalMooni(page);
    await tapFestivalSightsChip(page);

    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible({
      timeout: 120_000,
    });

    await simulateStaleSavedTripsRefresh(page);
    await page.waitForTimeout(800);

    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible();
  });
});
