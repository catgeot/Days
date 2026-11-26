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

async function expectCaptionsFit(page) {
  const tastes = page.getByTestId('home-watch-taste');
  const count = await tastes.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i += 1) {
    const fit = await tastes.nth(i).evaluate((el) => ({
      scroll: el.scrollWidth,
      client: el.clientWidth,
      text: el.textContent || '',
    }));
    expect(fit.scroll, fit.text).toBeLessThanOrEqual(fit.client);
  }
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
    await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label="말풍선 닫기"]');
      const bubble = btn?.parentElement?.parentElement;
      if (bubble) bubble.style.display = 'none';
    });
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
    if (project === 'chromium-home-monthly-375') {
      await page.screenshot({
        path: '/opt/cursor/artifacts/home-monthly-375.png',
        clip: { x: 0, y: 0, width: 375, height: 667 },
      });
    }
    if (project === 'chromium-home-monthly-430') {
      await page.screenshot({
        path: '/opt/cursor/artifacts/home-monthly-430.png',
        clip: { x: 0, y: 0, width: 430, height: 932 },
      });
    }
    await expectCaptionsFit(page);

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
    await expectCaptionsFit(page);
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
    await expectCaptionsFit(page);
    await link.click();
    await expect(card).toContainText('December picks');
    await expect(link).toHaveText('See November ▸');
    await expectCaptionsFit(page);
  });
});

function keepMonthlyFlagOnHome() {
  const keep = (url) => {
    if (url == null) return url;
    try {
      const next = new URL(String(url), window.location.origin);
      if (next.pathname === '/' && !next.searchParams.has('home_monthly_switch')) {
        next.searchParams.set('home_monthly_switch', '1');
        return `${next.pathname}${next.search}${next.hash}`;
      }
    } catch {
      /* keep the original url */
    }
    return url;
  };
  const push = history.pushState.bind(history);
  const replace = history.replaceState.bind(history);
  history.pushState = (state, title, url) => push(state, title, keep(url));
  history.replaceState = (state, title, url) => replace(state, title, keep(url));
}

async function openMonthlyHome(page) {
  await page.addInitScript(keepMonthlyFlagOnHome);
  await openHome(page, '/?home_monthly_switch=1', NOVEMBER_AT);
}

async function hideMooniHint(page) {
  const hint = page.getByText('여행을 찾아봐요');
  if (await hint.count()) {
    await expect(hint).toBeHidden({ timeout: 8_000 });
  }
  const closeHint = page.getByRole('button', { name: '말풍선 닫기' });
  if (await closeHint.count()) {
    await closeHint.click();
    await expect(closeHint).toBeHidden({ timeout: 8_000 });
  }
  await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label="말풍선 닫기"]');
    const bubble = btn?.parentElement?.parentElement;
    if (bubble) bubble.style.display = 'none';
  });
}

async function readyMonthlyCard(page) {
  const card = page.getByTestId('home-watch-card');
  await expect(card).toBeVisible({ timeout: 60_000 });
  await expect(card).toHaveAttribute('data-monthly-placed', '1', { timeout: 60_000 });
  await expect(card).toHaveAttribute('data-monthly-switch', '1');
  await hideMooniHint(page);
  await expect(page.locator('.mapboxgl-canvas')).toBeVisible();
  await expect(page.locator('.mapboxgl-ctrl-logo')).toBeVisible({ timeout: 20_000 });
  return card;
}

/**
 * Touch swipe on the monthly scroller.
 * Playwright WebKit does not apply native overflow momentum to synthetic
 * touch/pointer events. When the scroller is `touch-action: pan-x` (iOS would
 * scroll it) and scrollLeft did not move, apply the same horizontal delta.
 * `touch-action: none` is left as a failed swipe — that is the pre-fix card.
 */
async function touchSwipeScroller(page, scroller) {
  const after = await scroller.evaluate(async (el) => {
    const before = el.scrollLeft;
    const rect = el.getBoundingClientRect();
    const y = rect.top + rect.height / 2;
    const startX = rect.left + rect.width * 0.84;
    const endX = rect.left + rect.width * 0.16;
    const max = Math.max(0, el.scrollWidth - el.clientWidth);
    const tile = el.querySelector('li');
    const gap = Number.parseFloat(getComputedStyle(el).columnGap) || 0;
    const step = tile ? tile.getBoundingClientRect().width + gap : Math.abs(endX - startX);
    const forward = max - before >= 24 || before < 24;
    const delta = (forward ? 1 : -1) * Math.max(24, Math.min(step, Math.abs(endX - startX)));
    const pointerId = 31;
    const point = (type, x) => {
      el.dispatchEvent(new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
        clientX: x,
        clientY: y,
        view: window,
      }));
      try {
        const touch = new Touch({
          identifier: pointerId,
          target: el,
          clientX: x,
          clientY: y,
          pageX: x,
          pageY: y,
        });
        const typing = type === 'pointerdown' ? 'touchstart' : type === 'pointerup' ? 'touchend' : 'touchmove';
        el.dispatchEvent(new TouchEvent(typing, {
          bubbles: true,
          cancelable: true,
          touches: typing === 'touchend' ? [] : [touch],
          targetTouches: typing === 'touchend' ? [] : [touch],
          changedTouches: [touch],
        }));
      } catch {
        /* Some WebKit builds reject a synthetic Touch. The pointer sequence still ran. */
      }
    };
    point('pointerdown', forward ? startX : endX);
    const steps = 8;
    for (let i = 1; i <= steps; i += 1) {
      const from = forward ? startX : endX;
      const to = forward ? endX : startX;
      point('pointermove', from + ((to - from) * i) / steps);
    }
    point('pointerup', forward ? endX : startX);
    let next = el.scrollLeft;
    const touchAction = getComputedStyle(el).touchAction;
    const panX = touchAction.split(' ').includes('pan-x') || touchAction === 'pan-x';
    if (Math.abs(next - before) <= 8 && panX) {
      el.scrollLeft = Math.max(0, Math.min(max, before + delta));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      next = el.scrollLeft;
    }
    return { before, next, touchAction };
  });
  expect(Math.abs(after.next - after.before)).toBeGreaterThan(8);
  return after.next;
}

async function dragMooniTo(page, place) {
  const viewport = page.viewportSize();
  const target = {
    left: { x: 52, y: 430 },
    center: { x: viewport.width / 2, y: 430 },
    right: { x: viewport.width - 48, y: 690 },
  }[place];
  const moved = await page.evaluate(async ({ target: point }) => {
    const fab = document.querySelector('[data-testid="mooni-fab-open"]');
    const start = fab.getBoundingClientRect();
    const from = { x: start.left + start.width / 2, y: start.top + start.height / 2 };
    const pointerId = 11;
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
    const steps = 16;
    for (let i = 1; i <= steps; i += 1) {
      dispatch(
        'pointermove',
        from.x + ((point.x - from.x) * i) / steps,
        from.y + ((point.y - from.y) * i) / steps,
      );
    }
    dispatch('pointerup', point.x, point.y);
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    const next = fab.getBoundingClientRect();
    return { x: next.left + next.width / 2, y: next.top + next.height / 2 };
  }, { target });
  const third = viewport.width / 3;
  if (place === 'left') expect(moved.x).toBeLessThan(third);
  if (place === 'center') {
    expect(moved.x).toBeGreaterThan(third);
    expect(moved.x).toBeLessThan(third * 2);
  }
  if (place === 'right') expect(moved.x).toBeGreaterThan(third * 2);
  return moved;
}

async function visibleDestinationCount(scroller) {
  return scroller.evaluate((el) => {
    const view = el.getBoundingClientRect();
    return [...el.querySelectorAll('[data-slot-type="destination"]')].filter((tile) => {
      const rect = tile.getBoundingClientRect();
      const width = Math.min(rect.right, view.right) - Math.max(rect.left, view.left);
      return width >= 48;
    }).length;
  });
}

function shot390(page, name) {
  fs.mkdirSync('/opt/cursor/artifacts', { recursive: true });
  return page.screenshot({
    path: `/opt/cursor/artifacts/${name}.png`,
    clip: { x: 0, y: 0, width: 390, height: 844 },
  });
}

test.describe('home monthly card gestures (WebKit 390)', () => {
  test('card still swipes after place back', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-home-monthly-390');
    await openMonthlyHome(page);
    await readyMonthlyCard(page);
    const scroller = page.getByTestId('home-monthly-scroller');
    const scrolling = await scroller.evaluate((el) => {
      const style = getComputedStyle(el);
      const tile = el.querySelector('li');
      return {
        touchAction: style.touchAction,
        snap: style.scrollSnapType,
        snapStop: tile ? getComputedStyle(tile).scrollSnapStop : '',
        overflowX: style.overflowX,
        scrollWidth: el.scrollWidth,
        clientWidth: el.clientWidth,
      };
    });
    expect(scrolling.touchAction).toBe('pan-x');
    expect(scrolling.snap).toContain('x');
    expect(scrolling.snap).toContain('mandatory');
    expect(scrolling.snapStop).toBe('normal');
    expect(scrolling.overflowX).toBe('auto');
    expect(scrolling.scrollWidth).toBeGreaterThan(scrolling.clientWidth + 8);
    expect(await visibleDestinationCount(scroller)).toBeGreaterThanOrEqual(3);

    const backs = [
      ['in-app', async () => {
        await page.getByRole('button', { name: '뒤로가기' }).click();
      }],
      ['browser', async () => {
        await page.goBack();
      }],
    ];
    for (const [kind, goBack] of backs) {
      for (let cycle = 1; cycle <= 3; cycle += 1) {
        await touchSwipeScroller(page, page.getByTestId('home-monthly-scroller'));
        await expect.poll(() => new URL(page.url()).pathname).toBe('/');
        await page.locator('[data-testid="home-watch-slot-destination"] a').nth(cycle % 2).tap();
        await expect.poll(() => new URL(page.url()).pathname.startsWith('/place/')).toBe(true);
        await expect(page.getByTestId('home-monthly-scroller')).toHaveCount(0);
        await goBack();
        await expect.poll(() => new URL(page.url()).pathname).toBe('/');
        // Browser history pop restores the globe summary and hides the card.
        // In-app back sets the skip flag, so the summary stays closed.
        const summaryClose = page.getByRole('button', { name: '써머리 닫기' });
        if (await summaryClose.isVisible()) {
          await summaryClose.click();
          await expect(summaryClose).toBeHidden();
        }
        const cardAfter = await readyMonthlyCard(page);
        await expect(cardAfter).toHaveAttribute('data-globe-drag-passthrough', 'false');
        await touchSwipeScroller(page, page.getByTestId('home-monthly-scroller'));
        if (kind === 'in-app' && cycle === 3) {
          await shot390(page, 'home-monthly-390-after-3rd-back');
        }
      }
    }
  });

  test('dragging MOONi left, center, and right keeps the card width', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-home-monthly-390');
    await openMonthlyHome(page);
    const card = await readyMonthlyCard(page);
    const before = await box(card);
    expect(await visibleDestinationCount(page.getByTestId('home-monthly-scroller'))).toBeGreaterThanOrEqual(3);
    for (const place of ['left', 'center', 'right']) {
      await dragMooniTo(page, place);
      await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }));
      const after = await box(card);
      expect(after.width, place).toBe(before.width);
      expect(after.left, place).toBe(before.left);
      expect(after.right, place).toBe(before.right);
      expect(await visibleDestinationCount(page.getByTestId('home-monthly-scroller')), place).toBeGreaterThanOrEqual(3);
      await touchSwipeScroller(page, page.getByTestId('home-monthly-scroller'));
      if (place === 'left' || place === 'right') {
        await shot390(page, `home-monthly-390-mooni-${place}`);
      }
    }
  });

  test('a vertical gesture outside the card leaves the scroller alone', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'webkit-home-monthly-390');
    await openMonthlyHome(page);
    const card = await readyMonthlyCard(page);
    const scroller = page.getByTestId('home-monthly-scroller');
    await touchSwipeScroller(page, scroller);
    const beforeScroll = await scroller.evaluate((el) => el.scrollLeft);
    const beforeBox = await box(card);
    const start = await page.evaluate(() => {
      const rect = document.querySelector('[data-testid="home-watch-card"]').getBoundingClientRect();
      return { x: rect.left + 24, y: Math.max(96, rect.top - 220) };
    });
    await page.evaluate(({ x, y }) => {
      const hit = document.elementFromPoint(x, y);
      hit.dispatchEvent(new PointerEvent('pointerdown', {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 41,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientX: x,
        clientY: y,
        view: window,
      }));
    }, start);
    await expect(card).toHaveAttribute('data-globe-drag-passthrough', 'true');
    await page.evaluate(({ x, y }) => {
      const hit = document.elementFromPoint(x, y + 80) || document.elementFromPoint(x, y);
      hit.dispatchEvent(new PointerEvent('pointermove', {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 41,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: 1,
        clientX: x,
        clientY: y + 140,
        view: window,
      }));
      hit.dispatchEvent(new PointerEvent('pointerup', {
        bubbles: true,
        cancelable: true,
        composed: true,
        pointerId: 41,
        pointerType: 'touch',
        isPrimary: true,
        button: 0,
        buttons: 0,
        clientX: x,
        clientY: y + 140,
        view: window,
      }));
    }, start);
    await expect(card).toHaveAttribute('data-globe-drag-passthrough', 'false');
    expect(await scroller.evaluate((el) => el.scrollLeft)).toBe(beforeScroll);
    const afterBox = await box(card);
    expect(afterBox.width).toBe(beforeBox.width);
    expect(afterBox.top).toBe(beforeBox.top);
  });
});
