export const REVIEW_HUB_ANCHOR_ID = 'review-hub';
export const REVIEW_HUB_HASH = '#review-hub';
export const REVIEW_HUB_HREF = `/blog${REVIEW_HUB_HASH}`;

/**
 * One-time arrival from the home «리뷰 창고» link.
 * Returns 0 when the hub is already on the first screen, or the reader already moved the scrollport.
 * @param {{ hubRect: { top: number, bottom: number }, rootRect: { top: number, bottom: number }, scrollTop: number, userMoved?: boolean }} input
 */
export function reviewHubArrivalDelta({ hubRect, rootRect, scrollTop, userMoved = false }) {
  if (userMoved || scrollTop > 8) return 0;
  const onFirstScreen = hubRect.top < rootRect.bottom - 24 && hubRect.bottom > rootRect.top + 24;
  if (onFirstScreen) return 0;
  return hubRect.top - rootRect.top;
}
