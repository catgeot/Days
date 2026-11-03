// Explore Enter — 단독 한글 검색어 (PR #650 회귀: 지역 접두 없이 우do·닭머르·고산사)
import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import { installExploreTourapiMock } from './explore-tourapi-mock.js';

const UDO = '\uC6B0\uB3C4';
const GAUDO = '\uAC00\uC6B0\uB3C4';
const DAKMEORU = '\uB2ED\uBA38\uB974';
const JEJU = '\uC81C\uC8FC';
const GOSANSA = '\uACE0\uC0B0\uC0AC';

test.use({ ignoreHTTPSErrors: true });

async function openExploreSearch(page) {
  await page.goto('/explore');
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 60_000 });
  return searchInput;
}

async function submitExploreQuery(page, query) {
  const searchInput = await openExploreSearch(page);
  await searchInput.fill(query);
  await searchInput.press('Enter');
  return searchInput;
}

test.describe('Explore bare Korean place queries', () => {
  test.beforeEach(async ({ page }) => {
    const ctx = page.context();
    await installExploreGeminiMock(ctx);
    await installExploreTourapiMock(ctx);
  });

  test('우do — 맨 위 결과 행에 제주, 가우do 없음', async ({ page }) => {
    await submitExploreQuery(page, UDO);
    const first = page.getByRole('button', { name: new RegExp(UDO) }).first();
    await expect(first).toBeVisible({ timeout: 120_000 });
    await expect(first.getByText(new RegExp(JEJU))).toBeVisible();
    await expect(page.getByRole('button', { name: new RegExp(GAUDO) })).toHaveCount(0);
  });

  test('닭머르 — 제주 해안 choice visible', async ({ page }) => {
    await submitExploreQuery(page, DAKMEORU);
    const first = page.getByRole('button', { name: new RegExp(DAKMEORU) }).first();
    await expect(first).toBeVisible({ timeout: 120_000 });
    await expect(first.getByText(new RegExp(JEJU))).toBeVisible();
    await expect(page.getByText(/맞는 장소를 찾지 못했습니다/)).toHaveCount(0);
  });

  test('고산사 — 카드 클릭 시 /place/ 상세', async ({ page }) => {
    await submitExploreQuery(page, GOSANSA);
    const card = page.getByRole('button', { name: new RegExp(GOSANSA) }).first();
    await expect(card).toBeVisible({ timeout: 120_000 });
    await card.click();
    await page.waitForURL(/\/place\//, { timeout: 60_000 });
    const path = new URL(page.url()).pathname;
    expect(path).toMatch(/^\/place\//);
    expect(path).not.toBe('/');
  });
});
