// Flag unset — mocked WebKit. The pickup row must not render.
import { test, expect } from './fixtures.js';
import { installMooniGeminiMock } from './mooni-gemini-mock.js';

test.describe('airport pickup row (flag off)', () => {
  test.beforeEach(async ({ context }) => {
    await installMooniGeminiMock(context);
  });

  test('Khao Lak place card and MOONi answer omit the row', async ({ page }) => {
    await page.goto('/place/khao-lak?lang=ko', { waitUntil: 'domcontentloaded' });
    await expect(page.getByText('카오락').first()).toBeVisible({ timeout: 60_000 });
    await page.getByRole('button', { name: /현지 정보/ }).first().click();
    const airport = page.locator('[data-local-info-row="airport"]:visible');
    await expect(airport).toBeVisible();
    await airport.locator('button').click();
    await expect(airport).toContainText('푸켓');
    await expect(page.locator('[data-airport-pickup-row]')).toHaveCount(0);

    const hint = page.getByRole('button', { name: /말풍선 닫기|Close hint bubble/i });
    if (await hint.isVisible({ timeout: 3_000 }).catch(() => false)) await hint.click();
    const mooniBtn = page.locator('.place-header-mooni-btn').first();
    await expect(mooniBtn).toBeVisible({ timeout: 60_000 });
    await mooniBtn.click();
    await expect(page.getByLabel(/채팅 닫기|Close chat/i)).toBeVisible({ timeout: 60_000 });
    const dock = page.locator('[data-testid="mooni-quick-replies"]:visible').first();
    await expect(dock).toBeVisible({ timeout: 60_000 });
    await dock.getByRole('button', { name: /✈️\s*가는 방법/ }).click({ force: true });
    await page.getByRole('button', { name: '물어보기', exact: true }).click();
    const reply = page.getByTestId('mooni-model-reply').last();
    await expect(reply).toBeVisible({ timeout: 60_000 });
    await expect(reply).toContainText('E2E-MOCK-9f3a');
    await expect(reply.locator('[data-airport-pickup-row]')).toHaveCount(0);
    await expect(page.locator('[data-airport-pickup-row]')).toHaveCount(0);
  });
});
