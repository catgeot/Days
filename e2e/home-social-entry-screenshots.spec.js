import { test, expect } from './fixtures.js';

async function waitGlobe(page) {
  await expect(page.locator('.mapboxgl-canvas, canvas').first()).toBeVisible({ timeout: 120_000 });
}

async function clipShot(page, path, width) {
  await page.screenshot({
    path,
    clip: { x: 0, y: 0, width, height: 844 },
  });
}

test.describe('Home social entry screenshots', () => {
  test('home entry visible then navigates to /social', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    const slug = testInfo.project.name;

    await page.goto('/?social_links=1', { waitUntil: 'domcontentloaded' });
    await waitGlobe(page);

    const entry = page.locator('[data-testid="home-social-entry-link"]:visible').first();
    await expect(entry).toBeVisible({ timeout: 60_000 });
    await expect(entry).toHaveAttribute('href', '/social');

    await clipShot(page, `/opt/cursor/artifacts/home-social-entry-${slug}-home.png`, width);

    await entry.click();
    await expect(page).toHaveURL(/\/social/, { timeout: 30_000 });
    await expect(
      page.getByRole('heading', { name: /릴스·게시물에 나온 곳/ }),
    ).toBeVisible({ timeout: 60_000 });

    await clipShot(page, `/opt/cursor/artifacts/home-social-entry-${slug}-social.png`, width);
  });
});