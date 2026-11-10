/** 1280 미만: 레이아웃 B(hero·반폭 tile·4번/jeju 전폭). xl+: 6칸 세 줄(아래 DESKTOP_ROWS). */

export const EXPLORE_MONTHLY_PICK_LAYOUT_B_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-12 auto-rows-min gap-x-3 gap-y-4 sm:gap-x-4 sm:gap-y-5';

export const EXPLORE_MONTHLY_PICK_DESKTOP_BOARD_CLASS =
  'flex w-full min-w-0 flex-col gap-y-4 sm:gap-y-5';

export const EXPLORE_MONTHLY_PICK_DESKTOP_ROW_CLASS =
  'grid w-full min-w-0 grid-cols-6 items-stretch gap-x-3 sm:gap-x-4';

/** @type {Array<{ index: number, colClass: string, variant: 'wide' | 'tall' | 'mid' }>} */
export const EXPLORE_MONTHLY_PICK_DESKTOP_ROWS = [
  [
    { index: 0, colClass: 'col-span-4', variant: 'wide' },
    { index: 1, colClass: 'col-span-2', variant: 'tall' },
  ],
  [
    { index: 2, colClass: 'col-span-3', variant: 'mid' },
    { index: 3, colClass: 'col-span-3', variant: 'mid' },
  ],
  [
    { index: 4, colClass: 'col-span-2', variant: 'tall' },
    { index: 5, colClass: 'col-span-4', variant: 'wide' },
  ],
];

/**
 * @param {number} index
 * @param {string} slug
 */
export function resolveExploreMonthlyPickLayoutBGridClass(index, slug) {
  if (index === 0) return 'col-span-12';
  if (index === 1 || index === 2 || index === 4 || index === 5) return 'col-span-6';
  if (index === 3 || String(slug || '').toLowerCase() === 'jeju') return 'col-span-12';
  return 'col-span-6';
}

/**
 * @param {number} index
 * @param {string} slug
 * @returns {'hero' | 'wide' | 'tile'}
 */
export function resolveExploreMonthlyPickLayoutBVariant(index, slug) {
  if (index === 0) return 'hero';
  if (index === 3 || String(slug || '').toLowerCase() === 'jeju') return 'wide';
  return 'tile';
}

/**
 * @param {number} index
 * @returns {'wide' | 'tall' | 'mid' | null}
 */
export function resolveExploreMonthlyPickDesktopVariant(index) {
  for (const row of EXPLORE_MONTHLY_PICK_DESKTOP_ROWS) {
    const slot = row.find((s) => s.index === index);
    if (slot) return slot.variant;
  }
  return null;
}

/**
 * @param {number} index
 * @returns {string}
 */
export function resolveExploreMonthlyPickDesktopColClass(index) {
  for (const row of EXPLORE_MONTHLY_PICK_DESKTOP_ROWS) {
    const slot = row.find((s) => s.index === index);
    if (slot) return slot.colClass;
  }
  return 'col-span-6';
}
