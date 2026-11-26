import fs from 'node:fs';
import { test, expect } from './fixtures.js';

const NOVEMBER_AT = '2026-11-25T03:00:00.000Z';

function overlaps(a, b) {
  if (!a || !b || a.width < 1 || b.width < 1) return false;
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
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

function centerOf(rect) {
  return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
}

async function pointOf(locator) {
  const rect = await box(locator);
  return centerOf(rect);
}

function fabShell(page) {
  return page.getByTestId('mooni-fab-open').locator('xpath=ancestor::*[contains(@class,"fixed")][1]');
}

async function readShellPos(page) {
  return fabShell(page).evaluate((el) => ({
    right: Number.parseFloat(el.style.right),
    bottom: Number.parseFloat(el.style.bottom),
  }));
}

async function selectionText(page) {
  return page.evaluate(() => window.getSelection()?.toString() ?? '');
}

/** WebKit may report fractional `style.bottom`; matches MooniAgentFab layout, not raw clamp only. */
const FAB_REST_BOTTOM_TOLERANCE_PX = 1;

/** Main `clampPosition` in MooniAgentFab.jsx — dismissed / no-card drops must match it. */
async function expectedMainDrop(page, start, from, to) {
  return page.evaluate(({ start, from, to }) => {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const width = mobile ? 80 : 96;
    const height = mobile ? 104 : 120;
    const edgeOverflow = mobile ? 28 : 0;
    const edge = 8;
    const minBottom = mobile ? -edgeOverflow : edge;
    const minRight = mobile ? 0 : edge;
    const maxRight = Math.max(minRight, window.innerWidth - width - edge + edgeOverflow);
    const maxBottom = Math.max(minBottom, window.innerHeight - height - edge);
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    return {
      right: Math.min(Math.max(start.right - dx, minRight), maxRight),
      bottom: Math.min(Math.max(start.bottom - dy, minBottom), maxBottom),
    };
  }, { start, from, to });
}

/**
 * `positionClearingMonthlyCard` after drop — clamp + monthly (if placed) + mobile chrome obstacles.
 * Uses geometry from `pos` only (not current shell style) so expectations match pre-render math.
 */
async function expectedFabRestPosition(page, rawPos) {
  return page.evaluate((rawPos) => {
    const GAP = 8;
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const FAB_W = mobile ? 80 : 96;
    const FAB_H = mobile ? 104 : 120;
    const edgeOverflow = mobile ? 28 : 0;
    const edge = 8;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const toRect = (r) => ({
      left: r.left,
      right: r.right,
      top: r.top,
      bottom: r.bottom,
      width: r.width,
      height: r.height,
    });

    const clampPosition = (pos) => {
      const minBottom = mobile ? -edgeOverflow : edge;
      const minRight = mobile ? 0 : edge;
      const maxRight = Math.max(minRight, vw - FAB_W - edge + edgeOverflow);
      const maxBottom = Math.max(minBottom, vh - FAB_H - edge);
      return {
        right: Math.min(Math.max(pos.right, minRight), maxRight),
        bottom: Math.min(Math.max(pos.bottom, minBottom), maxBottom),
      };
    };

    const fabRectForPos = (pos) => ({
      left: vw - pos.right - FAB_W,
      right: vw - pos.right,
      top: vh - pos.bottom - FAB_H,
      bottom: vh - pos.bottom,
      width: FAB_W,
      height: FAB_H,
    });

    const rectsOverlap = (a, b) => (
      a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
    );

    const positionAboveObstacles = (pos, fabRect, obstacles) => {
      const hits = obstacles.filter((obs) => obs && obs.width >= 1 && rectsOverlap(fabRect, obs));
      if (!hits.length) return pos;
      const ceiling = Math.min(...hits.map((obs) => obs.top));
      const bottom = vh - ceiling + GAP;
      if (!(bottom > pos.bottom + 0.5)) return pos;
      return { right: pos.right, bottom };
    };

    const obstacles = [];
    const card = document.querySelector(
      '[data-testid="home-watch-card"][data-monthly-switch="1"][data-monthly-placed="1"]',
    );
    if (card) {
      const cardRect = card.getBoundingClientRect();
      if (cardRect.width >= 1 && cardRect.height >= 1) obstacles.push(toRect(cardRect));
      const innerSelectors = [
        '[data-testid^="home-watch-slot-"]',
        '[data-testid="home-monthly-switch"]',
        '[data-testid="home-watch-dismiss"]',
        'h2',
      ].join(', ');
      for (const el of card.querySelectorAll(innerSelectors)) {
        const rect = el.getBoundingClientRect();
        if (rect.width >= 1 && rect.height >= 1) obstacles.push(toRect(rect));
      }
    }
    if (mobile) {
      for (const sel of [
        '[data-testid="home-category-bar"]',
        '[data-testid="home-about-row"]',
        '[data-testid="home-globe-country-menu"]',
      ]) {
        for (const el of document.querySelectorAll(sel)) {
          const rect = el.getBoundingClientRect();
          if (rect.width >= 1 && rect.height >= 1) obstacles.push(toRect(rect));
        }
      }
    }

    let pos = clampPosition(rawPos);
    for (let pass = 0; pass < 12; pass += 1) {
      const fabRect = fabRectForPos(pos);
      const next = positionAboveObstacles(pos, fabRect, obstacles);
      if (Math.abs(next.bottom - pos.bottom) < 0.5) break;
      pos = clampPosition(next);
    }
    return pos;
  }, rawPos);
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

async function tileCenterHit(tile) {
  return tile.evaluate((el) => {
    const r = el.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const hit = document.elementFromPoint(x, y);
    return {
      onTile: Boolean(hit && (hit === el || el.contains(hit))),
      fab: Boolean(hit?.closest?.('[data-testid="mooni-fab-open"]')),
      testId: hit?.closest?.('[data-testid]')?.getAttribute('data-testid') ?? null,
    };
  });
}

/**
 * Long-press, then move through `points`. Samples selection after each step
 * once the pointer has left the press point (the drag).
 */
async function dragMooni(page, points, { onPoint } = {}) {
  const fab = page.getByTestId('mooni-fab-open');
  const startBox = await fab.boundingBox();
  if (!startBox) throw new Error('mooni fab box missing');
  const origin = {
    x: startBox.x + startBox.width / 2,
    y: startBox.y + startBox.height / 2,
  };
  const samples = [];
  await page.mouse.move(origin.x, origin.y);
  await page.mouse.down();
  await page.waitForTimeout(450);
  let prev = origin;
  for (const point of points) {
    const steps = 6;
    for (let i = 1; i <= steps; i += 1) {
      const x = prev.x + ((point.x - prev.x) * i) / steps;
      const y = prev.y + ((point.y - prev.y) * i) / steps;
      await page.mouse.move(x, y);
      const moved = Math.hypot(x - origin.x, y - origin.y) > 6;
      samples.push({ text: await selectionText(page), moved });
    }
    if (point.capture) await onPoint?.(point);
    prev = { x: point.x, y: point.y };
  }
  await page.mouse.up();
  const after = await selectionText(page);
  return { samples, after, origin };
}

test.describe('home monthly card vs MOONi FAB drop', () => {
  test('drag onto the first tile clears the card and does not select page text', async ({ page }, testInfo) => {
    const card = await openHome(page);
    const tile = page.getByTestId('home-monthly-scroller').locator('li').first();
    await expect(tile).toContainText('교토');
    const tileAt = await pointOf(tile);
    const logo = await pointOf(page.locator('img[alt="GATEO"]:visible').first());
    const nav = await pointOf(page.locator('[data-testid="home-category-bar"]:visible').first());
    const footer = await pointOf(page.locator('[data-testid="home-about-row"]:visible').first());

    const width = testInfo.project.use.viewport?.width ?? 390;
    const height = testInfo.project.use.viewport?.height ?? 844;
    const artifactDir = process.env.CI ? null : '/opt/cursor/artifacts';
    if (artifactDir) fs.mkdirSync(artifactDir, { recursive: true });
    let captured = false;
    const { samples, after } = await dragMooni(page, [
      logo,
      nav,
      { ...footer, capture: true },
      tileAt,
    ], {
      onPoint: async () => {
        if (!artifactDir || captured || width !== 390) return;
        captured = true;
        await page.screenshot({
          path: `${artifactDir}/mooni-fab-mid-drag-390-${testInfo.project.name}.png`,
          clip: { x: 0, y: 0, width: 390, height: 844 },
        });
      },
    });

    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));

    if (artifactDir && width === 390) {
      await page.screenshot({
        path: `${artifactDir}/mooni-fab-drop-390-${testInfo.project.name}.png`,
        clip: { x: 0, y: 0, width, height },
      });
    }

    const during = samples.filter((sample) => sample.moved);
    expect(during.length).toBeGreaterThan(10);
    for (const sample of during) {
      expect(sample.text).toBe('');
    }
    expect(after).toBe('');
    expect(await page.evaluate(() => document.documentElement.classList.contains('mooni-fab-dragging'))).toBe(false);

    const fabBox = await box(page.getByTestId('mooni-fab-open'));
    const shellBox = await box(fabShell(page));
    const cardBox = await box(card);
    const tileBox = await box(tile);
    expect(fabBox.left < tileBox.right && fabBox.right > tileBox.left).toBe(true);
    expect(overlaps(fabBox, cardBox)).toBe(false);
    expect(overlaps(shellBox, cardBox)).toBe(false);
    expect(fabBox.bottom).toBeLessThanOrEqual(cardBox.top);

    const hint = page.getByTestId('mooni-fab-hint');
    if (await hint.count()) {
      await expect(hint).toBeHidden({ timeout: 4_000 });
    }
    const hit = await tileCenterHit(tile);
    expect(hit.fab, `elementFromPoint returned ${hit.testId}`).toBe(false);
    expect(hit.onTile, `elementFromPoint returned ${hit.testId}`).toBe(true);
  });

  test('default and corner drops stay clear of the monthly bar on 390', async ({ page }, testInfo) => {
    const width = testInfo.project.use.viewport?.width ?? 0;
    test.skip(width !== 390, '390 mobile viewport only');

    const card = await openHome(page);
    const artifactDir = process.env.CI ? null : '/opt/cursor/artifacts';
    if (artifactDir) fs.mkdirSync(artifactDir, { recursive: true });

    const assertClear = async (label) => {
      await page.evaluate(() => new Promise((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(resolve));
      }));
      const fabBox = await box(page.getByTestId('mooni-fab-open'));
      const shellBox = await box(fabShell(page));
      const cardBox = await box(card);
      expect(overlaps(fabBox, cardBox), `${label}: fab intersects card`).toBe(false);
      expect(overlaps(shellBox, cardBox), `${label}: shell intersects card`).toBe(false);
      const bar = page.getByTestId('home-category-bar');
      const barBox = await box(bar);
      expect(overlaps(fabBox, barBox), `${label}: fab intersects category bar`).toBe(false);
      expect(overlaps(shellBox, barBox), `${label}: shell intersects category bar`).toBe(false);
      const buttons = bar.getByRole('button');
      const btnCount = await buttons.count();
      for (let i = 0; i < btnCount; i += 1) {
        const btnBox = await box(buttons.nth(i));
        expect(overlaps(fabBox, btnBox), `${label}: fab intersects bar button ${i}`).toBe(false);
        const hit = await buttons.nth(i).evaluate((el) => {
          const r = el.getBoundingClientRect();
          const x = r.left + r.width / 2;
          const y = r.top + r.height / 2;
          const target = document.elementFromPoint(x, y);
          return Boolean(target && (target === el || el.contains(target)));
        });
        expect(hit, `${label}: elementFromPoint bar button ${i}`).toBe(true);
      }
      if (artifactDir && label) {
        const slug = label.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        await page.screenshot({
          path: `${artifactDir}/mooni-fab-${slug}-390-${testInfo.project.name}.png`,
          clip: { x: 0, y: 0, width: 390, height: 844 },
        });
      }
    };

    await assertClear('default');

    const dropPoints = await page.evaluate(() => ({
      center: { x: window.innerWidth / 2, y: window.innerHeight * 0.55 },
      bottomLeft: { x: 28, y: window.innerHeight - 16 },
      bottomRight: { x: window.innerWidth - 28, y: window.innerHeight - 16 },
      midLeft: { x: 28, y: window.innerHeight * 0.48 },
      midRight: { x: window.innerWidth - 28, y: window.innerHeight * 0.48 },
    }));

    for (const [label, point] of Object.entries(dropPoints)) {
      await dragMooni(page, [point]);
      expect(await page.evaluate(() => document.documentElement.classList.contains('mooni-fab-dragging'))).toBe(false);
      await assertClear(label);
    }
  });

  test('dismissed monthly card keeps the main drop position', async ({ page }) => {
    const card = await openHome(page);
    const tile = page.getByTestId('home-monthly-scroller').locator('li').first();
    await expect(tile).toContainText('교토');
    const tileAt = await pointOf(tile);
    const formerCard = await box(card);

    await page.getByTestId('home-watch-dismiss').click();
    await expect(card).toHaveCount(0);

    await page.evaluate(() => {
      window.__fabGesture = null;
      document.addEventListener('pointerdown', (event) => {
        const el = event.target;
        const onFab = Boolean(el?.closest?.('[data-testid="mooni-fab-open"], .mooni-fab'));
        if (!onFab) return;
        window.__fabGesture = {
          x: event.clientX,
          y: event.clientY,
          lastX: event.clientX,
          lastY: event.clientY,
        };
      }, true);
      document.addEventListener('pointermove', (event) => {
        if (!window.__fabGesture) return;
        window.__fabGesture.lastX = event.clientX;
        window.__fabGesture.lastY = event.clientY;
      }, true);
    });

    const start = await readShellPos(page);

    await dragMooni(page, [tileAt]);
    await page.evaluate(() => new Promise((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(resolve));
    }));

    const gesture = await page.evaluate(() => window.__fabGesture);
    expect(gesture).toBeTruthy();
    expect(Math.abs(gesture.lastX - tileAt.x)).toBeLessThanOrEqual(1);
    expect(Math.abs(gesture.lastY - tileAt.y)).toBeLessThanOrEqual(1);
    const rawExpected = await expectedMainDrop(
      page,
      start,
      { x: gesture.x, y: gesture.y },
      { x: gesture.lastX, y: gesture.lastY },
    );
    const clearedExpected = await expectedFabRestPosition(page, rawExpected);
    const actual = await readShellPos(page);
    expect(actual.right).toBe(clearedExpected.right);
    expect(Math.abs(actual.bottom - clearedExpected.bottom)).toBeLessThanOrEqual(
      FAB_REST_BOTTOM_TOLERANCE_PX,
    );

    const fabBox = await box(page.getByTestId('mooni-fab-open'));
    const barBox = await box(page.locator('[data-testid="home-category-bar"]:visible').first());
    const aboutBox = await box(page.locator('[data-testid="home-about-row"]:visible').first());
    expect(overlaps(fabBox, barBox)).toBe(false);
    expect(overlaps(fabBox, aboutBox)).toBe(false);
    expect(overlaps(fabBox, formerCard)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.classList.contains('mooni-fab-dragging'))).toBe(false);
    expect(await selectionText(page)).toBe('');
  });
});
