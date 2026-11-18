/**
 * Tour modal search chrome — icon, label, placeholder, clear, layout overlap.
 * GYG script is mocked. No partner network beyond stub.
 *
 * npx playwright test -c playwright.config.tour-modal-region-search.js tour-modal-search-chrome
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

function assertNoHorizontalOverlap(a, b, tolerance = 0) {
  if (a.right <= b.left + tolerance || b.right <= a.left + tolerance) return;
  if (a.bottom <= b.top + tolerance || b.bottom <= a.top + tolerance) return;
  const xOverlap = Math.min(a.right, b.right) - Math.max(a.left, b.left);
  const yOverlap = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
  expect(xOverlap, 'unexpected horizontal overlap between regions').toBeLessThanOrEqual(tolerance);
  expect(yOverlap, 'unexpected vertical overlap between regions').toBeLessThanOrEqual(tolerance);
}

test('search chrome — icon, label, placeholder, clear, layout', async ({ page }, testInfo) => {
  const viewport = page.viewportSize() || { width: 1280, height: 900 };
  const shot =
    viewport.width < 1024
      ? 'tour-modal-search-chrome-390.png'
      : 'tour-modal-search-chrome-1280.png';

  await installGygMock(page);
  await page.goto('/place/el-nido?lang=ko', { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });

  const tourButton = page.getByRole('button', { name: '투어 찾기' }).first();
  await expect(tourButton).toBeVisible({ timeout: 60_000 });
  await tourButton.click();

  if (viewport.width < 1024) {
    await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('region', { name: '투어 목록' })).toBeVisible({ timeout: 60_000 });
  }

  await expect(page.getByText('다른 지역 투어 찾기', { exact: true })).toBeVisible();
  await expect(page.locator('[data-service-region-search-icon]')).toBeVisible();

  const input = page.getByRole('combobox', { name: '투어 지역 검색' });
  await expect(input).toHaveAttribute('placeholder', '도시·지역 이름 입력 (예: 방콕)');
  await expect(page.locator('[data-service-region-clear]')).toHaveCount(0);

  const panel =
    viewport.width < 1024
      ? page.getByRole('dialog', { name: '투어 전체 목록' })
      : page.getByRole('region', { name: '투어 목록' });
  const closeButton = panel.getByRole('button', { name: '투어 목록 닫기' });
  const searchRoot = page.locator('[data-service-region-root]').first();

  const layout = await page.evaluate(() => {
    const root = document.querySelector('[data-service-region-root]');
    const close =
      document.querySelector('#globe-tour-strip-panel button[aria-label="투어 목록 닫기"]') ||
      document.querySelector('[role="dialog"] button[aria-label="투어 목록 닫기"]');
  const header = document.querySelector('#globe-tour-strip-panel header');
    if (!root || !close || !header) return null;
    return {
      search: root.getBoundingClientRect(),
      close: close.getBoundingClientRect(),
      header: header.getBoundingClientRect(),
    };
  });
  expect(layout).toBeTruthy();
  assertNoHorizontalOverlap(layout.search, layout.close, 0);
  assertNoHorizontalOverlap(layout.search, layout.header, 0);
  expect(layout.search.top).toBeGreaterThanOrEqual(layout.header.bottom - 1);

  await input.fill('방');
  await expect(page.locator('[data-service-region-clear]')).toBeVisible();
  await page.locator('[data-service-region-clear]').click();
  await expect(input).toHaveValue('');
  await expect(input).toHaveAttribute('placeholder', '도시·지역 이름 입력 (예: 방콕)');

  await page.screenshot({
    path: `/opt/cursor/artifacts/${shot}`,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });

  await searchRoot.screenshot({
    path: `/opt/cursor/artifacts/tour-modal-search-field-${viewport.width}.png`,
  });
});