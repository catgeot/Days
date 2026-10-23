import { test, expect } from '@playwright/test';
import { installFestivalRoadWonjuFixtures } from './festival-road-wonju-fixture.js';

const VIEWPORT = { width: 390, height: 844 };

async function assertFestivalRoadMapRendered(page) {
  await expect(page.locator('[data-festival-road-map-tiles-idle="1"]')).toBeAttached({ timeout: 90_000 });
  await expect(page.locator('[data-festival-road-line-ready="1"]')).toBeAttached({ timeout: 90_000 });
  await page.waitForFunction(
    () => {
      const root = document.querySelector('[data-festival-road-map-ready="1"]');
      const sync = root?.getAttribute('data-festival-road-canvas-sync') || '';
      const m = /^(\d+)x(\d+):(\d+)x(\d+)$/.exec(sync);
      if (!m) return false;
      const cw = Number(m[1]);
      const ch = Number(m[2]);
      const dw = Number(m[3]);
      const dh = Number(m[4]);
      if (dw < 40 || dh < 40) return false;
      return Math.abs(cw - dw) <= 2 && Math.abs(ch - dh) <= 2;
    },
    { timeout: 30_000 },
  );
  const stats = await page.evaluate(() => {
    const root = document.querySelector('[data-festival-road-map-ready="1"]');
    const canvas = document.querySelector('[data-festival-road-map] canvas');
    const pins = document.querySelectorAll('[data-festival-road-pin]');
    const lineReady = root?.getAttribute('data-festival-road-line-ready') === '1';
    const tilesIdle = root?.getAttribute('data-festival-road-map-tiles-idle') === '1';
    const sync = root?.getAttribute('data-festival-road-canvas-sync') || '';
    const m = /^(\d+)x(\d+):(\d+)x(\d+)$/.exec(sync);
    let syncOk = false;
    if (m && canvas) {
      const cw = Number(m[1]);
      const ch = Number(m[2]);
      const dw = Number(m[3]);
      const dh = Number(m[4]);
      syncOk =
        cw > 40 &&
        ch > 40 &&
        Math.abs(cw - dw) <= 2 &&
        Math.abs(ch - dh) <= 2 &&
        canvas.width > 40 &&
        canvas.height > 40;
    }
    return {
      ok: lineReady && tilesIdle && syncOk && pins.length >= 2,
      lineReady,
      tilesIdle,
      syncOk,
      pinCount: pins.length,
    };
  });
  expect(stats.ok, JSON.stringify(stats)).toBe(true);
}

async function alignMapInDialog(page) {
  await page.locator('[data-festival-road-map]').evaluate((el) => {
    const sheet = el.closest('[role="dialog"]');
    if (!sheet) return;
    const top = el.getBoundingClientRect().top - sheet.getBoundingClientRect().top + sheet.scrollTop;
    sheet.scrollTop = Math.max(0, top - 180);
  });
}

async function openWonjuRoad(page) {
  await page.goto('/korea', { waitUntil: 'domcontentloaded' });
  await page.locator('[aria-label="세부 칩"]').getByRole('button', { name: '강원' }).click();
  await page.locator('[aria-label="지역 구분 칩"]').getByRole('button', { name: '원주' }).click();
  await page.locator('[data-festival-id]:not([data-social-promo-card])').first().click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('[data-festival-detail-summary]')).toBeVisible({ timeout: 60_000 });
  const roadEntry = dialog.locator('[data-festival-road-entry]');
  await expect(roadEntry).toBeVisible({ timeout: 15_000 });
  await roadEntry.click();
  await expect(dialog.locator('[data-festival-road]')).toBeVisible();
  await alignMapInDialog(page);
}

test.describe('Festival road Wonju 390', () => {
  test.beforeEach(async ({ context }) => {
    await installFestivalRoadWonjuFixtures(context);
  });

  test('week-next and wonju stop keep map tiles and route line', async ({ page }) => {
    test.skip(
      process.env.VITE_GATEO_FESTIVAL_ROAD !== '1',
      'VITE_GATEO_FESTIVAL_ROAD=1 build required',
    );
    await page.setViewportSize(VIEWPORT);
    await openWonjuRoad(page);
    await assertFestivalRoadMapRendered(page);

    await page.locator('[data-week-shortcut="1"]').click();
    await alignMapInDialog(page);
    await assertFestivalRoadMapRendered(page);

    const stop = page.locator('[data-festival-road-stop="wonju"]');
    await stop.locator('button').first().click();
    await page.locator('[data-festival-road-fill]').waitFor({ timeout: 15_000 }).catch(() => {});
    await alignMapInDialog(page);
    await assertFestivalRoadMapRendered(page);
  });
});
