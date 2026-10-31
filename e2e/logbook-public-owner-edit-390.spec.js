import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { test, expect } from './fixtures.js';
import {
  OWNER_ID,
  OTHER_ID,
  REPORT_ID,
  installLogbookReportRoutes,
  seedAuthSession,
} from './fixtures/logbook-owner-edit-mocks.js';

const OUT_390 = '/opt/cursor/artifacts/logbook-public-owner-edit-390';
const OUT_1280 = '/opt/cursor/artifacts/logbook-public-owner-edit-1280';

async function shot(page, outDir, file, width, height) {
  await page.screenshot({
    path: join(outDir, file),
    clip: { x: 0, y: 0, width, height: Math.min(height, 844) },
  });
}

async function openPublicDetail(page) {
  await page.goto(`/p/${REPORT_ID}?lang=ko`, { waitUntil: 'domcontentloaded' });
  await expect(page.getByText('메롱')).toBeVisible({ timeout: 30_000 });
}

function defineViewportSuite({ tag, width, height, outDir }) {
  test.describe(`logbook public detail owner edit (${tag}px, mocked Supabase)`, () => {
    test.use({
      viewport: { width, height },
      deviceScaleFactor: 1,
      locale: 'ko-KR',
    });

    test.beforeAll(async () => {
      await mkdir(outDir, { recursive: true });
    });

    test('owner sees edit button', async ({ page }) => {
      await seedAuthSession(page, OWNER_ID);
      await installLogbookReportRoutes(page, OWNER_ID);
      await openPublicDetail(page);
      const edit = page.getByRole('button', { name: '기록 수정' });
      await expect(edit).toBeVisible();
      await expect(edit).toHaveAttribute('data-logbook-owner-edit-variant', 'public');
      await expect(edit).toContainText('수정');
      const box = await page.locator('[data-logbook-owner-edit]').boundingBox();
      expect(box?.width ?? 0).toBeGreaterThanOrEqual(44);
      expect(box?.height ?? 0).toBeGreaterThanOrEqual(44);
      await shot(page, outDir, 'owner-edit-visible.png', width, height);
    });

    test('other user does not see edit button', async ({ page }) => {
      await seedAuthSession(page, OTHER_ID);
      await installLogbookReportRoutes(page, OTHER_ID);
      await openPublicDetail(page);
      await expect(page.locator('[data-logbook-owner-edit]')).toHaveCount(0);
      await shot(page, outDir, 'other-user-no-edit.png', width, height);
    });

    test('logged out does not see edit button', async ({ page }) => {
      await seedAuthSession(page, null);
      await installLogbookReportRoutes(page, null);
      await openPublicDetail(page);
      await expect(page.locator('[data-logbook-owner-edit]')).toHaveCount(0);
      await shot(page, outDir, 'logged-out-no-edit.png', width, height);
    });
  });
}

defineViewportSuite({ tag: '390', width: 390, height: 844, outDir: OUT_390 });
defineViewportSuite({ tag: '1280', width: 1280, height: 720, outDir: OUT_1280 });
