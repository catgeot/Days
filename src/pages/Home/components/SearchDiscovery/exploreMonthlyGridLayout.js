/** 11월 여행지 — 높이만 다른 열. 한 카드가 여러 행을 차지하지 않는다. */

export const EXPLORE_MONTHLY_PICK_GRID_CLASS =
  'grid w-full min-w-0 items-start gap-3 sm:gap-4';

/** @type {Record<string, { variant: 'wide' | 'tile' | 'tall', photoClass: string }>} */
const EXPLORE_MONTHLY_PICK_GRID_SLOTS = {
  kyoto: { variant: 'tall', photoClass: 'aspect-[3/4]' },
  'chiang-mai': { variant: 'tile', photoClass: 'aspect-square' },
  'phu-quoc': { variant: 'wide', photoClass: 'aspect-[3/2]' },
  jeju: { variant: 'tall', photoClass: 'aspect-[4/5]' },
  dubai: { variant: 'wide', photoClass: 'aspect-video' },
  melbourne: { variant: 'tile', photoClass: 'aspect-[5/4]' },
};

const FALLBACK_SLOT = { variant: 'tile', photoClass: 'aspect-[3/2]' };

/**
 * @param {string} slug
 * @returns {{ variant: 'wide' | 'tile' | 'tall', photoClass: string }}
 */
export function resolveExploreMonthlyPickGridSlot(slug) {
  const key = String(slug || '').toLowerCase();
  return EXPLORE_MONTHLY_PICK_GRID_SLOTS[key] || FALLBACK_SLOT;
}

/** @param {unknown[]} cards @param {number} [columnCount] */
export function distributeExploreMonthlyPickColumns(cards, columnCount = 2) {
  const count = Math.max(1, Number(columnCount) || 2);
  const cols = Array.from({ length: count }, () => []);
  const list = cards || [];
  for (let i = 0; i < list.length; i += 1) {
    cols[i % count].push(list[i]);
  }
  return cols.filter((col) => col.length > 0);
}
