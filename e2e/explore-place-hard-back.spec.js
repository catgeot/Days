import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const FX = JSON.parse(readFileSync(join(__dir, 'fixtures/rome-travelogue-fullpage.json'), 'utf8'));

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

const SEARCH_CASES = [
  { query: '로마', pattern: /로마/, placePath: /\/place\/rome(?:\/|$|\?)/ },
  { query: '수원화성', pattern: /수원화성/, placePath: /\/place\// },
];

function attachPageErrors(page, bucket) {
  page.on('pageerror', (err) => {
    bucket.push({ message: err.message, stack: err.stack || '' });
  });
}

function expectErrorsClean(errors) {
  const fatal = errors.filter(
    (e) => !/access control checks|Fetch API cannot load/i.test(e.message || ''),
  );
  expect(fatal, JSON.stringify(errors, null, 2)).toHaveLength(0);
}

async function installPlaceMocks(context) {
  await context.route(/supabase\.co/, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.includes('/auth/v1')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) });
    }
    if (path.includes('/report_comments')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/place_reviews')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/place_videos')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await context.route('https://images.unsplash.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
  await context.route('https://www.googleapis.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' }),
  );
}

async function installBlogMocks(context) {
  await installPlaceMocks(context);
  await context.route(/supabase\.co/, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.includes('/auth/v1')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) });
    }
    if (path.includes('/reports')) {
      const slug = url.searchParams.get('slug');
      if (slug === 'eq.rome-travelogue') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FX.editorialReport),
        });
      }
      const loc = url.searchParams.get('location') || '';
      if (loc.includes('로마') || String(url.searchParams.get('or') || '').includes('로마')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([FX.editorialReport]),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });
  await context.route('https://images.unsplash.com/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
  );
}

async function openPlaceFromExploreSearch(page, query, namePattern) {
  await page.goto('/?lang=ko', { waitUntil: 'load' });
  const exploreCta = page
    .getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i })
    .first();
  await expect(exploreCta).toBeVisible({ timeout: 60_000 });
  await exploreCta.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  await page.waitForLoadState('load');
  await page.waitForLoadState('networkidle', { timeout: 25_000 }).catch(() => {});
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible({ timeout: 45_000 });
  await input.fill(query);
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: namePattern })
    .first();
  await expect(row).toBeVisible({ timeout: 30_000 });
  await row.click();
  await expect(page).toHaveURL(/\/place\//, { timeout: 120_000 });
  await page.waitForLoadState('load');
}

async function assertExploreAfterPlaceBack(page) {
  await expect(page).toHaveURL(/\/explore/, { timeout: 45_000 });
  await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
  const input = page.locator('input[placeholder]:visible').first();
  await expect(input).toBeVisible({ timeout: 30_000 });
}

async function clickPlaceScreenBack(page) {
  const chrome = page.locator('[data-place-chrome-hit]');
  await expect(chrome).toBeVisible({ timeout: 30_000 });
  await chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i }).click();
}

test.describe('explore search card → place → hard back', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await installPlaceMocks(context);
  });

  for (const { query, pattern, placePath } of SEARCH_CASES) {
    test(`«${query}» explore ← UI live @390`, async ({ page }) => {
      test.skip(test.info().project.name !== 'webkit-explore-hard-back-390', '390 only');
      const errors = [];
      attachPageErrors(page, errors);

      await openPlaceFromExploreSearch(page, query, pattern);
      await expect(page).toHaveURL(placePath, { timeout: 30_000 });

      await clickPlaceScreenBack(page);
      await assertExploreAfterPlaceBack(page);

      const input = page.locator('input[placeholder]:visible').first();
      await input.fill('파리');
      await expect(page.locator('[data-search-popover] button').first()).toBeVisible({ timeout: 20_000 });
      expectErrorsClean(errors);
    });

    test(`«${query}» explore ← UI live @1280`, async ({ page }) => {
      test.skip(test.info().project.name !== 'chromium-explore-hard-back-1280', '1280 only');
      const errors = [];
      attachPageErrors(page, errors);

      await openPlaceFromExploreSearch(page, query, pattern);
      await expect(page).toHaveURL(placePath, { timeout: 30_000 });

      await clickPlaceScreenBack(page);
      await assertExploreAfterPlaceBack(page);
      expectErrorsClean(errors);
    });

    test(`«${query}» explore ← UI live @1024`, async ({ page }) => {
      test.skip(test.info().project.name !== 'chromium-explore-hard-back-1024', '1024 only');
      const errors = [];
      attachPageErrors(page, errors);

      await openPlaceFromExploreSearch(page, query, pattern);
      await expect(page).toHaveURL(placePath, { timeout: 30_000 });

      await clickPlaceScreenBack(page);
      await assertExploreAfterPlaceBack(page);
      expectErrorsClean(errors);
    });
  }

});

test.describe('blog editorial hard back', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await installBlogMocks(context);
  });

  test('기행문 상세 → hard ← @1280', async ({ page }) => {
    test.skip(test.info().project.name !== 'chromium-explore-hard-back-1280', '1280 only');
    const errors = [];
    attachPageErrors(page, errors);

    await page.goto('/blog/e/rome-travelogue?lang=ko', { waitUntil: 'load' });
    await expect(page.getByRole('heading', { name: '석양 전의 콜로세움' })).toBeVisible({ timeout: 45_000 });
    await page.locator('[data-logbook-detail-back]').click();
    await expect(page).toHaveURL(/\/blog(?:\?|$)/, { timeout: 45_000, waitUntil: 'load' });
    await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
    expectErrorsClean(errors);
  });
});