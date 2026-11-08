/** 11월 여행지 — 균등 칸. 행을 걸치면 좁은 칸의 출처 글이 옆 카드 사진 위로 넘친다. */

export const EXPLORE_MONTHLY_PICK_GRID_CLASS =
  'grid w-full min-w-0 grid-cols-12 items-stretch gap-3 sm:gap-4';

const EVEN_SLOT = 'col-span-6 min-w-0 isolate lg:col-span-4';

/** @type {Record<string, { className: string, variant: 'tile' | 'tall' }>} */
const EXPLORE_MONTHLY_PICK_GRID_SLOTS = {
  kyoto: { className: EVEN_SLOT, variant: 'tile' },
  jeju: { className: EVEN_SLOT, variant: 'tall' },
  'chiang-mai': { className: EVEN_SLOT, variant: 'tile' },
  'phu-quoc': { className: EVEN_SLOT, variant: 'tile' },
  dubai: { className: EVEN_SLOT, variant: 'tile' },
  melbourne: { className: EVEN_SLOT, variant: 'tile' },
};

/**
 * @param {string} slug
 * @returns {{ className: string, variant: 'tile' | 'tall' }}
 */
export function resolveExploreMonthlyPickGridSlot(slug) {
  const key = String(slug || '').toLowerCase();
  return (
    EXPLORE_MONTHLY_PICK_GRID_SLOTS[key] || {
      className: EVEN_SLOT,
      variant: 'tile',
    }
  );
}
