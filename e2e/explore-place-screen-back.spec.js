import { test, expect } from './fixtures.js';

test.use({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});

async function openBangkokFromExplore(page) {
  await page.goto('/?lang=ko');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill('방콕');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: /방콕/ })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(page).toHaveURL(/\/place\/bangkok/, { timeout: 30_000 });
}

test.describe('explore → place screen back @regression', () => {
  test('stale blog returnTo does not block return to /explore', async ({ page }) => {
    await page.goto('/?lang=ko');
    await page.evaluate(() => {
      sessionStorage.setItem(
        'gateo:place-return-to',
        '/blog?tab=public&lang=ko&logbook_review_hub=1',
      );
    });
    await openBangkokFromExplore(page);

    const chrome = page.locator('[data-place-chrome-hit]');
    await chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i }).click();
    await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/\/$/);
    await expect(page).not.toHaveURL(/\/blog/);
  });
});