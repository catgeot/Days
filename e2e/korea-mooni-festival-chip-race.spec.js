import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import {
  FESTIVAL_CHIP_MOCK_MARKER,
  installFestivalChipGeminiMock,
} from './mooni-festival-chip-mock.js';
import {
  enableMooniE2eLoggedIn,
  openFestivalMooni,
  simulateStaleSavedTripsRefresh,
  tapFestivalSightsChip,
} from './mooni-festival-chip-helpers.js';
import { createLoggedInSavedTripsMock } from './mooni-festival-logged-in-routes.js';
import { installFestivalTourApiFixtures } from './mooni-festival-tourapi-fixture.js';

const OUT_DIR =
  process.env.MOONI_CHIP_SCREENSHOT_DIR ||
  '/opt/cursor/artifacts/screenshots/korea-mooni-festival-chip-persist';

async function shot(page, name) {
  await mkdir(OUT_DIR, { recursive: true });
  try {
    await page.screenshot({ path: join(OUT_DIR, name), fullPage: false });
  } catch (err) {
    if (err?.code !== 'EAGAIN') throw err;
  }
}

/** Hangul in chat dialogue only (MOONi modal), not the festival list behind the sheet. */
async function festivalDialogueHangul(page) {
  const chatRoot = page.locator('div.fixed.inset-0.z-\\[9999\\]').filter({
    has: page.getByRole('button', { name: /^(채팅 닫기|Close chat)$/i }),
  });
  return chatRoot.evaluate((root) => {
    const opening = root.querySelector('[data-testid="mooni-festival-opening"]');
    const scroll = root.querySelector('.flex-1.overflow-y-auto');
    if (!scroll) return 0;
    let text = scroll.innerText || '';
    if (opening) text = text.replace(opening.innerText || '', '');
    return (text.match(/[가-힣]/g) || []).length;
  });
}

async function closeMooniChat(page) {
  const closeBtn = page.getByRole('button', { name: /^(채팅 닫기|Close chat)$/i });
  await closeBtn.click({ timeout: 15_000 });
  await expect(page.getByTestId('mooni-festival-opening')).toHaveCount(0, {
    timeout: 15_000,
  });
}

test.describe('festival MOONi logged-in race (a) stale PATCH @390', () => {
  let savedTripsMock;
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(300_000);

  test.beforeEach(async ({ context, page }, testInfo) => {
    if (testInfo.project.name === 'chromium-mobile') {
      process.env.MOONI_TOURAPI_STUB_ONLY = '1';
      await installFestivalTourApiFixtures(context);
    }
    await enableMooniE2eLoggedIn(page);
    savedTripsMock = createLoggedInSavedTripsMock({ persistPatch: false });
    await savedTripsMock.attach(context);
    await installFestivalChipGeminiMock(context, { delayMs: 2800 });
  });

  test('(a) stale refresh during in-flight chip — answer persists ≥10s', async ({ page }, testInfo) => {
    const tag = testInfo.project.name.replace(/[^a-z0-9-]+/gi, '-');
    await openFestivalMooni(page);
    await shot(page, `${tag}-race-a-00-open.png`);

    await tapFestivalSightsChip(page);
    await page.waitForTimeout(350);
    savedTripsMock.forceStaleUserOnlyMessages();
    await simulateStaleSavedTripsRefresh(page);

    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible({
      timeout: 120_000,
    });
    await page.waitForTimeout(1000);
    await shot(page, `${tag}-race-a-01-answer-1s.png`);

    await page.waitForTimeout(10_000);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible();
    await shot(page, `${tag}-race-a-02-answer-12s.png`);
  });
});

test.describe('festival MOONi logged-in race (b) locale + missing trip @390', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    ignoreHTTPSErrors: true,
  });
  test.setTimeout(420_000);

  let savedTripsMock;

  test.beforeEach(async ({ context, page }, testInfo) => {
    if (testInfo.project.name === 'chromium-mobile') {
      process.env.MOONI_TOURAPI_STUB_ONLY = '1';
      await installFestivalTourApiFixtures(context);
    }
    await enableMooniE2eLoggedIn(page);
    savedTripsMock = createLoggedInSavedTripsMock({ persistPatch: true });
    await savedTripsMock.attach(context);
    await installFestivalChipGeminiMock(context, { delayMs: 400 });
  });

  test('(b) locale sessions — EN reopen clean, KO thread restored', async ({ page }) => {
    await openFestivalMooni(page);
    await tapFestivalSightsChip(page);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible({
      timeout: 120_000,
    });
    await page.waitForTimeout(600);

    savedTripsMock.setOmitFromGet(true);
    await simulateStaleSavedTripsRefresh(page);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible();

    await page.evaluate(async () => {
      await window.__gateoMooniE2e.setLanguage('en');
    });
    await page.waitForTimeout(500);
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toHaveCount(0);
    expect(await festivalDialogueHangul(page)).toBe(0);

    await closeMooniChat(page);

    savedTripsMock.setOmitFromGet(false);
    await openFestivalMooni(page, undefined, { reuseFestivalSheet: true });
    await expect(page.getByTestId('mooni-festival-opening')).toBeVisible({
      timeout: 120_000,
    });
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toHaveCount(0);
    expect(await festivalDialogueHangul(page)).toBe(0);
    await shot(page, 'webkit-iphone-race-b-en-reopen.png');

    await closeMooniChat(page);

    await page.evaluate(async () => {
      await window.__gateoMooniE2e.setLanguage('ko');
    });
    await page.waitForTimeout(400);
    await openFestivalMooni(page, undefined, { reuseFestivalSheet: true });
    await expect(page.getByText(FESTIVAL_CHIP_MOCK_MARKER)).toBeVisible({
      timeout: 90_000,
    });
    await shot(page, 'webkit-iphone-race-b-ko-reopen.png');
  });
});
