import { test, expect } from '@playwright/test';

/** Playwright route mock — 실제 MRT Edge 응답이 아님 */
function iguazuFixtureItems() {
  return [
    {
      itemId: 991001,
      itemName: 'Gran Melia Iguazu',
      salePrice: 1326656,
      reviewScore: '4.7',
      reviewCount: 842,
      starRating: 5,
      productUrl: 'https://accommodation.myrealtrip.com/union/products/991001',
      lat: -25.682,
      lng: -54.445,
    },
    {
      itemId: 991002,
      itemName: 'Hotel das Cataratas, A Belmond Hotel, Iguassu Falls',
      salePrice: 2100000,
      reviewScore: '4.9',
      reviewCount: 1203,
      starRating: 5,
      productUrl: 'https://accommodation.myrealtrip.com/union/products/991002',
    },
    {
      itemId: 991003,
      itemName: 'San Juan Eco Hotel',
      salePrice: 890000,
      reviewScore: '4.5',
      starRating: 3,
      productUrl: 'https://accommodation.myrealtrip.com/union/products/991003',
    },
    {
      itemId: 991004,
      itemName: 'Long name placeholder hotel near the falls with extra words for clamp test',
      salePrice: 0,
      reviewScore: null,
      productUrl: 'https://accommodation.myrealtrip.com/union/products/991004',
    },
  ];
}

async function mockMrtStays(page) {
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
        usedKeyword: '이구아수',
        region: { regionId: 55001, name: '이구아수' },
        totalCount: 4,
        items: iguazuFixtureItems(),
      }),
    });
  });
}

async function openIguazuStayList(page, { desktop = false } = {}) {
  await page.goto('/place/iguazu-falls?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '이구아수 폭포' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });

  const findStays = page.getByRole('button', { name: '숙소 찾기' }).first();
  await expect(findStays).toBeVisible({ timeout: 60_000 });
  await findStays.click();
  if (desktop) {
    await expect(page.getByRole('region', { name: '숙소 목록' })).toBeVisible({
      timeout: 60_000,
    });
  } else {
    await expect(page.getByRole('dialog', { name: '숙소 전체 목록' })).toBeVisible({
      timeout: 60_000,
    });
  }
  await expect(page.getByText('Gran Melia Iguazu')).toBeVisible({ timeout: 60_000 });
}

test.describe('숙소 목록 카드 — 목록 공지·카드 정보 (fixture)', () => {
  test.beforeEach(async ({ page }) => {
    await mockMrtStays(page);
  });

  test('390px — 이구아수 목록 스크린샷', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openIguazuStayList(page);

    const listNotice = page.locator('[data-stay-list-partner-notice]').first();
    await expect(listNotice).toBeVisible();
    await expect(listNotice).toContainText('제휴 · 마이리얼트립');
    await expect(page.getByText('파트너에서 예약합니다 · 가격·자리는 그쪽 기준')).toHaveCount(1);

    await expect(page.locator('a[data-partner-booking-handoff="cta"]').first()).toBeVisible();

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-list-iguazu-390-fixture.png',
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });

  test('1280px — 데스크톱 숙소 패널 스크린샷', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openIguazuStayList(page, { desktop: true });

    await expect(page.locator('[data-stay-list-partner-notice]').first()).toBeVisible();

    await page.screenshot({
      path: '/opt/cursor/artifacts/stay-list-iguazu-1280-fixture.png',
      clip: { x: 0, y: 0, width: 1280, height: 900 },
    });
  });

  test('EN locale 회귀', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/place/iguazu-falls?lang=en', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: 'Go to home' }).first().click();
    await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
    const findStays = page.getByRole('button', { name: 'Find stays' }).first();
    await expect(findStays).toBeVisible({ timeout: 60_000 });
    await findStays.click();
    await expect(page.locator('[data-stay-list-partner-notice]').first()).toContainText(
      'Affiliate · MyRealTrip',
    );
  });
});
