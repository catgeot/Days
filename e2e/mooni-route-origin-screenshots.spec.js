import { test, expect } from './fixtures.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { installMooniGeminiMock } from './mooni-gemini-mock.js';
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';
import { dismissLocHint, enableMooniE2eLoggedIn } from './mooni-festival-chip-helpers.js';

const OUT_DIR =
  process.env.MOONI_ORIGIN_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/mooni-route-origin';

const LOADING_DETAIL_RE = /상세 불러오는 중|Loading detail/i;

async function openFestivalFromHome(page, festivalId) {
  await page.goto('/korea/');
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 90_000 });
  await dismissLocHint(page);
  const promo = page.locator('[data-social-promo-festival-row]');
  await expect(promo).toBeVisible({ timeout: 120_000 });
  await promo
    .locator(`[data-social-promo-card][data-festival-id="${festivalId}"]`)
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), { timeout: 60_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 60_000 });
  await expect(dialog.getByText(LOADING_DETAIL_RE)).toHaveCount(0, { timeout: 60_000 });
}

async function openMooni(page) {
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  await mooniBtn.click({ timeout: 60_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
    timeout: 120_000,
  });
}

const CASES = [
  { festivalId: '638576', slug: 'gukhyang' },
  { festivalId: '637693', slug: 'masan' },
];

test.describe('MOONi festival access origin flow (WebKit 390)', () => {
  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const { festivalId, slug } of CASES) {
    test(`${slug} — 가는 법 shows 17 origin chips before send`, async ({ page, context }) => {
      await installFestivalTourApiFixtures(context, { festivalId });
      await installMooniGeminiMock(context);
      await enableMooniE2eLoggedIn(page);
      await openFestivalFromHome(page, festivalId);
      await openMooni(page);
      await page.getByRole('button', { name: /🚆\s*가는 법/ }).first().click({ force: true });
      const dock = page.getByTestId('mooni-festival-access-dock');
      await expect(dock).toBeVisible({ timeout: 20_000 });
      await expect(page.locator('[data-festival-origin="seoul"]')).toBeVisible();
      await expect(page.locator('[data-festival-origin="daegu"]')).toBeVisible();
      await expect(page.locator('[data-festival-origin="incheon"]')).toBeVisible();
      await page.screenshot({
        path: join(OUT_DIR, `${slug}-${festivalId}-origin-chips.png`),
        fullPage: false,
      });
    });

    for (const originId of ['seoul', 'daegu', 'incheon']) {
      test(`${slug} — ${originId} origin sends (mock)`, async ({ page, context }) => {
        await installFestivalTourApiFixtures(context, { festivalId });
        await installMooniGeminiMock(context);
        await enableMooniE2eLoggedIn(page);
        await openFestivalFromHome(page, festivalId);
        await openMooni(page);
        await page.getByRole('button', { name: /🚆\s*가는 법/ }).first().click({ force: true });
        await expect(page.getByTestId('mooni-festival-access-dock')).toBeVisible({
          timeout: 20_000,
        });
        await page.locator(`[data-festival-origin="${originId}"]`).click({ force: true });
        await expect(
          page.getByText(/E2E-MOCK-9f3a|가는 법 카드|KTX|ITX|무궁화|동대구|마산|함평|코레일/i).first(),
        ).toBeVisible({ timeout: 90_000 });
        await page.screenshot({
          path: join(OUT_DIR, `${slug}-${festivalId}-from-${originId}.png`),
          fullPage: false,
        });
      });
    }
  }
});
