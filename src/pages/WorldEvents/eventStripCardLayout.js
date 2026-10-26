/** Horizontal MRT stay/tour strip — mobile ~2 cards + third-card peek (one gap in width calc). */
export const EVENT_STRIP_INTER_CARD_GAP_REM = 0.5;
export const EVENT_STRIP_INTER_CARD_GAP_PX = 8;

/**
 * Mobile card width (max-sm): calc((100vw - inset - 0.5rem) / divisor).
 * Avoids flex % sizing against the scroll track; inset matches festival dialog at 390px.
 * Peek (px) = rowWidth - 2×cardWidth - gap.
 */
export const EVENT_STRIP_MOBILE_CARD_DIVISOR = 2.24;
/** 390px viewport → ~322px strip row (dialog horizontal inset). */
export const EVENT_STRIP_MOBILE_VIEWPORT_INSET_PX = 68;
/** inset + one inter-card gap (px) — single calc term for WebKit. */
export const EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX =
  EVENT_STRIP_MOBILE_VIEWPORT_INSET_PX + EVENT_STRIP_INTER_CARD_GAP_PX;

/** @returns {string} Tailwind arbitrary width value (no brackets). */
/** Must match the literal in `eventStripCardShellClass` (Tailwind scans static class strings only). */
export function eventStripMobileCardWidthCalcCss() {
  return `calc((100vw-${EVENT_STRIP_MOBILE_VIEWPORT_OFFSET_PX}px)/${EVENT_STRIP_MOBILE_CARD_DIVISOR})`;
}

export const EVENT_STRIP_SCROLL_ROW_CLASS =
  '-mx-1 flex w-full min-w-0 max-w-full snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 max-sm:[-ms-overflow-style:none] max-sm:[scrollbar-width:none] max-sm:[&::-webkit-scrollbar]:hidden';

const CARD_SHELL_BASE =
  'flex min-w-0 max-w-full shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm';

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

/** Mobile strip row width at 390px viewport (festival dialog padding). */
export const EVENT_STRIP_MOBILE_ROW_WIDTH_PX = 314;

/**
 * @param {number} rowWidthPx scroll row client width (px)
 * @param {{ large?: boolean; gapPx?: number; divisor?: number }} [opts]
 */
/** Card width from CSS `calc((100vw - offset) / divisor)` at a given viewport. */
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
 * @param {number} rowWidthPx scroll row client width (px)
 * @param {{ large?: boolean; gapPx?: number; divisor?: number; viewportWidthPx?: number }} [opts]
 */
export function eventStripCardPeekMetrics(rowWidthPx, opts = {}) {
  const gapPx = opts.gapPx ?? EVENT_STRIP_INTER_CARD_GAP_PX;
  const viewportWidthPx = opts.viewportWidthPx ?? 390;
  const cardWidth = eventStripCardWidthPx(viewportWidthPx, opts);
  const peekPx = rowWidthPx - cardWidth * 2 - gapPx;
  const peekPercent = cardWidth > 0 ? (peekPx / cardWidth) * 100 : 0;
  return { cardWidth, peekPx, peekPercent };
}

/** Third-card visible width inside the row viewport (getBoundingClientRect). */
export function eventStripThirdCardPeekPx(rowRect, thirdCardRect) {
  const visibleLeft = Math.max(rowRect.left, thirdCardRect.left);
  const visibleRight = Math.min(rowRect.right, thirdCardRect.right);
  return Math.max(0, visibleRight - visibleLeft);
}

/**
 * Peek as % of full card width (third card).
 * @param {{ left: number; right: number }} rowRect
 * @param {{ left: number; right: number; width: number }} thirdCardRect
 */
export function eventStripThirdCardPeekPercent(rowRect, thirdCardRect) {
  const peekPx = eventStripThirdCardPeekPx(rowRect, thirdCardRect);
  const fullWidth = thirdCardRect.width;
  return fullWidth > 0 ? (peekPx / fullWidth) * 100 : 0;
}
