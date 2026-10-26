/** Horizontal MRT stay/tour strip — mobile shows ~2 cards + third-card peek (gap-2 = 0.5rem). */
export const EVENT_STRIP_SCROLL_ROW_CLASS =
  '-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain touch-pan-x px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden';

/**
 * @param {{ large?: boolean }} [opts]
 * @returns {string}
 */
export function eventStripCardShellClass({ large = false } = {}) {
  const base =
    'flex shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm';
  if (large) {
    return `${base} w-[calc((100%-0.5rem)/1.55)] sm:w-[252px]`;
  }
  return `${base} w-[calc((100%-0.5rem)/2.18)] sm:w-[168px]`;
}

/** @param {number} containerWidthPx scroll row content width (px) */
export function eventStripCardPeekMetrics(containerWidthPx, { large = false, gapPx = 8 } = {}) {
  const divisor = large ? 1.55 : 2.18;
  const cardWidth = (containerWidthPx - gapPx) / divisor;
  const peekPx = containerWidthPx - cardWidth * 2 - gapPx;
  const peekPercent = cardWidth > 0 ? (peekPx / cardWidth) * 100 : 0;
  return { cardWidth, peekPx, peekPercent };
}
