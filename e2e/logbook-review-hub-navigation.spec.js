import { test, expect } from '@playwright/test';

const HUB_PATH =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=overseas';
const HUB_PATH_EN =
  '/blog?tab=public&lang=en&logbook_review_hub=1&logbook_filter=1&region=overseas';
const HUB_PATH_DOMESTIC =
  '/blog?tab=public&lang=ko&logbook_review_hub=1&logbook_filter=1&region=domestic';
const HWASEONG_REVIEW_ID = 'a9e7d546-7b70-47ce-bea1-362f36d12156';

function removeChildCount(page) {
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e?.message || e)));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errs.push(msg.text());
  });
  return () => errs.filter((t) => /removeChild/i.test(t)).length;
}

async function openHub(page, path = HUB_PATH) {
  await page.goto(path, { waitUntil: 'networkidle' });
  await page.getByTestId('logbook-official-review-hub').waitFor({ state: 'visible', timeout: 90_000 });
  await page.getByTestId('logbook-official-review-hub-toggle').click();
  await page.getByTestId('logbook-official-review-hub-panel').waitFor({ timeout: 30_000 });
}

async function loadMoreIfPresent(page) {
  const more = page.getByTestId('logbook-official-review-hub-more');
  if (await more.isVisible().catch(() => false)) {
    await more.click();
    await page.waitForTimeout(300);
  }
}

async function scrollHub(page) {
  await page.evaluate(() => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    if (el) el.scrollTop = 280;
  });
}

async function waitForHubScrollRestored(page, scrollBefore) {
  await page.waitForFunction(
    (before) => {
      const el = document.querySelector('[data-logbook-main-scroll]');
      if (!el) return false;
      const scrolled =
        Math.abs(el.scrollTop - before) < 80 ||
        (el.dataset.logbookHubScrollRestored === '1' &&
          Math.abs(Number(el.dataset.logbookHubScrollTarget || NaN) - before) < 80);
      return scrolled && Math.abs(el.scrollTop - before) < 80;
    },
    scrollBefore,
    { timeout: 30_000 },
  );
}

async function assertBlogHubVisible(page) {
  await expect(page.getByTestId('logbook-official-review-hub')).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
  expect(new URL(page.url()).pathname).toBe('/blog');
  const title = await page.title();
  expect(title.length).toBeGreaterThan(3);
}

async function tapPlaceChromeBack(page) {
  const chrome = page.locator('[data-place-chrome-hit]');
  await expect(chrome).toBeVisible();
  const backBtn = chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i });
  const isWebkit = test.info().project.name.includes('webkit');
  if (isWebkit) await backBtn.tap();
  else await backBtn.click();
}

async function openHwaseongReviewFromHub(page) {
  await openHub(page, HUB_PATH_DOMESTIC);
  await page.getByTestId('logbook-review-filter-major-domestic').click();
  await scrollHub(page);
  const card = page.locator(
    `[data-testid="logbook-official-review-hub-item"][data-review-id="${HWASEONG_REVIEW_ID}"]`,
  );
  await expect(card).toBeVisible({ timeout: 30_000 });
  const scrollBefore = await page.evaluate(() => {
    const el = document.querySelector('[data-logbook-main-scroll]');
    return el?.scrollTop ?? 0;
  });
  const isWebkit = test.info().project.name.includes('webkit');
  if (isWebkit) await card.tap();
  else await card.click();
  await page.waitForURL(
    new RegExp(
      `/place/hwaseong-fortress/reviews\\?.*review=${HWASEONG_REVIEW_ID.replace(/-/g, '\\-')}`,
    ),
    { timeout: 60_000 },
  );
  await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });
  await expect
    .poll(() => page.url(), { timeout: 60_000 })
    .toMatch(/\/place\/hwaseong-fortress\/reviews/);
  return { card, scrollBefore };
}

test.describe('LogBook review hub navigation @mocked', () => {
  test('390 WebKit — hub→review→back restores list state, removeChild 0', async ({ page }) => {
    const isWebkit = test.info().project.name.includes('webkit');
    test.skip(!isWebkit, 'WebKit-only matrix row');

    await page.setViewportSize({ width: 390, height: 844 });
    const countRemoveChild = removeChildCount(page);
    await openHub(page, HUB_PATH);
    await page.getByTestId('logbook-review-filter-major-overseas').click();
    await loadMoreIfPresent(page);
    await scrollHub(page);

    const visibleBefore = await page.getByTestId('logbook-official-review-hub-item').count();
    const scrollBefore = await page.evaluate(() => {
      const el = document.querySelector('[data-logbook-main-scroll]');
      return el?.scrollTop ?? 0;
    });

    const first = page.getByTestId('logbook-official-review-hub-item').first();
    await first.tap();
    await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 60_000 });
    await expect(page.getByTestId('place-card-route-loading')).toBeHidden({ timeout: 60_000 });

    await page.waitForTimeout(5_000);
    expect(countRemoveChild()).toBe(0);

    const chrome = page.locator('[data-place-chrome-hit]');
    await expect(chrome).toBeVisible();
    const backBtn = chrome.getByRole('button', { name: /^(뒤로가기|Back)$/i });
    await backBtn.tap();
    await expect(page.getByTestId('logbook-official-review-hub')).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
    expect(page.url()).toMatch(/\/blog/);
    const title = await page.title();
    expect(title.length).toBeGreaterThan(3);
    expect(title).toMatch(/GATEO|LogBook|logbook/i);

    await waitForHubScrollRestored(page, scrollBefore);
    const scrollAfter = await page.evaluate(() => {
      const el = document.querySelector('[data-logbook-main-scroll]');
      return el?.scrollTop ?? 0;
    });
    expect(Math.abs(scrollAfter - scrollBefore)).toBeLessThan(80);
    const visibleAfter = await page.getByTestId('logbook-official-review-hub-item').count();
    expect(visibleAfter).toBeGreaterThanOrEqual(visibleBefore);

    await first.tap();
    await page.waitForURL(/\/place\/[^/]+\/reviews/, { timeout: 60_000 });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    expect(page.url()).toMatch(/\/blog/);
    await expect(page.getByTestId('logbook-official-review-hub')).toBeVisible();
    await expect(page.locator('[data-place-chrome-hit]')).toHaveCount(0);
    expect((await page.title()).length).toBeGreaterThan(3);
  });

  test('hwaseong review deeplink — screen·browser back to /blog (prod path)', async ({
    page,
  }) => {
    const isWebkit = test.info().project.name.includes('webkit');
    const is1280 = test.info().project.name.includes('1280');
    test.skip(!isWebkit && !is1280, '390 WebKit or 1280 Chromium only');

    const { card, scrollBefore: scrollTarget } = await openHwaseongReviewFromHub(page);

    await tapPlaceChromeBack(page);
    await assertBlogHubVisible(page);
    await waitForHubScrollRestored(page, scrollTarget);
    await expect(page.getByTestId('logbook-review-filter-major-domestic')).toBeVisible();

    if (isWebkit) await card.tap();
    else await card.click();
    await page.waitForURL(/\/place\/hwaseong-fortress\/reviews/, { timeout: 60_000 });
    await page.goBack({ waitUntil: 'domcontentloaded' });
    await assertBlogHubVisible(page);
    await waitForHubScrollRestored(page, scrollTarget);
  });

  test('1280 — EN hub title + city chip label', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await openHub(page, HUB_PATH_EN);
    const hubToggle = page.getByTestId('logbook-official-review-hub-toggle');
    const hubText = await hubToggle.innerText();
    expect(hubText).toMatch(/GATEO reviewer reviews/i);
    const domestic = page.getByTestId('logbook-review-filter-major-domestic');
    await expect(domestic).toContainText('Korea');
    const cityChip = page.locator('[data-testid^="logbook-review-filter-city-"]').first();
    await expect(cityChip).toBeVisible();
    const chipText = await cityChip.innerText();
    expect(chipText).not.toMatch(/^[가-힣]/);
  });
});