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
  externalReturnShot,
  openFestivalSheet,
  openNearbyPlaceCard,
  probeHitAtCenter,
  returnFromNearbyOfficialPopup,
  returnFromNearbyOfficialSameTab,
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
    await page.goto('/korea/', { waitUntil: 'domcontentloaded' });
    await dismissLocHint(page);
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

    const programTab = dialog.getByRole('tab', { name: /프로그램/ });
    const probe = await probeHitAtCenter(programTab);
    expect(probe.scrim).toBe(false);
    expect(probe.ok).toBe(true);

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
    await expect(dialog).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
    await dispatchPersistedReturn(page);
    await assertSheetButtonsInteractive(page, dialog, {
      homepagePattern: /haean\.kr/i,
      closeSheet: true,
    });
  });
});
