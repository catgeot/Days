/** 11월 여행지 — 두 열. 한 카드가 여러 행을 차지하지 않는다. 비율은 잘리지 않게 사진 주제에 맞춘다. */

export const EXPLORE_MONTHLY_PICK_BOARD_CLASS =
  'flex w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid lg:grid-cols-3 lg:gap-4';

export const EXPLORE_MONTHLY_PICK_COLUMN_CLASS = [
  'flex w-0 min-w-0 flex-[1.27] flex-col gap-3 sm:flex-1 sm:gap-4 lg:contents',
  'flex w-0 min-w-0 flex-1 flex-col gap-3 sm:flex-1 sm:gap-4 lg:contents',
];

/** @type {string[][]} */
export const EXPLORE_MONTHLY_PICK_COLUMN_SLUGS = [
  ['kyoto', 'chiang-mai', 'dubai'],
  ['jeju', 'phu-quoc', 'melbourne'],
];

/** @type {Record<string, { variant: 'portrait' | 'landscape', photoClass: string }>} */
const EXPLORE_MONTHLY_PICK_GRID_SLOTS = {
  kyoto: { variant: 'portrait', photoClass: 'aspect-[4/5]' },
  'chiang-mai': { variant: 'landscape', photoClass: 'aspect-[3/2]' },
  'phu-quoc': { variant: 'landscape', photoClass: 'aspect-[3/2]' },
  jeju: { variant: 'landscape', photoClass: 'aspect-[3/2]' },
  dubai: { variant: 'portrait', photoClass: 'aspect-[4/5]' },
  melbourne: { variant: 'landscape', photoClass: 'aspect-[4/3]' },
};

const FALLBACK_SLOT = { variant: 'landscape', photoClass: 'aspect-[3/2]' };

/**
 * @param {string} slug
 * @returns {{ variant: 'portrait' | 'landscape', photoClass: string }}
 */
export function resolveExploreMonthlyPickGridSlot(slug) {
  const key = String(slug || '').toLowerCase();
  return EXPLORE_MONTHLY_PICK_GRID_SLOTS[key] || FALLBACK_SLOT;
}

/**
 * @param {Array<{ spot?: { slug?: string }, entry?: { slug?: string } }>} cards
 */
export function groupExploreMonthlyPickColumns(cards) {
  const bySlug = new Map();
  for (const card of cards || []) {
    const slug = String(card?.spot?.slug || card?.entry?.slug || '').toLowerCase();
    if (slug) bySlug.set(slug, card);
  }
  const used = new Set();
  const columns = EXPLORE_MONTHLY_PICK_COLUMN_SLUGS.map((slugs) => {
    const column = [];
    for (const slug of slugs) {
      const card = bySlug.get(slug);
      if (!card) continue;
      used.add(slug);
      column.push(card);
    }
    return column;
  });
  for (const [slug, card] of bySlug) {
    if (used.has(slug)) continue;
    const target = columns[0].length <= columns[1].length ? columns[0] : columns[1];
    target.push(card);
  }
  return columns;
}
