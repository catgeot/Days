import { test, expect } from '@playwright/test';

const VIEWPORT_MOBILE = { width: 390, height: 844 };
const SUCCESS_KEY = 'korea-festival-loc-success';

const SEOUL = { lat: 37.5665, lng: 126.978 };
const GANGWON = { lat: 37.8854, lng: 127.7298 };

const FIXTURE = [
  {
    contentId: 'se-1',
    title: '서울 문화축제',
    eventStartDate: '20261016',
    eventEndDate: '20261025',
    addr1: '서울특별시 종로구 세종대로 1',
    areaCode: '1',
  },
  {
    contentId: 'gw-1',
    title: '강릉 단오제',
    eventStartDate: '20261018',
    eventEndDate: '20261019',
    addr1: '강원특별자치도 강릉시 단오공원',
    areaCode: '32',
  },
  {
    contentId: 'dg-1',
    title: '대구 치맥축제',
    eventStartDate: '20261018',
    eventEndDate: '20261019',
    addr1: '대구광역시 중구 동성로 1',
    areaCode: '4',
  },
];

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

async function dismissLocHint(page) {
  const close = page.getByRole('button', { name: /^닫기$/ }).first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* hint not shown */
  }
}

async function installDelayedGeolocation(page, coords, delayMs) {
  await page.addInitScript(
    ({ delay, position }) => {
      const original = navigator.geolocation;
      Object.defineProperty(navigator, 'geolocation', {
        configurable: true,
        value: {
          getCurrentPosition(success, error) {
            window.setTimeout(
              () =>
                success({
                  coords: {
                    latitude: position.lat,
                    longitude: position.lng,
                    accuracy: 10,
                  },
                  timestamp: Date.now(),
                }),
              delay,
            );
          },
          watchPosition: () => 0,
          clearWatch: () => {},
          clear: () => {},
        },
      });
      if (navigator.permissions?.query) {
        const orig = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (desc) => {
          if (desc?.name === 'geolocation') {
            return Promise.resolve({ state: 'granted', onchange: null });
          }
          return orig(desc);
        };
      }
    },
    { delay: delayMs, position: coords },
  );
}

async function openRegionMajor(page) {
  await page.getByRole('button', { name: /지역 대분류/ }).click();
}

test.describe('Korea festival region geo boot respects explicit chip', () => {
  test.use({
    viewport: VIEWPORT_MOBILE,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
  });

  test.beforeEach(async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
    await stubFestivalApi(page);
    await page.addInitScript(() => {
      try {
        localStorage.removeItem('korea-festival-loc-success');
      } catch {
        /* ignore */
      }
    });
  });

  test('390: delayed geo does not override manual sido', async ({ page }) => {
    await installDelayedGeolocation(page, SEOUL, 5500);
    await page.goto('/korea/');
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await dismissLocHint(page);
    await openRegionMajor(page);
    await page.getByRole('button', { name: /^대구\s+\d+$/ }).click();
    await expect(page.locator('main [data-festival-id]').first()).toContainText('대구', {
      timeout: 15_000,
    });
    await page.waitForTimeout(6200);
    await expect(page.locator('main [data-festival-id]').first()).toContainText('대구');
    await expect(page.getByRole('button', { name: /^대구\s+\d+$/, pressed: true })).toBeVisible();
  });

  test('390: first entry applies boot region after delayed geo', async ({ page }) => {
    await installDelayedGeolocation(page, SEOUL, 1500);
    await page.goto('/korea/');
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await dismissLocHint(page);
    await expect
      .poll(
        async () =>
          (await page.getByRole('button', { name: /^서울\s+\d+$/, pressed: true }).count()) >
          0,
        { timeout: 10_000 },
      )
      .toBe(true);
    await expect(page.locator('main [data-festival-id]').first()).toContainText('서울');
  });

  test('390: explicit region survives reload', async ({ page }) => {
    await page.addInitScript(() => {
      if (navigator.permissions?.query) {
        const orig = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (desc) => {
          if (desc?.name === 'geolocation') {
            return Promise.resolve({ state: 'denied', onchange: null });
          }
          return orig(desc);
        };
      }
    });
    await page.goto('/korea/');
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await dismissLocHint(page);
    await openRegionMajor(page);
    await page.getByRole('button', { name: /^강원\s+\d+$/ }).click();
    await expect(page.locator('main [data-festival-id]').first()).toContainText('강릉', {
      timeout: 15_000,
    });
    await expect
      .poll(async () =>
        page.evaluate(() => sessionStorage.getItem('gateo:festival-hub-region-choice:v1')),
      )
      .toContain('"explicit":true');
    const saved = await page.evaluate(() =>
      sessionStorage.getItem('gateo:festival-hub-region-choice:v1'),
    );
    await page.reload();
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await dismissLocHint(page);
    await expect
      .poll(async () =>
        page.evaluate(() => sessionStorage.getItem('gateo:festival-hub-region-choice:v1')),
      )
      .toBe(saved);
    await expect(page.locator('main [data-festival-id]').first()).toContainText('강릉', {
      timeout: 15_000,
    });
  });

  test('390: explicit region survives festival detail back', async ({ page }) => {
    await page.addInitScript(() => {
      if (navigator.permissions?.query) {
        const orig = navigator.permissions.query.bind(navigator.permissions);
        navigator.permissions.query = (desc) => {
          if (desc?.name === 'geolocation') {
            return Promise.resolve({ state: 'denied', onchange: null });
          }
          return orig(desc);
        };
      }
    });
    await installDelayedGeolocation(page, SEOUL, 8000);
    await page.goto('/korea/');
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });
    await dismissLocHint(page);
    await openRegionMajor(page);
    await page.getByRole('button', { name: /^대구\s+\d+$/ }).click();
    await expect(page.locator('main [data-festival-id]').first()).toContainText('대구', {
      timeout: 15_000,
    });
    await page.waitForTimeout(9000);
    await expect(page.locator('main [data-festival-id]').first()).toContainText('대구');
    await page.locator('main [data-festival-id]').first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await page.goBack();
    await expect(page.locator('main [data-festival-id]').first()).toContainText('대구', {
      timeout: 15_000,
    });
    await expect(page.getByRole('button', { name: /^대구\s+\d+$/, pressed: true })).toBeVisible();
  });
});
