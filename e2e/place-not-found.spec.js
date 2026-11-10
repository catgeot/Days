import { test, expect } from '@playwright/test';

test.describe('place not found', () => {
  test('missing slug stays on URL with not-found UI (ko)', async ({ page }) => {
    await page.goto('/place/not-a-real-slug?lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/place\/not-a-real-slug/);
    const panel = page.getByTestId('place-not-found');
    await expect(panel).toBeVisible({ timeout: 15_000 });
    await expect(panel.getByText('찾는 여행지가 없어요')).toBeVisible();
    await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
  });

  test('real place does not show not-found', async ({ page }) => {
    await page.goto('/place/paris?lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/place\/paris/);
    await expect(page.getByTestId('place-not-found')).toHaveCount(0);
    await expect(page.getByText('파리', { exact: false }).first()).toBeVisible({ timeout: 30_000 });
  });

  test('editorial logbook route unaffected', async ({ page }) => {
    await page.goto('/blog/e/not-a-real-slug?lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/blog\/e\/not-a-real-slug/);
    await expect(page.getByTestId('place-not-found')).toHaveCount(0);
  });
});
