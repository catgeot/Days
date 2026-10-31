// Explore v2 step 1 — monthly picks row (flag off = legacy /explore unchanged)
import { test, expect } from './fixtures.js';

const monthlySection = (page) => page.getByTestId('explore-v2-monthly-section');
const SCROLL_AREA = (page) => page.locator('.modal-scroll-area').first();

async function openExplore(page, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

test.describe('Explore v2 monthly picks @flagOff', () => {
  test.use({ ignoreHTTPSErrors: true });

  test('390 — legacy explore without monthly row', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expect(monthlySection(page)).toHaveCount(0);
    await expect(page.getByText('에디터스 픽').first()).toBeVisible({ timeout: 45_000 });
    const row = page.getByTestId('explore-trending-chips-row');
    await expect(row).toBeVisible({ timeout: 45_000 });
  });

  test('1280 — legacy explore without monthly row', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expect(monthlySection(page)).toHaveCount(0);
    await expect(page.getByText('에디터스 픽').first()).toBeVisible({ timeout: 45_000 });
  });
});

test.describe('Explore v2 monthly picks @flagOn', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 !== '1',
      'requires VITE_GATEO_EXPLORE_V2=1 in webServer',
    );
  });

  test('390 — six cards, sources, jeju estimate, tap navigates', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    const section = monthlySection(page);
    await expect(section).toBeVisible({ timeout: 45_000 });
    await expect(page.getByTestId('explore-v2-monthly-heading')).toContainText('11월의 여행지');
    await expect(page.getByTestId('explore-v2-monthly-heading')).toContainText('274곳 중 6곳');

    const cards = page.locator('[data-testid^="explore-v2-monthly-card-"]');
    await expect(cards).toHaveCount(6);

    for (let i = 0; i < 6; i += 1) {
      await expect(cards.nth(i).getByTestId('explore-v2-monthly-source-link').first()).toBeVisible();
    }

    const jejuCard = page.getByTestId('explore-v2-monthly-card-jeju');
    await expect(jejuCard.getByTestId('explore-v2-monthly-estimate')).toHaveText('추정');

    const scrollEl = SCROLL_AREA(page);
    const urlBefore = page.url();
    const scrollBefore = await scrollEl.evaluate((el) => el.scrollTop);
    await page.waitForTimeout(1500);
    expect(page.url()).toBe(urlBefore);
    expect(await scrollEl.evaluate((el) => el.scrollTop)).toBe(scrollBefore);

    await jejuCard.click();
    await expect(page).toHaveURL(/\/place\/jeju/, { timeout: 30_000 });
  });

  test('1280 — six cards and jeju estimate', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expect(monthlySection(page)).toBeVisible({ timeout: 45_000 });
    await expect(page.locator('[data-testid^="explore-v2-monthly-card-"]')).toHaveCount(6);
    await expect(page.getByTestId('explore-v2-monthly-card-jeju').getByTestId('explore-v2-monthly-estimate')).toBeVisible();
    await expect(page.getByText('에디터스 픽').first()).toBeVisible();
  });
});
