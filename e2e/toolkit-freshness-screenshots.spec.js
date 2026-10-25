import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { test, expect } from '@playwright/test';

const OUT_DIR = process.env.TOOLKIT_FRESHNESS_SHOT_DIR || '/opt/cursor/artifacts/toolkit-freshness-390';
const VIEWPORT = { width: 390, height: 844 };
const TODAY = '2026-10-25';

test.use({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
  ignoreHTTPSErrors: true,
  locale: 'ko-KR',
});

async function injectToday(page) {
  await page.addInitScript((injectedToday) => {
    globalThis.__GATEO_FRESHNESS_TODAY__ = injectedToday;
  }, TODAY);
}

async function clipShot(page, filename) {
  mkdirSync(OUT_DIR, { recursive: true });
  await page.screenshot({
    path: join(OUT_DIR, filename),
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

test.describe('toolkit freshness — WebKit 390', () => {
  test('flag ON — badges and banner', async ({ page }) => {
    await injectToday(page);
    await page.goto('/qa/toolkit-freshness');
    await expect(page.locator('[data-toolkit-freshness-fixture][data-toolkit-freshness-variant="on"]')).toBeVisible();
    await expect(page.locator('[data-toolkit-freshness-banner]')).toBeVisible();
    await expect(page.locator('[data-toolkit-freshness-badge][data-toolkit-freshness-band="fresh"]').first()).toBeVisible();
    await expect(page.locator('[data-toolkit-freshness-badge][data-toolkit-freshness-band="overdue"]').first()).toBeVisible();
    await clipShot(page, 'flag-on-badges-390.png');
  });

  test('flag ON — report form success', async ({ page }) => {
    await injectToday(page);
    await page.route('**/rest/v1/toolkit_reports**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, body: '{}' });
        return;
      }
      await route.continue();
    });
    await page.goto('/qa/toolkit-freshness');
    await page.locator('[data-toolkit-report-trigger]').first().click();
    await expect(page.locator('[data-toolkit-report-sheet]')).toBeVisible();
    await clipShot(page, 'flag-on-report-form-390.png');
    await page.getByPlaceholder(/공항 리무진/).fill('요금이 올랐어요');
    await page.getByRole('button', { name: '보내기' }).click();
    await expect(page.locator('[data-toolkit-report-status="success"]')).toBeVisible();
    await clipShot(page, 'flag-on-report-success-390.png');
  });

  test('flag ON — report submit error when table missing', async ({ page }) => {
    await injectToday(page);
    await page.route('**/rest/v1/toolkit_reports**', async (route) => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'relation does not exist' }),
        });
        return;
      }
      await route.continue();
    });
    await page.goto('/qa/toolkit-freshness');
    await page.locator('[data-toolkit-report-trigger]').first().click();
    await page.getByPlaceholder(/공항 리무진/).fill('링크가 깨졌어요');
    await page.getByRole('button', { name: '보내기' }).click();
    await expect(page.locator('[data-toolkit-report-status="error"]')).toBeVisible();
    await clipShot(page, 'flag-on-report-error-390.png');
  });

  test('flag OFF — baseline fixture without freshness chrome', async ({ page }) => {
    await injectToday(page);
    await page.goto('/qa/toolkit-freshness-baseline');
    await expect(page.locator('[data-toolkit-freshness-variant="off"]')).toBeVisible();
    await expect(page.locator('[data-toolkit-freshness-badge]')).toHaveCount(0);
    await expect(page.locator('[data-toolkit-report-trigger]')).toHaveCount(0);
    await clipShot(page, 'flag-off-unchanged-390.png');
  });
});
