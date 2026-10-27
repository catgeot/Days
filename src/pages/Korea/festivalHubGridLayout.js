/** Festival hub photo grid — 390 stays 2-col; wider viewports add columns. */
export const FESTIVAL_HUB_GRID_CLASS =
  'grid w-full grid-cols-2 gap-1.5 md:grid-cols-3 md:gap-2 lg:grid-cols-4 lg:gap-2.5';

/** Flat nationwide grid: eager-load thumbs for first screen (2× mobile · up to 4× desktop). */
export const FESTIVAL_HUB_GRID_EAGER_THUMB_COUNT = 12;

/** Extra list bottom pad on mobile so fixed 「위로」 does not cover grid meta lines. */
export const FESTIVAL_HUB_GRID_MOBILE_SCROLL_PAD_CLASS =
  'festival-hub-grid-list-scroll-pad';

/** Mobile-only: center 「위로」 below grid so right-column meta stays readable. */
/** Center with inset+mx-auto so translate-y show/hide does not cancel -translate-x-1/2. */
export const FESTIVAL_HUB_GRID_SCROLL_TOP_BOTTOM_CLASS =
  'bottom-[max(3rem,calc(env(safe-area-inset-bottom)+2.35rem))] left-0 right-0 mx-auto w-max';
