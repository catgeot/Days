import { test, expect } from '@playwright/test';

function stayItems() {
  return Array.from({ length: 6 }, (_, i) => ({
    itemId: 88000 + i,
    itemName: `하와이 테스트 호텔 ${i + 1}`,
    salePrice: 180000 + i * 1000,
    reviewScore: 9,
    productUrl: `https://accommodation.myrealtrip.com/union/products/${88000 + i}`,
    lat: 21.28,
    lng: -157.83,
  }));
}

test('숙소 목록 하단 마이리얼트립 더보기 아래 트립닷컴 숙소 검색', async ({ page }) => {
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
        usedKeyword: '하와이',
        region: { regionId: 4242 },
        totalCount: 6,
        items: stayItems(),
      }),
    });
  });

  await page.goto('/place/hawaii?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: '하와이' }).first()).toBeVisible();
  await page.getByRole('button', { name: '홈으로 이동' }).first().click();
  await expect(page).toHaveURL(/\/(\?|$)/);

  const findStays = page.getByRole('button', { name: '숙소 찾기' }).first();
  await expect(findStays).toBeVisible();
  await findStays.click();

  const mrtMore = page.getByRole('link', { name: '마이리얼트립에서 더 보기' });
  const tripSearch = page.getByRole('link', { name: '트립닷컴에서 숙소 검색' });
  await expect(mrtMore).toBeVisible();
  await expect(tripSearch).toBeVisible();

  const mrtBox = await mrtMore.boundingBox();
  const tripBox = await tripSearch.boundingBox();
  expect(mrtBox && tripBox && tripBox.y > mrtBox.y).toBeTruthy();

  const href = await tripSearch.getAttribute('href');
  const url = new URL(href);
  expect(url.hostname).toBe('kr.trip.com');
  expect(url.pathname).toBe('/hotels/list');
  expect(url.searchParams.get('city')).toBe('757');
  expect(url.searchParams.get('trip_sub1')).toBe('숙소찾기 목록하단');

  await tripSearch.scrollIntoViewIfNeeded();
  const box = await tripSearch.boundingBox();
  const y = Math.max(0, Math.round(box.y) - 70);
  const height = Math.min(260, 844 - y);
  await page.screenshot({
    path: '/opt/cursor/artifacts/stay-list-tripcom-footer.png',
    clip: { x: 0, y, width: 390, height },
  });
});
