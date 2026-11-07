/**
 * GlobeTourStrip / MrtTnaActivitiesWidget — 고지 1회·카드 전체 링크·이미지 확대.
 *
 * PROD-like: `npm run build` 후 `vite preview`(DEV 아님).
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5198 npx playwright test e2e/tour-list-card-readability.spec.js
 */
import { test, expect } from '@playwright/test';
import {
  MRT_TNA_HAEUNDAE_CONTRACT_FIXTURE,
  MRT_TNA_MISSING_PRICE_ITEM,
  MRT_TNA_NO_IMAGE_ITEM,
} from './fixtures/mrtTnaHaeundaeContract.fixture.mjs';

async function assertProdLikeChrome(page) {
  await expect(page.getByText('모바일 위젯 로그')).toHaveCount(0);
  await expect(page.getByText('작업 로그')).toHaveCount(0);
}

async function mockTnas(page, payload) {
  await page.route('**/functions/v1/fetch-mrt-tnas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    });
  });
}

async function goHomeFromPlace(page, placePath, placeButtonName) {
  const url = placePath.includes('?') ? placePath : `${placePath}?lang=ko`;
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  if (placeButtonName) {
    await expect(page.getByRole('button', { name: placeButtonName }).first()).toBeVisible({
      timeout: 60_000,
    });
  }
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
}

async function openTourListMobile(page) {
  await expect(page.getByRole('button', { name: '투어 찾기' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '투어 찾기' }).first().click();
  await expect(page.getByRole('dialog', { name: '투어 전체 목록' })).toBeVisible({
    timeout: 60_000,
  });
}

async function openTourListDesktop(page) {
  await expect(page.getByRole('button', { name: '투어 찾기' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '투어 찾기' }).first().click();
  await expect(page.getByRole('region', { name: '투어 목록' })).toBeVisible({ timeout: 60_000 });
}

async function assertListNoticeOnce(page, narrowPattern) {
  await expect(page.locator('[data-stay-list-partner-notice]')).toHaveCount(1);
  await expect(page.getByText(narrowPattern)).toHaveCount(1);
  await expect(page.getByText('제휴 · 마이리얼트립')).toHaveCount(1);
}

test.describe('GlobeTourStrip list partner notice', () => {
  test.beforeEach(async ({ page }) => {
    await mockTnas(page, MRT_TNA_HAEUNDAE_CONTRACT_FIXTURE);
  });

  test('390 ko — 해운대 계약 fixture 캡처', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goHomeFromPlace(page, '/place/haeundae-beach?lang=ko', '해운대해수욕장');
    await openTourListMobile(page);
    await assertProdLikeChrome(page);
    await assertListNoticeOnce(page, '파트너에서 예약합니다 · 가격·자리는 그쪽 기준');

    const dialog = page.getByRole('dialog', { name: '투어 전체 목록' });
    const cardLinks = dialog.locator('a[data-partner-booking-handoff="cta"]');
    await expect(cardLinks).toHaveCount(4);
    await expect(page.getByText('상품 보고 예약 시작', { exact: true })).toHaveCount(0);
    await expect(cardLinks.first()).toHaveAttribute('href', /9001001/);
    await expect(cardLinks.first()).toHaveAttribute('aria-label', /스노클링/);
    await expect(cardLinks.first()).toHaveAttribute('aria-label', /상품 보고 예약 시작/);
    await expect(cardLinks.first()).toHaveAttribute('rel', /sponsored/);

    await page.screenshot({
      path: '/opt/cursor/artifacts/tour-list-card-readability-390-haeundae.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('1280 ko — 해운대 계약 fixture 캡처', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await goHomeFromPlace(page, '/place/haeundae-beach?lang=ko', '해운대해수욕장');
    await openTourListDesktop(page);
    await assertProdLikeChrome(page);
    await assertListNoticeOnce(page, '파트너에서 예약합니다 · 가격·자리는 그쪽 기준');

    await page.screenshot({
      path: '/opt/cursor/artifacts/tour-list-card-readability-1280-haeundae.png',
      clip: { x: 0, y: 0, width: 1280, height: 900 },
    });
  });

  test('390 — No image·가격 없음·href', async ({ page }) => {
    await mockTnas(page, {
      ...MRT_TNA_HAEUNDAE_CONTRACT_FIXTURE,
      items: [
        MRT_TNA_HAEUNDAE_CONTRACT_FIXTURE.items[0],
        MRT_TNA_NO_IMAGE_ITEM,
        MRT_TNA_MISSING_PRICE_ITEM,
      ],
      totalCount: 3,
    });
    await page.setViewportSize({ width: 390, height: 844 });
    await goHomeFromPlace(page, '/place/haeundae-beach?lang=ko', '해운대해수욕장');
    await openTourListMobile(page);

    await expect(page.getByText('No image')).toBeVisible();
    await expect(
      page.locator('a[data-partner-booking-handoff="cta"][href*="9001999"]'),
    ).toHaveCount(1);

    const link = page.locator('a[data-partner-booking-handoff="cta"]').first();
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute('rel', /sponsored/);
    let popupCount = 0;
    page.on('popup', () => {
      popupCount += 1;
    });
    await link.evaluate((el) => {
      el.addEventListener(
        'click',
        (e) => {
          e.preventDefault();
        },
        { once: true },
      );
    });
    await page.keyboard.press('Enter');
    await page.waitForTimeout(400);
    expect(popupCount).toBe(0);
  });
});
