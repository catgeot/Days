// E2E-2 @see plans/site-health-monitoring-plan.md Phase 2-B · §2-B-1 (라벨 변경 시 이 assert도 같이)
import { test, expect } from '@playwright/test';

test.describe('PlaceCard', () => {
  test('E2E-2 /place/bali shows title and tabs', async ({ page }) => {
    await page.goto('/place/bali');

    await expect(page.getByRole('button', { name: '발리' }).first()).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByRole('button', { name: '여행 플래너' }).first()).toBeVisible();
    // UI 탭 표시명 SSOT — PlaceMobileSecondaryNav / PlaceCard index suffix (「여행 위키」아님)
    await expect(page.getByRole('button', { name: '여행 스케치' }).first()).toBeVisible();
  });
});
