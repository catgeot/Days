import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  FESTIVAL_CHIP_MOCK_MARKER,
  installFestivalChipGeminiMock,
} from './mooni-festival-chip-mock.js';
import {
  clearFestivalListSessionCache,
  enableMooniE2eLoggedIn,
  openFestivalMooni,
  simulateStaleSavedTripsRefresh,
  tapFestivalSightsChip,
} from './mooni-festival-chip-helpers.js';
import { createLoggedInSavedTripsMock } from './mooni-festival-logged-in-routes.js';

let savedTripsMock;
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';

const OUT_DIR =
  process.env.MOONI_CHIP_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-mooni-festival-chip-persist';

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  await page.screenshot({ path: join(OUT_DIR, name), fullPage: false });
}

/**
 * Run only with **pre-fix ChatModal** (origin/main / 48a3efc2 era):
 *   MOONI_CHIP_MAIN_BASELINE=1 npm run build:e2e-mooni
 *   (after scripts/swap-mooni-chatmodal-for-gate.mjs main)
 */
test.describe('festival MOONi main baseline — stale wipe proof @390', () => {
  test.skip(
    () => process.env.MOONI_CHIP_MAIN_BASELINE !== '1',
    'Set MOONI_CHIP_MAIN_BASELINE=1 with main ChatModal build',
  );

  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(300_000);

  test.beforeEach(async ({ context, page }) => {
    await clearFestivalListSessionCache(page);
    await enableMooniE2eLoggedIn(page);
    process.env.MOONI_TOURAPI_STUB_ONLY = '1';
    await installFestivalTourApiFixtures(context);
    savedTripsMock = createLoggedInSavedTripsMock({ persistPatch: false });
    await savedTripsMock.attach(context);
    await installFestivalChipGeminiMock(context, { delayMs: 400 });
  });

  test('main: chip answer visible then wiped after stale savedTrips refresh', async ({ page }) => {
    await openFestivalMooni(page);
    await tapFestivalSightsChip(page);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible({
      timeout: 120_000,
    });
    await page.waitForTimeout(1000);
    await shot(page, 'webkit-iphone-main-baseline-01-answer-1s.png');

    savedTripsMock.forceStaleUserOnlyMessages();
    await simulateStaleSavedTripsRefresh(page);
    await page.waitForTimeout(800);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toHaveCount(0, {
      timeout: 15_000,
    });
    await page.waitForTimeout(10_000);
    await shot(page, 'webkit-iphone-main-baseline-02-answer-wiped-12s.png');
  });
});
