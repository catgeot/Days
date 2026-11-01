/** Festival hub photo list — masonry columns (390 stays 2-col; wider viewports add columns). */
export const FESTIVAL_HUB_GRID_CLASS =
  'grid w-full grid-cols-2 items-start gap-1.5 md:grid-cols-3 md:gap-2 lg:grid-cols-4 lg:gap-2.5';

export const FESTIVAL_HUB_PHOTO_WIDE_MIN_RATIO = 1.5;

const FESTIVAL_HUB_PHOTO_MIN_RATIO = 0.5;
const FESTIVAL_HUB_PHOTO_MAX_RATIO = 2;

export function festivalHubPhotoLayout(naturalWidth, naturalHeight) {
  const width = Number(naturalWidth);
  const height = Number(naturalHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { aspectRatio: null, wide: false };
  }
  const ratio = width / height;
  const clamped = Math.min(
    FESTIVAL_HUB_PHOTO_MAX_RATIO,
    Math.max(FESTIVAL_HUB_PHOTO_MIN_RATIO, ratio),
  );
  return {
    aspectRatio: `${clamped} / 1`,
    wide: ratio >= FESTIVAL_HUB_PHOTO_WIDE_MIN_RATIO,
  };
}

/**
 * Split items into column runs vs standalone wide rows so wide cards span full width
 * while non-wide runs flow in independent masonry flex columns without WebKit multicol fragmentation.
 */
export function partitionFestivalHubSegments(
  items,
  isWideItem,
  minColumnEntries = 2,
) {
  const minCols = Math.max(1, Number(minColumnEntries) || 2);
  const segments = [];
  let currentEntries = [];
  const list = items || [];
  for (let index = 0; index < list.length; index += 1) {
    const item = list[index];
    const canBreakWide =
      currentEntries.length === 0 || currentEntries.length >= minCols;
    if (canBreakWide && isWideItem?.(item, index)) {
      if (currentEntries.length > 0) {
        segments.push({ type: 'columns', entries: currentEntries });
        currentEntries = [];
      }
      segments.push({ type: 'wide', entry: { item, index } });
    } else {
      currentEntries.push({ item, index });
    }
  }
  if (currentEntries.length > 0) {
    segments.push({ type: 'columns', entries: currentEntries });
  }
  return segments;
}

export function distributeFestivalHubMasonryColumns(entries, columnCount = 2) {
  const count = Math.max(1, Number(columnCount) || 2);
  const cols = Array.from({ length: count }, () => []);
  const list = entries || [];
  for (let i = 0; i < list.length; i += 1) {
    cols[i % count].push(list[i]);
  }
  return cols.filter((col) => col.length > 0);
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
