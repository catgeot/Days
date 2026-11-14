import { test, expect } from '@playwright/test';

const HUB_PATH =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=overseas';

async function openHub(page) {
  await page.goto(HUB_PATH, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
  await page.getByTestId('logbook-review-filter').waitFor({ timeout: 10_000 });
}

test.describe('LogBook review filter cards @mocked', () => {
  test('390 — 2-column grid, 12 visible, other cities chip', async ({ page }) => {
    await openHub(page);
    const grid = page.getByTestId('logbook-official-review-hub-card-grid');
    await expect(grid).toBeVisible();
    await expect(grid).toHaveClass(/grid-cols-2/);
    const items = page.getByTestId('logbook-official-review-hub-item');
    await expect(items).toHaveCount(12);
    await expect(page.getByTestId('logbook-review-filter-other-cities')).toBeVisible();
    const fallback = page.getByTestId('logbook-official-review-hub-card-fallback').first();
    await expect(fallback).toBeVisible();
    const href = await items.first().evaluate((el) => el.getAttribute('href') || '');
    expect(href).toMatch(/review=/);
  });

  test('1280 — 3-column grid', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHub(page);
    const grid = page.getByTestId('logbook-official-review-hub-card-grid');
    await expect(grid).toHaveClass(/xl:grid-cols-3/);
    const box = await grid.boundingBox();
    expect(box?.width).toBeGreaterThan(700);
    const columns = await page.evaluate(() => {
      const gridEl = document.querySelector('[data-testid="logbook-official-review-hub-card-grid"]');
      const cards = [...gridEl.querySelectorAll('[data-testid="logbook-official-review-hub-item"]')].slice(
        0,
        6,
      );
      return cards.map((el) => el.getBoundingClientRect().left);
    });
    const uniqueRows = [...new Set(columns.map((x) => Math.round(x / 40)))];
    expect(uniqueRows.length).toBeGreaterThanOrEqual(2);
  });

  test('load more adds up to 12 cards', async ({ page }) => {
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