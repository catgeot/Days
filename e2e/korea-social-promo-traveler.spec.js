import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const OUT_DIR =
  process.env.SOCIAL_PROMO_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-social-promo-traveler';

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

test.describe('korea social promo traveler @390', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('utm profile → promo → detail → close pin → search 국향', async ({
    page,
  }) => {
    await page.goto('/korea/?utm_source=instagram&utm_medium=profile');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible({ timeout: 90_000 });
    await dismissLocHint(page);

    const promoRow = page.locator('[data-social-promo-festival-row]');
    await expect(promoRow).toBeVisible({ timeout: 120_000 });
    const paths = [];
    paths.push(await shot(page, '01-home-promo-row'));

    const gukhyangCard = promoRow
      .locator('[data-social-promo-card][data-festival-id="638576"]')
      .first();
    await expect(gukhyangCard).toBeVisible({ timeout: 30_000 });
    await gukhyangCard.click();

    await expect(page).toHaveURL(/festival=638576/, { timeout: 60_000 });
    paths.push(await shot(page, '02-detail-sheet'));

    const closeDetail = page
      .getByRole('dialog')
      .getByRole('button', { name: /^닫기$|^Close$/i })
      .first();
    await expect(closeDetail).toBeVisible({ timeout: 30_000 });
    await closeDetail.click();
    await expect(page).not.toHaveURL(/festival=638576/, { timeout: 30_000 });

    const pinned = page.locator('[data-session-pinned-festival]');
    await expect(pinned).toBeVisible({ timeout: 15_000 });
    await expect(
      pinned.locator('[data-festival-id="638576"]'),
    ).toBeVisible();
    paths.push(await shot(page, '03-pinned-after-close'));

    const searchToggle = page.getByRole('button', {
      name: /축제 검색|Search festivals/i,
    });
    await searchToggle.click();
    const searchInput = page.getByRole('searchbox').first();
    await searchInput.fill('국향');
    await searchInput.press('Enter');
    await expect(
      page.getByRole('main').locator('[data-festival-id="638576"]').first(),
    ).toBeVisible({ timeout: 30_000 });
    paths.push(await shot(page, '04-search-gukhyang'));

    await test.info().attach('screenshot-paths.txt', {
      body: paths.join('\n'),
      contentType: 'text/plain',
    });
  });
});
