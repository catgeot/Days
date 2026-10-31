import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import {
  EXTERNAL_RETURN_FESTIVALS,
  HTTP_HOME_FESTIVAL_ID,
  installFestivalExternalReturnFixtures,
} from './festival-external-return-fixture.js';
import {
  assertSheetButtonsInteractive,
  dispatchPersistedReturn,
  dispatchBlankPersistedReloadAndWait,
  externalReturnShot,
  openFestivalSheet,
  openNearbyPlaceCard,
  nearbyPlaceModal,
  returnFromNearbyOfficialPopup,
  returnFromNearbyOfficialSameTab,
  waitForFestivalSheetAfterExternalReturn,
  festivalSheetDialog,
} from './festival-external-return-helpers.js';

const OUT = 'docs/qa/pr-external-return';
const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const OPEN_TIMEOUT_MS = IS_CI ? 25_000 : 120_000;
const TEST_TIMEOUT_MS = IS_CI ? 90_000 : 180_000;

const YANGGU = EXTERNAL_RETURN_FESTIVALS[0];

test.describe('festival external return — WebKit 390', () => {
  test.describe.configure({ timeout: TEST_TIMEOUT_MS });

  test.beforeAll(async () => {
    await mkdir(OUT, { recursive: true });
  });

  test.beforeEach(async ({ context, page }) => {
    await installFestivalExternalReturnFixtures(context);
    await page.goto('about:blank');
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
  });

  test('nearby official homepage — target=_blank and opens new tab (Yanggu haean.kr)', async ({
    page,
    context,
  }) => {
    const dialog = await openFestivalSheet(page, YANGGU.id, OPEN_TIMEOUT_MS);
    const nearbyModal = await openNearbyPlaceCard(page, dialog, YANGGU.nearby.cardMatch);
    const official = nearbyModal.locator('[data-theme-spot-official-home]');
    await expect(official).toHaveAttribute('target', '_blank');
    await expect(official).toHaveAttribute('rel', /noopener noreferrer/);
    await expect(official).toHaveAttribute('href', /haean\.kr/i);
    const popupPromise = context.waitForEvent('page', { timeout: 25_000 });
    await official.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    expect(popup.url()).toMatch(/haean\.kr/i);
    await popup.close();
    await page.bringToFront();
    await dispatchPersistedReturn(page);
    const nearbyAfter = nearbyPlaceModal(page);
    if (await nearbyAfter.isVisible().catch(() => false)) {
      await expect(nearbyAfter).toBeVisible({ timeout: 15_000 });
    } else {
      await expect(dialog).toBeVisible({ timeout: 15_000 });
    }
  });

  test('HTTP official label screenshot (festival summary)', async ({ page }) => {
    const dialog = await openFestivalSheet(page, HTTP_HOME_FESTIVAL_ID, OPEN_TIMEOUT_MS);
    await expect(dialog.locator('[data-festival-official-home-http-notice]')).toContainText(
      '보안 연결',
    );
    await externalReturnShot(page, OUT, 'http-official-label');
  });

  test('owner path — Yanggu nearby 야생화 HTTP official → back → back', async ({
    page,
    context,
  }) => {
    const dialog = await openFestivalSheet(page, YANGGU.id, OPEN_TIMEOUT_MS);
    const nearbyModal = await openNearbyPlaceCard(page, dialog, YANGGU.nearby.cardMatch);
    await externalReturnShot(page, OUT, 'yanggu-nearby-before-external');

    await returnFromNearbyOfficialPopup(page, context, nearbyModal);
    await externalReturnShot(page, OUT, 'yanggu-nearby-owner-after-return');

    await assertSheetButtonsInteractive(page, dialog, {
      homepagePattern: /haean\.kr/i,
      closeSheet: true,
    });
  });

  test('nearby official popup — sheet controls stay tappable (Yanggu)', async ({
    page,
    context,
  }) => {
    const dialog = await openFestivalSheet(page, YANGGU.id, OPEN_TIMEOUT_MS);
    const nearbyModal = await openNearbyPlaceCard(page, dialog, YANGGU.nearby.cardMatch);
    await returnFromNearbyOfficialPopup(page, context, nearbyModal);
    await assertSheetButtonsInteractive(page, dialog, {
      homepagePattern: /haean\.kr/i,
      closeSheet: true,
    });
  });

  test('nearby official same-tab goBack + persisted pageshow (Yanggu)', async ({ page }) => {
    const dialog = await openFestivalSheet(page, YANGGU.id, OPEN_TIMEOUT_MS);
    const nearbyModal = await openNearbyPlaceCard(page, dialog, YANGGU.nearby.cardMatch);
    await returnFromNearbyOfficialSameTab(page, nearbyModal);
    await dispatchPersistedReturn(page);
    await assertSheetButtonsInteractive(page, dialog, {
      homepagePattern: /haean\.kr/i,
      closeSheet: true,
    });
  });

  test('same-tab HTTP back + persisted blank root reloads and restores sheet', async ({
    page,
  }) => {
    const dialog = await openFestivalSheet(page, YANGGU.id, OPEN_TIMEOUT_MS);
    const nearbyModal = await openNearbyPlaceCard(page, dialog, YANGGU.nearby.cardMatch);
    const official = nearbyModal.locator('[data-theme-spot-official-home]');
    const href = await official.getAttribute('href');
    expect(href).toMatch(/haean\.kr/i);
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page).toHaveURL(new RegExp(`festival=${YANGGU.id}`), { timeout: 15_000 });

    await dispatchBlankPersistedReloadAndWait(page);

    const sheet = festivalSheetDialog(page);
    if (!(await sheet.isVisible().catch(() => false))) {
      await openFestivalSheet(page, YANGGU.id, OPEN_TIMEOUT_MS);
    }
    await waitForFestivalSheetAfterExternalReturn(page, festivalSheetDialog(page));
  });

  test('navigate away goBack + persisted pageshow after nearby return', async ({
    page,
    context,
  }) => {
    const dialog = await openFestivalSheet(page, YANGGU.id, OPEN_TIMEOUT_MS);
    const nearbyModal = await openNearbyPlaceCard(page, dialog, YANGGU.nearby.cardMatch);
    await returnFromNearbyOfficialPopup(page, context, nearbyModal);

    await page.evaluate(() => {
      window.location.assign('https://example.com/');
    });
    await page.waitForURL(/example\.com/i, { timeout: 15_000 });
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await page.waitForURL(/\/korea\//i, { timeout: OPEN_TIMEOUT_MS });
    const sheetAfterNav = festivalSheetDialog(page);
    await waitForFestivalSheetAfterExternalReturn(page, sheetAfterNav);
    await dispatchPersistedReturn(page);
    await assertSheetButtonsInteractive(page, sheetAfterNav, {
      homepagePattern: /haean\.kr/i,
      closeSheet: true,
    });
  });
});
