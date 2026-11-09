// @ts-check
import { test, expect } from './fixtures.js';
import { installFestivalBackOverviewFixtures } from './festival-back-overview-fixture.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';

const BRIGHT_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  'base64',
);

const VIEWPORTS = [
  { label: '390', width: 390, height: 844 },
  { label: '1280', width: 1280, height: 800 },
];

async function shot(page, name, viewport) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
  await page.screenshot({
    path: `/opt/cursor/artifacts/lightbox-escape-focus-${viewport.label}-${name}.png`,
    clip: { x: 0, y: 0, width: viewport.width, height: Math.min(viewport.height, 844) },
  });
}

for (const viewport of VIEWPORTS) {
  test.describe(`lightbox Esc + focus — ${viewport.label}`, () => {
    test.beforeEach(async ({ context }) => {
      await installFestivalBackOverviewFixtures(context);
      await context.route(/e2e-static\.gateo\.test/i, async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'image/png',
          body: BRIGHT_PNG,
        });
      });
    });

    test('festival sheet: Esc closes lightbox only, sheet stays open', async ({ page }) => {
      test.setTimeout(120_000);
      await page.setViewportSize({ width: viewport.width, height: viewport.height, deviceScaleFactor: 1 });
      const id = '825295';
      await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
      await dismissLocHint(page);
      await page.goto(`/korea/?festival=${id}`, { waitUntil: 'domcontentloaded' });

      const sheet = page.getByRole('dialog').filter({ has: page.locator('#korea-festival-sheet-title') });
      await expect(sheet).toBeVisible({ timeout: 60_000 });

      await expect(sheet.locator('[data-festival-hero-thumbs-scroller]')).toBeVisible({ timeout: 30_000 });
      const expand = sheet.locator('[data-festival-hero-expand="ready"]');
      await expect(expand).toBeVisible({ timeout: 30_000 });
      await expand.click();
      const lightbox = page.locator('[data-festival-lightbox]');
      await expect(lightbox).toBeVisible({ timeout: 30_000 });
      await shot(page, '01-open', viewport);

      await expect.poll(async () => page.evaluate(() => {
        const el = document.querySelector('[data-gateo-photo-lightbox-focus]');
        return el === document.activeElement || Boolean(el?.contains(document.activeElement));
      })).toBe(true);

      await page.keyboard.press('Escape');
      await expect(lightbox).toBeHidden({ timeout: 15_000 });
      await shot(page, '02-after-esc', viewport);

      await expect(sheet).toBeVisible();
      await expect(sheet.locator('#korea-festival-sheet-title')).toContainText('강릉커피축제');
    });
  });
}
