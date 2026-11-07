import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const BASE =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.SMOKE_SITE_URL ||
  'http://127.0.0.1:5198';
const OUT = '/opt/cursor/artifacts';
mkdirSync(OUT, { recursive: true });

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
    contentId: 'dg-1',
    title: '대구 치맥축제',
    eventStartDate: '20261018',
    eventEndDate: '20261019',
    addr1: '대구광역시 중구 동성로 1',
    areaCode: '4',
  },
];

async function stub(page) {
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

async function shot(page, name, width) {
  const height = width === 390 ? 844 : 900;
  await page.setViewportSize({ width, height });
  await page.screenshot({
    path: join(OUT, name),
    clip: { x: 0, y: 0, width, height },
  });
}

const browser = await chromium.launch();
const context = await browser.newContext({ locale: 'ko-KR', timezoneId: 'Asia/Seoul' });
const page = await context.newPage();
await page.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
await stub(page);
await page.addInitScript(() => {
  const delay = 5500;
  const position = { lat: 37.5665, lng: 126.978 };
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition(success) {
        setTimeout(
          () =>
            success({
              coords: { latitude: position.lat, longitude: position.lng, accuracy: 10 },
              timestamp: Date.now(),
            }),
          delay,
        );
      },
      watchPosition: () => 0,
      clearWatch: () => {},
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
  localStorage.removeItem('korea-festival-loc-success');
});

await page.goto(`${BASE}/korea/`, { waitUntil: 'domcontentloaded' });
await page.getByRole('heading', { name: /한국의 축제/ }).waitFor({ timeout: 60_000 });
try {
  await page.getByRole('button', { name: /^닫기$/ }).first().click({ timeout: 2500 });
} catch {
  /* no hint */
}
await page.getByRole('button', { name: /지역 대분류/ }).click();
await page.getByRole('button', { name: /^대구\s+\d+$/ }).click();
await page.locator('main [data-festival-id]').first().waitFor({ timeout: 20_000 });
await page.waitForTimeout(6200);
await shot(page, 'festival-region-geo-boot-after-daegu-390.png', 390);
await shot(page, 'festival-region-geo-boot-after-daegu-1280.png', 1280);
await browser.close();
console.log(`capture-festival-region-geo-boot-qa: wrote ${OUT}`);
