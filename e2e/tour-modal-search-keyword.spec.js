/**
 * Tour modal — region + activity keyword search (GYG mocked).
 *
 * npx playwright test -c playwright.config.tour-modal-region-search.js tour-modal-search-keyword
 */
import { test, expect } from '@playwright/test';

const GYG_STUB = `(() => {
  const mount = () => {
    document.querySelectorAll('[data-gyg-widget="activities"]').forEach((el) => {
      const q = el.getAttribute('data-gyg-q') || '';
      let frame = el.querySelector('iframe');
      if (!frame) {
        frame = document.createElement('iframe');
        frame.title = 'GetYourGuide activities';
        el.appendChild(frame);
      }
      frame.setAttribute('data-mock-gyg-q', q);
    });
  };
  const obs = new MutationObserver(mount);
  obs.observe(document.documentElement, { attributes: true, childList: true, subtree: true, attributeFilter: ['data-gyg-q'] });
  mount();
})();`;

async function installGygMock(page) {
  await page.route('**/*getyourguide.com/**', (route) => route.abort());
  await page.route('**/pa.umd.production.min.js', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: GYG_STUB,
    }),
  );
}

async function openKhaoLakTourModal(page) {
  await page.goto('/place/khao-lak?lang=ko', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
  const tourButton = page.getByRole('button', { name: '투어 찾기' }).first();
  await expect(tourButton).toBeVisible({ timeout: 60_000 });
  await tourButton.click();
  const viewport = page.viewportSize() || { width: 1280, height: 900 };
  if (viewport.width < 1024) {
    await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('region', { name: '투어 목록' })).toBeVisible({ timeout: 60_000 });
  }
  const host = page.locator('[data-gyg-widget="activities"]');
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak Phang Nga');
  return host;
}

test('combo search, activity-only, no results, single clear control', async ({ page }, testInfo) => {
  const viewport = page.viewportSize() || { width: 1280, height: 900 };
  const shotCombo =
    viewport.width < 1024
      ? 'tour-modal-search-combo-390.png'
      : 'tour-modal-search-combo-1280.png';
  const shotEmpty =
    viewport.width < 1024
      ? 'tour-modal-search-empty-390.png'
      : 'tour-modal-search-empty-1280.png';

  await installGygMock(page);
  const host = await openKhaoLakTourModal(page);
  const input = page.getByRole('combobox', { name: '투어 지역 검색' });

  await expect(input).toHaveAttribute('type', 'text');

  await input.fill('카오락 시미란');
  await expect(page.locator('[data-service-region-clear]')).toHaveCount(1);
  await input.press('Enter');
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak Phang Nga 시미란');

  await input.fill('island hopping');
  await input.press('Enter');
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak Phang Nga island hopping');

  await input.fill('카오락');
  await input.press('Enter');
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak Phang Nga');

  await input.fill('없는말');
  await expect(page.getByText('검색 결과가 없어요')).toBeVisible();
  await expect(page.locator('[data-tour-search-no-results]')).toBeVisible();

  await page.screenshot({
    path: `/opt/cursor/artifacts/${shotEmpty}`,
    clip: { x: 0, y: 0, width: viewport.width, height: Math.min(844, viewport.height) },
  });

  await input.fill('방콕 수상시장');
  await input.press('Enter');
  await expect(host).toHaveAttribute('data-gyg-q', 'Bangkok 수상시장');

  await page.screenshot({
    path: `/opt/cursor/artifacts/${shotCombo}`,
    clip: { x: 0, y: 0, width: viewport.width, height: Math.min(844, viewport.height) },
  });
});