// Smoke Health — fast prod page liveness (Playwright + read-only guard)
import { test, expect } from './fixtures.js';

test.describe('Smoke Health pages', () => {
  test('home — mapbox globe renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#root')).toBeVisible();
    await expect(page.locator('.mapboxgl-map, .mapboxgl-canvas').first()).toBeVisible({
      timeout: 90_000,
    });
  });

  test('place — /place/paris PlaceCard title', async ({ page }) => {
    await page.goto('/place/paris');
    await expect(page.getByRole('button', { name: '파리' }).first()).toBeVisible({
      timeout: 60_000,
    });
  });

  test('korea — festival list loads', async ({ page }) => {
    await page.goto('/korea/');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible({ timeout: 60_000 });
    const cards = page
      .getByRole('main')
      .getByRole('button')
      .filter({ has: page.locator('img[alt]') });
    await expect(cards.first()).toBeVisible({ timeout: 90_000 });
  });
});
