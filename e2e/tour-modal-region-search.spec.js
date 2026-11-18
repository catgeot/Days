/**
 * Tour modal region search. GYG script is mocked. No Gemini or partner network.
 *
 * npx playwright test -c playwright.config.tour-modal-region-search.js
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
  await page.addInitScript(() => {
    localStorage.setItem(
      'gateo_recent_visited_destinations',
      JSON.stringify([{ name: '교토', slug: 'kyoto', name_en: 'Kyoto' }]),
    );
  });
}

test('type, select, widget updates, reset', async ({ page }, testInfo) => {
  const viewport = page.viewportSize() || { width: 1280, height: 900 };
  const shot = testInfo.project.name.includes('webkit')
    ? 'tour-modal-search-webkit-390.png'
    : viewport.width < 1024
      ? 'tour-modal-search-390.png'
      : 'tour-modal-search-1280.png';

  await installGygMock(page);
  await page.goto('/place/khao-lak?lang=ko', { waitUntil: 'domcontentloaded' });
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

  const host = page.locator('[data-gyg-widget="activities"]');
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak');
  await expect(host).toHaveAttribute('data-gyg-partner-id', 'LRKVVU4');
  await expect(host).toHaveAttribute('data-gyg-cmp', 'gateo_planer_khao-lak');

  const input = page.getByRole('combobox', { name: '투어 지역 검색' });
  await input.click();
  await expect(page.getByText('최근 본 지역', { exact: true })).toBeVisible();
  await expect(page.getByText('추천 지역', { exact: true })).toBeVisible();
  await expect(page.locator('[data-region-slug="kyoto"]')).toBeVisible();
  await expect(page.locator('[data-region-method="recommended"]')).toHaveCount(3);

  await input.fill('푸');
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak');
  await input.fill('푸켓');
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak');
  await page.locator('[data-region-slug="phuket"]').click();
  await expect(host).toHaveAttribute('data-gyg-q', 'Phuket');
  await expect(host).toHaveAttribute('data-gyg-cmp', 'gateo_planer_phuket');
  await expect(host).toHaveAttribute('data-gyg-partner-id', 'LRKVVU4');
  await expect(page.locator('iframe[data-mock-gyg-q="Phuket"]')).toBeAttached();
  await expect(page.locator('a[data-gateo-place="Phuket"]').first()).toHaveAttribute(
    'rel',
    /noopener noreferrer sponsored/,
  );
  await expect(page.getByRole('button', { name: /카오락 투어로 돌아가기/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /검색어 ·/ })).toHaveCount(0);
  await expect(page.getByText('현지 투어를 불러오는 중이에요')).toHaveCount(0);

  await page.screenshot({
    path: `/opt/cursor/artifacts/${shot}`,
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
  });

  await page.getByRole('button', { name: /카오락 투어로 돌아가기/ }).click();
  await expect(host).toHaveAttribute('data-gyg-q', 'Khao Lak');
  await expect(host).toHaveAttribute('data-gyg-cmp', 'gateo_planer_khao-lak');
  await expect(page.locator('[data-service-region-reset]')).toHaveCount(0);

  if (viewport.width >= 1024) {
    await page.getByRole('region', { name: '투어 목록' }).getByRole('button', { name: '투어 목록 닫기' }).click();
    await expect(page.getByRole('region', { name: '투어 목록' })).toHaveCount(0);
    await page.getByRole('button', { name: '투어 찾기' }).first().click();
    await expect(page.locator('[data-gyg-widget="activities"]')).toHaveAttribute('data-gyg-q', 'Khao Lak');
  }
});
