import { test, expect } from '@playwright/test';

const SIDEBAR_W = 256;

async function readDesktopSidebarMetrics(page) {
  return page.evaluate(() => {
    const sidebar = document.querySelector('[data-testid="logbook-desktop-sidebar"]');
    const main = document.querySelector('[data-logbook-main-scroll]');
    const photo = document.querySelector('[data-testid="logbook-sidebar-profile-photo"]');
    const sidebarRect = sidebar?.getBoundingClientRect();
    const mainRect = main?.getBoundingClientRect();
    const photoRect = photo?.getBoundingClientRect();
    return {
      sidebarWidth: sidebarRect?.width ?? 0,
      gap: sidebarRect && mainRect ? mainRect.left - sidebarRect.right : null,
      photoRatio:
        photoRect && photoRect.height > 0 ? photoRect.width / photoRect.height : null,
    };
  });
}

for (const width of [1024, 1280, 1440]) {
  test.describe(`logbook desktop sidebar layout @${width}`, () => {
    test.use({ viewport: { width, height: 900 } });

    test('sidebar stays 256px flush with main column', async ({ page }) => {
      await page.goto('/blog?tab=public&lang=ko', { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1500);
      const metrics = await readDesktopSidebarMetrics(page);
      expect(metrics.sidebarWidth).toBeGreaterThan(SIDEBAR_W - 2);
      expect(metrics.sidebarWidth).toBeLessThan(SIDEBAR_W + 2);
      expect(metrics.gap).not.toBeNull();
      expect(Math.abs(metrics.gap)).toBeLessThan(1.5);
    });
  });
}

test.describe('logbook mobile sidebar layout @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });

  test('desktop sidebar is hidden on mobile', async ({ page }) => {
    await page.goto('/blog?tab=public&lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('logbook-desktop-sidebar')).toBeHidden();
  });
});