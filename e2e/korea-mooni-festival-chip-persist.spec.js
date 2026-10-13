import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  FESTIVAL_CHIP_MOCK_MARKER,
  installFestivalChipGeminiMock,
} from './mooni-festival-chip-mock.js';
import {
  clearFestivalListSessionCache,
  openFestivalMooni,
  tapFestivalSightsChip,
} from './mooni-festival-chip-helpers.js';
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';

const OUT_DIR =
  process.env.MOONI_CHIP_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-mooni-festival-chip-persist';

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

/**
 * gemini-proxy is route-mocked (festival_sights-shaped reply) — local preview cannot call prod Edge without Origin/CORS.
 */
test.describe('festival MOONi chip reply persists @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(300_000);

  test.beforeEach(async ({ context, page }, testInfo) => {
    await clearFestivalListSessionCache(page);
    if (testInfo.project.name === 'chromium-mobile') {
      process.env.MOONI_TOURAPI_STUB_ONLY = '1';
      await installFestivalTourApiFixtures(context);
    }
    await installFestivalChipGeminiMock(context, { delayMs: 200 });
  });

  test('2989642 — mock chip answer visible at 1s and 12s (WebKit evidence)', async ({
    page,
  }, testInfo) => {
    const tag = testInfo.project.name.replace(/[^a-z0-9-]+/gi, '-');
    await openFestivalMooni(page);
    await shot(page, `${tag}-00-open`);

    await tapFestivalSightsChip(page);
    await expect(page.getByText('볼거리·분위기 알려 줘')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('데이터에 없는 붐비는 시간은 지어내지 마')).toHaveCount(0);
    await shot(page, `${tag}-00b-chip-bubble`);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible({
      timeout: 120_000,
    });
    await page.waitForTimeout(1000);
    await shot(page, `${tag}-01-answer-1s`);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible();

    await page.waitForTimeout(11_000);
    await shot(page, `${tag}-02-answer-12s`);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible();
  });
});
