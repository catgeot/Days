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

/**
 * @param {number} rowTop
 * @param {number} sheetTop
 */
export function captureNearbyListRowAnchorDelta(rowTop, sheetTop) {
  return rowTop - sheetTop;
}

/**
 * @param {number} rowTop
 * @param {number} sheetTop
 * @param {number} anchorDelta
 */
export function nearbyListRowAnchorDrift(rowTop, sheetTop, anchorDelta) {
  return rowTop - sheetTop - anchorDelta;
}
