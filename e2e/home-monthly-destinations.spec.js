import fs from 'node:fs';
import { test, expect } from './fixtures.js';

const NOVEMBER_AT = '2026-11-25T03:00:00.000Z';

function overlaps(a, b) {
  if (!a || !b || a.width < 1 || b.width < 1) return false;
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

async function box(locator) {
  return locator.evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      right: rect.right,
      top: rect.top,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
    };
  });
}

async function openHome(page, path, time) {
  if (time) await page.clock.install({ time: new Date(time) });
  await page.addInitScript(() => {
    window.__gateoGaEvents = window.__gateoGaEvents || [];
  });
  await page.goto(path, { waitUntil: 'domcontentloaded' });
}

async function visibleBox(page, testId) {
  const locator = page.locator(`[data-testid="${testId}"]:visible`);
  if ((await locator.count()) === 0) return null;
  return box(locator.first());
}

test.describe('home monthly destinations', () => {
  test('flag off keeps the current card', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    const height = testInfo.project.use.viewport?.height ?? 844;
    await openHome(page, '/');
    const card = page.getByTestId('home-watch-card');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).not.toHaveAttribute('data-monthly-switch');
    await expect(card).toContainText('지금 볼 거리');
    await expect(page.getByTestId('home-monthly-switch')).toHaveCount(0);
    await expect(page.getByTestId('home-monthly-scroller')).toHaveCount(0);
    await expect(card).toHaveAttribute('data-slot-count', width >= 1280 ? '4' : '3');
    await expect(page.getByTestId('home-watch-slot-destination')).toHaveCount(width >= 1280 ? 4 : 3);

    const cardBox = await box(card);
    expect(cardBox.height).toBeGreaterThanOrEqual(80);
    expect(cardBox.height).toBeLessThanOrEqual(96);
    if (width >= 1280) {
      expect(cardBox.left).toBeGreaterThanOrEqual(290);
      expect(cardBox.left).toBeLessThanOrEqual(310);
      expect(height - cardBox.bottom).toBeGreaterThanOrEqual(100);
      expect(height - cardBox.bottom).toBeLessThanOrEqual(120);
    } else if (width === 390 && height === 844) {
      expect(cardBox.left).toBeGreaterThanOrEqual(10);
      expect(cardBox.left).toBeLessThanOrEqual(16);
      expect(cardBox.top).toBeGreaterThanOrEqual(500);
      expect(cardBox.top).toBeLessThanOrEqual(570);
    }
  });

  test('flag on switches month, scrolls, and clears bottom chrome', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 390;
    const height = testInfo.project.use.viewport?.height ?? 844;
    const project = testInfo.project.name;
    await openHome(page, '/?home_monthly_switch=1', NOVEMBER_AT);
    const card = page.getByTestId('home-watch-card');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toHaveAttribute('data-monthly-placed', '1', { timeout: 60_000 });
    await expect(card).toHaveAttribute('data-month-key', '2026-11');
    await expect(card).toContainText('11월 여행지');
    const link = page.getByTestId('home-monthly-switch');
    await expect(link).toBeVisible();
    await expect(link).toHaveText('12월 보기 ▸');
    await expect(link).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(link).toHaveCSS('border-radius', '0px');
    await expect(link).toHaveCSS('border-top-width', '0px');
    const cardBox = await box(card);
    expect(cardBox.height).toBeGreaterThanOrEqual(85);
    expect(cardBox.height).toBeLessThan(86);

    const hint = page.getByText('여행을 찾아봐요');
    if (await hint.count()) {
      await expect(hint).toBeHidden({ timeout: 8_000 });
    }
    const closeHint = page.getByRole('button', { name: '말풍선 닫기' });
    if (await closeHint.count()) {
      await closeHint.click();
      await expect(closeHint).toBeHidden({ timeout: 8_000 });
    }
    await expect(page.locator('.mapboxgl-canvas')).toBeVisible();
    await expect(page.locator('.mapboxgl-ctrl-logo')).toBeVisible({ timeout: 20_000 });
    await page.waitForTimeout(2_000);
    await expect(page.getByTestId('mooni-fab-open')).toBeVisible();
    const about = await visibleBox(page, 'home-about-row');
    const nav = await visibleBox(page, 'home-category-bar');
    const mooni = await visibleBox(page, 'mooni-fab-open');
    const chat = await visibleBox(page, 'home-bottom-chat');
    const account = await visibleBox(page, 'home-bottom-account');
    const placed = await box(card);
    expect(about, 'about row').toBeTruthy();
    expect(placed.bottom).toBeLessThanOrEqual(about.top + 0.5);
    expect(overlaps(placed, about)).toBe(false);
    expect(overlaps(placed, mooni)).toBe(false);
    for (const obstacle of [nav, chat, account]) {
      if (!obstacle) continue;
      expect(overlaps(placed, obstacle)).toBe(false);
      expect(placed.bottom).toBeLessThanOrEqual(obstacle.top + 0.5);
    }
    const named = [about, nav, chat, account].filter(Boolean);
    const gaps = named
      .filter((obstacle) => placed.left < obstacle.right && placed.right > obstacle.left)
      .map((obstacle) => obstacle.top - placed.bottom)
      .filter((gap) => gap >= -0.5);
    expect(gaps.length).toBeGreaterThan(0);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(4);
    expect(Math.min(...gaps)).toBeLessThanOrEqual(16);

    fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
    if (await hint.count()) {
      await expect(hint).toBeHidden({ timeout: 8_000 });
    }
    if (project === 'chromium-home-monthly-390') {
      await page.screenshot({
        path: '/opt/cursor/artifacts/home-monthly-390.png',
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
    }
    if (project === 'chromium-home-monthly-1280') {
      await page.screenshot({
        path: '/opt/cursor/artifacts/home-monthly-1280.png',
        clip: { x: 0, y: 0, width: 1280, height: 800 },
      });
    }

    const scroller = page.getByTestId('home-monthly-scroller');
    const before = await scroller.evaluate((el) => ({
      scrollLeft: el.scrollLeft,
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(before.scrollWidth).toBeGreaterThan(before.clientWidth + 8);
    await expect(page.getByTestId('home-watch-slot-destination')).toHaveCount(6);

    const url = page.url();
    await link.click();
    await expect(page).toHaveURL(url);
    await expect(card).toContainText('12월 여행지');
    await expect(link).toHaveText('11월 보기 ▸');
    await expect(card).toHaveAttribute('data-month-key', '2026-12');
    await expect(page.locator('[data-slug="sapporo"]')).toHaveCount(1);
    await expect(page.locator('[data-slug="kyoto"]')).toHaveCount(0);
    if (project === 'chromium-home-monthly-390') {
      await page.screenshot({
        path: '/opt/cursor/artifacts/home-monthly-390-december.png',
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
    }

    const area = await scroller.boundingBox();
    expect(area).toBeTruthy();
    await page.mouse.move(area.x + area.width * 0.75, area.y + area.height / 2);
    await page.mouse.down();
    await page.mouse.move(area.x + area.width * 0.25, area.y + area.height / 2, { steps: 8 });
    if (project === 'chromium-home-monthly-390') {
      await page.screenshot({
        path: '/opt/cursor/artifacts/home-monthly-390-swipe.png',
        clip: { x: 0, y: 0, width: 390, height: 844 },
      });
    }
    await page.mouse.up();
    const after = await scroller.evaluate((el) => {
      const tile = el.querySelector('li');
      const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
      const step = tile.getBoundingClientRect().width + gap;
      const max = el.scrollWidth - el.clientWidth;
      const remainder = step > 0 ? el.scrollLeft % step : 0;
      return {
        scrollLeft: el.scrollLeft,
        step,
        max,
        snapError: Math.min(remainder, Math.abs(step - remainder), Math.abs(max - el.scrollLeft)),
      };
    });
    expect(after.scrollLeft).toBeGreaterThan(8);
    expect(after.snapError).toBeLessThan(3);

    expect(width).toBeGreaterThan(0);
    expect(height).toBeGreaterThan(0);
  });

  test('next-month link is visible only inside the preview window', async ({ page }) => {
    await openHome(
      page,
      '/?home_monthly_switch=1&home_monthly_preview_start=20',
      '2026-11-19T14:30:00.000Z',
    );
    const card = page.getByTestId('home-watch-card');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toContainText('11월 여행지');
    await expect(page.getByTestId('home-monthly-switch')).toHaveCount(0);
    await page.clock.setFixedTime(new Date('2026-11-19T15:00:00.000Z'));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('home-monthly-switch')).toHaveText('12월 보기 ▸');
  });

  test('English title and switch link', async ({ page }) => {
    await page.clock.install({ time: new Date(NOVEMBER_AT) });
    await page.goto('/?home_monthly_switch=1&lang=en', { waitUntil: 'domcontentloaded' });
    const card = page.getByTestId('home-watch-card');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toContainText('November picks');
    const link = page.getByTestId('home-monthly-switch');
    await expect(link).toHaveText('See December ▸');
    await link.click();
    await expect(card).toContainText('December picks');
    await expect(link).toHaveText('See November ▸');
  });
});
