// Explore sheet — mobile TOP10 chips (option C)
import { test, expect } from '@playwright/test';

test.describe('Explore trending chips', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(async ({ page }) => {
    await page.route(/\.supabase\.co/i, async (route) => {
      const req = route.request();
      if (req.method() !== 'GET' && req.method() !== 'HEAD' && req.method() !== 'OPTIONS') {
        await route.abort();
        return;
      }
      await route.continue();
    });
  });

  test('390px /explore shows trending chip row when ranking loads', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/explore');

    const row = page.getByTestId('explore-trending-chips-row');
    await expect(row).toBeVisible({ timeout: 45_000 });

    const chip = row.locator('button').first();
    await expect(chip).toBeVisible();
    await expect(chip).toContainText(/\d/);
  });
});
