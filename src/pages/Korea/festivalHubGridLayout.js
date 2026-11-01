/** Festival hub photo list — masonry columns (390 stays 2-col; wider viewports add columns). List order stays in the data; columns flow top-to-bottom like PlaceGallery. */
export const FESTIVAL_HUB_GRID_CLASS =
  'w-full columns-2 gap-1.5 md:columns-3 md:gap-2 lg:columns-4 lg:gap-2.5';

const FESTIVAL_HUB_MASONRY_THUMB_ASPECT_CLASSES = [
  'aspect-[3/4]',
  'aspect-[4/3]',
  'aspect-[4/5]',
  'aspect-[1/1]',
  'aspect-[5/4]',
  'aspect-[3/4]',
];

export function festivalHubMasonryIsWide(index) {
  return ((index % 6) + 6) % 6 === 5;
}

export function festivalHubMasonryThumbAspectClass(index) {
  if (festivalHubMasonryIsWide(index)) return 'aspect-[16/9]';
  const len = FESTIVAL_HUB_MASONRY_THUMB_ASPECT_CLASSES.length;
  return FESTIVAL_HUB_MASONRY_THUMB_ASPECT_CLASSES[((index % len) + len) % len];
}

/** Flat nationwide grid: eager-load thumbs for first screen (2× mobile · up to 4× desktop). */
export const FESTIVAL_HUB_GRID_EAGER_THUMB_COUNT = 12;

/** Extra list bottom pad on mobile so fixed 「위로」 does not cover grid meta lines. */
export const FESTIVAL_HUB_GRID_MOBILE_SCROLL_PAD_CLASS =
  'festival-hub-grid-list-scroll-pad';

/** Mobile-only: center 「위로」 below grid so right-column meta stays readable. */
/** Center with inset+mx-auto so translate-y show/hide does not cancel horizontal centering. */
export const FESTIVAL_HUB_GRID_SCROLL_TOP_BOTTOM_CLASS =
  'bottom-[max(3rem,calc(env(safe-area-inset-bottom)+2.35rem))] left-0 right-0 mx-auto w-max';
