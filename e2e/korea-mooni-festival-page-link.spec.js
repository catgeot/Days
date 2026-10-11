import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR =
  process.env.MOONI_FESTIVAL_PAGE_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-mooni-festival-page-link';

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

async function openPromoGukhyang(page) {
  const promo = await waitForPromoReady(page);
  await promo
    .locator('[data-social-promo-card][data-festival-id="638576"]')
    .first()
    .click();
  await expect(page).toHaveURL(/festival=638576/, { timeout: 60_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog.getByRole('heading', { name: /국향대전/i })).toBeVisible({
    timeout: 90_000,
  });
  return dialog;
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

test.describe('korea MOONi festival page link @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(300_000);

  test('promo 638576: MOONi 축제 페이지 opens detail after stale 강원 chip', async ({
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
    const sheet = page.getByRole('dialog').first();
    await expect(sheet.getByRole('heading', { name: /국향대전/i })).toBeVisible({
      timeout: 90_000,
    });
    await expect(page.locator('[data-festival-detail-asof]').first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('button', { name: /^전국/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await shot(page, '03-gukhyang-detail-after-mooni-link');
  });

  test('in-window 2930716: MOONi 축제 페이지 reopens detail', async ({ page }) => {
    await waitForKoreaHome(page);
    const searchToggle = page.getByRole('button', {
      name: /축제 검색|Search festivals/i,
    });
    await searchToggle.click();
    const searchInput = page.getByRole('searchbox').first();
    await searchInput.fill('강릉 국수');
    await searchInput.press('Enter');
    const hit = page.locator('[data-festival-id="2930716"]').first();
    await expect(hit).toBeVisible({ timeout: 60_000 });
    await hit.click();
    await expect(page).toHaveURL(/festival=2930716/, { timeout: 60_000 });
    const dialog = page.getByRole('dialog').first();
    await expect(dialog.getByRole('heading', { name: /강릉 국수/i })).toBeVisible({
      timeout: 90_000,
    });
    await openMooniFromDetail(page);
    await clickFestivalPageLinkInMooni(page);
    await expect(dialog.getByRole('heading', { name: /강릉 국수/i })).toBeVisible({
      timeout: 60_000,
    });
    await shot(page, '04-gangneung-after-mooni-link');
  });
});
