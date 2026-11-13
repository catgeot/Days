// @ts-check
import { test, expect } from './fixtures.js';

const SPOT_PATH =
  '/korea/theme/scenic?hub=jongno&spot=cha-1351100670000';

const VIEWPORTS = [
  { label: '1280', width: 1280, height: 800 },
  { label: '390', width: 390, height: 844 },
];

const BRIGHT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64',
);

async function assertBodyUnlocked(page) {
  await expect
    .poll(async () => page.evaluate(() => document.body.style.overflow), {
      timeout: 15_000,
    })
    .not.toBe('hidden');
  await expect
    .poll(async () => page.evaluate(() => document.body.style.overflowY), {
      timeout: 15_000,
    })
    .not.toBe('hidden');
  await expect
    .poll(async () => page.evaluate(() => document.querySelectorAll('[inert]').length), {
      timeout: 15_000,
    })
    .toBe(0);
}

async function shot(page, name, viewport) {
  await page.setViewportSize({
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
  });
  await page.screenshot({
    path: `/opt/cursor/artifacts/theme-scenic-nested-lightbox-${viewport.label}-${name}.png`,
    clip: {
      x: 0,
      y: 0,
      width: viewport.width,
      height: Math.min(viewport.height, 844),
    },
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`theme nested nearby lightbox — ${viewport.label}`, () => {
    test.beforeEach(async ({ context }) => {
      await context.route(/\.(jpg|jpeg|png|webp)(\?|$)/i, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: BRIGHT_PNG,
        });
      });
    });

    test('nearby food → lightbox controls → nested close', async ({ page }) => {
      test.setTimeout(180_000);
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height,
        deviceScaleFactor: 1,
      });

      await page.goto(SPOT_PATH, { waitUntil: 'domcontentloaded' });

      const rootDialog = page.getByRole('dialog').filter({
        has: page.locator('#korea-theme-spot-modal-title'),
      });
      await expect(rootDialog).toBeVisible({ timeout: 90_000 });
      await expect(rootDialog.locator('#korea-theme-spot-modal-title')).toContainText(
        /백악산/,
        { timeout: 30_000 },
      );

      const foodHeading = rootDialog.getByRole('heading', { name: '주변 맛집' });
      await foodHeading.scrollIntoViewIfNeeded();
      await expect(foodHeading).toBeVisible({ timeout: 60_000 });
      await expect(rootDialog.getByText('주변 맛집 불러오는 중')).toHaveCount(0, {
        timeout: 120_000,
      });

      const foodCard = rootDialog
        .locator('[data-scenic-nearby-variant="food"] [data-scenic-nearby-card]')
        .first();
      await expect(foodCard).toBeVisible({ timeout: 60_000 });
      const foodName = ((await foodCard.locator('span.font-bold').first().textContent()) || '').trim();
      await foodCard.click();

      await expect(page.getByRole('dialog')).toHaveCount(2, { timeout: 30_000 });
      const nestedDialog = page.getByRole('dialog').filter({ hasText: foodName }).last();
      await expect(nestedDialog).toBeVisible({ timeout: 30_000 });

      const expand = nestedDialog.getByRole('button', { name: /확대|expand/i }).first();
      await expect(expand).toBeVisible({ timeout: 60_000 });
      await expand.click();

      const lightbox = page.locator('[data-theme-spot-lightbox]');
      await expect(lightbox).toBeVisible({ timeout: 30_000 });
      await shot(page, '01-lightbox-open', viewport);

      const counter = lightbox.getByText(/\d+\s*\/\s*\d+/);
      const before = (await counter.textContent()) || '';
      const nextBtn = lightbox.getByRole('button', { name: /다음|next/i });
      if (await nextBtn.isVisible().catch(() => false)) {
        await nextBtn.click();
        await expect.poll(async () => counter.textContent()).not.toBe(before);
      }

      const closeLb = lightbox.getByRole('button', { name: /닫기|close/i });
      await closeLb.click();
      await expect(lightbox).toBeHidden({ timeout: 15_000 });
      await shot(page, '02-after-lightbox-close', viewport);

      const nestedClose = nestedDialog.getByRole('button', { name: /^닫기$/ });
      await nestedClose.click();
      await expect(page.getByRole('dialog')).toHaveCount(1, { timeout: 15_000 });

      await expect(rootDialog).toBeVisible();
      const rootClose = rootDialog.getByRole('button', { name: /^닫기$/ });
      await expect(rootClose).toBeEnabled();
      await rootClose.click();
      await expect(rootDialog).toBeHidden({ timeout: 15_000 });
      await assertBodyUnlocked(page);
      await shot(page, '03-all-modals-closed', viewport);
    });
  });
}
