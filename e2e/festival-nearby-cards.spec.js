import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = '/opt/cursor/artifacts/screenshots/nearby-cards';

async function dismissLocHint(page) {
  const close = page
    .getByRole('main')
    .getByRole('button', { name: /^닫기$|^Close$/i })
    .first();
  try {
    await close.waitFor({ state: 'visible', timeout: 2500 });
    await close.click();
  } catch {
    /* optional */
  }
}

async function openFestival(page, festivalId) {
  await page.goto(`/korea/?festival=${festivalId}`, { waitUntil: 'domcontentloaded' });
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible({ timeout: 120_000 });
  return dialog;
}

async function assertTwoColumnGrid(section) {
  await expect(section.locator('[data-nearby-banner]')).toBeVisible({ timeout: 120_000 });
  await expect(section.locator('[data-nearby-group-title]').first()).toBeVisible();
  const cards = section.locator('[data-nearby-photo-card]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  const count = await cards.count();
  expect(count).toBeGreaterThanOrEqual(2);
  const xs = await cards.evaluateAll((nodes) =>
    nodes.slice(0, 6).map((n) => Math.round(n.getBoundingClientRect().left)),
  );
  const unique = new Set(xs);
  expect(unique.size, `expected 2+ distinct card x positions, got ${JSON.stringify(xs)}`).toBeGreaterThanOrEqual(2);
}

test.describe('Festival nearby cards — flag ON', () => {
  test('825295 attractions + food banner, grid, summary tap no scroll', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/korea/');
    await dismissLocHint(page);

    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);

    const scrollBefore = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"].overflow-y-auto');
      return el?.scrollTop ?? 0;
    });
    const walkCell = attractions.locator('[data-nearby-summary-cell][data-band="walk"]');
    if ((await walkCell.getAttribute('disabled')) == null) {
      await walkCell.evaluate((node) => node.click());
    }
    const scrollAfter = await page.evaluate(() => {
      const el = document.querySelector('[role="dialog"].overflow-y-auto');
      return el?.scrollTop ?? 0;
    });
    expect(scrollAfter).toBe(scrollBefore);

    const food = dialog.locator('[data-festival-section="nearFood"]');
    await expect(food).toBeVisible({ timeout: 120_000 });
    await assertTwoColumnGrid(food);

    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/825295-nearAttractions-390-flag-on.png`,
    });
    await food.screenshot({
      path: `${SCREENSHOT_DIR}/825295-nearFood-390-flag-on.png`,
    });
  });

  test('4128786 attractions grid', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '4128786');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/4128786-nearAttractions-390-flag-on.png`,
    });
    const food = dialog.locator('[data-festival-section="nearFood"]');
    if ((await food.count()) > 0) {
      await assertTwoColumnGrid(food);
      await food.screenshot({
        path: `${SCREENSHOT_DIR}/4128786-nearFood-390-flag-on.png`,
      });
    }
  });

  test('4106717 attractions only — no empty food banner', async ({ page }) => {
    test.setTimeout(180_000);
    await dismissLocHint(page);
    const dialog = await openFestival(page, '4106717');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-nearAttractions-390-flag-on.png`,
    });
    const food = dialog.locator('[data-festival-section="nearFood"]');
    await expect(food).toHaveCount(0);
    await expect(dialog.locator('[data-nearby-banner]').filter({ hasText: '맛집' })).toHaveCount(0);
  });

  test('image failure shows text card', async ({ page }) => {
    test.setTimeout(180_000);
    await page.route('**/*tong.visitkorea.or.kr/**', (route) => route.abort());
    await page.route('**/*cdn.visitkorea.or.kr/**', (route) => route.abort());
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await expect(attractions.locator('[data-nearby-text-card]').first()).toBeVisible({
      timeout: 120_000,
    });
  });
});
