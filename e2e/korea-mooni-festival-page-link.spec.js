import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR =
  process.env.MOONI_FESTIVAL_PAGE_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-mooni-festival-page-link';

const LOADING_DETAIL_RE = /상세 불러오는 중|Loading detail/i;
const LOADING_SCHEDULE_RE = /축제 일정을 불러오는 중|Loading festival schedule/i;

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  const path = join(OUT_DIR, `${name}.png`);
  await page.screenshot({ path, fullPage: false });
  return path;
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

async function openPromoGukhyang(page) {
  const promo = await waitForPromoReady(page);
  await promo
    .locator('[data-social-promo-card][data-festival-id="638576"]')
    .first()
    .click();
  await expect(page).toHaveURL(/festival=638576/, { timeout: 60_000 });
  await waitForFestivalDetailBody(page, { timeout: 15_000 });
  return page.getByRole('dialog').first();
}

async function openMooniFromDetail(page) {
  const mooniBtn = page
    .locator('[data-festival-mooni-inline]')
    .or(page.getByRole('button', { name: /무니에게 이 축제 물어보기/i }))
    .first();
  await mooniBtn.click({ timeout: 60_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
    timeout: 120_000,
  });
}

async function clickFestivalPageLinkInMooni(page) {
  const link = page
    .getByTestId('mooni-festival-opening')
    .getByRole('link', { name: /축제 페이지|festival page/i })
    .first();
  await expect(link).toBeVisible({ timeout: 120_000 });
  await link.click();
}

async function selectSidoChip(page, pattern) {
  const chip = page.getByRole('button', { name: pattern }).first();
  await expect(chip).toBeVisible({ timeout: 30_000 });
  await chip.click();
}

async function openFestivalFromSearch(page, query, festivalId) {
  await waitForKoreaHome(page);
  const searchToggle = page.getByRole('button', {
    name: /축제 검색|Search festivals/i,
  });
  await searchToggle.click();
  const searchInput = page.getByRole('searchbox').first();
  await searchInput.fill(query);
  await searchInput.press('Enter');
  const hit = page.locator(`[data-festival-id="${festivalId}"]`).first();
  await expect(hit).toBeVisible({ timeout: 60_000 });
  await hit.click();
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), {
    timeout: 60_000,
  });
  await waitForFestivalDetailBody(page, { timeout: 15_000 });
  return page.getByRole('dialog').first();
}

test.describe('korea festival deeplink entries @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(300_000);

  test('638576 MOONi 축제 페이지 — body loaded, 전국 after 강원 chip', async ({
    page,
  }) => {
    await waitForKoreaHome(page);
    await selectSidoChip(page, /강원/);
    await expect(page.getByText(/강릉|K-Drone|커피/i).first()).toBeVisible({
      timeout: 60_000,
    });

    await waitForKoreaHome(page);
    await expect(
      page.getByText('GATEO가 소개하는 축제', { exact: true }),
    ).toBeVisible({ timeout: 120_000 });

    await openPromoGukhyang(page);
    await shot(page, '01-gukhyang-detail-before-mooni');
    await openMooniFromDetail(page);
    await shot(page, '02-mooni-with-festival-page-link');
    await clickFestivalPageLinkInMooni(page);

    await expect(page.getByTestId('mooni-festival-opening')).toHaveCount(0, {
      timeout: 30_000,
    });
    const dialog = await waitForFestivalDetailBody(page, { timeout: 10_000 });
    await expect(dialog.getByRole('heading', { name: /국향대전/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^전국/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await shot(page, '03-gukhyang-detail-after-mooni-link-loaded');
  });

  test('2930716 in-window — MOONi 축제 페이지 body loaded', async ({ page }) => {
    const dialog = await openFestivalFromSearch(page, '강릉 국수', '2930716');
    await expect(dialog.getByRole('heading', { name: /강릉 국수/i })).toBeVisible();
    await openMooniFromDetail(page);
    await clickFestivalPageLinkInMooni(page);
    await waitForFestivalDetailBody(page, { timeout: 10_000 });
    await expect(dialog.getByRole('heading', { name: /강릉 국수/i })).toBeVisible();
    await shot(page, '04-gangneung-after-mooni-link-loaded');
  });

  test('서울 in-window — MOONi 축제 페이지 body loaded', async ({ page }) => {
    await waitForKoreaHome(page);
    await selectSidoChip(page, /서울/);
    const firstCard = page
      .getByRole('main')
      .locator('[data-festival-id]')
      .first();
    await expect(firstCard).toBeVisible({ timeout: 60_000 });
    const festivalId = await firstCard.getAttribute('data-festival-id');
    expect(festivalId).toMatch(/^\d+$/);
    await firstCard.click();
    await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), {
      timeout: 60_000,
    });
    const dialog = await waitForFestivalDetailBody(page, { timeout: 15_000 });
    await openMooniFromDetail(page);
    await clickFestivalPageLinkInMooni(page);
    await waitForFestivalDetailBody(page, { timeout: 10_000 });
    await shot(page, '05-seoul-in-window-mooni-link-loaded');
  });

  test('가리산 인근 축제 산천어 — out-of-window deeplink body loaded', async ({
    page,
  }) => {
    await page.goto('/korea/theme/scenic?hub=hongcheon');
    await expect(
      page.getByRole('heading', { name: /한국의 명승|Korea scenic/i }),
    ).toBeVisible({ timeout: 90_000 });

    const garisan = page
      .getByRole('button', { name: /가리산/ })
      .filter({ hasNotText: /자연휴양림/ })
      .first();
    await expect(garisan).toBeVisible({ timeout: 60_000 });
    await garisan.click();

    const spotDialog = page.getByRole('dialog').last();
    await expect(spotDialog).toBeVisible({ timeout: 30_000 });
    const nearFestHeading = spotDialog.getByRole('heading', { name: /인근 축제/i });
    await nearFestHeading.scrollIntoViewIfNeeded();
    await expect(nearFestHeading).toBeVisible({ timeout: 60_000 });
    await expect(spotDialog.getByText(/인근 축제 불러오는 중/i)).toHaveCount(0, {
      timeout: 90_000,
    });

    const sancheoneo = spotDialog
      .getByRole('button', { name: /산천어|화천/i })
      .first();
    await expect(sancheoneo).toBeVisible({ timeout: 90_000 });
    await sancheoneo.click();

    await expect(page).toHaveURL(/\/korea\?.*festival=\d+/, { timeout: 60_000 });
    await expect(page.getByText(LOADING_SCHEDULE_RE)).toHaveCount(0, {
      timeout: 10_000,
    });
    const festDialog = await waitForFestivalDetailBody(page, { timeout: 15_000 });
    await expect(
      festDialog.getByRole('heading', { name: /얼음나라화천 산천어축제/i }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /^전국/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await shot(page, '06-garisan-sancheoneo-detail-loaded');
  });
});
