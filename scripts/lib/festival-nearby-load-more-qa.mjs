import { nearbyLoadMoreScrollWithinTolerance } from '../../src/pages/Korea/lib/festivalSheetNearbyScroll.js';

export const NEARBY_LOAD_MORE_SCROLL_TOLERANCE_PX = 20;

/** @param {number} before @param {number} after @param {number} [tolerancePx] */
export function nearbyLoadMoreScrollDeltaAcceptable(before, after, tolerancePx = NEARBY_LOAD_MORE_SCROLL_TOLERANCE_PX) {
  return nearbyLoadMoreScrollWithinTolerance(before, after, tolerancePx);
}

/**
 * Playwright scrollIntoView runs before click and corrupts scroll restore on WebKit.
 * @param {import('playwright').Page} page
 */
export async function dispatchFestivalNearbyLoadMore(page) {
  const btn = page.locator('[data-festival-near-scenic-more]:not([disabled])').first();
  await btn.dispatchEvent('mousedown');
  await btn.dispatchEvent('click');
}

/** @param {import('playwright').Page} page */
export async function waitFestivalNearbyAttractionsReady(page) {
  const section = page.locator('[data-festival-section="nearAttractions"]');
  await section.waitFor({ state: 'visible', timeout: 120_000 });
  await section.locator('.animate-spin').waitFor({ state: 'detached', timeout: 120_000 }).catch(() => {});
}

/** @param {import('playwright').Page} page */
export async function waitFestivalNearbyMoreButtonEnabled(page) {
  await waitFestivalNearbyAttractionsReady(page);
  await page
    .waitForFunction(
      () => {
        const b = document.querySelector('[data-festival-near-scenic-more]');
        return b && !b.disabled;
      },
      { timeout: 120_000 },
    )
    .catch(() => {});
}

/** Scroll dialog only if 더보기 is not already fully visible. @param {import('playwright').Page} page */
export async function ensureFestivalNearbyMoreButtonVisible(page) {
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const visible = await page.evaluate(() => {
      const dialog = document.querySelector('[role="dialog"]');
      const btn = document.querySelector('[data-festival-near-scenic-more]');
      if (!dialog || !btn) return true;
      const t = btn.getBoundingClientRect();
      const s = dialog.getBoundingClientRect();
      if (t.top >= s.top + 8 && t.bottom <= s.bottom - 8) return true;
      dialog.scrollTop += t.top - s.top - 120;
      return false;
    });
    if (visible) break;
    await page.waitForTimeout(150);
  }
  await page.waitForTimeout(100);
}

/** @param {import('playwright').Page} page */
export async function tapFestivalNearbyLoadMore(page) {
  const coords = await page.evaluate(() => {
    const btn = document.querySelector('[data-festival-near-scenic-more]:not([disabled])');
    if (!btn) return null;
    const r = btn.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  });
  if (!coords) throw new Error('더보기 button not tappable');
  await page.touchscreen.tap(coords.x, coords.y);
}

/**
 * Finger swipe down on dialog scroller (~scrollTop increase). Wheel fallback on desktop runners.
 * @param {import('playwright').Page} page
 * @param {number} [deltaPx]
 */
export async function fingerSwipeDialogDown(page, deltaPx = 300) {
  const dialog = page.locator('[role="dialog"]');
  const box = await dialog.boundingBox();
  if (!box) throw new Error('dialog missing for swipe');
  const x = box.x + box.width / 2;
  const y0 = box.y + Math.min(360, box.height * 0.42);
  const y1 = y0 + deltaPx;

  const before = await dialog.evaluate((el) => el.scrollTop);

  try {
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x, y: y0 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchMove',
      touchPoints: [{ x, y: y1 }],
    });
    await cdp.send('Input.dispatchTouchEvent', {
      type: 'touchEnd',
      touchPoints: [],
    });
  } catch {
    await dialog.dispatchEvent('touchstart');
    try {
      await page.mouse.move(x, y0);
      await page.mouse.down();
      await page.mouse.move(x, y1, { steps: 12 });
      await page.mouse.up();
    } catch {
      await dialog.hover({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.mouse.wheel(0, deltaPx);
    }
  }

  await page.waitForTimeout(80);
  const after = await dialog.evaluate((el) => el.scrollTop);
  const moved = after - before;
  if (Math.abs(moved) >= 260) return;

  await dialog.dispatchEvent('touchstart');
  await dialog.evaluate((el, delta) => {
    el.scrollTop += delta;
  }, deltaPx);
}

/** @param {import('playwright').Page} page @param {number} [maxMs] */
export async function waitVisibleNearbyThumbsLoaded(page, maxMs = 30_000) {
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector('[data-festival-section="nearAttractions"]');
        if (!root) return false;
        const imgs = [...root.querySelectorAll('img')].filter((img) => {
          const r = img.getBoundingClientRect();
          return r.width > 8 && r.height > 8 && r.bottom > 0 && r.top < window.innerHeight;
        });
        if (!imgs.length) return true;
        return imgs.every((img) => img.complete && img.naturalWidth > 0);
      },
      { timeout: maxMs },
    )
    .catch(() => {});
}
