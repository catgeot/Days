import { test, expect } from './fixtures.js';

const SEARCH_TERM = '속초';

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* location hint not shown */
  }
}

function festivalCards(page) {
  return page
    .getByRole('main')
    .getByRole('button')
    .filter({ has: page.locator('img[alt]') });
}

function festivalParam(url) {
  try {
    return new URL(url).searchParams.get('festival') || '';
  } catch {
    return '';
  }
}

test.describe('Korea search → festival card click', () => {
  test.use({ viewport: { width: 1280, height: 720 }, isMobile: false, hasTouch: false });

  test('uncommitted search draft opens detail and keeps filter', async ({ page }) => {
    test.setTimeout(180_000);

    await page.goto('/korea/');
    await expect(
      page.getByRole('heading', { name: /한국의 축제|Korea festivals/i }),
    ).toBeVisible({ timeout: 60_000 });
    await dismissLocHint(page);

    const searchInput = page.locator('#korea-festival-search-pc');
    await expect(searchInput).toBeVisible({ timeout: 30_000 });
    await searchInput.click();
    await searchInput.fill(SEARCH_TERM);

    await expect(page.getByText(/검색\s*·\s*속초/)).toBeVisible({
      timeout: 30_000,
    });

    const cards = festivalCards(page);
    await expect(cards).toHaveCount(1, { timeout: 30_000 });
    const festivalId = await cards.first().getAttribute('data-festival-id');
    expect(festivalId, 'search result data-festival-id').toBeTruthy();

    await cards.first().click();

    await expect(page.getByRole('dialog').first()).toBeVisible({
      timeout: 30_000,
    });
    await expect
      .poll(() => festivalParam(page.url()), {
        timeout: 30_000,
        message: '?festival= after card click',
      })
      .toBe(festivalId);

    const searchValue = await searchInput.inputValue();
    const searchPlaceholder = await searchInput.getAttribute('placeholder');
    expect(
      searchValue.includes(SEARCH_TERM) ||
        (searchPlaceholder && searchPlaceholder.includes(SEARCH_TERM)),
    ).toBeTruthy();
  });
});
