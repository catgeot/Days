import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { test, expect } from './fixtures.js';

const __dir = dirname(fileURLToPath(import.meta.url));
const FIXTURE_ROWS = JSON.parse(
  readFileSync(join(__dir, 'fixtures/place-travelogue-reports.json'), 'utf8'),
);

const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
);

test.use({
  ignoreHTTPSErrors: true,
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 1,
});

function decodePostgrestIlikeToken(token) {
  let raw = String(token || '').trim();
  if (raw.startsWith('ilike.')) raw = raw.slice(6);
  else if (raw.startsWith('eq.')) raw = raw.slice(3);
  if (raw.startsWith('"') && raw.endsWith('"')) raw = raw.slice(1, -1);
  try {
    raw = decodeURIComponent(raw);
  } catch {
    /* keep raw */
  }
  return raw.replace(/\\/g, '').replace(/"/g, '').replace(/%/g, '').trim();
}

function rowsMatchingLocationNeedle(rows, needle) {
  if (!needle) return rows;
  return rows.filter((row) => String(row.location || '').includes(needle));
}

function rowsMatchingOrLocationIlike(rows, orParam) {
  const needles = String(orParam || '')
    .split(',')
    .filter((part) => part.includes('location.ilike.'))
    .map((part) => {
      const marker = 'location.ilike.';
      const idx = part.indexOf(marker);
      return decodePostgrestIlikeToken(part.slice(idx + marker.length));
    })
    .filter(Boolean);
  if (!needles.length) return [];
  return rows.filter((row) => {
    const loc = String(row.location || '');
    return needles.some((needle) => loc.includes(needle));
  });
}

function fulfillReports(route, rows) {
  const url = new URL(route.request().url());
  if (!url.pathname.includes('/rest/v1/reports')) {
    return route.continue();
  }
  const placeSlugParam = url.searchParams.get('place_slug');
  if (placeSlugParam) {
    const slugValue = placeSlugParam.replace(/^eq\./, '');
    const filtered = rows.filter((row) => row.place_slug === slugValue);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  }
  const orParam = url.searchParams.get('or');
  if (orParam && orParam.includes('location.ilike')) {
    const filtered = rowsMatchingOrLocationIlike(rows, orParam);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  }
  const locationParam = url.searchParams.get('location');
  if (locationParam) {
    const needle = decodePostgrestIlikeToken(locationParam);
    const filtered = rowsMatchingLocationNeedle(rows, needle);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(filtered),
    });
  }
  return route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(rows),
  });
}

async function openBangkokFromSearch(page) {
  await page.goto('/?lang=ko');
  const search = page.getByRole('button', { name: /여행지 검색|여행지 탐색|Search destinations/i }).first();
  await expect(search).toBeVisible({ timeout: 60_000 });
  await search.click();
  await expect(page).toHaveURL(/\/explore/, { timeout: 30_000 });
  const input = page.locator('input[placeholder]:visible').first();
  await input.fill('방콕');
  const row = page
    .locator('[data-search-popover] button')
    .filter({ hasNotText: 'MOONi' })
    .filter({ hasText: /방콕/ })
    .first();
  await expect(row).toBeVisible({ timeout: 20_000 });
  await row.click();
  await expect(page).toHaveURL(/\/place\/bangkok/, { timeout: 30_000 });
}

test.describe('place overview GATEO travelogue card (flag ON, fixtures)', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/rest/v1/reports**', (route) => fulfillReports(route, FIXTURE_ROWS));
    await page.route('https://images.unsplash.com/**', (route) =>
      route.fulfill({ status: 200, contentType: 'image/png', body: PNG }),
    );
  });

  test('shows card and opens editorial travelogue', async ({ page }) => {
    await openBangkokFromSearch(page);
    const card = page.locator('[data-place-travelogue-card]:visible');
    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card).toContainText('GATEO 기행문');
    await expect(card).toContainText('E2E 방콕 GATEO 기행문');
    await expect(card).toContainText('픽스처 데크');

    await page.locator('[data-place-travelogue-item]:visible').first().click();
    await expect(page).toHaveURL(/\/blog\/e\/e2e-bangkok-travelogue/, { timeout: 30_000 });
  });
});
