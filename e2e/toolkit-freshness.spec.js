// Assert-only — opt in: TOOLKIT_FRESHNESS_E2E=1 with local Vite (DEV or VITE_GATEO_TOOLKIT_FRESHNESS=1).
// Example:
//   BROWSER=none DEV_SSL=0 VITE_GATEO_TOOLKIT_FRESHNESS=1 npx vite --host 127.0.0.1 --port 5194
//   TOOLKIT_FRESHNESS_E2E=1 PLAYWRIGHT_BASE_URL=http://127.0.0.1:5194 npx playwright test e2e/toolkit-freshness.spec.js --project=webkit

import { test, expect } from '@playwright/test';

const OPT_IN = process.env.TOOLKIT_FRESHNESS_E2E === '1';
const TODAY = '2026-10-25';

test.describe('toolkit freshness (assert-only, opt-in)', () => {
  test.skip(!OPT_IN, 'set TOOLKIT_FRESHNESS_E2E=1');

  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    locale: 'ko-KR',
  });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript((injectedToday) => {
      globalThis.__GATEO_FRESHNESS_TODAY__ = injectedToday;
    }, TODAY);
  });

  test('flag-on fixture shows freshness chrome', async ({ page }) => {
    await page.goto('/qa/toolkit-freshness');
    await expect(page.locator('[data-toolkit-freshness-fixture][data-toolkit-freshness-variant="on"]')).toBeVisible();
    await expect(page.locator('[data-toolkit-freshness-banner]')).toBeVisible();
    await expect(page.locator('[data-toolkit-freshness-badge]').first()).toBeVisible();
    await expect(page.locator('[data-toolkit-report-trigger]').first()).toBeVisible();
  });

  test('baseline fixture has no freshness chrome', async ({ page }) => {
    await page.goto('/qa/toolkit-freshness-baseline');
    await expect(page.locator('[data-toolkit-freshness-variant="off"]')).toBeVisible();
    await expect(page.locator('[data-toolkit-freshness-badge]')).toHaveCount(0);
    await expect(page.locator('[data-toolkit-report-trigger]')).toHaveCount(0);
  });

  test('report sheet success and error paths', async ({ page }) => {
    await page.goto('/qa/toolkit-freshness');
    await page.route('**/rest/v1/toolkit_reports**', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.continue();
        return;
      }
      await route.fulfill({ status: 201, body: '{}' });
    });
    await page.locator('[data-toolkit-report-trigger]').first().click();
    await page.getByPlaceholder(/공항 리무진/).fill('요금이 올랐어요');
    await page.getByRole('button', { name: '보내기' }).click();
    await expect(page.locator('[data-toolkit-report-status="success"]')).toBeVisible();

    await page.locator('[data-toolkit-report-trigger]').first().click();
    await page.unroute('**/rest/v1/toolkit_reports**');
    await page.route('**/rest/v1/toolkit_reports**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 404, contentType: 'application/json', body: '{}' });
        return;
      }
      await route.continue();
    });
    await page.getByPlaceholder(/공항 리무진/).fill('다시 시도');
    await page.getByRole('button', { name: '보내기' }).click();
    await expect(page.locator('[data-toolkit-report-status="error"]')).toBeVisible();
  });
});
