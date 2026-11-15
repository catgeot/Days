/**
 * @typedef {{ reviewId: string, offset: number, scrollTop: number }} LogbookHubScrollAnchor
 */

function escapeReviewId(value) {
  const text = String(value || '');
  if (typeof CSS !== 'undefined' && typeof CSS.escape === 'function') return CSS.escape(text);
  return text.replace(/["\\]/g, '\\$&');
}

/**
 * Card nearest the top edge of the hub scroller — the one the reader is on.
 * @param {HTMLElement | null | undefined} scroller
 * @returns {LogbookHubScrollAnchor | null}
 */
export function captureLogbookHubScrollAnchor(scroller) {
  if (!(scroller instanceof HTMLElement)) return null;
  const rootTop = scroller.getBoundingClientRect().top;
  const cards = scroller.querySelectorAll('[data-review-id]');
  for (const card of cards) {
    if (!(card instanceof HTMLElement)) continue;
    const rect = card.getBoundingClientRect();
    if (rect.height < 1) continue;
    const offset = rect.top - rootTop;
    if (offset + rect.height <= 8) continue;
    const reviewId = card.getAttribute('data-review-id') || '';
    if (!reviewId) continue;
    return { reviewId, offset, scrollTop: scroller.scrollTop };
  }
  return null;
}

/**
 * Keeps the anchored card at the same viewport offset when later rows change height.
 * Scroll the reader already did is left in place; only the layout delta is applied.
 * @param {HTMLElement | null | undefined} scroller
 * @param {LogbookHubScrollAnchor | null | undefined} anchor
 */
export function holdLogbookHubScrollAnchor(scroller, anchor) {
  if (!(scroller instanceof HTMLElement) || !anchor?.reviewId) return false;
  const card = scroller.querySelector(`[data-review-id="${escapeReviewId(anchor.reviewId)}"]`);
  if (!(card instanceof HTMLElement)) return false;
  const cardRect = card.getBoundingClientRect();
  const rootRect = scroller.getBoundingClientRect();
  if (cardRect.height < 1 || rootRect.height < 1) return false;
  const offset = cardRect.top - rootRect.top;
  const userDelta = scroller.scrollTop - Number(anchor.scrollTop || 0);
  const layoutDelta = offset - (Number(anchor.offset) || 0) + userDelta;
  if (Math.abs(layoutDelta) >= 1) scroller.scrollTop += layoutDelta;
  return true;
}
