import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';
import { installExploreMapboxGosansaMock } from './explore-mapbox-gosansa-mock.js';

const UNESCO_PATH = '/place/tour-125565';
const OSANG_PATH = '/place/tour-2765210';
const QUERIES = ['강화 고인돌', '고인돌', '부근리 고인돌', '강화 지석묘', '부근리 지석묘'];

test.use({ ignoreHTTPSErrors: true });

async function installExploreMocks(page) {
  const ctx = page.context();
  await installExploreGeminiMock(ctx);
  await installExploreTourapiMock(ctx);
  await installExploreMapboxGosansaMock(ctx);
}

function unescoCard(page) {
  return page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: /강화 고인돌 유적/ });
}

test.describe('강화 고인돌 유적 125565', () => {
  test.beforeEach(async ({ page }) => {
    await installExploreMocks(page);
  });

  for (const query of QUERIES) {
    test(`${query} — 125565 카드 → ${UNESCO_PATH}`, async ({ page }) => {
      await page.goto('/explore');
      const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
      await expect(input).toBeVisible({ timeout: 60_000 });
      await input.fill(query);
      const card = unescoCard(page).first();
      await expect(card).toBeVisible({ timeout: 30_000 });
      await card.click();
      await page.waitForURL(new RegExp(`${UNESCO_PATH.replace(/\//g, '\\/')}$`), { timeout: 60_000 });
      expect(new URL(page.url()).pathname).toBe(UNESCO_PATH);
    });
  }

  test('강화 고인돌 — 대표 유적이 오상리보다 위', async ({ page }) => {
    await page.goto('/explore');
    const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
    await expect(input).toBeVisible({ timeout: 60_000 });
    await input.fill('강화 고인돌');
    const unesco = unescoCard(page).first();
    const osang = page
      .locator('[data-search-popover] button')
      .filter({ hasNotText: 'MOONi' })
      .filter({ hasText: /오상리 고인돌군/ })
      .first();
    await expect(unesco).toBeVisible({ timeout: 30_000 });
    await expect(osang).toBeVisible({ timeout: 30_000 });
    const unescoBox = await unesco.boundingBox();
    const osangBox = await osang.boundingBox();
    expect(unescoBox.y).toBeLessThan(osangBox.y);
    await osang.click();
    await page.waitForURL(new RegExp(`${OSANG_PATH.replace(/\//g, '\\/')}$`), { timeout: 60_000 });
    expect(new URL(page.url()).pathname).toBe(OSANG_PATH);
  });
});
