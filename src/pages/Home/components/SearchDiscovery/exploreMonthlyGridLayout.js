/** 11월 여행지 — 좁은 화면은 가로·세로를 섞고, 넓은 화면은 여섯 칸. 한 카드가 여러 행을 차지하지 않는다. */

export const EXPLORE_MONTHLY_PICK_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-2 items-start gap-3 sm:gap-4 lg:grid-cols-6';

/** @type {Record<string, { variant: 'wide' | 'tall', className: string, photoClass: string }>} */
const EXPLORE_MONTHLY_PICK_GRID_SLOTS = {
  kyoto: {
    variant: 'wide',
    className: 'col-span-2 lg:col-span-4',
    photoClass: 'aspect-[16/9]',
  },
  'chiang-mai': {
    variant: 'tall',
    className: 'col-span-1 lg:col-span-2',
    photoClass: 'aspect-[3/4]',
  },
  'phu-quoc': {
    variant: 'tall',
    className: 'col-span-1 lg:col-span-2',
    photoClass: 'aspect-[3/4]',
  },
  jeju: {
    variant: 'wide',
    className: 'col-span-2 lg:col-span-4',
    photoClass: 'aspect-[2/1] lg:aspect-[16/9]',
  },
  dubai: {
    variant: 'tall',
    className: 'col-span-1 lg:col-span-3',
    photoClass: 'aspect-[3/4]',
  },
  melbourne: {
    variant: 'tall',
    className: 'col-span-1 lg:col-span-3',
    photoClass: 'aspect-[4/5]',
  },
};

const FALLBACK_SLOT = {
  variant: 'tall',
  className: 'col-span-1 lg:col-span-2',
  photoClass: 'aspect-[3/4]',
};

/**
 * @param {string} slug
 * @returns {{ variant: 'wide' | 'tall', className: string, photoClass: string }}
 */
export function resolveExploreMonthlyPickGridSlot(slug) {
  const key = String(slug || '').toLowerCase();
  return EXPLORE_MONTHLY_PICK_GRID_SLOTS[key] || FALLBACK_SLOT;
}
