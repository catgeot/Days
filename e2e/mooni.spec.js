// E2E-3 @see plans/site-health-monitoring-plan.md Phase 2-B
import { test, expect } from './fixtures.js';
import { mooniOneChatTurn, AI_ERROR_PATTERN } from './helpers.js';
import { installMooniGeminiMock, MOONI_MOCK_REPLY } from './mooni-gemini-mock.js';

test.describe('MOONi', () => {
  test('E2E-3 FAB opens chat and completes one turn', async ({ page }) => {
    test.setTimeout(180_000);
    await installMooniGeminiMock(page.context());
    await page.goto('/');

    await mooniOneChatTurn(page);

    await expect(page.getByText(MOONI_MOCK_REPLY)).toBeVisible({ timeout: 90_000 });
    const bodyText = await page.locator('body').innerText();
    expect(AI_ERROR_PATTERN.test(bodyText), 'MOONi must not show AI error/limit copy').toBe(false);
  });
});
