/**
 * WebKit 390 before/after for PR — 광주 list bottom → 대구 chip.
 * Run: npx playwright test -c playwright.config.festival-region-chip-scroll-screenshots.js
 */
import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';

const OUT = '/opt/cursor/artifacts/festival-region-chip-scroll';
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

const FIXTURE = [
  ...gwangjuItems(28),
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

async function clipShot(page, name) {
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

test.describe('Festival region chip scroll — PR screenshots', () => {
  test.use({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test('gwangju bottom then daegu top', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
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

    await page.goto('/korea/');
    await expect(page.getByRole('heading', { name: /한국의 축제/ })).toBeVisible({
      timeout: 60_000,
    });

    await page.getByRole('button', { name: /지역 대분류/ }).click();
    await page.getByRole('button', { name: /^광주\s+\d+$/ }).click();
    await expect(page.locator('main [data-festival-id]').first()).toBeVisible({
      timeout: 30_000,
    });

    const main = page.locator('main');
    await main.evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(150);
    await clipShot(page, '01-gwangju-scrolled-bottom');

    await page.getByRole('button', { name: /지역 대분류/ }).click();
    const daeguChip = page.getByRole('button', { name: /^대구\s+\d+$/ });
    await daeguChip.scrollIntoViewIfNeeded();
    await daeguChip.click();
    await expect(page.locator('main [data-festival-id]').first()).toContainText('대구', {
      timeout: 10_000,
    });
    await page.waitForTimeout(150);
    await clipShot(page, '02-daegu-after-chip-top');
  });
});
