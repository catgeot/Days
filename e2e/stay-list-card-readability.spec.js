/**
 * GlobeStayStrip 숙소 목록 — 고지 1회·카드 성급·회귀.
 *
 * PROD-like: `npm run build` 후 `vite preview`(DEV 아님 → Preview debug chrome 미번들).
 *   PLAYWRIGHT_BASE_URL=http://127.0.0.1:5198 npx playwright test e2e/stay-list-card-readability.spec.js
 */
import { test, expect } from '@playwright/test';
import {
  MRT_STAY_IGUAZU_CONTRACT_FIXTURE,
  MRT_STAY_MISSING_PRICE_ITEM,
  MRT_STAY_NO_IMAGE_ITEM,
} from './fixtures/mrtStayIguazuContract.fixture.mjs';

async function assertProdLikeChrome(page) {
  await expect(page.getByText('모바일 위젯 로그')).toHaveCount(0);
  await expect(page.getByText('작업 로그')).toHaveCount(0);
}

async function mockStays(page, payload) {
  const { items, usedKeyword, region, totalCount } = payload;
  await page.route('**/functions/v1/fetch-mrt-stays', async (route) => {
    const body = route.request().postDataJSON?.() || {};
    if (body.geocodeItems) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: body.geocodeItems }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        usedKeyword: usedKeyword || '이구아수 폭포',
        region: region || { regionId: 9001 },
        totalCount: totalCount ?? items.length,
        items,
      }),
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

async function openStayListMobile(page, { findStays, dialogName }) {
  await expect(page.getByRole('button', { name: findStays }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: findStays }).first().click();
  await expect(page.getByRole('dialog', { name: dialogName })).toBeVisible({
    timeout: 60_000,
  });
}

async function openStayListDesktop(page) {
  await expect(page.getByRole('button', { name: '숙소 찾기' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '숙소 찾기' }).first().click();
  await expect(page.getByRole('region', { name: '숙소 목록' })).toBeVisible({ timeout: 60_000 });
}

async function assertListNoticeOnce(page, narrowPattern) {
  await expect(page.locator('[data-stay-list-partner-notice]')).toHaveCount(1);
  await expect(page.getByText(narrowPattern)).toHaveCount(1);
}

async function assertCardImagesLoaded(page) {
  const dialog = page.getByRole('dialog').or(page.getByRole('region', { name: '숙소 목록' }));
  const imgs = dialog.locator('img[src*="cloudfront.net"]');
  await expect(imgs.first()).toBeVisible({ timeout: 30_000 });
  const broken = await imgs.evaluateAll((nodes) =>
    nodes.filter((img) => img.complete && img.naturalWidth === 0).length,
  );
  expect(broken).toBe(0);
}

test.describe('GlobeStayStrip list partner notice', () => {
  test.beforeEach(async ({ page }) => {
    await mockStays(page, MRT_STAY_IGUAZU_CONTRACT_FIXTURE);
  });

  test('390 ko 2열 — 계약 fixture 캡처', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goHomeFromPlace(page, '/place/iguazu-falls?lang=ko', '이구아수 폭포');
    await openStayListMobile(page, { findStays: '숙소 찾기', dialogName: '숙소 전체 목록' });
    await assertProdLikeChrome(page);
    await assertListNoticeOnce(page, '파트너에서 예약합니다 · 가격·자리는 그쪽 기준');
    await expect(page.getByText('제휴 · 마이리얼트립')).toHaveCount(1);

    await assertCardImagesLoaded(page);
    await expect(page.getByText('4성급').first()).toBeVisible();
    await expect(page.getByText('5성급').first()).toBeVisible();

    await expect(page.getByRole('link', { name: '호텔 보고 예약 시작' })).toHaveCount(4);
    await expect(page.getByRole('link', { name: '호텔 보고 예약 시작' }).first()).toHaveAttribute(
      'href',
      /1190340/,
    );

    const cardLinks = page.getByRole('dialog', { name: '숙소 전체 목록' }).locator(
      'a[data-partner-booking-handoff="cta"]',
    );
    await expect(cardLinks).toHaveCount(4);
    await expect(page.getByText('호텔 보고 예약 시작', { exact: true })).toHaveCount(0);

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-list-card-readability-390-iguazu.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('1280 ko — 계약 fixture 캡처', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await goHomeFromPlace(page, '/place/iguazu-falls?lang=ko', '이구아수 폭포');
    await openStayListDesktop(page);
    await assertProdLikeChrome(page);
    await assertListNoticeOnce(page, '파트너에서 예약합니다 · 가격·자리는 그쪽 기준');
    await assertCardImagesLoaded(page);

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-list-card-readability-1280-iguazu.png',
      clip: { x: 0, y: 0, width: 1280, height: 900 },
    });
  });

  test('390 en — list notice copy', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/place/iguazu-falls?lang=en', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('button', { name: /Iguazu/i }).first()).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole('button', { name: /Go home|Go to home/i }).first().click();
    await expect(page).toHaveURL(/\/(\?|$)/);
    await openStayListMobile(page, { findStays: 'Find stays', dialogName: 'Full stay list' });
    await assertListNoticeOnce(
      page,
      'Book on the partner site · price and seats are on their site',
    );
    await expect(page.getByRole('link', { name: 'View hotel & start booking' }).first()).toBeVisible();
  });

  test('390 1열 그리드 — CTA·고지 유지', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goHomeFromPlace(page, '/place/iguazu-falls?lang=ko', '이구아수 폭포');
    await openStayListMobile(page, { findStays: '숙소 찾기', dialogName: '숙소 전체 목록' });
    const zoomBtn = page.getByRole('button', { name: '확대해서 보기' });
    await expect(zoomBtn).toBeVisible();
    await zoomBtn.click();
    await assertListNoticeOnce(page, '파트너에서 예약합니다 · 가격·자리는 그쪽 기준');
    await expect(page.getByRole('link', { name: '호텔 보고 예약 시작' })).toHaveCount(4);
  });

  test('긴 제목·값 없음·href — assertion', async ({ page }) => {
    const payload = {
      ...MRT_STAY_IGUAZU_CONTRACT_FIXTURE,
      items: [
        MRT_STAY_IGUAZU_CONTRACT_FIXTURE.items[3],
        MRT_STAY_MISSING_PRICE_ITEM,
        MRT_STAY_NO_IMAGE_ITEM,
      ],
      totalCount: 3,
    };
    await mockStays(page, payload);
    await page.setViewportSize({ width: 390, height: 844 });
    await goHomeFromPlace(page, '/place/iguazu-falls?lang=ko', '이구아수 폭포');
    await openStayListMobile(page, { findStays: '숙소 찾기', dialogName: '숙소 전체 목록' });

    await expect(page.getByText('일정 조정 후 예약')).toBeVisible();
    await expect(page.getByText('No image')).toBeVisible();
    await expect(page.getByText('5성급')).toHaveCount(1);

    await expect(
      page.locator('a[data-partner-booking-handoff="cta"][href*="9999001"]'),
    ).toHaveCount(1);

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-card-image-link-mock-regression-390.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('390 — 카드 링크 focus·sponsored (mock)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goHomeFromPlace(page, '/place/iguazu-falls?lang=ko', '이구아수 폭포');
    await openStayListMobile(page, { findStays: '숙소 찾기', dialogName: '숙소 전체 목록' });
    const link = page.locator('a[data-partner-booking-handoff="cta"]').first();
    await link.focus();
    await expect(link).toBeFocused();
    await expect(link).toHaveAttribute('rel', /sponsored/);
  });

  test('이구아수 fixture — distanceLabel 없음(좌표 없음)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await goHomeFromPlace(page, '/place/iguazu-falls?lang=ko', '이구아수 폭포');
    await openStayListMobile(page, { findStays: '숙소 찾기', dialogName: '숙소 전체 목록' });
    const dialog = page.getByRole('dialog', { name: '숙소 전체 목록' });
    await expect(dialog.getByText(/이구아수 폭포\s+\d+m/)).toHaveCount(0);
    await expect(dialog.getByText(/이구아수 폭포\s+\d/)).toHaveCount(0);
  });
});
