import { devices } from '@playwright/test';
import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR =
  process.env.COLD_FESTIVAL_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-festival-cold-deeplink';

const INSTAGRAM_IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/21F90 Instagram 359.0.0.0.0 (iPhone15,4; iOS 17_5_1; ko_KR; ko; scale=3.00; 1179x2556; 644448486)';

const LOADING_DETAIL_RE = /상세 불러오는 중|Loading detail/i;
const LOADING_SCHEDULE_RE = /축제 일정을 불러오는 중|Loading festival schedule/i;

/** Deduped tourapi-proxy Edge actions (cold-open budget). */
function trackTourApiAction(req, tourCalls) {
  if (!/tourapi-proxy/i.test(req.url())) return;
  try {
    const raw = req.postData();
    if (!raw) return;
    const body = JSON.parse(raw);
    if (!body?.action) return;
    tourCalls.push({
      action: String(body.action),
      contentId: String(body.contentId || body.contentid || ''),
    });
  } catch {
    /* ignore */
  }
}

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
}

async function assertMainThreadResponsive(page) {
  const start = Date.now();
  await expect
    .poll(
      async () => {
        try {
          return await Promise.race([
            page.evaluate(() => true),
            new Promise((_, rej) =>
              setTimeout(() => rej(new Error('blocked')), 1000),
            ),
          ]);
        } catch {
          return false;
        }
      },
      { timeout: 2000 },
    )
    .toBe(true);
  expect(Date.now() - start).toBeLessThan(1500);
}

async function waitForFestivalDetailBody(page, { timeout = 10_000 } = {}) {
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(LOADING_SCHEDULE_RE)).toHaveCount(0, { timeout });
  await expect(dialog.getByText(LOADING_DETAIL_RE)).toHaveCount(0, { timeout });
  const loaded = dialog
    .getByRole('tab', { name: /정보|Info/i })
    .or(dialog.getByText(/개요|Overview/i))
    .or(dialog.locator('[data-festival-detail-asof]'));
  await expect(loaded.first()).toBeVisible({ timeout });
  return dialog;
}

/** Regression guard: no deeplink detail refetch storm (LIVE froze after 2–3). */
function assertColdOpenTourApiBudget(tourCalls, festivalId) {
  const detailsForTarget = tourCalls.filter(
    (c) => c.action === 'festivalDetail' && c.contentId === festivalId,
  ).length;
  expect(detailsForTarget).toBeLessThanOrEqual(1);
  expect(tourCalls.length).toBeLessThanOrEqual(12);
}

async function coldOpenFestival(page, festivalId, { label }) {
  const tourCalls = [];
  const handler = (req) => trackTourApiAction(req, tourCalls);
  page.on('request', handler);
  const t0 = Date.now();
  await page.goto(`/korea/?festival=${festivalId}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForFestivalDetailBody(page, { timeout: 10_000 });
  page.off('request', handler);
  await assertMainThreadResponsive(page);
  expect(Date.now() - t0).toBeLessThan(10_000);
  assertColdOpenTourApiBudget(tourCalls, festivalId);
  await shot(page, label);
}

test.describe('korea festival cold deeplink @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
    userAgent: devices['iPhone 13'].userAgent,
  });
  test.setTimeout(180_000);

  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  test('638576 국향 — cold open', async ({ page }) => {
    await coldOpenFestival(page, '638576', {
      label: '01-cold-638576-gukhyang',
    });
  });

  test('638576 국향 — 강원 칩 후 cold festival URL', async ({ page }) => {
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await page.getByRole('button', { name: /^강원/ }).first().click();
    await expect(page.getByRole('button', { name: /^강원/ }).first()).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await coldOpenFestival(page, '638576', {
      label: '02-cold-638576-after-gangwon-chip',
    });
  });

  test('637693 마산국화 — cold open', async ({ page }) => {
    await coldOpenFestival(page, '637693', {
      label: '03-cold-637693-masan',
    });
  });

  test('507599 산천어 — cold open', async ({ page }) => {
    await coldOpenFestival(page, '507599', {
      label: '04-cold-507599-sancheoneo',
    });
  });

  test('2930716 in-window — cold open', async ({ page }) => {
    await coldOpenFestival(page, '2930716', {
      label: '05-cold-2930716-in-window',
    });
  });
});

test.describe('korea festival cold deeplink Instagram UA @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
    userAgent: INSTAGRAM_IOS_UA,
    isMobile: true,
    hasTouch: true,
  });
  test.setTimeout(180_000);

  test('638576 — Instagram in-app cold open', async ({ page, context }) => {
    await context.clearCookies();
    const cdp = await context.newCDPSession(page);
    await cdp.send('Network.enable');
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (400 * 1024) / 8,
      uploadThroughput: (400 * 1024) / 8,
      latency: 400,
    });

    const tourCalls = [];
    const handler = (req) => trackTourApiAction(req, tourCalls);
    page.on('request', handler);

    const t0 = Date.now();
    await page.goto('/korea/?festival=638576', { waitUntil: 'domcontentloaded' });
    await waitForFestivalDetailBody(page, { timeout: 55_000 });
    page.off('request', handler);
    await assertMainThreadResponsive(page);
    expect(Date.now() - t0).toBeLessThan(60_000);
    assertColdOpenTourApiBudget(tourCalls, '638576');
    await shot(page, '06-cold-638576-instagram-slow4g');
  });
});
