// 홈 검색 결과 탭 → /place/<slug> (WebKit 390 해외 직행 회귀)
import { test, expect } from './fixtures.js';

test.use({ ignoreHTTPSErrors: true });

async function openHomeSearch(page) {
  await page.goto('/');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible();
  return input;
}

async function tapSearchResult(page, query, resultText) {
  const input = await openHomeSearch(page);
  await input.click();
  await input.fill(query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: resultText })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
}

test.describe('home search result opens /place', () => {
  test('사파 / Sapa opens /place/sapa', async ({ page }) => {
    await tapSearchResult(page, '사파', '사파');
    await expect(page).toHaveURL(/\/place\/sapa(?:\/|$|\?)/, { timeout: 30_000 });
    await page.goto('/');
    await tapSearchResult(page, 'Sapa', '사파');
    await expect(page).toHaveURL(/\/place\/sapa(?:\/|$|\?)/, { timeout: 30_000 });
  });

  test('카이로 / Cairo opens /place/cairo', async ({ page }) => {
    await tapSearchResult(page, '카이로', '카이로');
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
    await page.goto('/');
    await tapSearchResult(page, 'Cairo', '카이로');
    await expect(page).toHaveURL(/\/place\/cairo(?:\/|$|\?)/, { timeout: 30_000 });
  });

  test('갯벌 — UNESCO 3장·음식점 부분일치 없음·/place 이동 (홈→탐색)', async ({ page }) => {
    const input = await openHomeSearch(page);
    await input.fill('갯벌');
    const buttons = page.locator('[data-search-popover] button').filter({ hasNotText: 'MOONi' });
    await expect(buttons).toHaveCount(3, { timeout: 30_000 });
    await expect(buttons.filter({ hasText: /횟집|회집|팰리스|스타일/ })).toHaveCount(0);

    const cases = [
      { label: /고창\s*갯벌/, path: '/place/tour-2615234' },
      { label: /신안갯벌|증도/, path: /\/place\/tour-575607/ },
      { label: /순천만습지/, path: '/place/tour-126730' },
    ];
    for (const { label, path } of cases) {
      await input.fill('');
      await input.fill('갯벌');
      const card = buttons.filter({ hasText: label }).first();
      await expect(card).toBeVisible({ timeout: 20_000 });
      await card.click();
      await page.waitForURL(path, { timeout: 60_000 });
      await page.goto('/');
      await openHomeSearch(page);
    }
  });

  test('domestic 속초 and 제주 still open their place pages', async ({ page }) => {
    await tapSearchResult(page, '속초', '속초');
    await expect(page).toHaveURL(/\/place\/sokcho(?:\/|$|\?)/, { timeout: 30_000 });
    await page.goto('/');
    await tapSearchResult(page, '제주', '제주');
    await expect(page).toHaveURL(/\/place\/jeju(?:\/|$|\?)/, { timeout: 30_000 });
  });
});
