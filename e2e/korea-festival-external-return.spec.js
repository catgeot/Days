import { mkdir } from 'node:fs/promises';
import { test, expect } from './fixtures.js';
import { dismissLocHint } from './mooni-festival-chip-helpers.js';
import {
  HTTP_HOME_FESTIVAL_ID,
  installFestivalExternalReturnFixtures,
} from './festival-external-return-fixture.js';

const OUT = 'docs/qa/pr-external-return';
const IS_CI = process.env.CI === 'true' || process.env.GITHUB_ACTIONS === 'true';
const OPEN_TIMEOUT_MS = IS_CI ? 25_000 : 120_000;
const TEST_TIMEOUT_MS = IS_CI ? 55_000 : 180_000;
const VIEWPORT = { width: 390, height: 844 };
const Z_MIN = 40;
const Z_MAX = 59;

async function shot(page, name) {
  await page.screenshot({
    path: `${OUT}/${name}.png`,
    clip: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
  });
}

async function openFestival(page) {
  await page.goto(`/korea/?festival=${HTTP_HOME_FESTIVAL_ID}`, {
    waitUntil: 'domcontentloaded',
  });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
  await expect(dialog.locator('#korea-festival-sheet-title')).toBeVisible({
    timeout: OPEN_TIMEOUT_MS,
  });
  await expect(dialog.locator('[data-festival-official-home]')).toBeVisible({
    timeout: OPEN_TIMEOUT_MS,
  });
  return dialog;
}

async function assertNoZBandBlockersOverDialog(dialog) {
  const bad = await dialog.evaluate(
    (node, bounds) => {
      const { zMin, zMax } = bounds;
      const rect = node.getBoundingClientRect();
      const probes = [
        [0.5, 0.25],
        [0.5, 0.4],
        [0.5, 0.55],
      ];
      for (const [rx, ry] of probes) {
        const x = rect.left + rect.width * rx;
        const y = rect.top + rect.height * ry;
        const hit = document.elementFromPoint(x, y);
        if (!hit || node.contains(hit)) continue;
        let el = hit;
        while (el && el !== document.body) {
          const style = window.getComputedStyle(el);
          const z = Number.parseInt(style.zIndex, 10);
          const fixed =
            style.position === 'fixed' ||
            style.position === 'sticky' ||
            style.position === 'absolute';
          const pe = style.pointerEvents;
          if (
            fixed &&
            Number.isFinite(z) &&
            z >= zMin &&
            z <= zMax &&
            pe !== 'none' &&
            !el.closest('[role="dialog"]')
          ) {
            return {
              tag: el.tagName,
              z,
              className: el.className,
            };
          }
          el = el.parentElement;
        }
      }
      return null;
    },
    { zMin: Z_MIN, zMax: Z_MAX },
  );
  expect(bad).toBeNull();
}

async function assertHitIsTarget(locator) {
  await locator.scrollIntoViewIfNeeded();
  await expect
    .poll(async () =>
      locator.evaluate((target) => {
        const rect = target.getBoundingClientRect();
        if (rect.width < 1 || rect.height < 1) return false;
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const hit = document.elementFromPoint(x, y);
        return Boolean(hit && (target === hit || target.contains(hit)));
      }),
    )
    .toBe(true);
}

async function assertSheetButtonsInteractive(page, dialog, { testClose = false } = {}) {
  await assertNoZBandBlockersOverDialog(dialog);

  const infoTab = dialog.getByRole('tab', { name: /^안내$/ });
  const programTab = dialog.getByRole('tab', { name: /프로그램/ });
  await expect(programTab).toBeVisible();
  await assertHitIsTarget(programTab);
  await programTab.click();
  await expect(programTab).toHaveAttribute('aria-selected', 'true');

  const backOverview = dialog.getByRole('button', { name: '안내로 돌아가기' });
  await expect(backOverview).toBeVisible();
  await assertHitIsTarget(backOverview);
  await backOverview.click();
  await expect(infoTab).toHaveAttribute('aria-selected', 'true');

  await expect
    .poll(async () => {
      await dialog.evaluate((el) => {
        el.scrollTop = el.scrollHeight;
      });
      const scrollTopBtn = page.locator('button[aria-label="맨 위로"][class*="z-[45]"]');
      const cls = (await scrollTopBtn.getAttribute('class')) || '';
      return cls.includes('pointer-events-auto');
    })
    .toBe(true);
  const scrollTopBtn = page.locator('button[aria-label="맨 위로"][class*="z-[45]"]');
  await assertHitIsTarget(scrollTopBtn);
  await scrollTopBtn.click();

  const official = dialog.locator('[data-festival-official-home]');
  await assertHitIsTarget(official);
  await expect(official).toHaveAttribute('href', /http:\/\/haean\.kr/i);

  const thumb = dialog.locator('[data-festival-hero-thumbs] button').first();
  await expect(thumb).toBeVisible({ timeout: 10_000 });
  await assertHitIsTarget(thumb);
  await thumb.click();

  const closeBtn = page.getByRole('button', { name: /^닫기$/ }).first();
  await expect(closeBtn).toBeVisible();
  await assertHitIsTarget(closeBtn);
  if (testClose) {
    await closeBtn.click();
    await expect(page.getByRole('dialog')).toHaveCount(0, { timeout: 5_000 });
  }
}

async function dispatchPersistedReturn(page) {
  await page.evaluate(() => {
    window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }));
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

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
    const dialog = await openFestival(page);
    await expect(dialog.locator('[data-festival-official-home-http-notice]')).toContainText(
      '보안 연결',
    );
    await shot(page, 'http-official-label');
  });

  test('popup official home then sheet controls stay tappable', async ({ page, context }) => {
    const dialog = await openFestival(page);
    const official = dialog.locator('[data-festival-official-home]');

    const popupPromise = context.waitForEvent('page');
    await official.click();
    const popup = await popupPromise;
    await popup.waitForLoadState('domcontentloaded');
    await popup.close();
    await page.bringToFront();
    await dispatchPersistedReturn(page);

    await assertSheetButtonsInteractive(page, dialog, { testClose: true });
  });

  test('navigate away goBack + persisted pageshow restores hits', async ({ page }) => {
    const dialog = await openFestival(page);

    await page.evaluate(() => {
      window.location.assign('https://example.com/');
    });
    await page.waitForURL(/example\.com/i, { timeout: 15_000 });
    await page.goBack({ waitUntil: 'domcontentloaded', timeout: 30_000 });
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: OPEN_TIMEOUT_MS });
    const dialogAfter = page.getByRole('dialog');

    await dispatchPersistedReturn(page);
    await assertSheetButtonsInteractive(page, dialogAfter, { testClose: true });
  });
});
