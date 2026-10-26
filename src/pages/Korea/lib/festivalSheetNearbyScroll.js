/**
 * After nearby load-more, the sheet may shift scrollTop when rows mount (scroll anchoring).
 * @param {number | null | undefined} plannedScrollTop
 * @param {number} measuredScrollTop
 */
export function resolveFestivalNearbyLoadMoreScrollTop(plannedScrollTop, measuredScrollTop) {
  if (plannedScrollTop == null || !Number.isFinite(plannedScrollTop)) {
    return measuredScrollTop;
  }
  return plannedScrollTop;
}
