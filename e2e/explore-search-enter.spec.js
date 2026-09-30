// Explore Enter 검색 — 기백산 ReferenceError 회귀 (@see QA report 2026-10-01)
import { test, expect } from '@playwright/test';

test.use({ ignoreHTTPSErrors: true });

async function blockSupabaseWrites(page) {
  await page.route(/\/rest\/v1\//, async (route) => {
    const req = route.request();
    if (req.method() !== 'GET') {
      await route.abort();
      return;
    }
    await route.continue();
  });
}

function attachReferenceErrors(page) {
  const errors = [];
  page.on('pageerror', (err) => errors.push(String(err?.message || err)));
  return errors;
}

async function openExploreSearch(page) {
  await page.goto('/explore');
  const searchInput = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(searchInput).toBeVisible({ timeout: 60_000 });
  return searchInput;
}

async function submitExploreQuery(page, query) {
  const errors = attachReferenceErrors(page);
  await blockSupabaseWrites(page);
  const searchInput = await openExploreSearch(page);
  await searchInput.fill(query);
  await searchInput.press('Enter');
  return { errors, searchInput };
}

test.describe('Explore search Enter', () => {
  test('기백산 + Enter shows choice card (not stuck empty explore state)', async ({ page }) => {
    const { errors } = await submitExploreQuery(page, '기백산');

    await expect(
      page.getByRole('button', { name: /기백산/ }).first(),
    ).toBeVisible({ timeout: 120_000 });

    const refErrors = errors.filter((m) => /placeNameMatchesSearchQuery|preferEnterSuggestion/.test(m));
    expect(refErrors).toEqual([]);
  });

  test('지리산 + Enter shows selection card', async ({ page }) => {
    const { errors } = await submitExploreQuery(page, '지리산');

    await expect(
      page.getByRole('button', { name: /지리산/ }).first(),
    ).toBeVisible({ timeout: 120_000 });

    const refErrors = errors.filter((m) => /placeNameMatchesSearchQuery|preferEnterSuggestion/.test(m));
    expect(refErrors).toEqual([]);
  });

  test('기백 + Enter shows selection card (AI fallback path)', async ({ page }) => {
    const { errors } = await submitExploreQuery(page, '기백');

    await expect(
      page.getByRole('button', { name: /기백|백두|설악|오대/i }).first(),
    ).toBeVisible({ timeout: 180_000 });

    const refErrors = errors.filter((m) => /placeNameMatchesSearchQuery|preferEnterSuggestion/.test(m));
    expect(refErrors).toEqual([]);
  });
});
