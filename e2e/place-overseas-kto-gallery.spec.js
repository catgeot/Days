// Overseas place gallery — no KTO/TourAPI credit; section header toggle UX.
import { test, expect } from './fixtures.js';

test.use({ ignoreHTTPSErrors: true });

const OVERSEAS_PHOTO = [
  { path: '/place/cairo?lang=ko', label: 'cairo' },
  { path: '/place/rio-de-janeiro?lang=ko', label: 'rio' },
  { path: '/place/bangkok?lang=ko', label: 'bangkok' },
  { path: '/place/paris?lang=ko', label: 'paris' },
];

async function waitGalleryReady(page) {
  await page.waitForLoadState('networkidle', { timeout: 120_000 });
  const marker = page
    .locator('[data-local-info="gallery"]')
    .or(page.getByText(/더 많은 사진|Unsplash|사진:/))
    .first();
  await expect(marker).toBeVisible({ timeout: 120_000 });
}

async function assertSectionToggle(page) {
  const localInfo = page.locator('[data-local-info="gallery"]:visible').first();
  await expect(localInfo).toBeVisible({ timeout: 60_000 });
  const headerBtn = localInfo.getByRole('button', { name: /현지 정보/ }).first();
  await expect(headerBtn).toBeVisible();
  await expect(headerBtn).toHaveAttribute('aria-expanded', 'false');
  await expect(localInfo.locator('[data-section-toggle-label]')).toContainText(/접기|펼치기/);
  await expect(page.locator('[data-local-info-row]:visible')).toHaveCount(0);
  await headerBtn.click();
  await expect(headerBtn).toHaveAttribute('aria-expanded', 'true');
  await headerBtn.click();
  await expect(headerBtn).toHaveAttribute('aria-expanded', 'false');
}

async function clipShot(page, fileName) {
  const { width, height } = page.viewportSize();
  await page.screenshot({
    path: `/opt/cursor/artifacts/${fileName}`,
    clip: { x: 0, y: 0, width, height },
  });
}

test.describe('place overseas gallery — no KTO @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
  });

  for (const place of OVERSEAS_PHOTO) {
    test(`${place.label} — no 한국관광공사 credit`, async ({ page }) => {
      await page.goto(place.path);
      await waitGalleryReady(page);
      if (place.label === 'cairo') {
        await assertSectionToggle(page);
      }
      await expect(page.getByText('사진: 한국관광공사')).toHaveCount(0);
      await clipShot(page, `place-${place.label}-kto-fix-390.png`);
    });
  }

  test('jeju — domestic may show KTO attribution', async ({ page }) => {
    await page.goto('/place/jeju?lang=ko');
    await waitGalleryReady(page);
    await clipShot(page, 'place-jeju-kto-control-390.png');
  });
});

test.describe('place overseas gallery — desktop header toggle @1280', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('cairo — section header toggle', async ({ page }) => {
    await page.goto('/place/cairo?lang=ko');
    await waitGalleryReady(page);
    await assertSectionToggle(page);
    await clipShot(page, 'place-cairo-section-header-1280.png');
  });

  test('bangkok — no KTO + header area', async ({ page }) => {
    await page.goto('/place/bangkok?lang=ko');
    await waitGalleryReady(page);
    await expect(page.getByText('사진: 한국관광공사')).toHaveCount(0);
    await clipShot(page, 'place-bangkok-section-1280.png');
  });

  test('jeju — desktop control', async ({ page }) => {
    await page.goto('/place/jeju?lang=ko');
    await waitGalleryReady(page);
    await clipShot(page, 'place-jeju-section-1280.png');
  });
});
