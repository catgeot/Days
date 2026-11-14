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

async function installRomeMocks(context) {
  await context.route(/supabase\.co/, (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname;
    if (path.includes('/auth/v1')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ user: null }) });
    }
    if (path.includes('/report_comments')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/report_likes')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/place_reviews')) {
      const slug = (url.searchParams.get('place_slug') || '').replace(/^eq\./, '');
      if (slug === 'rome') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([FX.longReview]),
        });
      }
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/place_videos')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
    }
    if (path.includes('/rpc/increment_report_view')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: '1' });
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
      const placeSlug = url.searchParams.get('place_slug');
      if (placeSlug === 'eq.rome') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FX.placeSlugRows),
        });
      }
      if (url.searchParams.get('location') || String(url.searchParams.get('or') || '').includes('location')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(FX.placeSlugRows),
        });
      }
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

async function openRomeFromExplore(page, { preferDirect = false } = {}) {
  if (preferDirect) {
    await page.goto('/place/rome?lang=ko');
    await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
    return;
  }
  await page.goto('/?lang=ko');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill('로마');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: /로마/ })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(page).toHaveURL(/\/place\/rome/, { timeout: 60_000 });
}

async function openRomeFromExploreForScreenBack(page) {
  await page.goto('/?lang=ko', { waitUntil: 'domcontentloaded' });
  await page.evaluate(() => {
    sessionStorage.setItem(
      'gateo:explore-return-snapshot',
      JSON.stringify({ path: '/explore', query: '?lang=ko', scrollY: 0, seq: 1 }),
    );
  });
  await page.goto('/place/rome?lang=ko', { waitUntil: 'domcontentloaded' });
  await expect(page).toHaveURL(/\/place\/rome/, { timeout: 30_000 });
}

test.describe('travelogue full-page navigation hotfix', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ context }) => {
    await installRomeMocks(context);
  });

  test('place gallery → editorial (full page) → back / EN respond @1280', async ({ page }) => {
    const errors = [];
    attachPageErrors(page, errors);
    test.skip(test.info().project.name !== 'chromium-travelogue-fullpage-1280', '1280 only');

    await openRomeFromExplore(page);
    const travelLink = page.locator('[data-place-travelogue-slug="rome-travelogue"]');
    await expect(travelLink).toBeVisible({ timeout: 45_000 });
    await Promise.all([
      page.waitForURL(/\/blog\/e\/rome-travelogue/, { timeout: 60_000 }),
      travelLink.click(),
    ]);
    await expect(page.getByRole('heading', { name: '석양 전의 콜로세움' })).toBeVisible({ timeout: 30_000 });

    const back = page.locator('[data-logbook-detail-back]');
    await back.click();
    await expect(page).toHaveURL(/\/blog(?:\?|$)/, { timeout: 30_000 });

    await page.goto('/blog/e/rome-travelogue?lang=ko');
    await expect(page.getByRole('heading', { name: '석양 전의 콜로세움' })).toBeVisible({ timeout: 30_000 });
    const en = page.getByRole('button', { name: /English|EN/i }).first();
    if (await en.isVisible().catch(() => false)) {
      await en.click();
      await page.waitForTimeout(500);
    }
    const mooni = page.getByRole('button', { name: /MOONi|무니/i }).first();
    if (await mooni.isVisible().catch(() => false)) {
      await mooni.click({ timeout: 5000 }).catch(() => {});
    }

    expectErrorsClean(errors);
  });

  test('direct editorial → back and same-place; reviews 더보기; explore ← @390', async ({ page }) => {
    const errors = [];
    attachPageErrors(page, errors);
    test.skip(test.info().project.name !== 'webkit-travelogue-fullpage-390', '390 only');

    await page.goto('/blog/e/rome-travelogue?lang=ko');
    await expect(page.getByRole('heading', { name: '석양 전의 콜로세움' })).toBeVisible({ timeout: 45_000 });

    const back = page.locator('[data-logbook-detail-back]');
    await back.click();
    await expect(page).toHaveURL(/\/blog(?:\?|$)/, { timeout: 30_000 });

    await page.goto('/blog/e/rome-travelogue?lang=ko');
    const samePlace = page.getByRole('link', { name: /같은 장소/i }).first();
    if (await samePlace.isVisible().catch(() => false)) {
      await Promise.all([
        page.waitForURL(/\/blog\?.*location=/, { timeout: 30_000 }),
        samePlace.click(),
      ]);
    }

    await page.goto('/place/rome/reviews?lang=ko');
    await expect(page).toHaveURL(/\/place\/rome\/reviews/, { timeout: 30_000 });
    const expand = page.locator('[data-review-expand-toggle]').first();
    await expect(expand).toBeVisible({ timeout: 20_000 });
    const before = await expand.getAttribute('aria-expanded');
    await expand.click();
    const after = await expand.getAttribute('aria-expanded');
    expect(before).not.toEqual(after);

    await openRomeFromExploreForScreenBack(page);
    const chrome = page.locator('[data-place-chrome-hit]');
    await chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i }).click();
    await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });

    expectErrorsClean(errors);
  });
});