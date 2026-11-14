// Explore «빛초롱» — WebKit 390 touch: festival · scenic tap + Enter geo (regression 2026-11-14)
import { test, expect } from './fixtures.js';
import {
  BITCHCHORONG_FESTIVAL,
  installExploreBichchorongSearchMock,
  installDelayedGangwonGeolocation,
} from './explore-bichchorong-search-mock.js';

test.use({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
  isMobile: true,
  hasTouch: true,
  locale: 'ko-KR',
});

async function openExploreSearch(page) {
  await page.goto('/explore', { waitUntil: 'domcontentloaded' });
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(input).toBeVisible({ timeout: 90_000 });
  return input;
}

async function clearFestivalListCaches(page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
      sessionStorage.removeItem('gateo:korea-festivals:v2:rolling12:en');
      localStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
      localStorage.removeItem('gateo:korea-festivals:v2:rolling12:en');
    } catch {
      /* ignore */
    }
  });
}

test.describe('Explore 빛초롱 search — WebKit 390 touch', () => {
  test.beforeEach(async ({ page, context }) => {
    await clearFestivalListCaches(page);
    await installExploreBichchorongSearchMock(context);
  });

  test('tap festival card opens detail 1095732', async ({ page }) => {
    const input = await openExploreSearch(page);
    await input.fill('빛초롱');
    const festBtn = page
      .locator('[data-search-popover] button')
      .filter({ hasText: /서울빛초롱축제/ })
      .first();
    await expect(festBtn).toBeVisible({ timeout: 90_000 });
    await Promise.all([
      page.waitForURL(new RegExp(`festival=${BITCHCHORONG_FESTIVAL.contentId}`), {
        timeout: 90_000,
        waitUntil: 'load',
      }),
      festBtn.tap(),
    ]);
    await expect(page.locator('#korea-festival-sheet-title')).toContainText(/서울빛초롱축제/, {
      timeout: 90_000,
    });
  });

  test('Enter opens festival list with 빛초롱 — geo 강원 does not hide match', async ({ page }) => {
    await installDelayedGangwonGeolocation(page);
    await installExploreBichchorongSearchMock(page.context());
    const input = await openExploreSearch(page);
    await input.fill('빛초롱');
    await input.press('Enter');
    await page.waitForURL(
      new RegExp(`festival=${BITCHCHORONG_FESTIVAL.contentId}|\\/korea`),
      { timeout: 90_000 },
    );
    const url = page.url();
    if (url.includes(`festival=${BITCHCHORONG_FESTIVAL.contentId}`)) {
      const festDialog = page.getByRole('dialog');
      await expect(festDialog).toBeVisible({ timeout: 60_000 });
      await expect(festDialog.locator('#korea-festival-sheet-title')).toContainText(/서울빛초롱축제/);
      return;
    }
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await expect
      .poll(async () => page.getByRole('button', { name: /^강원/, pressed: true }).count(), {
        timeout: 8_000,
      })
      .toBe(0);
    await expect(page.locator('main').getByText(/서울빛초롱축제/).first()).toBeVisible({
      timeout: 30_000,
    });
  });
});