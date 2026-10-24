import { test, expect } from '@playwright/test';

const VIEWPORT = { width: 390, height: 844 };

function gwangjuItems(count) {
  return Array.from({ length: count }, (_, i) => ({
    contentId: `gw-${i + 1}`,
    title: `광주 축제 ${i + 1}`,
    eventStartDate: '20261016',
    eventEndDate: '20261025',
    addr1: `광주광역시 북구 충장로 ${i + 1}`,
    areaCode: '5',
  }));
}

const DAEGU_ITEMS = [
  {
    contentId: 'dg-1',
    title: '대구 치맥 축제',
    eventStartDate: '20261018',
    eventEndDate: '20261019',
    addr1: '대구광역시 중구 동성로 1',
    areaCode: '4',
  },
  {
    contentId: 'dg-2',
    title: '대구 문화 축제',
    eventStartDate: '20261020',
    eventEndDate: '20261021',
    addr1: '대구광역시 수성구 달구벌대로 1',
    areaCode: '4',
  },
];

const FIXTURE = [...gwangjuItems(72), ...DAEGU_ITEMS];

async function dismissLocHint(page) {
  const close = page.getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* hint not shown */
  }
}

async function stubFestivalApi(page) {
  await page.route('**/functions/v1/tourapi-proxy**', async (route) => {
    let action = '';
    try {
      action = String(route.request().postDataJSON()?.action || '');
    } catch {
      action = '';
    }
    if (action === 'festivalWindow') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: FIXTURE }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true }),
    });
  });
}

test.describe('Korea festival region chip scroll reset', () => {
  test.use({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
    await stubFestivalApi(page);
    await page.goto('/korea/');
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await dismissLocHint(page);
    await page.getByRole('button', { name: /지역 대분류/ }).click();
    await page.getByRole('button', { name: /^광주\s+\d+$/ }).click();
    await expect(page.locator('main [data-festival-id]').first()).toBeVisible({
      timeout: 30_000,
    });
  });

  test('switching region after long scroll shows list top cards (WebKit 390)', async ({
    page,
  }) => {
    const main = page.locator('main');
    await main.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await expect
      .poll(async () => main.evaluate((el) => el.scrollTop), { timeout: 5_000 })
      .toBeGreaterThan(200);

    await page.getByRole('button', { name: /지역 대분류/ }).click();
    await page.getByRole('button', { name: /^대구\s+\d+$/ }).click();

    await expect
      .poll(async () => main.evaluate((el) => el.scrollTop), { timeout: 5_000 })
      .toBeLessThan(8);

    const firstCard = page.locator('main [data-festival-id]').first();
    await expect(firstCard).toBeVisible({ timeout: 10_000 });
    await expect(firstCard).toContainText('대구');

    await expect(firstCard).toBeInViewport({ ratio: 0.25 });
  });

  test('map close keeps deep list scroll (WebKit 390, tall fixture)', async ({ page }) => {
    const main = page.locator('main');
    const targetTop = 2214;
    await main.evaluate((el, top) => {
      el.scrollTop = top;
      if (el.scrollTop < top) el.scrollTop = el.scrollHeight;
      el.dispatchEvent(new Event('scroll', { bubbles: true }));
    }, targetTop);
    const deepTop = await main.evaluate((el) => el.scrollTop);
    expect(deepTop).toBeGreaterThan(2000);

    await page.getByRole('button', { name: '지도로 위치·동선 보기' }).click();
    await expect(page.getByRole('button', { name: /지도 닫기|목록으로/ }).first()).toBeVisible({
      timeout: 10_000,
    });
    await page.getByRole('button', { name: /지도 닫기|목록으로/ }).first().click();

    await expect
      .poll(async () => main.evaluate((el) => el.scrollTop), { timeout: 8_000 })
      .toBeGreaterThan(2000);
    const afterMap = await main.evaluate((el) => el.scrollTop);
    expect(afterMap).toBeGreaterThanOrEqual(deepTop - 24);

    await page.waitForTimeout(300);
    const after300 = await main.evaluate((el) => el.scrollTop);
    expect(after300).toBeGreaterThan(2000);

    await page.waitForTimeout(1200);
    const after1500 = await main.evaluate((el) => el.scrollTop);
    expect(after1500).toBeGreaterThan(2000);
  });

  test('favorites close keeps list scroll position', async ({ page }) => {
    const main = page.locator('main');
    await main.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    const deepTop = await main.evaluate((el) => el.scrollTop);
    expect(deepTop).toBeGreaterThan(200);

    const favToggle = page.getByRole('button', { name: '즐겨찾기·본 항목' });
    await favToggle.evaluate((el) => el.click());
    await expect(favToggle).toHaveAttribute('aria-pressed', 'true');
    await favToggle.evaluate((el) => el.click());
    await expect(favToggle).toHaveAttribute('aria-pressed', 'false');

    await expect
      .poll(async () => main.evaluate((el) => el.scrollTop), { timeout: 8_000 })
      .toBeGreaterThan(200);
  });
});
