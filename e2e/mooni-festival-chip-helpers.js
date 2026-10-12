import { expect } from '@playwright/test';

export const E2E_FESTIVAL_ID = '2989642';

export async function dismissLocHint(page) {
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

export async function clearFestivalListSessionCache(page) {
  await page.addInitScript(() => {
    try {
      sessionStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
      sessionStorage.removeItem('gateo:korea-festivals:v2:rolling12:en');
      localStorage.removeItem('gateo:korea-festivals:v2:rolling12:ko');
      localStorage.removeItem('gateo:korea-festivals:v2:rolling12:en');
    } catch {
      /* ignore */
    }
  });
}

export async function enableMooniE2eLoggedIn(page) {
  await clearFestivalListSessionCache(page);
  await page.addInitScript(() => {
    window.__gateoMooniE2eForceUser = { id: 'e2e-mooni-logged-in' };
  });
}

export async function openFestivalMooni(page, festivalId = E2E_FESTIVAL_ID, opts = {}) {
  const { reuseFestivalSheet = false } = opts;
  const mooniBtn = page.locator('[data-festival-mooni-inline]').first();
  if (reuseFestivalSheet) {
    try {
      await mooniBtn.waitFor({ state: 'visible', timeout: 8_000 });
      await mooniBtn.scrollIntoViewIfNeeded();
      await mooniBtn.click({ timeout: 30_000 });
      await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
        timeout: 120_000,
      });
      return;
    } catch {
      /* sheet closed — full deep link */
    }
  }
  await page.goto(`/korea/?festival=${festivalId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await dismissLocHint(page);
  await mooniBtn.waitFor({ state: 'attached', timeout: 90_000 });
  await mooniBtn.scrollIntoViewIfNeeded();
  await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
  await mooniBtn.click({ timeout: 60_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
    timeout: 120_000,
  });
}

export async function tapFestivalSightsChip(page) {
  const chip = page.getByRole('button', { name: /볼거리·분위기/i }).first();
  await expect(chip).toBeVisible({ timeout: 30_000 });
  await chip.click();
}

/** Simulates logged-in fetchData() returning a stale saved_trips row (user turn only). */
/** Logged-in fetchData() with DB still on user-only messages (model reply not saved yet). */
export async function simulateStaleSavedTripsRefresh(page) {
  await page.waitForFunction(() => window.__gateoMooniE2e?.fetchData, null, {
    timeout: 60_000,
  });
  await page.evaluate(async () => {
    await window.__gateoMooniE2e.fetchData();
  });
}
