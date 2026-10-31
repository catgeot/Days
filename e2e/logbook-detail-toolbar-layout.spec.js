import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import {
  OWNER_ID,
  REPORT_ID,
  installLogbookReportRoutes,
  seedAuthSession,
} from './fixtures/logbook-owner-edit-mocks.js';

async function shot(page, outDir, file, width, height) {
  await page.screenshot({
    path: join(outDir, file),
    clip: { x: 0, y: 0, width, height: Math.min(height, 844) },
  });
}

async function expectToolbarSingleRow(page) {
  const toolbar = page.locator('[data-logbook-detail-toolbar]');
  await expect(toolbar).toBeVisible();
  const centers = await toolbar.locator('button').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return r.top + r.height / 2;
    }),
  );
  expect(centers.length).toBeGreaterThanOrEqual(4);
  const minC = Math.min(...centers);
  const maxC = Math.max(...centers);
  expect(maxC - minC, `toolbar row centers: ${centers.map((c) => Math.round(c)).join(',')}`).toBeLessThanOrEqual(
    10,
  );
}

async function openMineDetail(page) {
  await page.goto(`/blog/${REPORT_ID}?lang=ko`, { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(new RegExp(`/blog/${REPORT_ID}`), { timeout: 30_000 });
  await expect(page.locator('[data-logbook-detail-toolbar]')).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole('heading', { name: '메롱' })).toBeVisible({ timeout: 30_000 });
}

async function measureToolbarOverflow(page) {
  return page.locator('[data-logbook-detail-toolbar]').evaluate((el) => ({
    scrollWidth: el.scrollWidth,
    clientWidth: el.clientWidth,
    scrollLeft: el.scrollLeft,
  }));
}

async function expectToolbarFitsUnscrolled(page) {
  const { scrollWidth, clientWidth, scrollLeft } = await measureToolbarOverflow(page);
  expect(scrollLeft, 'toolbar should not be pre-scrolled').toBe(0);
  expect(
    scrollWidth,
    `toolbar scrollWidth ${scrollWidth} > clientWidth ${clientWidth} (overflow ${scrollWidth - clientWidth}px)`,
  ).toBeLessThanOrEqual(clientWidth);
  return { scrollWidth, clientWidth, overflowPx: scrollWidth - clientWidth };
}

async function expectDeleteFullyInViewport(page, viewportWidth) {
  const deleteBox = await page.locator('[data-logbook-detail-delete]').boundingBox();
  expect(deleteBox, 'delete button missing box').toBeTruthy();
  expect(deleteBox.x, `delete left ${deleteBox.x}px`).toBeGreaterThanOrEqual(0);
  expect(
    deleteBox.x + deleteBox.width,
    `delete right ${deleteBox.x + deleteBox.width}px > viewport ${viewportWidth}`,
  ).toBeLessThanOrEqual(viewportWidth);
  return deleteBox;
}

async function expectShareButtonSingleLine(page) {
  const share = page.locator('[data-logbook-detail-share]');
  await expect(share).toBeVisible();
  const box = await share.boundingBox();
  expect(box?.height ?? 999, 'Share button should stay single-line').toBeLessThanOrEqual(40);
  return box?.height ?? null;
}

async function expectDeleteClearOfBack(page) {
  const deleteBtn = page.locator('[data-logbook-detail-delete]');
  const backBtn = page.locator('[data-logbook-detail-back]');
  await expect(deleteBtn).toBeVisible();
  await expect(backBtn).toBeVisible();
  const deleteBox = await deleteBtn.boundingBox();
  const backBox = await backBtn.boundingBox();
  expect(deleteBox && backBox).toBeTruthy();
  const deleteRight = deleteBox.x + deleteBox.width;
  const backLeft = backBox.x;
  const gapPx = Math.round((backLeft - deleteRight) * 10) / 10;
  const deleteBottom = deleteBox.y + deleteBox.height;
  const backBottom = backBox.y + backBox.height;
  const intersects =
    deleteBox.x < backBox.x + backBox.width &&
    backBox.x < deleteRight &&
    deleteBox.y < backBottom &&
    backBox.y < deleteBottom;
  expect(intersects, `delete–back boxes overlap (gap ${gapPx}px)`).toBe(false);
  expect(
    gapPx,
    `delete–back horizontal gap ${gapPx}px (need ≥8px)`,
  ).toBeGreaterThanOrEqual(8);
  return gapPx;
}

function defineDetailToolbarSuite({
  tag,
  width,
  height,
  outDir,
  assertShareHeight,
  assertInitialLayout,
  assertSingleRow,
}) {
  test.describe(`logbook mine Detail toolbar (${tag}px, mocked Supabase)`, () => {
    test.use({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
    });

    test.beforeAll(async () => {
      await mkdir(outDir, { recursive: true });
    });

    test('toolbar stays one row with compact edit', async ({ page }, testInfo) => {
      await seedAuthSession(page, OWNER_ID);
      await installLogbookReportRoutes(page, OWNER_ID);
      await openMineDetail(page);
      await expect(page.locator('[data-logbook-owner-edit-variant="compact"]')).toBeVisible();

      let shareHeight = null;
      let gapPx = null;
      let overflowPx = null;

      if (assertInitialLayout) {
        const fit = await expectToolbarFitsUnscrolled(page);
        overflowPx = fit.overflowPx;
        await expectDeleteFullyInViewport(page, width);
        gapPx = await expectDeleteClearOfBack(page);
      }
      if (assertShareHeight) {
        shareHeight = await expectShareButtonSingleLine(page);
      }
      if (assertSingleRow) {
        await expectToolbarSingleRow(page);
      }

      testInfo.annotations.push({
        type: tag,
        description: JSON.stringify({
          overflowPx,
          deleteBackGapPx: gapPx,
          shareHeightPx: shareHeight,
        }),
      });

      await shot(page, outDir, 'detail-toolbar.png', width, height);
    });
  });
}

defineDetailToolbarSuite({
  tag: '360',
  width: 360,
  height: 740,
  outDir: '/opt/cursor/artifacts/logbook-detail-toolbar-360',
  assertShareHeight: true,
  assertInitialLayout: true,
  assertSingleRow: false,
});
defineDetailToolbarSuite({
  tag: '390',
  width: 390,
  height: 844,
  outDir: '/opt/cursor/artifacts/logbook-detail-toolbar-390',
  assertShareHeight: true,
  assertInitialLayout: true,
  assertSingleRow: true,
});
defineDetailToolbarSuite({
  tag: '1280',
  width: 1280,
  height: 720,
  outDir: '/opt/cursor/artifacts/logbook-detail-toolbar-1280',
  assertShareHeight: false,
  assertInitialLayout: false,
  assertSingleRow: true,
});
