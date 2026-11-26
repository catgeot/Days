import fs from 'node:fs';
import { test, expect } from './fixtures.js';

const NOVEMBER_AT = '2026-11-25T03:00:00.000Z';
const VW = 390;
const VH = 844;

function overlaps(a, b) {
  if (!a || !b || a.width < 1 || b.width < 1) return false;
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

function gapAbove(fab, obstacle) {
  return obstacle.top - fab.bottom;
}

async function box(locator) {
  return locator.evaluate((el) => {
    const r = el.getBoundingClientRect();
    return {
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    };
  });
}

function fabShell(page) {
  return page.getByTestId('mooni-fab-open').locator('xpath=ancestor::*[contains(@class,"fixed")][1]');
}

function shot(page, name) {
  fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
  return page.screenshot({
    path: `/opt/cursor/artifacts/${name}.png`,
    clip: { x: 0, y: 0, width: VW, height: VH },
  });
}

async function openHome(page) {
  await page.clock.install({ time: new Date(NOVEMBER_AT) });
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('gateo_mooni_intro_seen', '1');
      localStorage.removeItem('gateo_mooni_fab_pos');
    } catch {
      /* ignore */
    }
  });
  await page.goto('/?home_monthly_switch=1', { waitUntil: 'domcontentloaded' });
  const card = page.getByTestId('home-watch-card');
  await expect(card).toBeVisible({ timeout: 60_000 });
  await expect(card).toHaveAttribute('data-monthly-placed', '1', { timeout: 60_000 });
  await expect(page.getByTestId('mooni-fab-open')).toBeVisible();
  return card;
}

async function dragMooniTo(page, target) {
  const fab = page.getByTestId('mooni-fab-open');
  const startBox = await fab.boundingBox();
  if (!startBox) throw new Error('mooni fab box missing');
  const from = {
    x: startBox.x + startBox.width / 2,
    y: startBox.y + startBox.height / 2,
  };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  const steps = 16;
  for (let i = 1; i <= steps; i += 1) {
    const x = from.x + ((target.x - from.x) * i) / steps;
    const y = from.y + ((target.y - from.y) * i) / steps;
    await page.mouse.move(x, y);
  }
  await page.mouse.up();
  await page.evaluate(() => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  }));
}

async function assertFabClearsCategoryBar(page, label) {
  const fabBox = await box(page.getByTestId('mooni-fab-open'));
  const shellBox = await box(fabShell(page));
  const bar = page.getByTestId('home-category-bar');
  const buttons = bar.getByRole('button');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  const barBox = await box(bar);
  expect(overlaps(fabBox, barBox), `${label}: fab vs category bar`).toBe(false);
  expect(overlaps(shellBox, barBox), `${label}: shell vs category bar`).toBe(false);
  for (let i = 0; i < count; i += 1) {
    const btn = buttons.nth(i);
    const btnBox = await box(btn);
    expect(overlaps(fabBox, btnBox), `${label}: fab vs button ${i}`).toBe(false);
    expect(overlaps(shellBox, btnBox), `${label}: shell vs button ${i}`).toBe(false);
    const hit = await btn.evaluate((el) => {
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const target = document.elementFromPoint(x, y);
      return Boolean(target && (target === el || el.contains(target)));
    });
    expect(hit, `${label}: elementFromPoint category button ${i}`).toBe(true);
  }
  return { fabBox, barBox, gap: gapAbove(fabBox, barBox) };
}

async function openParadiseCountryMenu(page) {
  await page.getByRole('button', { name: '휴양', exact: true }).click();
  const menu = page.getByTestId('home-globe-country-menu');
  await expect(menu).toBeVisible({ timeout: 30_000 });
  return menu;
}

test.describe('home MOONi mobile chrome overlap (WebKit 390)', () => {
  test('MOONi corners, country menu, footer row', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-theme-monthly-390');
    testInfo.annotations.push({ type: 'gaps', description: 'recorded at end' });

    const card = await openHome(page);
    const gaps = {};

    gaps.default = (await assertFabClearsCategoryBar(page, 'default')).gap;
    await shot(page, 'fix-390-default');

    await dragMooniTo(page, { x: 28, y: VH - 16 });
    gaps.bottomLeft = (await assertFabClearsCategoryBar(page, 'bottom-left')).gap;
    await shot(page, 'fix-390-bl');

    const cardBox = await box(card);
    const fabBl = await box(page.getByTestId('mooni-fab-open'));
    expect(overlaps(fabBl, cardBox)).toBe(false);

    await dragMooniTo(page, { x: VW - 28, y: VH - 16 });
    gaps.bottomRight = (await assertFabClearsCategoryBar(page, 'bottom-right')).gap;
    await shot(page, 'fix-390-br');

    await openParadiseCountryMenu(page);
    const mobileStack = page.getByTestId('home-category-bar').locator('xpath=..');
    await expect(mobileStack.getByTestId('home-about-row')).toHaveCount(0);
    const visibleFooters = await page.evaluate(() => {
      const rows = [...document.querySelectorAll('[data-testid="home-about-row"]')];
      return rows
        .map((el) => {
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return null;
          const style = window.getComputedStyle(el);
          if (style.visibility === 'hidden' || style.display === 'none') return null;
          return { top: r.top, bottom: r.bottom, height: r.height };
        })
        .filter(Boolean);
    });
    for (const row of visibleFooters) {
      expect(row.bottom).toBeGreaterThanOrEqual(VH - row.height - 8);
      expect(row.top).toBeGreaterThan(VH * 0.72);
    }
    const menu = page.getByTestId('home-globe-country-menu');
    const menuBox = await box(menu);
    const fabMenu = await box(page.getByTestId('mooni-fab-open'));
    expect(overlaps(fabMenu, menuBox)).toBe(false);
    await shot(page, 'fix-390-menu-open');

    await dragMooniTo(page, { x: VW - 28, y: VH - 16 });
    const fabMenuBr = await box(page.getByTestId('mooni-fab-open'));
    const menuBox2 = await box(menu);
    expect(overlaps(fabMenuBr, menuBox2)).toBe(false);
    gaps.menuBr = gapAbove(fabMenuBr, menuBox2);
    await assertFabClearsCategoryBar(page, 'menu-bottom-right');
    await shot(page, 'fix-390-menu-open-br');

    testInfo.annotations.push({
      type: 'gaps',
      description: JSON.stringify(gaps),
    });
  });

  test('390 English locale clearance', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-theme-monthly-390');
    await page.clock.install({ time: new Date(NOVEMBER_AT) });
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('gateo_mooni_intro_seen', '1');
        localStorage.removeItem('gateo_mooni_fab_pos');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/?home_monthly_switch=1&lang=en', { waitUntil: 'domcontentloaded' });
    await expect(page.getByTestId('home-watch-card')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('mooni-fab-open')).toBeVisible();
    await dragMooniTo(page, { x: 28, y: VH - 16 });
    await assertFabClearsCategoryBar(page, 'en-bottom-left');
    await shot(page, 'fix-390-en');
  });

  test('1280 desktop MOONi geometry unchanged', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-theme-monthly-1280');
    const vw = 1280;
    const vh = 800;
    await page.clock.install({ time: new Date(NOVEMBER_AT) });
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('gateo_mooni_intro_seen', '1');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/?home_monthly_switch=1', { waitUntil: 'domcontentloaded' });
    const card = page.getByTestId('home-watch-card');
    await expect(card).toBeVisible({ timeout: 60_000 });
    await expect(card).toHaveAttribute('data-monthly-placed', '1');
    const placed = await box(card);
    expect(placed.height).toBeGreaterThanOrEqual(85);
    expect(placed.height).toBeLessThan(86);
    fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
    await page.screenshot({
      path: '/opt/cursor/artifacts/fix-1280.png',
      clip: { x: 0, y: 0, width: vw, height: vh },
    });
  });
});