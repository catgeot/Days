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
