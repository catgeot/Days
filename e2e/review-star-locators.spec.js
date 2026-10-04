import { test, expect } from '@playwright/test';
import { editorialReviewCards, starRatingIn } from './review-star-locators.js';

const STAR = (filled) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" class="lucide lucide-star w-4 h-4 ${filled ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}"><polygon points="12 2 15 9 22 9 17 14 19 21 12 17 5 21 7 14 2 9 9 9"/></svg>`;

const card = (editorial, withStars) => `
<div class="bg-white border border-gray-100 rounded-xl p-5 shadow-sm" data-qa-card>
  <div class="flex justify-between items-start mb-3">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-full">G</div>
      <div><div class="font-medium text-gray-900 text-sm flex flex-wrap items-center gap-2">
        ${editorial ? '<span class="text-[11px] font-semibold text-indigo-800 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">GATEO 리뷰어 · 페르소나</span>' : 'user'}
      </div><div class="text-xs text-gray-400 mt-0.5">2026년 10월 1일</div></div>
    </div>
    <div class="flex flex-col items-end gap-1">
      ${withStars ? `<div class="flex gap-0.5" data-review-stars="">${STAR(1) + STAR(1) + STAR(1) + STAR(1) + STAR(0)}</div>` : ''}
    </div>
  </div><p>본문</p>
</div>`;

const blogCard = `<div class="shrink-0 w-56 bg-white border rounded-xl border-indigo-100"><h5>blog</h5></div>`;

test.beforeEach(async ({ context }) => {
  await context.route('**/*', (r) => r.abort());
});

async function prAssertion(page) {
  const editorialCards = editorialReviewCards(page);
  await expect(editorialCards.first()).toBeVisible({ timeout: 2000 });
  const n = await editorialCards.count();
  expect(n).toBeGreaterThan(0);
  for (let i = 0; i < n; i += 1) {
    await expect(starRatingIn(editorialCards.nth(i))).toHaveCount(0, { timeout: 1000 });
  }
  return n;
}

test.describe('review-star-locators', () => {
  test('NEGATIVE: editorial review WITH stars → assertion must FAIL', async ({ page }) => {
    await page.setContent(`<main>${blogCard}${card(true, true)}${card(false, true)}</main>`);
    let failed = false;
    try {
      await prAssertion(page);
    } catch {
      failed = true;
    }
    expect(failed, 'star check must fail when stars exist on editorial review card').toBe(true);
  });

  test('POSITIVE: editorial review WITHOUT stars → assertion passes', async ({ page }) => {
    await page.setContent(`<main>${blogCard}${card(true, false)}${card(false, true)}</main>`);
    await prAssertion(page);
  });
});
