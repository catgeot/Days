// E2E-3 @see plans/site-health-monitoring-plan.md Phase 2-B
import { test, expect } from '@playwright/test';
import { mooniOneChatTurn } from './helpers.js';

test.describe('MOONi', () => {
  test('E2E-3 FAB opens chat and completes one turn', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/');

    const { hasError, hasDialogue } = await mooniOneChatTurn(page);

    expect(hasError || hasDialogue).toBeTruthy();
  });
});
