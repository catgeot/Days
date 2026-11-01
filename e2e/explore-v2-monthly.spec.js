// Explore v2 step 1 — monthly picks row (flag off = legacy /explore unchanged)
import { test, expect } from './fixtures.js';

/** prod place_stats verified heroes — six cards */
const MONTHLY_VISIBLE_COUNT = 6;
const MONTHLY_EXCLUDED_LABELS = [];
const MONTHLY_HEADING = '11월의 여행지';

const monthlySection = (page) => page.getByTestId('explore-v2-monthly-section');
const SCROLL_AREA = (page) => page.locator('.modal-scroll-area').first();

async function openExplore(page, viewport, search = '') {
  await page.setViewportSize(viewport);
  const suffix = search ? (search.startsWith('?') ? search : `?${search}`) : '';
  await page.goto(`/explore${suffix}`, { waitUntil: 'domcontentloaded', timeout: 90_000 });
}

async function expectMonthlyRowWithPhotos(page) {
  const section = monthlySection(page);
  await expect(section).toBeVisible({ timeout: 45_000 });
  await page.waitForTimeout(2000);
  if (MONTHLY_EXCLUDED_LABELS.length > 0) {
    await expect(section).toHaveAttribute(
      'data-explore-v2-excluded',
      MONTHLY_EXCLUDED_LABELS.join(','),
    );
  } else {
    await expect(section).not.toHaveAttribute('data-explore-v2-excluded');
  }
  await expect(page.getByTestId('explore-v2-monthly-heading')).toHaveText(MONTHLY_HEADING);
  await expect(page.locator('[data-testid^="explore-v2-monthly-card-"]')).toHaveCount(
    MONTHLY_VISIBLE_COUNT,
  );
  return section;
}

test.describe('Explore v2 monthly picks @flagOff', () => {
  test.use({ ignoreHTTPSErrors: true });

  test('390 — legacy explore without monthly row', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expect(monthlySection(page)).toHaveCount(0);
    await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(0);
    await expect(page.getByText('에디터스 픽').first()).toBeVisible({ timeout: 45_000 });
  });

  test('1280 — legacy explore without monthly row', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expect(monthlySection(page)).toHaveCount(0);
    await expect(page.getByText('에디터스 픽').first()).toBeVisible({ timeout: 45_000 });
  });
});

test.describe('Explore v2 monthly picks @queryOn', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(() => {
    test.skip(
      process.env.VITE_GATEO_EXPLORE_V2 === '1',
      'query param path is tested with env flag off',
    );
  });

  test('390 — explore_v2=1 default layout a (horizontal)', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 }, 'explore_v2=1');
    await expectMonthlyRowWithPhotos(page);
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex');
    await expect(page.getByTestId('explore-v2-monthly-heading')).toContainText('11월의 여행지');
    await expect(page.getByTestId('explore-v2-monthly-layout-a')).toBeVisible();
    await expect(page.getByTestId('explore-v2-monthly-layout-b')).toHaveCount(0);
  });

  test('1280 — explore_v2=1&layout=b mosaic', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 }, 'explore_v2=1&layout=b');
    await expectMonthlyRowWithPhotos(page);
    await expect(page.getByTestId('explore-v2-monthly-layout-b')).toBeVisible();
    await expect(page.getByTestId('explore-v2-monthly-layout-a')).toHaveCount(0);
  });

  test('390 — layout=b mosaic at narrow width', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 }, 'explore_v2=1&layout=b');
    await expectMonthlyRowWithPhotos(page);
    await expect(page.getByTestId('explore-v2-monthly-layout-b')).toBeVisible();
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

  test('390 — cards with photos, sources, jeju estimate, tap navigates', async ({ page }) => {
    await openExplore(page, { width: 390, height: 844 });
    await expectMonthlyRowWithPhotos(page);
    await expect(page.getByTestId('explore-v2-monthly-layout-a')).toBeVisible();

    for (let i = 0; i < MONTHLY_VISIBLE_COUNT; i += 1) {
      await expect(
        page
          .locator('[data-testid^="explore-v2-monthly-item-"]')
          .nth(i)
          .getByTestId('explore-v2-monthly-source-link')
          .first(),
      ).toBeVisible();
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

  test('1280 — visible cards and jeju estimate', async ({ page }) => {
    await openExplore(page, { width: 1280, height: 720 });
    await expectMonthlyRowWithPhotos(page);
    await expect(page.getByTestId('explore-v2-monthly-card-jeju').getByTestId('explore-v2-monthly-estimate')).toBeVisible();
    await expect(page.getByText('에디터스 픽').first()).toBeVisible();
  });
});
