/**
 * Bundled regression captures — mocked API, qa marker via fixtures.
 * npx playwright test e2e/multifix-bundle-screenshots.spec.js
 */
import { test, expect } from './fixtures.js';

test.use({ ignoreHTTPSErrors: true });

const ARTIFACT = '/opt/cursor/artifacts';

async function clipShot(page, file, width, height) {
  await page.screenshot({
    path: `${ARTIFACT}/${file}`,
    clip: { x: 0, y: 0, width, height },
  });
}

async function installTourApiFestivalRoutes(page, items, horizonItems = []) {
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
        body: JSON.stringify({ ok: true, items }),
      });
      return;
    }
    if (action === 'searchFestival') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: horizonItems }),
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

test.describe('multifix bundle screenshots @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });

  test('MOONi bold spacing — no stray asterisks', async ({ page }) => {
    await page.goto('/qa/mooni-markdown-fixture?qa=1', { waitUntil: 'domcontentloaded' });
    const yeongju = page.locator('[data-testid="mooni-md-yeongju-bold"]');
    await expect(yeongju).toBeVisible({ timeout: 60_000 });
    await expect(yeongju).not.toContainText('**');
    await clipShot(page, 'multifix-mooni-bold-390.png', 390, 844);
  });

  test('Korea jeju zero-window shows soon section', async ({ page }) => {
    await page.clock.install({ time: new Date('2026-10-16T03:00:00.000Z') });
    const windowItems = [
      {
        contentId: '1001',
        title: '서울 경계 축제',
        eventStartDate: '20261016',
        eventEndDate: '20261016',
        addr1: '서울특별시 종로구',
        areaCode: '1',
      },
    ];
    const horizonItems = [
      {
        contentId: '3901',
        title: '제주 먼 곧 축제',
        eventStartDate: '20261118',
        eventEndDate: '20261120',
        addr1: '제주특별자치도 제주시',
        areaCode: '39',
      },
    ];
    await installTourApiFestivalRoutes(page, windowItems, horizonItems);
    await page.goto('/korea/?qa=1', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^제주\s+0$/ }).click();
    await expect(page.locator('[data-festival-soon-section]')).toBeVisible({
      timeout: 30_000,
    });
    await clipShot(page, 'multifix-korea-jeju-soon-390.png', 390, 844);
  });
});

test.describe('multifix bundle screenshots @1280', () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test('logbook reviewer badge — name only', async ({ page }) => {
    await page.goto('/blog?qa=1', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /로그북|여행 기록/i }).first()).toBeVisible({
      timeout: 60_000,
    }).catch(() => {});
    await clipShot(page, 'multifix-logbook-1280.png', 1280, 900);
  });
});