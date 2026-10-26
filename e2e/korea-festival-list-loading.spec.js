import { test, expect } from './fixtures.js';

const LOADING_SCHEDULE_RE = /축제 일정을 불러오는 중|Loading festival schedule/i;
const COUNT_UNIT_RE = /\d+\s*건/;

function isLocalPreviewBase(baseURL) {
  return /^https?:\/\/127\.0\.0\.1(?::\d+)?\/?$/i.test(String(baseURL || '').trim());
}

test.describe('Korea festival hub list loading', () => {
  test.beforeEach(({ baseURL }) => {
    test.skip(
      !isLocalPreviewBase(baseURL),
      'Requires vite preview on 127.0.0.1 (bundled hub fix); skipped on production E2E health.',
    );
  });
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test('main list shows skeleton only until window fetch resolves', async ({ page }) => {
    let releaseWindow;
    const windowGate = new Promise((resolve) => {
      releaseWindow = resolve;
    });

    await page.addInitScript(() => {
      sessionStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
      sessionStorage.removeItem('gateo:korea-festivals:v2:rolling12:en');
      localStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
      localStorage.removeItem('gateo:korea-festivals:v2:rolling12:en');
    });

    await page.route('**/functions/v1/tourapi-proxy**', async (route) => {
      let action = '';
      try {
        action = String(route.request().postDataJSON()?.action || '');
      } catch {
        action = '';
      }
      if (action === 'festivalWindow') {
        await windowGate;
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            items: [
              {
                contentId: '999001',
                title: 'E2E 로딩 테스트 축제',
                addr1: '서울특별시 중구',
                eventStartDate: '20261001',
                eventEndDate: '20261031',
              },
            ],
          }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true }),
      });
    });

    await page.goto('/korea/');
    await expect(page.getByText(LOADING_SCHEDULE_RE)).toBeVisible();

    const listScroll = page.locator('[data-festival-list-scroll]');
    await expect(listScroll.locator('[data-festival-list-loading]')).toBeVisible();
    await expect(listScroll.locator('[data-festival-id]')).toHaveCount(0);
    await expect(page.locator('[data-festival-list-meta]')).not.toContainText(COUNT_UNIT_RE);

    releaseWindow();
    await expect(page.getByText(LOADING_SCHEDULE_RE)).toHaveCount(0, { timeout: 30_000 });
    await expect(listScroll.locator('[data-festival-id]').first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-festival-list-meta]')).toContainText(COUNT_UNIT_RE);
  });
});
