import { test, expect } from './fixtures.js';

const FESTIVAL_ID = '2930716';
const FESTIVAL_SEARCH = '강릉 국수';

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

function festivalCards(page) {
  return page
    .getByRole('main')
    .getByRole('button')
    .filter({ has: page.locator('img[alt]') });
}

async function openFestivalDetailTraveler(page) {
  await page.goto('/korea/');
  await expect(
    page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
  ).toBeVisible({ timeout: 90_000 });
  await dismissLocHint(page);

  const mobileSearchBtn = page.getByRole('banner').getByRole('button', { name: '축제 검색' });
  const pcSearch = page.locator('#korea-festival-search-pc');
  const mobileSearch = page.locator('#korea-festival-search');
  if (await mobileSearchBtn.isVisible().catch(() => false)) {
    await mobileSearchBtn.click();
    await expect(mobileSearch).toBeVisible({ timeout: 15_000 });
    await mobileSearch.fill(FESTIVAL_SEARCH);
    await mobileSearch.press('Enter');
  } else {
    await expect(pcSearch).toBeVisible({ timeout: 30_000 });
    await pcSearch.fill(FESTIVAL_SEARCH);
    await pcSearch.press('Enter');
  }

  await expect(
    page.getByRole('main').getByRole('heading', { name: new RegExp(FESTIVAL_SEARCH) }),
  ).toBeVisible({ timeout: 60_000 });

  const targetCard = page.locator(`[data-festival-id="${FESTIVAL_ID}"]`).first();
  await expect(targetCard).toBeVisible({ timeout: 60_000 });
  await targetCard.click();

  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 90_000 });
  await expect(dialog.getByText(/강릉|국수/i).first()).toBeVisible({ timeout: 90_000 });
  return dialog;
}

async function screenshotLodgingViewport(page, dialog, path) {
  const nearAttractions = dialog.locator('[data-festival-section="nearAttractions"]');
  const lodging = dialog.locator('[data-festival-section="lodging"]');
  await expect(nearAttractions).toBeVisible({ timeout: 60_000 });
  await expect(lodging).toBeVisible({ timeout: 60_000 });
  await expect(dialog.getByRole('heading', { name: /강릉 숙소/ })).toBeVisible({
    timeout: 120_000,
  });
  const stayCardImg = lodging.locator('img[alt]').first();
  await expect(stayCardImg).toBeVisible({ timeout: 120_000 });

  await stayCardImg.scrollIntoViewIfNeeded();
  await dialog.evaluate((dialogEl) => {
    const near = dialogEl.querySelector('[data-festival-section="nearAttractions"]');
    const lodge = dialogEl.querySelector('[data-festival-section="lodging"]');
    const card = lodge?.querySelector('img[alt]');
    if (!near || !lodge || !card) return;
    let root = dialogEl;
    for (let n = dialogEl; n; n = n.parentElement) {
      const oy = getComputedStyle(n).overflowY;
      if (
        (oy === 'auto' || oy === 'scroll') &&
        n.scrollHeight > n.clientHeight + 8
      ) {
        root = n;
        break;
      }
    }
    const rr = () => root.getBoundingClientRect();
    for (let i = 0; i < 24; i += 1) {
      const r = rr();
      const nr = near.getBoundingClientRect();
      const cr = card.getBoundingClientRect();
      const nearLabel = near.querySelector('p');
      const labelTop = nearLabel ? nearLabel.getBoundingClientRect().top : nr.top;
      const ok =
        labelTop >= r.top - 2 &&
        labelTop <= r.top + 72 &&
        cr.top >= nr.top &&
        cr.bottom <= r.bottom + 2;
      if (ok) break;
      if (cr.bottom > r.bottom - 12) {
        root.scrollTop += cr.bottom - r.bottom + 16;
      } else if (labelTop < r.top + 8) {
        root.scrollTop += labelTop - r.top - 12;
      } else if (cr.top < nr.bottom + 8) {
        root.scrollTop += cr.top - nr.bottom - 12;
      } else {
        root.scrollTop -= 24;
      }
    }
  });
  await page.waitForTimeout(500);
  await expect(nearAttractions.getByText(/주변 관광지/)).toBeVisible();
  await expect(lodging.getByText(/강릉 숙소/).first()).toBeVisible();
  await expect(stayCardImg).toBeVisible();
  await page.screenshot({ path, fullPage: false });
}

test.describe('Gangneung festival stay strip', () => {
  test('mobile 390 — traveler route, 주변 관광지 then 강릉 숙소', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const dialog = await openFestivalDetailTraveler(page);

    const nearAttractions = dialog.locator('[data-festival-section="nearAttractions"]');
    const lodging = dialog.locator('[data-festival-section="lodging"]');
    const nearBox = await nearAttractions.boundingBox();
    const lodgeBox = await lodging.boundingBox();
    expect(nearBox).toBeTruthy();
    expect(lodgeBox).toBeTruthy();
    expect(lodgeBox.y).toBeGreaterThan(nearBox.y);

    await screenshotLodgingViewport(
      page,
      dialog,
      '/opt/cursor/artifacts/gangneung-festival-stay-390.png',
    );
    await page.screenshot({
      path: '/workspace/artifacts/gangneung-festival-stay/gangneung-festival-stay-390.png',
      fullPage: false,
    });
  });

  test('desktop 1280 sanity', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    const dialog = await openFestivalDetailTraveler(page);
    await screenshotLodgingViewport(
      page,
      dialog,
      '/opt/cursor/artifacts/gangneung-festival-stay-1280.png',
    );
    await page.screenshot({
      path: '/workspace/artifacts/gangneung-festival-stay/gangneung-festival-stay-1280.png',
      fullPage: false,
    });
  });
});
