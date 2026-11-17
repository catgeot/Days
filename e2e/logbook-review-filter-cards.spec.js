import { test, expect } from '@playwright/test';

const HUB_PATH =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=overseas';

const HUB_PATH_ALL =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1';

async function tapChip(page, testId) {
  const chip = page.getByTestId(testId);
  const useTouch = test.info().project.name.includes('webkit');
  if (useTouch) {
    await chip.tap();
  } else {
    await chip.click();
  }
}

async function openHub(page, path = HUB_PATH) {
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
  const toggle = page.getByTestId('logbook-official-review-hub-toggle');
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 15_000 });
  await page.getByTestId('logbook-review-filter').waitFor({ timeout: 10_000 });
}

async function assertReviewerNameVisible(card, name) {
  const reviewer = card.getByTestId('logbook-official-review-hub-card-reviewer');
  await reviewer.scrollIntoViewIfNeeded();
  await expect(reviewer).toBeVisible();
  await expect(reviewer).toContainText(name);
  const badge = await card.getAttribute('data-hub-persona-badge');
  expect(badge).toContain(name);
  await expect(reviewer).toHaveText(badge);
  const metrics = await reviewer.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    const x = Math.min(rect.right - 2, Math.max(rect.left + 2, rect.left + rect.width / 2));
    const y = Math.min(rect.bottom - 2, Math.max(rect.top + 2, rect.top + rect.height / 2));
    const node = document.elementFromPoint(x, y);
    const cardEl = el.closest('[data-testid="logbook-official-review-hub-item"]');
    const cardRect = cardEl.getBoundingClientRect();
    const title = cardEl.querySelector('[data-testid="logbook-official-review-hub-card-title"]');
    const titleRect = title?.getBoundingClientRect();
    const overlapsTitle = titleRect
      ? rect.bottom > titleRect.top + 1 && rect.top < titleRect.bottom - 1 && rect.right > titleRect.left && rect.left < titleRect.right
      : false;
    return {
      hit: node === el || el.contains(node),
      clipped: el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1,
      outside:
        rect.left < cardRect.left - 1 ||
        rect.right > cardRect.right + 1 ||
        rect.bottom > cardRect.bottom + 1,
      overlapsTitle,
    };
  });
  expect(metrics.hit).toBe(true);
  expect(metrics.clipped).toBe(false);
  expect(metrics.outside).toBe(false);
  expect(metrics.overlapsTitle).toBe(false);
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
    await expect(page.getByTestId('logbook-official-review-hub-card-title').first()).toHaveClass(/line-clamp-2/);
    await expect(page.getByTestId('logbook-official-review-hub-card-summary')).toHaveCount(0);
    const items = page.getByTestId('logbook-official-review-hub-item');
    await expect(items).toHaveCount(12);
    await expect(page.getByTestId('logbook-review-filter-other-cities')).toBeVisible();
    await assertCityRowSingleLine(page, { requireOverflow: true });
    const href = await items.first().evaluate((el) => el.getAttribute('href') || '');
    expect(href).toMatch(/review=/);
    await assertReviewerNameVisible(page.locator('[data-hub-place-slug="paris"]').first(), '야경렌즈');
    await assertReviewerNameVisible(page.locator('[data-hub-place-slug="prague"]').first(), '로컬하루');
    const archive = page.getByRole('heading', { name: /기록 보관소/ });
    await expect(archive).toBeVisible({ timeout: 15_000 });
    const gap = await page.evaluate(() => {
      const hub = document.querySelector('[data-testid="logbook-official-review-hub"]');
      const heading = [...document.querySelectorAll('h3')].find((el) =>
        /기록 보관소/.test(el.textContent || ''),
      );
      if (!hub || !heading) return null;
      return heading.getBoundingClientRect().top - hub.getBoundingClientRect().bottom;
    });
    expect(gap).toBeGreaterThanOrEqual(-1);
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
    await tapChip(page, 'logbook-review-filter-major-domestic');
    await page.waitForTimeout(150);
    const after = await page.evaluate(() => window.scrollY);
    expect(after).toBe(before);
  });

  test('filter chips push history — back and forward', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page, HUB_PATH_ALL);
    await tapChip(page, 'logbook-review-filter-major-overseas');
    await expect(page).toHaveURL(/region=overseas/);
    await expect(page).not.toHaveURL(/[?&]city=/);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await tapChip(page, 'logbook-review-filter-city-paris');
    await expect(page).toHaveURL(/region=overseas/);
    await expect(page).toHaveURL(/city=paris/);
    await expect(page.getByTestId('logbook-review-filter-city-paris')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.goBack();
    await expect(page).toHaveURL(/region=overseas/);
    await expect(page).not.toHaveURL(/[?&]city=/);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.goBack();
    await expect(page).not.toHaveURL(/region=overseas/);
    await expect(page.getByTestId('logbook-review-filter-major-all')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.goForward();
    await expect(page).toHaveURL(/region=overseas/);
    await expect(page).not.toHaveURL(/[?&]city=/);
    await expect(page.getByTestId('logbook-review-filter-major-overseas')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  test('1280 — 3-column grid, city/date + 2-line bold summary', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHub(page);
    const grid = page.getByTestId('logbook-official-review-hub-card-grid');
    await expect(grid).toHaveClass(/xl:grid-cols-3/);
    const title = page.getByTestId('logbook-official-review-hub-card-title').first();
    await expect(title).toBeVisible();
    await expect(title).toHaveClass(/line-clamp-2/);
    await expect(page.getByTestId('logbook-official-review-hub-card-reviewer').first()).toBeVisible();
    await expect(page.getByTestId('logbook-official-review-hub-card-summary')).toHaveCount(0);
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

  test('collapsed hub stays collapsed for the session', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await openHub(page);
    const toggle = page.getByTestId('logbook-official-review-hub-toggle');
    await toggle.click();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByTestId('logbook-official-review-hub-panel')).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => sessionStorage.getItem('gateo:logbook-review-hub-ui')))
      .toContain('"expanded":false');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 60_000 });
    await expect(page.getByTestId('logbook-official-review-hub-toggle')).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    await expect(page.getByTestId('logbook-official-review-hub-panel')).toHaveCount(0);
  });
});