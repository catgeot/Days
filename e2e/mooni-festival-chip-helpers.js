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

export async function enableMooniE2eLoggedIn(page) {
  await page.addInitScript(() => {
    window.__gateoMooniE2eForceUser = { id: 'e2e-mooni-logged-in' };
  });
}

export async function openFestivalMooni(page, festivalId = E2E_FESTIVAL_ID) {
  await page.goto(`/korea/?festival=${festivalId}`, {
    waitUntil: 'domcontentloaded',
    timeout: 120_000,
  });
  await dismissLocHint(page);
  const mooniBtn = page
    .locator('[data-festival-mooni-inline]')
    .or(page.getByRole('button', { name: /무니에게 이 축제 물어보기/i }))
    .first();
  await expect(mooniBtn).toBeVisible({ timeout: 150_000 });
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
