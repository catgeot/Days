// Explore sheet — mobile TOP10 chips (option C)
import { test, expect } from './fixtures.js';

test.describe('Explore trending chips', () => {
  test.use({ ignoreHTTPSErrors: true });

  test('390px /explore shows trending chip row when ranking loads', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/explore');

    const row = page.getByTestId('explore-trending-chips-row');
    await expect(row).toBeVisible({ timeout: 45_000 });

    const chip = row.locator('button').first();
    await expect(chip).toBeVisible();
    await expect(chip).not.toHaveText('');
  });
});
