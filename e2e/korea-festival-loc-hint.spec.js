import { test, expect } from '@playwright/test';

const SUCCESS_KEY = 'korea-festival-loc-success';
const DISMISS_KEY = 'korea-festival-loc-hint-dismissed-at';

test.describe('Korea festival location hint persistence', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });

  test('recent success hides banner on reload', async ({ page }) => {
    const now = Date.now();
    await page.addInitScript(
      ({ successKey, dismissKey, at }) => {
        localStorage.setItem(
          successKey,
          JSON.stringify({ at, lat: 37.5665, lng: 126.978 }),
        );
        localStorage.removeItem(dismissKey);
      },
      { successKey: SUCCESS_KEY, dismissKey: DISMISS_KEY, at: now },
    );

    await page.goto('/korea/');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible({ timeout: 60_000 });

    await expect(
      page.getByText('위치 허용이 없어 전국 축제 리스트를 보여 드려요'),
    ).toHaveCount(0);

    await page.reload();
    await expect(
      page.getByText('위치 허용이 없어 전국 축제 리스트를 보여 드려요'),
    ).toHaveCount(0);
  });

  test('dismiss stores seven-day hide', async ({ page }) => {
    await page.goto('/korea/');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible({ timeout: 60_000 });

    const close = page
      .getByRole('button', { name: /^닫기$|^Close$/i })
      .first();
    await close.waitFor({ state: 'visible', timeout: 15_000 });
    await close.click();
    await expect(
      page.getByText('위치 허용이 없어 전국 축제 리스트를 보여 드려요'),
    ).toHaveCount(0);

    const dismissedAt = await page.evaluate((key) => localStorage.getItem(key), DISMISS_KEY);
    expect(dismissedAt).toBeTruthy();

    await page.reload();
    await expect(
      page.getByText('위치 허용이 없어 전국 축제 리스트를 보여 드려요'),
    ).toHaveCount(0);
  });
});
