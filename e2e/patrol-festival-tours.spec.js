import { test, expect } from '@playwright/test';

const CONTENT_ID = '4108260';
const OK_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const FESTIVAL = {
  contentId: CONTENT_ID,
  title: '2026 HUG RUN 허그런',
  eventStartDate: '20261120',
  eventEndDate: '20261220',
  addr1: '서울특별시 마포구 월드컵로 240',
  areaCode: '1',
  firstimage: 'https://example.test/festival/hug-hero.png',
};

async function installRoutes(page) {
  await page.route('**/functions/v1/tourapi-proxy**', async (route) => {
    let action = '';
    let body = {};
    try {
      body = route.request().postDataJSON() || {};
      action = String(body.action || '');
    } catch {
      action = '';
    }
    if (action === 'festivalWindow' || action === 'searchFestival') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [FESTIVAL] }),
      });
      return;
    }
    if (action === 'festivalDetail' || action === 'detailCommon' || action === 'detailIntro') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          contentId: CONTENT_ID,
          intro: {
            contentId: CONTENT_ID,
            eventStartDate: FESTIVAL.eventStartDate,
            eventEndDate: FESTIVAL.eventEndDate,
          },
          common: {
            contentId: CONTENT_ID,
            title: FESTIVAL.title,
            addr1: FESTIVAL.addr1,
            firstimage: FESTIVAL.firstimage,
          },
        }),
      });
      return;
    }
    if (action === 'detailImage') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          items: [
            { originimgurl: 'https://example.test/festival/hug-a.png' },
            { originimgurl: 'https://example.test/festival/hug-b.png' },
            { originimgurl: 'https://example.test/festival/hug-missing.png' },
          ],
        }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [] }),
    });
  });

  await page.route('**/functions/v1/fetch-mrt-tnas', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        keywordUsed: '마포',
        items: [
          {
            gid: 'nz-mapourika',
            itemName: '마포우리카 (Lake Mapourika) 프란츠 요제프',
            productUrl: 'https://experiences.myrealtrip.com/products/nz-mapourika',
          },
          {
            gid: 'mapo-run',
            itemName: '[마포] 한강 야경 러닝',
            productUrl: 'https://experiences.myrealtrip.com/products/mapo-run',
          },
        ],
      }),
    });
  });

  await page.route(/example\.test\/festival\/hug-(hero|a|b)\.png/, async (route) => {
    await route.fulfill({ status: 200, contentType: 'image/png', body: OK_PNG });
  });
  await page.route(/example\.test\/festival\/hug-missing\.png/, async (route) => {
    await route.abort();
  });
}

test.describe('Patrol festival tours and photo strip', () => {
  for (const viewport of [
    { width: 390, height: 844, label: '390' },
    { width: 1280, height: 800, label: '1280' },
  ]) {
    test(`마포 tours and loaded thumbs only @${viewport.label}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.clock.install({ time: new Date('2026-11-25T03:00:00.000Z') });
      await installRoutes(page);
      await page.goto(`/korea?festival=${CONTENT_ID}`);
      await expect(page.getByText('2026 HUG RUN 허그런').first()).toBeVisible({ timeout: 60_000 });
      const tour = page.getByText('[마포] 한강 야경 러닝');
      await expect(tour).toBeVisible({ timeout: 30_000 });
      await expect(page.getByText(/마포우리카|Mapourika/)).toHaveCount(0);
      const strip = page.locator('[data-festival-hero-thumbs-scroller]');
      await expect(strip).toBeVisible({ timeout: 20_000 });
      await expect(strip.locator('[role="option"]')).toHaveCount(3);
      await expect(strip.locator('[data-thumb-fallback]')).toHaveCount(0);
      await strip.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `/opt/cursor/artifacts/festival-strip-after-${viewport.label}.png`,
        clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      });
      await tour.scrollIntoViewIfNeeded();
      await page.screenshot({
        path: `/opt/cursor/artifacts/festival-mapo-after-${viewport.label}.png`,
        clip: { x: 0, y: 0, width: viewport.width, height: viewport.height },
      });
    });
  }
});
