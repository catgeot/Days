import { test, expect } from '@playwright/test';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';

test.beforeEach(async ({ context }) => {
  await installExploreTourapiMock(context);
});

const PLACES = [
  { path: '/place/paris', koTitle: /파리/, enTitle: /Paris/i },
  { path: '/place/tour-127635', koTitle: /한라산|백록담|화구벽|국립공원|127635/, enTitle: /Hallasan|Baekrokdam|127635/i },
];

const VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
];

async function surfaceLocaleButton(page) {
  return page.locator('[data-testid="place-surface-locale-toggle"]:visible button').first();
}

async function assertLocaleToggleClickable(page) {
  const toggle = await surfaceLocaleButton(page);
  await expect(toggle).toBeVisible({ timeout: 60_000 });
  const box = await toggle.boundingBox();
  expect(box).toBeTruthy();
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  const hitOk = await page.evaluate(({ x, y }) => {
    const hit = document.elementFromPoint(x, y);
    if (!hit) return false;
    return Boolean(hit.closest('[data-testid="place-surface-locale-toggle"]'));
  }, { x: cx, y: cy });
  expect(hitOk).toBe(true);
  await expect(page.getByTestId('place-header-locale-toggle')).toHaveCount(0);
  await toggle.click();
  await expect(page).toHaveURL(/\?lang=en/, { timeout: 15_000 });
}

for (const place of PLACES) {
  for (const viewport of VIEWPORTS) {
    test(`${place.path} @${viewport.width} — surface locale toggle visible, switches to EN`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto(`${place.path}?lang=ko`, { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('button', { name: place.koTitle }).first()).toBeVisible({
        timeout: 60_000,
      });
      const toggle = await surfaceLocaleButton(page);
      await expect(toggle).toHaveText(/EN|영문/i);
      await assertLocaleToggleClickable(page);
      await expect(toggle).toHaveText(/한|KO/i);
      await expect(page.getByRole('button', { name: /Planner/i }).first()).toBeVisible({
        timeout: 30_000,
      });
    });
  }
}

test('place header — copy toast only from title button', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('/place/paris?lang=ko', { waitUntil: 'domcontentloaded' });
  const titleBtn = page.getByRole('button', { name: /^파리$/ }).first();
  await expect(titleBtn).toBeVisible({ timeout: 60_000 });
  await titleBtn.click();
  await expect(page.getByText(/여행지명 복사됨|Place name copied/i)).toBeVisible({ timeout: 5_000 });
  const toggle = await surfaceLocaleButton(page);
  await toggle.click();
  await expect(page).toHaveURL(/\?lang=en/);
  await expect(page.getByText(/여행지명 복사됨/)).toBeHidden({ timeout: 3_000 });
});