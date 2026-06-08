// E2E-1 @see plans/site-health-monitoring-plan.md Phase 2-B
import { test, expect } from '@playwright/test';

test.describe('Home', () => {
  test('E2E-1 loads globe or map container', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('#root')).toBeVisible();
    await expect(page).toHaveTitle(/Days|여행지/);

    const globeSurface = page.locator('.mapboxgl-canvas, .mapboxgl-map, canvas').first();
    await expect(globeSurface).toBeVisible({ timeout: 60_000 });
  });
});
