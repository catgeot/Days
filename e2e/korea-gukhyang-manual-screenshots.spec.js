import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR = '/opt/cursor/artifacts/screenshots/gukhyang-manual-638576';
const GUKHYANG_ID = '638576';

const WINDOW_ITEMS = [
  {
    contentId: '900001',
    title: '전남 더미 축제',
    eventStartDate: '20261015',
    eventEndDate: '20261020',
    addr1: '전라남도 여수시 중앙로 1',
    mapx: '127.664',
    mapy: '34.760',
    firstimage: 'https://tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG',
  },
];

test.describe('gukhyang manual promo screenshots @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
  });

  test.beforeEach(async ({ context }) => {
    await context.route(/tourapi-proxy/i, async (route) => {
      if (route.request().method() === 'OPTIONS') {
        await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*' } });
        return;
      }
      let body = {};
      try {
        body = route.request().postDataJSON() || {};
      } catch {
        body = {};
      }
      const action = String(body.action || '');
      const contentId = String(body.contentId || '').trim();
      if (action === 'festivalWindow') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, items: WINDOW_ITEMS, fromCache: true }),
        });
        return;
      }
      if (action === 'festivalDetail' && contentId === GUKHYANG_ID) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: false, contentId }),
        });
        return;
      }
      if (action === 'festivalDetail' && contentId === '637693') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ok: true,
            contentId: '637693',
            intro: {
              contentId: '637693',
              eventStartDate: '20261031',
              eventEndDate: '20261108',
            },
            common: {
              contentId: '637693',
              title: '마산가고파국화축제',
              addr1: '경상남도 창원시 마산합포구',
              mapx: '128.567',
              mapy: '35.196',
              firstimage: 'https://tong.visitkorea.or.kr/cms/resource/06/4114406_image2_1.JPG',
            },
          }),
        });
        return;
      }
      if (action === 'festivalImages' && contentId === GUKHYANG_ID) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ok: true, items: [] }),
        });
        return;
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      });
    });
  });

  async function shot(page, name) {
    await mkdir(OUT_DIR, { recursive: true });
    const path = join(OUT_DIR, `${name}.png`);
    await page.screenshot({ path, fullPage: true });
    return path;
  }

  test('전남 list — promo only once', async ({ page }) => {
    await page.goto('/korea', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-social-promo-card], [data-social-promo-card-skeleton]').first()).toBeVisible({
      timeout: 60_000,
    });
    await page.getByRole('button', { name: '전남' }).click();
    await expect(page.locator('[data-social-promo-card]').first()).toBeVisible({
      timeout: 60_000,
    });
    const promo = page.locator(`[data-social-promo-card][data-festival-id="${GUKHYANG_ID}"]`);
    await expect(promo).toBeVisible({ timeout: 60_000 });
    const listRows = page.locator(`[data-festival-id="${GUKHYANG_ID}"]`);
    await expect(async () => {
      const count = await listRows.count();
      expect(count).toBe(1);
    }).toPass({ timeout: 30_000 });
    await shot(page, 'jeonnam-list-single-promo-390');
  });

  test('국향 detail — official basis and photo credit', async ({ page }) => {
    await page.goto(`/korea?festival=${GUKHYANG_ID}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('[data-festival-detail-asof="official-homepage"]')).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.locator('[data-festival-photo-credit]')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.locator('[data-festival-summary-fee]')).toContainText('사전예매 10%');
    await expect(page.locator('[data-festival-summary-fee]')).toContainText('함평군민');
    const summary = page.locator('[data-festival-summary-fee]').locator('..').locator('..');
    await summary.screenshot({
      path: join(OUT_DIR, 'gukhyang-detail-fee-hours-390.png'),
    });
    await shot(page, 'gukhyang-detail-asof-credit-390');
  });
});
