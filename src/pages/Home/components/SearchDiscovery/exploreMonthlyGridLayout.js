/** 11월 여행지 — 단일 CSS Grid (메이슨리·전폭 배너 금지). */

export const EXPLORE_MONTHLY_PICK_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-12 auto-rows-min items-start gap-x-2 gap-y-3 sm:gap-x-3 sm:gap-y-4';

/** @type {Record<string, { className: string, variant: 'wide' | 'tile' | 'tall' }>} */
const EXPLORE_MONTHLY_PICK_GRID_SLOTS = {
  kyoto: {
    className: 'col-start-1 col-span-8 row-start-1 lg:col-span-5 lg:row-start-1',
    variant: 'wide',
  },
  jeju: {
    className:
      'col-start-9 col-span-4 row-start-1 row-span-2 lg:col-start-10 lg:col-span-3 lg:row-start-1 lg:row-span-2',
    variant: 'tall',
  },
  'chiang-mai': {
    className: 'col-start-1 col-span-4 row-start-2 lg:col-start-6 lg:col-span-2 lg:row-start-1',
    variant: 'tile',
  },
  'phu-quoc': {
    className: 'col-start-5 col-span-4 row-start-2 lg:col-start-8 lg:col-span-2 lg:row-start-1',
    variant: 'tile',
  },
  dubai: {
    className: 'col-start-1 col-span-6 row-start-3 lg:col-start-1 lg:col-span-4 lg:row-start-2',
    variant: 'tall',
  },
  melbourne: {
    className: 'col-start-7 col-span-6 row-start-3 lg:col-start-5 lg:col-span-5 lg:row-start-2',
    variant: 'wide',
  },
};

/**
 * @param {string} slug
 * @returns {{ className: string, variant: 'wide' | 'tile' | 'tall' }}
 */
export function resolveExploreMonthlyPickGridSlot(slug) {
  const key = String(slug || '').toLowerCase();
  return (
    EXPLORE_MONTHLY_PICK_GRID_SLOTS[key] || {
      className: 'col-span-6',
      variant: 'tile',
    }
  );
}
