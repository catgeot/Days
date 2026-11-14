import { test, expect } from '@playwright/test';

const HUB_PATH =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=overseas';

async function openHub(page, path = HUB_PATH) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
  await page.getByTestId('logbook-review-filter').waitFor({ timeout: 10_000 });
}

async function assertTextLineCount(page, testId, maxLines, tolerance = 0.35) {
  const metrics = await page.evaluate((id) => {
    const el = document.querySelector(`[data-testid="${id}"]`);
    if (!el) return null;
    const style = getComputedStyle(el);
    const lineHeight = parseFloat(style.lineHeight);
    const height = el.getBoundingClientRect().height;
    if (!Number.isFinite(lineHeight) || lineHeight <= 0) return null;
    return { height, lineHeight, lines: height / lineHeight };
  }, testId);
  expect(metrics).toBeTruthy();
  expect(metrics.lines).toBeLessThanOrEqual(maxLines + tolerance);
}

async function assertCityRowSingleLine(page, { requireOverflow = false } = {}) {
  const metrics = await page.evaluate(() => {
    const row = document.querySelector('[data-testid="logbook-review-filter-city-row"]');
    if (!row) return null;
    const chips = [...row.querySelectorAll('button')];
    const tops = chips.map((el) => Math.round(el.getBoundingClientRect().top));
    const nowrap = getComputedStyle(row).flexWrap === 'nowrap';
    return {
      chipCount: chips.length,
      uniqueTops: [...new Set(tops)].length,
      scrollWidth: row.scrollWidth,
      clientWidth: row.clientWidth,
      nowrap,
    };
  });
  expect(metrics).toBeTruthy();
  expect(metrics.nowrap).toBe(true);
  expect(metrics.uniqueTops).toBe(1);
  expect(metrics.chipCount).toBeGreaterThanOrEqual(2);
  if (requireOverflow) {
    expect(metrics.scrollWidth).toBeGreaterThan(metrics.clientWidth);
  }
}

test.describe('LogBook review filter cards @mocked', () => {
  test('390 — 2-column grid, 12 visible, other cities chip', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    const grid = page.getByTestId('logbook-official-review-hub-card-grid');
    await expect(grid).toBeVisible();
    await expect(grid).toHaveClass(/grid-cols-2/);
    const items = page.getByTestId('logbook-official-review-hub-item');
    await expect(items).toHaveCount(12);
    await expect(page.getByTestId('logbook-review-filter-other-cities')).toBeVisible();
    await assertCityRowSingleLine(page, { requireOverflow: true });
    const href = await items.first().evaluate((el) => el.getAttribute('href') || '');
    expect(href).toMatch(/review=/);
  });

  test('390 — broken image shows persona fallback', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    const prague = page.locator('[data-hub-place-slug="prague"]').first();
    await expect(prague).toBeVisible();
    await expect(prague.getByTestId('logbook-official-review-hub-card-fallback')).toBeVisible();
    await expect(prague.getByTestId('logbook-official-review-hub-card-photo')).toHaveCount(0);
  });

  test('390 — chip tap does not change scrollY', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    const before = await page.evaluate(() => window.scrollY);
    await page.getByTestId('logbook-review-filter-major-domestic').click();
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBe(before);
  });

  test('1280 — 3-column grid, title + summary lines', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHub(page);
    const grid = page.getByTestId('logbook-official-review-hub-card-grid');
    await expect(grid).toHaveClass(/xl:grid-cols-3/);
    const title = page.getByTestId('logbook-official-review-hub-card-title').first();
    await expect(title).toBeVisible();
    const summary = page.getByTestId('logbook-official-review-hub-card-summary').first();
    if ((await summary.count()) > 0) {
      await expect(summary).toBeVisible();
      await assertTextLineCount(page, 'logbook-official-review-hub-card-summary', 1);
    }
    await assertTextLineCount(page, 'logbook-official-review-hub-card-title', 2);
    await assertCityRowSingleLine(page);
  });

  test('load more adds up to 12 cards', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    const before = await page.getByTestId('logbook-official-review-hub-item').count();
    expect(before).toBe(12);
    const more = page.getByTestId('logbook-official-review-hub-more');
    await expect(more).toBeVisible();
    await more.click();
    const after = await page.getByTestId('logbook-official-review-hub-item').count();
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBeLessThanOrEqual(12);
  });
});