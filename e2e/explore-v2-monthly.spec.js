// 「11월의 여행지」 — code default ON, mosaic B only, no noindex (env flag / legacy query do not change it)
import { test, expect } from './fixtures.js';

const MONTHLY_VISIBLE_COUNT = 6;
const MONTHLY_HEADING = '11월의 여행지';

const monthlySection = (page) => page.getByTestId('explore-v2-monthly-section');
const SCROLL_AREA = (page) => page.locator('.modal-scroll-area').first();

async function openExplore(page, viewport, search = '') {
  await page.setViewportSize(viewport);
  const suffix = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  await page.goto(`/explore${suffix}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

async function expectMonthlyMosaic(page) {
  const section = monthlySection(page);
  await expect(section).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(2000);
  await expect(section).not.toHaveAttribute('data-explore-v2-excluded');
  await expect(page.getByTestId('explore-v2-monthly-heading')).toHaveText(MONTHLY_HEADING);
  await expect(page.getByTestId('explore-v2-monthly-layout-b')).toBeVisible();
  await expect(page.getByTestId('explore-v2-monthly-layout-a')).toHaveCount(0);
  await expect(page.locator('[data-testid^="explore-v2-monthly-card-"]')).toHaveCount(
    MONTHLY_VISIBLE_COUNT,
  );
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(0);
  return section;
}

async function expectNoMosaicGap(page) {
  const gap = await page.getByTestId('explore-v2-monthly-layout-b').evaluate((grid) => {
    const gridRect = grid.getBoundingClientRect();
    const rows = new Map();
    for (const item of grid.children) {
      const r = item.getBoundingClientRect();
      const key = Math.round(r.top);
      rows.set(key, (rows.get(key) || 0) + r.width);
    }
    const colGap = parseFloat(getComputedStyle(grid).columnGap) || 0;
    return [...rows.values()].map((w) => gridRect.width - w).filter((d) => d > colGap + 2);
  });
  expect(gap).toEqual([]);
}

test.describe('Explore monthly picks @flagOff', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 === '1',
      'default-path tests require env flag off in webServer',
    );
  });

  test('390 — default /explore shows mosaic B, jeju estimate, tap navigates', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expectMonthlyMosaic(page);
    await expectNoMosaicGap(page);

    const items = page.locator('[data-testid^="explore-v2-monthly-item-"]');
    for (let i = 0; i < MONTHLY_VISIBLE_COUNT; i += 1) {
      await expect(items.nth(i).getByTestId('explore-v2-monthly-source-link').first()).toBeVisible();
    }

    const jejuItem = page.getByTestId('explore-v2-monthly-item-jeju');
    const jejuCard = page.getByTestId('explore-v2-monthly-card-jeju');
    await expect(jejuCard.getByTestId('explore-v2-monthly-estimate')).toHaveText('추정');

    const scrollEl = SCROLL_AREA(page);
    const urlBefore = page.url();
    const scrollBefore = await scrollEl.evaluate((el) => el.scrollTop);
    await page.waitForTimeout(1500);
    expect(page.url()).toBe(urlBefore);
    expect(await scrollEl.evaluate((el) => el.scrollTop)).toBe(scrollBefore);

    await jejuItem.scrollIntoViewIfNeeded();
    await jejuCard.click();
    await expect(page).toHaveURL(/\/place\/jeju/, { timeout: 30_000 });
  });

  test('1280 — default /explore shows mosaic B without gaps', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expectMonthlyMosaic(page);
    await expectNoMosaicGap(page);
    await expect(page.getByText('에디터스 픽').first()).toBeVisible({ timeout: 45_000 });
  });
});

test.describe('Explore monthly picks @queryOn', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 === '1',
      'legacy query path is tested with env flag off',
    );
  });

  test('390 — legacy ?explore_v2=1&layout=a still mosaic B, no noindex', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 }, 'explore_v2=1&layout=a');
    await expectMonthlyMosaic(page);
  });

  test('1280 — legacy ?explore_v2=1 still mosaic B, no noindex', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 }, 'explore_v2=1');
    await expectMonthlyMosaic(page);
  });
});

test.describe('Explore monthly picks @flagOn', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 !== '1',
      'requires VITE_GATEO_EXPLORE_V2=1 in webServer',
    );
  });

  test('390 — env flag on keeps same mosaic B', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expectMonthlyMosaic(page);
    await expectNoMosaicGap(page);
  });

  test('1280 — env flag on keeps same mosaic B and jeju estimate', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expectMonthlyMosaic(page);
    await expect(
      page.getByTestId('explore-v2-monthly-card-jeju').getByTestId('explore-v2-monthly-estimate'),
    ).toBeVisible();
    await expect(page.getByText('에디터스 픽').first()).toBeVisible();
  });
});
