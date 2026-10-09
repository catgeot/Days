import { test, expect } from './fixtures.js';

const FESTIVAL_ID = '2930716';

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

async function openFestivalDetail(page) {
  await page.goto('/korea/');
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 90_000 });
  await dismissLocHint(page);
  await page.goto(`/korea/?festival=${FESTIVAL_ID}`);
  await dismissLocHint(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  await expect(dialog.getByText(/강릉|국수/i).first()).toBeVisible({ timeout: 90_000 });
  return dialog;
}

test.describe('Gangneung festival stay strip', () => {
  test('mobile 390 — nearby attractions then 강릉 숙소 with cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const dialog = await openFestivalDetail(page);

    const nearAttractions = dialog.locator('[data-festival-section="nearAttractions"]');
    const lodging = dialog.locator('[data-festival-section="lodging"]');
    await expect(nearAttractions).toBeVisible({ timeout: 60_000 });
    await expect(lodging).toBeVisible({ timeout: 60_000 });

    const nearBox = await nearAttractions.boundingBox();
    const lodgeBox = await lodging.boundingBox();
    expect(nearBox).toBeTruthy();
    expect(lodgeBox).toBeTruthy();
    expect(lodgeBox.y).toBeGreaterThan(nearBox.y);

    await expect(dialog.getByRole('heading', { name: /강릉 숙소/ })).toBeVisible({
      timeout: 60_000,
    });

    const stayCards = dialog.locator('a[href*="accommodation.myrealtrip.com"]');
    await expect(stayCards.first()).toBeVisible({ timeout: 120_000 });
    expect(await stayCards.count()).toBeGreaterThan(0);

    await page.screenshot({
      path: '/opt/cursor/artifacts/gangneung-festival-stay-390.png',
      fullPage: true,
    });
  });

  test('desktop 1280 sanity', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const dialog = await openFestivalDetail(page);
    await expect(dialog.locator('[data-festival-section="lodging"]')).toBeVisible({
      timeout: 60_000,
    });
    await expect(dialog.getByRole('heading', { name: /강릉 숙소/ })).toBeVisible({
      timeout: 60_000,
    });
    await page.screenshot({
      path: '/opt/cursor/artifacts/gangneung-festival-stay-1280.png',
      fullPage: false,
    });
  });
});
