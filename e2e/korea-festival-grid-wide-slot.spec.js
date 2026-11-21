import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { test, expect } from './fixtures.js';

const OUT_DIR = '/opt/cursor/artifacts';

const WIDE_THUMB = '/e2e/wide-festival-thumb.png';
const LIST_THUMB = '/e2e/tall-festival-thumb.png';

function isLocalPreviewBase(baseURL) {
  try {
    return new URL(String(baseURL || '').trim()).hostname === '127.0.0.1';
  } catch {
    return false;
  }
}

function mockWindowPayload() {
  return {
    ok: true,
    items: [
      {
        contentId: '880001',
        title: 'E2E 가로 히어로 축제',
        addr1: '서울특별시 중구 세종대로',
        eventStartDate: '20261201',
        eventEndDate: '20261215',
        firstimage: WIDE_THUMB,
      },
      {
        contentId: '880002',
        title: 'E2E 옆 카드 A',
        addr1: '서울특별시 종로구',
        eventStartDate: '20261201',
        eventEndDate: '20261220',
        firstimage: LIST_THUMB,
      },
      {
        contentId: '880003',
        title: 'E2E 옆 카드 B',
        addr1: '서울특별시 용산구',
        eventStartDate: '20261201',
        eventEndDate: '20261220',
        firstimage: LIST_THUMB,
      },
      {
        contentId: '880004',
        title: 'E2E 리스트 카드',
        addr1: '서울특별시 마포구',
        eventStartDate: '20261205',
        eventEndDate: '20261225',
        firstimage: LIST_THUMB,
      },
    ],
  };
}

async function installWideFestivalMocks(page) {
  await page.addInitScript(() => {
    sessionStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
    localStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
    try {
      sessionStorage.setItem('gateo:festival-hub-list-view:v1', 'grid');
    } catch {
      /* */
    }
  });

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
        body: JSON.stringify(mockWindowPayload()),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [] }),
    });
  });
}

async function gridWideLayout(page) {
  return page.evaluate(() => {
    const slot = document.querySelector('[data-festival-grid-wide-slot]');
    const row = document.querySelector('[data-festival-grid-wide-row]');
    if (!slot || !row) return null;
    const slotRect = slot.getBoundingClientRect();
    const rowRect = row.getBoundingClientRect();
    const gap = parseFloat(getComputedStyle(row).columnGap || getComputedStyle(row).gap || '0');
  const colWidth = (rowRect.width - gap * 3) / 4;
    return {
      rowWidth: rowRect.width,
      slotWidth: slotRect.width,
      colWidth,
      ratio: slotRect.width / colWidth,
    };
  });
}

test.describe('Korea festival grid wide slot layout', () => {
  test.use({ ignoreHTTPSErrors: true });

  test.beforeEach(({ baseURL }) => {
    test.skip(
      !isLocalPreviewBase(baseURL),
      'Requires vite preview on 127.0.0.1; skipped on production E2E health.',
    );
  });

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test('desktop 1280 — wide slot spans two of four columns', async ({ page, baseURL }) => {
    await installWideFestivalMocks(page);
    await page.setViewportSize({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto('/korea/?area=1&city=all');

    await expect(page.locator('[data-festival-grid]')).toBeVisible({ timeout: 60_000 });
    await page.waitForFunction(
      () => {
        const img = document.querySelector('[data-festival-id="880001"] img');
        return Boolean(img && img.naturalWidth > 0);
      },
      null,
      { timeout: 60_000 },
    );
    await expect(page.locator('[data-festival-grid-wide-slot]')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-festival-grid-card-wide="true"]').first()).toBeVisible({
      timeout: 60_000,
    });

    await page.waitForFunction(
      () => {
        const row = document.querySelector('[data-festival-grid-wide-row]');
        return row && row.getBoundingClientRect().width > 600;
      },
      null,
      { timeout: 30_000 },
    );

    const layout = await gridWideLayout(page);
    expect(layout).not.toBeNull();
    expect(layout.ratio).toBeGreaterThan(1.85);
    expect(layout.ratio).toBeLessThan(2.15);

    await page.screenshot({
      path: join(OUT_DIR, 'korea-grid-wide-slot-after-1280.png'),
      clip: { x: 0, y: 0, width: 1280, height: 900 },
    });
  });

  test('mobile 390 — wide slot spans full grid width', async ({ page, baseURL }) => {
    await installWideFestivalMocks(page);
    await page.setViewportSize({ width: 390, height: 844, deviceScaleFactor: 1 });
    await page.goto('/korea/?area=1&city=all');

    await page.waitForFunction(
      () => {
        const img = document.querySelector('[data-festival-id="880001"] img');
        return Boolean(img && img.naturalWidth > 0);
      },
      null,
      { timeout: 60_000 },
    );
    await expect(page.locator('[data-festival-grid-wide-slot]')).toBeVisible({
      timeout: 60_000,
    });

    const layout = await page.evaluate(() => {
      const slot = document.querySelector('[data-festival-grid-wide-slot]');
      const row = document.querySelector('[data-festival-grid-wide-row]');
      if (!slot || !row) return null;
      const slotRect = slot.getBoundingClientRect();
      const rowRect = row.getBoundingClientRect();
      return { slotWidth: slotRect.width, rowWidth: rowRect.width };
    });
    expect(layout).not.toBeNull();
    expect(Math.abs(layout.slotWidth - layout.rowWidth)).toBeLessThan(4);

    await page.screenshot({
      path: join(OUT_DIR, 'korea-grid-wide-slot-after-390.png'),
      clip: { x: 0, y: 0, width: 390, height: 844 },
    });
  });
});