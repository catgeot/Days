/**
 * Real MOONi festival_access flow on a deployed Preview (prod gemini edge).
 * MOONI_ROUTE_ORIGIN_LIVE=1 PLAYWRIGHT_BASE_URL=https://…vercel.app npx playwright test -c playwright.config.mooni-route-origin.js
 */
import { test, expect } from './fixtures.js';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { dismissLocHint, enableMooniE2eLoggedIn } from './mooni-festival-chip-helpers.js';

const LIVE = process.env.MOONI_ROUTE_ORIGIN_LIVE === '1';
const OUT_DIR =
  process.env.MOONI_ORIGIN_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/mooni-route-origin';

const LOADING_DETAIL_RE = /상세 불러오는 중|Loading detail/i;

async function openKoreaFestivalsFromHome(page) {
  await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 120_000 });
  await expect(page.locator('#root')).toBeVisible({ timeout: 90_000 });
  const koreaLink = page.locator('a[href*="/korea"]').first();
  await expect(koreaLink).toBeVisible({ timeout: 90_000 });
  await koreaLink.click();
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 120_000 });
  await dismissLocHint(page);
}

async function openFestivalPromoCard(page, festivalId) {
  const promo = page.locator('[data-social-promo-festival-row]');
  await expect(promo).toBeVisible({ timeout: 180_000 });
  await promo
    .locator(`[data-social-promo-card][data-festival-id="${festivalId}"]`)
    .first()
    .click();
  await expect(page).toHaveURL(new RegExp(`festival=${festivalId}`), { timeout: 90_000 });
  const dialog = page.getByRole('dialog').first();
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  await expect(dialog.getByText(LOADING_DETAIL_RE)).toHaveCount(0, { timeout: 120_000 });
}

async function openMooni(page) {
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  await mooniBtn.click({ timeout: 90_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
    timeout: 180_000,
  });
}

const FLOWS = [
  {
    festivalId: '638576',
    slug: 'gukhyang',
    origins: ['seoul', 'incheon'],
    captureOriginDock: true,
  },
  {
    festivalId: '637693',
    slug: 'masan',
    origins: ['daegu'],
    captureOriginDock: true,
  },
];

test.describe('MOONi access — Vercel preview live (WebKit 390)', () => {
  test.skip(!LIVE, 'set MOONI_ROUTE_ORIGIN_LIVE=1 and PLAYWRIGHT_BASE_URL to a Preview host');

  test.beforeAll(() => {
    mkdirSync(OUT_DIR, { recursive: true });
  });

  test.describe.configure({ mode: 'serial' });

  for (const flow of FLOWS) {
    test(`${flow.slug} — origin dock`, async ({ page }) => {
      test.setTimeout(360_000);
      await enableMooniE2eLoggedIn(page);
      await openKoreaFestivalsFromHome(page);
      await openFestivalPromoCard(page, flow.festivalId);
      await openMooni(page);
      await page.getByRole('button', { name: /🚆\s*가는 법/ }).first().click({ force: true });
      const dock = page.getByTestId('mooni-festival-access-dock');
      await expect(dock).toBeVisible({ timeout: 30_000 });
      await expect(page.locator('[data-festival-origin="seoul"]')).toBeVisible();
      await page.screenshot({
        path: join(OUT_DIR, `preview-${flow.slug}-${flow.festivalId}-origin-dock.png`),
        fullPage: false,
      });
    });

    for (const originId of flow.origins) {
      test(`${flow.slug} — ${originId} reply + booking footer`, async ({ page }) => {
        test.setTimeout(420_000);
        await enableMooniE2eLoggedIn(page);
        await openKoreaFestivalsFromHome(page);
        await openFestivalPromoCard(page, flow.festivalId);
        await openMooni(page);
        await page.getByRole('button', { name: /🚆\s*가는 법/ }).first().click({ force: true });
        await expect(page.getByTestId('mooni-festival-access-dock')).toBeVisible({
          timeout: 30_000,
        });
        await page.locator(`[data-festival-origin="${originId}"]`).click({ force: true });
        await expect(
          page.getByText(/버스타고|bustago|코레일|letskorail|KTX|SRT|고속버스/i).first(),
        ).toBeVisible({ timeout: 240_000 });
        await expect(page.getByText(/교통\s*·\s*티켓/).first()).toHaveCount(0, { timeout: 5_000 });
        await page.screenshot({
          path: join(
            OUT_DIR,
            `preview-${flow.slug}-${flow.festivalId}-from-${originId}-footer.png`,
          ),
          fullPage: false,
        });
      });
    }
  }
});
