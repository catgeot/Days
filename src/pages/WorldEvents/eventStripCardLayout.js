/** Horizontal MRT stay/tour strip — mobile card width only (scroll row matches main). */
export const EVENT_STRIP_INTER_CARD_GAP_PX = 8;

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
 * Third-card peek % at scroll start (390 WebKit convention).
 * peek% = visiblePeekPx / card3.width, visiblePeekPx = clamp(row.right - card3.left, card3 visible band).
 */
export function eventStripThirdCardPeekPercent(rowRect, thirdCardRect) {
  const visibleLeft = Math.max(rowRect.left, thirdCardRect.left);
  const visibleRight = Math.min(rowRect.right, thirdCardRect.right);
  const visibleBand = Math.max(0, visibleRight - visibleLeft);
  const fromRowRight = Math.max(0, rowRect.right - thirdCardRect.left);
  const peekPx = Math.min(thirdCardRect.width, fromRowRight, visibleBand);
  return thirdCardRect.width > 0 ? (peekPx / thirdCardRect.width) * 100 : 0;
}

/**
 * Analytical peek% for health gate (viewport card width + measured row width at 390).
 * @param {number} rowWidthPx
 * @param {{ viewportWidthPx?: number; divisor?: number }} [opts]
 */
export function eventStripCardPeekMetrics(rowWidthPx, opts = {}) {
  const viewportWidthPx = opts.viewportWidthPx ?? 390;
  const divisor = opts.divisor ?? EVENT_STRIP_MOBILE_CARD_DIVISOR;
  const cardWidth = eventStripCardWidthPx(viewportWidthPx, { divisor });
  const rowRect = { left: 0, right: rowWidthPx };
  const thirdLeft = cardWidth * 2 + EVENT_STRIP_INTER_CARD_GAP_PX;
  const thirdCardRect = {
    left: thirdLeft,
    right: thirdLeft + cardWidth,
    width: cardWidth,
  };
  const peekPercent = eventStripThirdCardPeekPercent(rowRect, thirdCardRect);
  const peekPx = (peekPercent / 100) * cardWidth;
  return { cardWidth, peekPx, peekPercent };
}

/** Measured strip row width at 390px (festival dialog). */
export const EVENT_STRIP_MOBILE_ROW_WIDTH_PX = 314;
