import { devices } from '@playwright/test';
import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR =
  process.env.INAPP_FESTIVAL_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-festival-cold-deeplink';

const LOADING_DETAIL_RE = /상세 불러오는 중|Loading detail/i;
const LOADING_SCHEDULE_RE = /축제 일정을 불러오는 중|Loading festival schedule/i;

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

function assertTourApiBudget(tourCalls, festivalId) {
  expect(
    tourCalls.filter((c) => c.action === 'festivalDetail' && c.contentId === festivalId)
      .length,
  ).toBeLessThanOrEqual(2);
  expect(tourCalls.length).toBeLessThanOrEqual(12);
}

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  await page.screenshot({ path: join(OUT_DIR, `${name}.png`), fullPage: false });
}

async function dismissLocHint(page) {
  try {
    await page
      .getByRole('main')
      .getByRole('button', { name: /^닫기$|^Close$/i })
      .first()
      .click({ timeout: 2000 });
  } catch {
    /* optional */
  }
}

async function waitForKoreaHome(page) {
  await page.goto('/korea/');
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 90_000 });
  await dismissLocHint(page);
}

async function waitForPromoReady(page) {
  const promo = page.locator('[data-social-promo-festival-row]');
  await expect(promo).toBeVisible({ timeout: 120_000 });
  await expect(promo).toHaveAttribute('data-social-promo-loading', 'false', {
    timeout: 120_000,
  });
  return promo;
}

async function waitForFestivalDetailBody(page, { timeout = 3_000 } = {}) {
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

async function tapPromoCard(page, festivalId) {
  const promo = await waitForPromoReady(page);
  const t0 = Date.now();
  await promo
    .locator(`[data-social-promo-card][data-festival-id="${festivalId}"]`)
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), {
    timeout: 15_000,
  });
  await waitForFestivalDetailBody(page, { timeout: 3_000 });
  expect(Date.now() - t0).toBeLessThan(3_500);
}

test.describe('korea festival in-app open @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    locale: 'ko-KR',
    timezoneId: 'Asia/Seoul',
    ignoreHTTPSErrors: true,
    userAgent: devices['iPhone 13'].userAgent,
  });
  test.setTimeout(180_000);

  test('promo card 국향대전 638576 — body ≤3s', async ({ page }) => {
    const tourCalls = [];
    page.on('request', (req) => trackTourApiAction(req, tourCalls));
    await waitForKoreaHome(page);
    await tapPromoCard(page, '638576');
    assertTourApiBudget(tourCalls, '638576');
    await shot(page, 'promo-tap-gukhyang-638576');
  });

  test('promo card 마산 637693 — body ≤3s', async ({ page }) => {
    const tourCalls = [];
    page.on('request', (req) => trackTourApiAction(req, tourCalls));
    await waitForKoreaHome(page);
    await tapPromoCard(page, '637693');
    assertTourApiBudget(tourCalls, '637693');
    await shot(page, 'promo-tap-masan-637693');
  });

  test('MOONi 축제 페이지 link 638576', async ({ page }) => {
    const tourCalls = [];
    page.on('request', (req) => trackTourApiAction(req, tourCalls));
    await waitForKoreaHome(page);
    await tapPromoCard(page, '638576');
    const mooniBtn = page
      .locator('[data-festival-mooni-inline]')
      .or(page.getByRole('button', { name: /무니에게 이 축제 물어보기/i }))
      .first();
    await mooniBtn.click({ timeout: 60_000 });
    await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
      timeout: 120_000,
    });
    await page
      .getByTestId('mooni-festival-opening')
      .getByRole('link', { name: /축제 페이지|festival page/i })
      .first()
      .click();
    await waitForFestivalDetailBody(page, { timeout: 10_000 });
    assertTourApiBudget(tourCalls, '638576');
    await shot(page, 'mooni-link-638576');
  });

  test('가리산 인근 축제 산천어', async ({ page }) => {
    await page.goto('/korea/theme/scenic?hub=hongcheon');
    await expect(
      page.getByRole('heading', { name: /한국의 명승|Korea scenic/i }),
    ).toBeVisible({ timeout: 90_000 });
    const garisan = page
      .getByRole('button', { name: /가리산/ })
      .filter({ hasNotText: /자연휴양림/ })
      .first();
    await garisan.click();
    const spotDialog = page.getByRole('dialog').last();
    await spotDialog.getByRole('heading', { name: /인근 축제/i }).waitFor({
      timeout: 60_000,
    });
    await spotDialog.getByText(/인근 축제 불러오는 중/i).waitFor({
      state: 'hidden',
      timeout: 90_000,
    });
    await spotDialog.getByRole('button', { name: /산천어|화천/i }).first().click();
    await expect(page).toHaveURL(/festival=\d+/, { timeout: 60_000 });
    await waitForFestivalDetailBody(page, { timeout: 15_000 });
    await shot(page, 'garisan-sancheoneo-inapp');
  });
});
