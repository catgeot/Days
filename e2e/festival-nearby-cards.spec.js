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

async function waitNearbyCardImages(section) {
  await section.scrollIntoViewIfNeeded();
  const cards = section.locator('[data-nearby-photo-card]');
  await expect(cards.first()).toBeVisible({ timeout: 120_000 });
  const imgs = section.locator('img[data-festival-photo]');
  const count = await imgs.count();
  for (let i = 0; i < count; i++) {
    const img = imgs.nth(i);
    await img.scrollIntoViewIfNeeded();
    await expect
      .poll(
        async () =>
          img.evaluate((el) => el.complete && el.naturalWidth > 0),
        { timeout: 45_000 },
      )
      .toBe(true);
  }
  await expect(section.locator('[data-festival-photo-pending]')).toHaveCount(0, {
    timeout: 5_000,
  });
}

async function clearNearbyBandFilter(section) {
  const pressed = section.locator('[data-nearby-summary-cell][aria-pressed="true"]');
  if ((await pressed.count()) > 0) {
    await pressed.first().evaluate((node) => node.click());
  }
}

async function waitSheetReadyForCapture(page) {
  await page.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"].overflow-y-auto');
    if (sheet) sheet.scrollTop = 0;
  });
  await page.waitForTimeout(350);
}

async function collectCardImageStats(section) {
  const cards = section.locator('[data-nearby-photo-card]');
  const count = await cards.count();
  let hasUrl = 0;
  let loaded = 0;
  let failed = 0;
  for (let i = 0; i < count; i++) {
    const row = await cards.nth(i).evaluate((node) => {
      const img = node.querySelector('img[data-festival-photo]');
      const url = img?.getAttribute('src') || '';
      const ok = Boolean(img && img.complete && img.naturalWidth > 0);
      const bad = Boolean(img && img.complete && img.naturalWidth === 0 && url);
      return { hasUrl: Boolean(url), loaded: ok, failed: bad };
    });
    if (row.hasUrl) hasUrl += 1;
    if (row.loaded) loaded += 1;
    if (row.failed) failed += 1;
  }
  return { total: count, hasUrl, loaded, failed };
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

async function measureCloseVsRightColumnCards(page, section) {
  const close = page.getByRole('button', { name: /^닫기$|^Close$/i }).last();
  await expect(close).toBeVisible();
  await section.scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const sheet = document.querySelector('[role="dialog"].overflow-y-auto');
    if (sheet) sheet.scrollTop = sheet.scrollHeight;
  });
  await page.waitForTimeout(300);
  return page.evaluate(() => {
    const buttons = [...document.querySelectorAll('body > button.fixed')];
    const closeBtn = buttons.find((b) => /닫기|Close/i.test(b.getAttribute('aria-label') || ''));
    if (!closeBtn) return { close: null, rightColumnCards: [], overlaps: [] };
    const btn = closeBtn.getBoundingClientRect();
    const cards = [...document.querySelectorAll('[data-nearby-photo-card]')];
    const lefts = cards.map((c) => c.getBoundingClientRect().left);
    const mid =
      lefts.length > 1
        ? (Math.min(...lefts) + Math.max(...lefts)) / 2
        : Number.POSITIVE_INFINITY;
    const rightColumnCards = cards
      .map((card) => {
        const r = card.getBoundingClientRect();
        return { title: card.querySelector('[data-nearby-compact-card]')?.textContent?.trim()?.slice(0, 24) || '', rect: r };
      })
      .filter((row) => row.rect.left >= mid - 2);
    const vh = window.innerHeight || 844;
    const overlaps = rightColumnCards
      .map((row) => {
        const r = row.rect;
        const visible = r.bottom > 0 && r.top < vh;
        const intersects =
          visible &&
          r.left < btn.right &&
          r.right > btn.left &&
          r.top < btn.bottom &&
          r.bottom > btn.top;
        return { title: row.title, intersects, visible };
      })
      .filter((row) => row.intersects);
    const toJson = (rect) => ({
      x: Math.round(rect.x),
      y: Math.round(rect.y),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      right: Math.round(rect.right),
      bottom: Math.round(rect.bottom),
    });
    return {
      close: toJson(btn),
      rightColumnCards: rightColumnCards.map((row) => ({
        title: row.title,
        rect: toJson(row.rect),
      })),
      overlaps,
    };
  });
}

async function assertCloseButtonDoesNotOverlapCards(page, section) {
  const report = await measureCloseVsRightColumnCards(page, section);
  test.info().attach('close-x-bbox-390', {
    body: JSON.stringify(report, null, 2),
    contentType: 'application/json',
  });
  expect(report.overlaps?.length || 0, JSON.stringify(report)).toBe(0);
}

test.describe('Festival nearby cards — flag ON', () => {
  test('825295 attractions + food banner, grid, summary tap no scroll', async ({ page }) => {
    test.setTimeout(180_000);
    await page.goto('/korea/');
    await dismissLocHint(page);

    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await assertTwoColumnGrid(attractions);
    await waitNearbyCardImages(attractions);

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
    await clearNearbyBandFilter(attractions);

    const food = dialog.locator('[data-festival-section="nearFood"]');
    await expect(food).toBeVisible({ timeout: 120_000 });
    await assertTwoColumnGrid(food);
    await waitNearbyCardImages(food);
    await assertCloseButtonDoesNotOverlapCards(page, attractions);
    await waitSheetReadyForCapture(page);
    await clearNearbyBandFilter(attractions);

    const attrStats = await collectCardImageStats(attractions);
    const foodStats = await collectCardImageStats(food);
    test.info().attach('825295-image-stats', {
      body: JSON.stringify({ attractions: attrStats, food: foodStats }, null, 2),
      contentType: 'application/json',
    });

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
    await waitNearbyCardImages(attractions);
    await waitSheetReadyForCapture(page);
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/4128786-nearAttractions-390-flag-on.png`,
    });
    const food = dialog.locator('[data-festival-section="nearFood"]');
    if ((await food.count()) > 0) {
      await assertTwoColumnGrid(food);
      await waitNearbyCardImages(food);
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
    await waitNearbyCardImages(attractions);
    await waitSheetReadyForCapture(page);
    await attractions.screenshot({
      path: `${SCREENSHOT_DIR}/4106717-nearAttractions-390-flag-on.png`,
    });
    const food = dialog.locator('[data-festival-section="nearFood"]');
    await expect(food).toHaveCount(0);
    await expect(dialog.locator('[data-nearby-banner]').filter({ hasText: '맛집' })).toHaveCount(0);
  });

  test('image failure shows compact card', async ({ page }) => {
    test.setTimeout(180_000);
    await page.route('**/*tong.visitkorea.or.kr/**', (route) => route.abort());
    await page.route('**/*cdn.visitkorea.or.kr/**', (route) => route.abort());
    await dismissLocHint(page);
    const dialog = await openFestival(page, '825295');
    const attractions = dialog.locator('[data-festival-section="nearAttractions"]');
    await expect(attractions.locator('[data-nearby-compact-card]').first()).toBeVisible({
      timeout: 120_000,
    });
  });
});
