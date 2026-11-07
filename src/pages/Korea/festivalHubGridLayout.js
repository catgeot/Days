/** Festival hub explore monthly masonry — 2/3/4 uniform columns (unchanged). */
export const FESTIVAL_HUB_GRID_CLASS =
  'grid w-full grid-cols-2 items-start gap-1.5 md:grid-cols-3 md:gap-2 lg:grid-cols-4 lg:gap-2.5';

/** Festival hub card view — plan C: 12-col dense grid, max body ~1152px (`max-w-6xl`). */
export const FESTIVAL_HUB_CARD_GRID_CLASS =
  'mx-auto grid w-full max-w-6xl grid-cols-12 grid-flow-dense auto-rows-auto items-stretch gap-1.5 md:gap-2';

export const FESTIVAL_HUB_PHOTO_WIDE_MIN_RATIO = 1.3;
export const FESTIVAL_HUB_PHOTO_LANDSCAPE_MIN_RATIO = 1.05;

export const FESTIVAL_HUB_PHOTO_PORT_MAX_RATIO = 0.85;
export const FESTIVAL_HUB_PHOTO_LAND_MIN_RATIO = 1.25;
export const FESTIVAL_HUB_PHOTO_ULTRA_MIN_RATIO = 1.55;

export const FESTIVAL_HUB_CARD_GRID_TIER_SPAN_CLASS = {
  port: 'col-span-6 md:col-span-3',
  mid: 'col-span-6 md:col-span-4',
  land: 'col-span-12 md:col-span-6',
  ultrawide: 'col-span-12 md:col-span-8',
};

export const FESTIVAL_HUB_COLUMN_LANDSCAPE_ASPECT_RATIOS = [
  '0.78 / 1',
  '0.88 / 1',
  '0.82 / 1',
  '0.92 / 1',
];

const FESTIVAL_HUB_PHOTO_MIN_RATIO = 0.5;
const FESTIVAL_HUB_PHOTO_MAX_RATIO = 2;

export function festivalHubColumnLandscapeAspectRatio(slotIndex = 0) {
  const len = FESTIVAL_HUB_COLUMN_LANDSCAPE_ASPECT_RATIOS.length;
  const idx = ((Number(slotIndex) || 0) % len + len) % len;
  return FESTIVAL_HUB_COLUMN_LANDSCAPE_ASPECT_RATIOS[idx];
}

export function festivalHubCardGridTier(naturalWidth, naturalHeight) {
  const width = Number(naturalWidth);
  const height = Number(naturalHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return 'mid';
  }
  const ratio = width / height;
  if (ratio <= FESTIVAL_HUB_PHOTO_PORT_MAX_RATIO) return 'port';
  if (ratio >= FESTIVAL_HUB_PHOTO_ULTRA_MIN_RATIO) return 'ultrawide';
  if (ratio >= FESTIVAL_HUB_PHOTO_LAND_MIN_RATIO) return 'land';
  return 'mid';
}

export function festivalHubCardGridSpanClass(tier) {
  return (
    FESTIVAL_HUB_CARD_GRID_TIER_SPAN_CLASS[tier] ||
    FESTIVAL_HUB_CARD_GRID_TIER_SPAN_CLASS.mid
  );
}

export function festivalHubCardGridSideCaption(tier) {
  return tier === 'land' || tier === 'ultrawide';
}

export function festivalHubCardGridThumbAspectStyle(
  tier,
  naturalWidth,
  naturalHeight,
  options = {},
) {
  const width = Number(naturalWidth);
  const height = Number(naturalHeight);
  const sideCaption =
    options?.sideCaption ?? festivalHubCardGridSideCaption(tier);
  const hasSize =
    Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;
  const ratio = hasSize ? width / height : null;
  const clamped = hasSize
    ? Math.min(
        FESTIVAL_HUB_PHOTO_MAX_RATIO,
        Math.max(FESTIVAL_HUB_PHOTO_MIN_RATIO, ratio),
      )
    : null;

  if (sideCaption) {
    if (options?.mdLayout) {
      return undefined;
    }
    return { aspectRatio: hasSize ? `${clamped} / 1` : '16 / 9' };
  }

  if (tier === 'port') {
    return { aspectRatio: hasSize ? `${clamped} / 1` : '3 / 4' };
  }
  if (tier === 'mid') {
    return { aspectRatio: hasSize ? `${clamped} / 1` : '5 / 4' };
  }
  return { aspectRatio: hasSize ? `${clamped} / 1` : '5 / 4' };
}

export function festivalHubPhotoLayout(naturalWidth, naturalHeight, options = {}) {
  const width = Number(naturalWidth);
  const height = Number(naturalHeight);
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return { aspectRatio: null, wide: false, enlargedLandscape: false };
  }
  const ratio = width / height;
  const clamped = Math.min(
    FESTIVAL_HUB_PHOTO_MAX_RATIO,
    Math.max(FESTIVAL_HUB_PHOTO_MIN_RATIO, ratio),
  );
  const isLandscape = ratio >= FESTIVAL_HUB_PHOTO_LANDSCAPE_MIN_RATIO;
  if (options?.inColumn && isLandscape) {
    return {
      aspectRatio: festivalHubColumnLandscapeAspectRatio(options.slotIndex),
      wide: false,
      enlargedLandscape: true,
    };
  }
  return {
    aspectRatio: `${clamped} / 1`,
    wide: ratio >= FESTIVAL_HUB_PHOTO_WIDE_MIN_RATIO,
    enlargedLandscape: false,
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
    const lastSeg = segments[segments.length - 1];
    const canBreakAtStart =
      currentEntries.length === 0 && lastSeg?.type !== 'wide';
    const canBreakAfterBalancedColumns =
      currentEntries.length >= minCols &&
      currentEntries.length % minCols === 0;
    const canBreakWide = canBreakAtStart || canBreakAfterBalancedColumns;
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
    if (
      currentEntries.length < minCols &&
      segments.length > 0 &&
      segments[segments.length - 1].type === 'wide'
    ) {
      const prevWide = segments.pop();
      segments.push({
        type: 'columns',
        entries: [prevWide.entry, ...currentEntries],
      });
    } else {
      segments.push({ type: 'columns', entries: currentEntries });
    }
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
