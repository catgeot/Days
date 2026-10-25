/**
 * Tinian UX — WebKit 390px assert-only (not in default Playwright projects).
 * Run: npx playwright test e2e/tinian-search-planner-390.spec.js --project=webkit-390
 */
import { test, expect } from './fixtures.js';

test.use({ ignoreHTTPSErrors: true });

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

    const choiceList = page.locator('[data-search-choice-list], [role="listbox"]').first();
    await expect(choiceList.or(page.getByRole('button', { name: /티니안/i }).first())).toBeVisible({
      timeout: 120_000,
    });

    const sanJoseLine = page.getByText(/San Jose\s*·/i);
    await expect(sanJoseLine).toHaveCount(0);

    const tinianChoice = page.getByRole('button', { name: /티니안/i }).first();
    await expect(tinianChoice).toBeVisible({ timeout: 30_000 });
    await tinianChoice.click();

    const card = page.locator('.place-summary-card').first();
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card.getByText(/Tinian/i).first()).toBeVisible();

    const plannerTab = page
      .getByRole('button', { name: /플래너|Planner/i })
      .or(page.getByRole('tab', { name: /플래너|Planner/i }))
      .first();
    await expect(plannerTab).toBeVisible({ timeout: 30_000 });
    await plannerTab.click();

    const plannerRoot = page.locator('[data-planner-scroll-root]').first();
    await expect(plannerRoot).toBeVisible({ timeout: 60_000 });
    await expect(card.getByText(/사이판|Saipan/i)).toHaveCount(0);

    const runToolkit = page.getByRole('button', { name: /툴킷.*생성|Run toolkit|Generate toolkit/i });
    await expect(runToolkit).toHaveCount(0);
  });
});
