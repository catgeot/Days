import { test, expect } from './fixtures.js';
import { installExploreGeminiMock } from './explore-gemini-mock.js';
import { installExploreSeowonSearchMock } from './explore-seowon-search-mock.js';

test.use({ ignoreHTTPSErrors: true });

test('«서원» Enter — 소수·옥산·도동이 앞에 있고 건수가 목록과 같다', async ({ page }) => {
  await installExploreGeminiMock(page);
  await installExploreSeowonSearchMock(page);
  await page.goto('/explore');
  const input = page.getByRole('textbox', { name: /예: 속초|e\.g\. Sokcho/i }).first();
  await expect(input).toBeVisible({ timeout: 60_000 });
  await input.fill('서원');
  await input.press('Enter');

  const count = page.locator('[data-search-result-count]').first();
  await expect(count).toBeVisible({ timeout: 30_000 });
  const declared = Number(await count.getAttribute('data-search-result-count'));
  await expect(count).toHaveText(`검색 결과 ${declared}건`);

  const names = [];
  for (let guard = 0; guard < 40; guard += 1) {
    const pageNames = await page.locator('[data-search-result-card]').evaluateAll((els) =>
      els.map((el) => el.getAttribute('data-search-result-name') || ''),
    );
    names.push(...pageNames);
    const next = page.getByRole('button', { name: '다음' }).first();
    if ((await next.count()) === 0 || (await next.isDisabled())) break;
    const first = pageNames[0];
    await next.click();
    await expect
      .poll(async () =>
        page.locator('[data-search-result-card]').first().getAttribute('data-search-result-name'),
      )
      .not.toBe(first);
  }

  expect(names[0] || '').toContain('소수서원');
  const oksan = names.findIndex((name) => name.includes('옥산서원'));
  const dodong = names.findIndex((name) => name.includes('도동서원'));
  expect(oksan).toBeGreaterThan(0);
  expect(dodong).toBeGreaterThan(oksan);
  expect(names.some((name) => name.includes('서원구'))).toBe(false);
  expect(names).toContain('가199서원');
  expect(declared).toBeGreaterThan(180);
  expect(names.length).toBe(declared);
});
