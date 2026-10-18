import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import {
  HTTP_HOME_FESTIVAL_ID,
  installFestivalExternalReturnFixtures,
} from './festival-external-return-fixture.js';
import {
  assertSheetButtonsInteractive,
  dispatchPersistedReturn,
  externalReturnShot,
  openFestivalSheet,
} from './festival-external-return-helpers.js';

const OUT = 'docs/qa/pr-external-return';
const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const OPEN_TIMEOUT_MS = IS_CI ? 25_000 : 120_000;
const TEST_TIMEOUT_MS = IS_CI ? 55_000 : 180_000;

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

  test('HTTP official label screenshot', async ({ page }) => {
    const dialog = await openFestivalSheet(page, HTTP_HOME_FESTIVAL_ID, OPEN_TIMEOUT_MS);
    await expect(dialog.locator('[data-festival-official-home-http-notice]')).toContainText(
      '보안 연결',
    );
    await externalReturnShot(page, OUT, 'http-official-label');
  });

  test('popup official home then sheet controls stay tappable', async ({ page, context }) => {
    const dialog = await openFestivalSheet(page, HTTP_HOME_FESTIVAL_ID, OPEN_TIMEOUT_MS);
    const official = dialog.locator('[data-festival-official-home]');

    const popupPromise = context.waitForEvent('page');
    await official.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await popup.close();
    await page.bringToFront();
    await dispatchPersistedReturn(page);

    await assertSheetButtonsInteractive(page, dialog, {
      homepagePattern: /http:\/\/haean\.kr/i,
      closeSheet: true,
    });
  });

  test('navigate away goBack + persisted pageshow restores hits', async ({ page, context }) => {
    const dialog = await openFestivalSheet(page, HTTP_HOME_FESTIVAL_ID, OPEN_TIMEOUT_MS);
    const official = dialog.locator('[data-festival-official-home]');
    const popupPromise = context.waitForEvent('page');
    await official.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await popup.close();
    await page.bringToFront();

    await page.evaluate(() => {
      window.location.assign('https://example.com/');
    });
    await page.waitForURL(/example\.com/i, { timeout: 15_000 });
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    const dialogAfter = page.getByRole('dialog');
    await expect(dialogAfter).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
    await expect(dialogAfter.locator('[data-festival-official-home]')).toBeVisible({
      timeout: OPEN_TIMEOUT_MS,
    });

    await dispatchPersistedReturn(page);
    await assertSheetButtonsInteractive(page, dialogAfter, {
      homepagePattern: /http:\/\/haean\.kr/i,
      closeSheet: true,
    });
  });
});
