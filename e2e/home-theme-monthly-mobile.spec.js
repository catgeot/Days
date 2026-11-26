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

function shot(page, name, width, height) {
  fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
  return page.screenshot({
    path: `/opt/cursor/artifacts/${name}.png`,
    clip: { x: 0, y: 0, width, height },
  });
}

async function openMonthlyHome(page) {
  await page.clock.install({ time: new Date(NOVEMBER_AT) });
  await page.addInitScript(() => {
    window.__gateoGaEvents = window.__gateoGaEvents || [];
    localStorage.setItem('gateo_mooni_intro_seen', '1');
    const keep = (url) => {
      if (url == null) return url;
      try {
        const next = new URL(String(url), window.location.origin);
        if (next.pathname === '/' && !next.searchParams.has('home_monthly_switch')) {
          next.searchParams.set('home_monthly_switch', '1');
          return `${next.pathname}${next.search}${next.hash}`;
        }
      } catch {
        /* keep original */
      }
      return url;
    };
    const push = history.pushState.bind(history);
    const replace = history.replaceState.bind(history);
    history.pushState = (state, title, url) => push(state, title, keep(url));
    history.replaceState = (state, title, url) => replace(state, title, keep(url));
  });
  await page.goto('/?home_monthly_switch=1', { waitUntil: 'domcontentloaded' });
}

async function readyMonthlyCard(page) {
  const card = page.getByTestId('home-watch-card');
  await expect(card).toBeVisible({ timeout: 60_000 });
  await expect(card).toHaveAttribute('data-monthly-placed', '1', { timeout: 60_000 });
  await expect(page.locator('.mapboxgl-canvas')).toBeVisible();
  await expect(page.locator('.mapboxgl-ctrl-logo')).toBeVisible({ timeout: 20_000 });
  return card;
}

async function openParadiseCountryMenu(page) {
  await page.getByRole('button', { name: '휴양', exact: true }).click();
  const menu = page.getByTestId('home-globe-country-menu');
  await expect(menu).toBeVisible({ timeout: 30_000 });
  await expect(menu.getByRole('listbox', { name: '나라·지역 탐색' })).toBeVisible();
  return menu;
}

async function closeCountryMenu(page) {
  await page.getByRole('button', { name: '휴양', exact: true }).click();
  await expect(page.getByTestId('home-globe-country-menu')).toHaveCount(0, { timeout: 15_000 });
}

async function touchSwipeScroller(page) {
  return page.getByTestId('home-monthly-scroller').evaluate((el) => {
    const before = el.scrollLeft;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const step = el.querySelector('li')?.getBoundingClientRect().width || 120;
    el.scrollLeft = Math.min(max, before + step);
    return { before, after: el.scrollLeft };
  });
}

test.describe('home theme monthly mobile layout', () => {
  test('390 yields highlights for country menu, full width, MOONi clearance, gestures', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-theme-monthly-390');
    const vw = 390;
    const vh = 844;

    await openMonthlyHome(page);
    const card = await readyMonthlyCard(page);
    const cardClosed = await box(card);
    expect(cardClosed.height).toBeGreaterThanOrEqual(96);
    expect(cardClosed.height).toBeLessThan(97);
    expect(vw - cardClosed.right).toBeLessThanOrEqual(14);

    const mooni = page.getByTestId('mooni-fab-open');
    await expect(mooni).toBeVisible();
    const mooniDefault = await box(mooni);
    expect(overlaps(cardClosed, mooniDefault)).toBe(false);
    await shot(page, 'home-theme-390-menu-closed', vw, vh);

    const menu = await openParadiseCountryMenu(page);
    await expect(page.getByTestId('home-watch-card')).toHaveCount(0, { timeout: 10_000 });
    const intersectsWatchCard = await page.evaluate(() => {
      const menuEl = document.querySelector('[data-testid="home-globe-country-menu"]');
      const cardEl = document.querySelector('[data-testid="home-watch-card"]');
      if (!menuEl || !cardEl) return false;
      const a = menuEl.getBoundingClientRect();
      const b = cardEl.getBoundingClientRect();
      return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
    });
    expect(intersectsWatchCard).toBe(false);
    await shot(page, 'home-theme-390-menu-open', vw, vh);

    await closeCountryMenu(page);
    await expect(card).toBeVisible({ timeout: 15_000 });
    await shot(page, 'home-theme-390-mooni-default', vw, vh);

    const dragFabTo = async (to, shotName) => {
      const dragged = await page.evaluate(async ({ target }) => {
        const fab = document.querySelector('[data-testid="mooni-fab-open"]');
        const start = fab.getBoundingClientRect();
        const from = { x: start.left + start.width / 2, y: start.top + start.height / 2 };
        const pointerId = 21;
        const dispatch = (type, x, y) => {
          fab.dispatchEvent(new PointerEvent(type, {
            bubbles: true,
            cancelable: true,
            composed: true,
            pointerId,
            pointerType: 'touch',
            isPrimary: true,
            button: 0,
            buttons: type === 'pointerup' ? 0 : 1,
            clientX: x,
            clientY: y,
            view: window,
          }));
        };
        dispatch('pointerdown', from.x, from.y);
        for (let i = 1; i <= 16; i += 1) {
          dispatch(
            'pointermove',
            from.x + ((target.x - from.x) * i) / 16,
            from.y + ((target.y - from.y) * i) / 16,
          );
        }
        dispatch('pointerup', target.x, target.y);
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        const cardEl = document.querySelector('[data-testid="home-watch-card"]');
        const nextFab = fab.getBoundingClientRect();
        const cardRect = cardEl?.getBoundingClientRect();
        const hit = cardRect
          && nextFab.left < cardRect.right
          && nextFab.right > cardRect.left
          && nextFab.top < cardRect.bottom
          && nextFab.bottom > cardRect.top;
        return { hit: Boolean(hit) };
      }, { target: to });
      expect(dragged.hit).toBe(false);
      if (shotName) await shot(page, shotName, vw, vh);
    };

    await dragFabTo({ x: vw / 2, y: 430 }, 'home-theme-390-mooni-dragged-center');
    await dragFabTo({ x: 28, y: vh - 16 }, 'home-theme-390-mooni-dragged-bottom-left');
    await dragFabTo({ x: vw - 28, y: vh - 16 }, 'home-theme-390-mooni-dragged-bottom-right');

    const scroller = page.getByTestId('home-monthly-scroller');
    const swipe = await touchSwipeScroller(page);
    expect(Math.abs(swipe.after - swipe.before)).toBeGreaterThan(8);

    const dest = page.getByTestId('home-watch-slot-destination').first();
    await dest.locator('a').click({ force: true });
    await page.waitForURL(/\/place\//, { timeout: 60_000 });
  });

  test('390 English monthly tile names match locale', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-theme-monthly-390');
    const vw = 390;
    const vh = 844;
    await page.clock.install({ time: new Date(NOVEMBER_AT) });
    await page.addInitScript(() => {
      try {
        sessionStorage.setItem('gateo_mooni_intro_seen', '1');
      } catch {
        /* ignore */
      }
    });
    await page.goto('/?home_monthly_switch=1&lang=en', { waitUntil: 'domcontentloaded' });
    const card = await readyMonthlyCard(page);
    await expect(card).toContainText('November picks');
    const names = page.getByTestId('home-monthly-scroller').locator('[data-caption-role="name"]');
    await expect(names.first()).toContainText('Kyoto');
    await shot(page, 'home-theme-390-en-monthly', vw, vh);
  });

  test('1280 desktop monthly geometry unchanged', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-theme-monthly-1280');
    const vw = 1280;
    const vh = 800;

    await openMonthlyHome(page);
    const card = await readyMonthlyCard(page);
    await expect(card).toHaveAttribute('data-monthly-placed', '1');
    const placed = await box(card);
    expect(placed.height).toBeGreaterThanOrEqual(85);
    expect(placed.height).toBeLessThan(86);
    expect(placed.left).toBeGreaterThanOrEqual(290);
    expect(placed.left).toBeLessThanOrEqual(310);
    expect(vw - placed.right).toBeGreaterThanOrEqual(115);
    expect(vw - placed.right).toBeLessThanOrEqual(125);
    expect(vh - placed.bottom).toBeGreaterThanOrEqual(65);
    expect(vh - placed.bottom).toBeLessThanOrEqual(125);
    await shot(page, 'home-theme-1280-desktop', vw, vh);
  });
});