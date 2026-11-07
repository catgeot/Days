/** 11월 여행지 — 단일 CSS Grid (메이슨리 column run 금지). */

export const EXPLORE_MONTHLY_PICK_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-12 auto-rows-min items-start gap-x-2 gap-y-3 sm:gap-x-3 sm:gap-y-4';

/**
 * @param {number} index MONTHLY_PICKS 노출 순 (0 교토 … 5 멜버른)
 * @returns {{ className: string, variant: 'hero' | 'wide' | 'tile' }}
 */
export function resolveExploreMonthlyPickGridSlot(index) {
  if (index === 0) {
    return { className: 'col-span-12', variant: 'hero' };
  }
  if (index === 1 || index === 2 || index === 3) {
    return { className: 'col-span-6 lg:col-span-4', variant: 'tile' };
  }
  if (index === 4) {
    return { className: 'col-span-6', variant: 'wide' };
  }
  return { className: 'col-span-12 lg:col-span-6', variant: 'wide' };
}
