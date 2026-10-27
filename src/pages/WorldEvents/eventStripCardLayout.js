/** Horizontal MRT stay/tour strip — mobile card width only (scroll row matches main). */
export const EVENT_STRIP_INTER_CARD_GAP_PX = 8;

/** Row horizontal padding (`px-1` on EVENT_STRIP_SCROLL_ROW_CLASS). */
export const EVENT_STRIP_ROW_PADDING_X_PX = 4;

/** Shared with CSS literal `w-[calc((100vw-76px)/DIVISOR)]` (Tailwind must see a static string). */
export const EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX = 76;
export const EVENT_STRIP_MOBILE_CARD_DIVISOR = 2.24;

/** Main scroll row — no snap / touch / scrollbar overrides. */
export const EVENT_STRIP_SCROLL_ROW_CLASS = '-mx-1 flex gap-2 overflow-x-auto px-1 pb-1';

const CARD_SHELL_BASE =
  'flex shrink-0 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm';

/**
 * @param {{ large?: boolean }} [opts]
 * @returns {string}
 */
export function eventStripCardShellClass({ large = false } = {}) {
  if (large) {
    return `${CARD_SHELL_BASE} w-[220px] sm:w-[252px]`;
  }
  return `${CARD_SHELL_BASE} w-[calc((100vw-76px)/2.24)] sm:w-[168px]`;
}

/** @param {number} viewportWidthPx */
export function eventStripCardWidthPx(
  viewportWidthPx,
  { large = false, divisor = EVENT_STRIP_MOBILE_CARD_DIVISOR } = {},
) {
  if (large) {
    return 220;
  }
  return (viewportWidthPx - EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX) / divisor;
}

/**
 * Site QA peek% with scrollLeft=0:
 * visible row right = rowRect.right − padding-right (not scrollWidth).
 * peek% = clamp(visibleRowRight − card3.left, card3 visible band) / card3.width.
 */
export function eventStripThirdCardPeekPercent(rowRect, thirdCardRect, paddingRightPx = 0) {
  const visibleRowRight = rowRect.right - paddingRightPx;
  const visibleLeft = Math.max(rowRect.left, thirdCardRect.left);
  const visibleRight = Math.min(visibleRowRight, thirdCardRect.right);
  const visibleBand = Math.max(0, visibleRight - visibleLeft);
  const fromRowRight = Math.max(0, visibleRowRight - thirdCardRect.left);
  const peekPx = Math.min(thirdCardRect.width, fromRowRight, visibleBand);
  return thirdCardRect.width > 0 ? (peekPx / thirdCardRect.width) * 100 : 0;
}

/**
 * @param {number} rowOuterWidthPx getBoundingClientRect width (scrollLeft=0)
 * @param {{ viewportWidthPx?: number; divisor?: number }} [opts]
 */
export function eventStripCardPeekMetrics(rowOuterWidthPx, opts = {}) {
  const viewportWidthPx = opts.viewportWidthPx ?? 390;
  const divisor = opts.divisor ?? EVENT_STRIP_MOBILE_CARD_DIVISOR;
  const cardWidth = eventStripCardWidthPx(viewportWidthPx, { divisor });
  const pl = EVENT_STRIP_ROW_PADDING_X_PX;
  const pr = EVENT_STRIP_ROW_PADDING_X_PX;
  const rowRect = { left: 0, right: rowOuterWidthPx };
  const thirdLeft = pl + cardWidth * 2 + EVENT_STRIP_INTER_CARD_GAP_PX;
  const thirdCardRect = {
    left: thirdLeft,
    right: thirdLeft + cardWidth,
    width: cardWidth,
  };
  const peekPercent = eventStripThirdCardPeekPercent(rowRect, thirdCardRect, pr);
  const peekPx = (peekPercent / 100) * cardWidth;
  return { cardWidth, peekPx, peekPercent };
}

/** Outer row width at 390px WebKit (festival dialog). */
export const EVENT_STRIP_MOBILE_ROW_WIDTH_PX = 322;
