import { test, expect } from './fixtures.js';

test.describe('Korea scenic hidden / invalid spot URL', () => {
  test('hidden gunwi-whistle-forest replaces to scenic home', async ({ page }) => {
    await page.goto('/korea/theme/scenic?spot=gunwi-whistle-forest');
    await expect(page).toHaveURL(/\/korea\/theme\/scenic\/?(\?|$)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/spot=gunwi-whistle-forest/);
  });

  test('unknown spot replaces to scenic home', async ({ page }) => {
    await page.goto('/korea/theme/scenic?spot=zzzz-no-such-scenic-spot');
    await expect(page).toHaveURL(/\/korea\/theme\/scenic\/?(\?|$)/, { timeout: 30_000 });
    await expect(page).not.toHaveURL(/spot=zzzz-no-such-scenic-spot/);
  });
});
