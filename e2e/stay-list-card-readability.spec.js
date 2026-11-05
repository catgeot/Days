import { test, expect } from '@playwright/test';

function iguazuItems() {
  return [
    {
      itemId: 1190340,
      itemName: '칸지 카타라타스 호텔',
      salePrice: 237321,
      starRating: 4,
      reviewScore: '4.2',
      productUrl: 'https://accommodation.myrealtrip.com/union/products/1190340',
    },
    {
      itemId: 1190341,
      itemName: '그란 멜리아 이과수',
      salePrice: 1326656,
      starRating: 5,
      reviewScore: '4.7',
      productUrl: 'https://accommodation.myrealtrip.com/union/products/1190341',
    },
    {
      itemId: 1190342,
      itemName: '산마 호텔',
      salePrice: 312503,
      starRating: 4,
      reviewScore: '4.8',
      productUrl: 'https://accommodation.myrealtrip.com/union/products/1190342',
    },
    {
      itemId: 1190343,
      itemName: '호텔 다스 카타라타스',
      salePrice: 1339944,
      starRating: 5,
      reviewScore: '5.0',
      productUrl: 'https://accommodation.myrealtrip.com/union/products/1190343',
    },
  ];
}

function seoulItems() {
  return [
    {
      itemId: 2681842,
      itemName: '나인트ree 바이 파르나스 서울 인사동',
      salePrice: 325185,
      starRating: 4,
      reviewScore: '4.6',
      categoryLabel: '호텔',
      address: '서울 종로구',
      lat: 37.571,
      lng: 126.989,
      productUrl: 'https://accommodation.myrealtrip.com/union/products/2681842',
    },
    {
      itemId: 2681843,
      itemName: '롯데호텔 서울',
      salePrice: 450000,
      starRating: 5,
      reviewScore: '4.8',
      categoryLabel: '호텔',
      lat: 37.565,
      lng: 126.981,
      productUrl: 'https://accommodation.myrealtrip.com/union/products/2681843',
    },
  ];
}

async function mockStays(page, items, keyword = '이구아수 폭포') {
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
        usedKeyword: keyword,
        region: { regionId: 9001 },
        totalCount: items.length,
        items,
      }),
    });
  });
}

async function openStayListMobile(page, placePath, placeButtonName) {
  await page.goto(`${placePath}?lang=ko`, { waitUntil: 'domcontentloaded' });
  if (placeButtonName) {
    await expect(page.getByRole('button', { name: placeButtonName }).first()).toBeVisible({
      timeout: 60_000,
    });
  }
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
  await expect(page.getByRole('button', { name: '숙소 찾기' }).first()).toBeVisible({
    timeout: 60_000,
  });
  await page.getByRole('button', { name: '숙소 찾기' }).first().click();
  await expect(page.getByRole('dialog', { name: '숙소 전체 목록' })).toBeVisible({
    timeout: 60_000,
  });
}

test('숙소 목록: 고지 1회·카드 성급·예약 CTA (fixture)', async ({ page }) => {
  await mockStays(page, iguazuItems());
  await page.setViewportSize({ width: 390, height: 844 });
  await openStayListMobile(page, '/place/iguazu-falls', '이구아수 폭포');

  const listNotice = page.locator('[data-stay-list-partner-notice]');
  await expect(listNotice).toHaveCount(1);
  await expect(listNotice).toContainText('파트너에서 예약합니다');
  await expect(listNotice).toContainText('제휴 · 마이리얼트립');

  await expect(page.getByText('파트너에서 예약합니다 · 가격·자리는 그쪽 기준')).toHaveCount(1);

  await expect(page.getByText('4성급').first()).toBeVisible();
  await expect(page.getByRole('link', { name: '호텔 보고 예약 시작' }).first()).toBeVisible();

  await page.screenshot({
    path: '/opt/cursor/artifacts/stay-list-card-readability-390-iguazu.png',
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
});

test('숙소 목록: 주소·거리 fixture (서울, 1280)', async ({ page }) => {
  await mockStays(page, seoulItems(), '종로');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/place/seoul?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '서울' }).first()).toBeVisible({ timeout: 60_000 });
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/, { timeout: 60_000 });
  await page.getByRole('button', { name: '숙소 찾기' }).first().click();
  await expect(page.getByRole('region', { name: '숙소 목록' })).toBeVisible({ timeout: 60_000 });

  await expect(page.getByText('호텔 · 서울 종로구')).toBeVisible();
  await expect(page.locator('[data-stay-list-partner-notice]')).toHaveCount(1);

  await page.screenshot({
    path: '/opt/cursor/artifacts/stay-list-card-readability-1280-seoul-fixture.png',
    clip: { x: 0, y: 0, width: 1280, height: 900 },
  });
});
