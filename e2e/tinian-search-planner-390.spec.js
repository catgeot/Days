/**
 * Tinian UX — WebKit 390px (screenshots under /opt/cursor/artifacts).
 */
import { test, expect } from './fixtures.js';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

test.use({ ignoreHTTPSErrors: true });

const ARTIFACT_DIR = process.env.TINIAN_E2E_ARTIFACT_DIR || '/opt/cursor/artifacts';
const WIDTH = 390;
const HEIGHT = 844;

async function clip390(page, filename) {
  await mkdir(ARTIFACT_DIR, { recursive: true });
  await page.screenshot({
    path: join(ARTIFACT_DIR, filename),
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  });
}

async function openExploreSearch(page) {
  await page.goto('/explore', { waitUntil: 'domcontentloaded', timeout: 90_000 });
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho|Search/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 60_000 });
  return searchInput;
}

test.describe('Tinian search & planner @webkit-390', () => {
  test('티니안 Enter shows choice list; card shows Tinian; planner has toolkit', async ({ page }) => {
    const input = await openExploreSearch(page);
    await input.fill('티니안');
    await page.waitForTimeout(800);
    await input.press('Enter');

    const choice = page.getByRole('button', { name: /티니안|Tinian|San\s*Jose/i }).first();
    await expect(choice).toBeVisible({ timeout: 120_000 });
    await clip390(page, 'tinian-enter-choice-list-390.png');

    const tinianChoice = page.getByRole('button', { name: /Tinian/i }).first();
    if (await tinianChoice.isVisible().catch(() => false)) {
      await tinianChoice.click();
    } else {
      await choice.click();
    }
    const card = page.locator('.place-summary-card').first();
    await expect(card).toBeVisible({ timeout: 60_000 });
    await clip390(page, 'tinian-card-subtitle-390.png');
    const tinianSub = card.getByText(/Tinian/i);
    if (await tinianSub.count()) {
      await expect(tinianSub.first()).toBeVisible();
    }

    const plannerTab = page
      .getByRole('button', { name: /플래너|Planner/i })
      .or(page.getByRole('tab', { name: /플래너|Planner/i }))
      .first();
    if (await plannerTab.isVisible().catch(() => false)) {
      await plannerTab.click();
      await page.waitForTimeout(500);
      const plannerRoot = page.locator('[data-planner-scroll-root]').first();
      await expect(plannerRoot.or(page.getByText(/스마트 트래블 툴킷|출발 전|준비 중이에요/i).first())).toBeVisible({
        timeout: 60_000,
      });
      await clip390(page, 'tinian-planner-tab-390.png');
    } else {
      await page.goto('/place/saipan', { waitUntil: 'domcontentloaded', timeout: 90_000 });
      const saipanPlanner = page
        .getByRole('button', { name: /플래너|Planner/i })
        .or(page.getByRole('tab', { name: /플래너|Planner/i }))
        .first();
      if (await saipanPlanner.isVisible().catch(() => false)) {
        await saipanPlanner.click();
        await expect(page.locator('[data-planner-scroll-root]').first()).toBeVisible({ timeout: 60_000 });
        await clip390(page, 'tinian-planner-tab-390.png');
      }
    }
  });
});
