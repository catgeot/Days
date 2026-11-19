import {
  addDaysYmd,
  filterFestivalsByYmdRange,
  formatFestivalRangeLabel,
  isYmd,
  seoulTodayYmd,
} from '../festivalDateFilter.js';
import {
  buildSidoTags,
  LIST_SIDO_CHIP_MIN_COUNT,
  filterByRegion,
  SIDO_ORDER,
} from '../festivalRegionTags.js';

export const SHOW_ZERO_WINDOW_SIDO_CHIPS = true;
export const SOON_WIDEN_THRESHOLD = 5;
export const SOON_WIDEN_MAX_CARDS = 6;

const DEFAULT_PERIOD_TABS = new Set(['thisMonth', 'window30']);

/**
 * @param {string} timeTab
 */
export function isFestivalSoonWidenPeriod(timeTab) {
  return DEFAULT_PERIOD_TABS.has(String(timeTab || ''));
}

/**
 * @param {{
 *   timeTab?: string,
 *   searchActive?: boolean,
 *   nearActive?: boolean,
 *   personalTab?: string | null,
 * }} ctx
 */
export function isFestivalSoonWidenContext(ctx) {
  if (ctx.personalTab != null) return false;
  if (ctx.searchActive || ctx.nearActive) return false;
  return isFestivalSoonWidenPeriod(ctx.timeTab);
}

/**
 * @param {string} fromYmd
 * @param {string} toYmd
 */
export function diffYmdDays(fromYmd, toYmd) {
  if (!isYmd(fromYmd) || !isYmd(toYmd)) return 0;
  const a = Date.UTC(
    Number(fromYmd.slice(0, 4)),
    Number(fromYmd.slice(4, 6)) - 1,
    Number(fromYmd.slice(6, 8)),
  );
  const b = Date.UTC(
    Number(toYmd.slice(0, 4)),
    Number(toYmd.slice(4, 6)) - 1,
    Number(toYmd.slice(6, 8)),
  );
  return Math.round((b - a) / 86_400_000);
}

/**
 * @param {object} item
 * @param {string} todayYmd
 * @returns {number | null} days until start; null when already started or invalid
 */
export function festivalDaysUntilStart(item, todayYmd) {
  const start = String(item?.eventStartDate || '');
  if (!isYmd(start) || !isYmd(todayYmd)) return null;
  if (start <= todayYmd) return null;
  return diffYmdDays(todayYmd, start);
}

/**
 * @param {object[]} items
 * @param {{ minCount?: number }} [opts]
 */
export function buildSidoTagsForListWindow(items, opts = {}) {
  const baseMin = opts.minCount ?? LIST_SIDO_CHIP_MIN_COUNT;
  const chips = buildSidoTags(items, { ...opts, minCount: baseMin });
  if (!SHOW_ZERO_WINDOW_SIDO_CHIPS) return chips;
  const present = new Set(chips.map((c) => String(c.id)));
  const zeros = [];
  for (const meta of SIDO_ORDER) {
    if (present.has(meta.id)) continue;
    zeros.push({ id: meta.id, label: meta.label, count: 0 });
  }
  return [...chips, ...zeros];
}

function sortSoonItems(items) {
  return [...(items || [])].sort((a, b) => {
    const as = String(a?.eventStartDate || '');
    const bs = String(b?.eventStartDate || '');
    const cmp = as.localeCompare(bs);
    if (cmp !== 0) return cmp;
    return String(a?.title || '').localeCompare(String(b?.title || ''), 'ko');
  });
}

/**
 * @param {object[]} pool
 * @param {string} winStart
 * @param {string} winEnd
 * @param {Set<string>} defaultIds
 * @param {Set<string>} excludeIds
 * @param {Set<string>} alreadyPicked
 */
function pickSoonInWindow(pool, winStart, winEnd, defaultIds, excludeIds, alreadyPicked) {
  const hits = filterFestivalsByYmdRange(pool, winStart, winEnd);
  return hits.filter((item) => {
    const id = String(item?.contentId || '');
    if (!id) return false;
    if (defaultIds.has(id)) return false;
    if (excludeIds.has(id)) return false;
    if (alreadyPicked.has(id)) return false;
    return true;
  });
}

/**
 * @param {object[]} pool
 * @param {string} todayYmd
 * @param {Set<string>} excludeIds
 */
export function findNearestUpcomingFestival(pool, todayYmd, excludeIds = new Set()) {
  const rows = (pool || []).filter((item) => {
    const start = String(item?.eventStartDate || '');
    const id = String(item?.contentId || '');
    if (!isYmd(start) || start <= todayYmd) return false;
    if (excludeIds.has(id)) return false;
    return true;
  });
  rows.sort((a, b) => {
    const cmp = String(a.eventStartDate).localeCompare(String(b.eventStartDate));
    if (cmp !== 0) return cmp;
    return String(a.title || '').localeCompare(String(b.title || ''), 'ko');
  });
  return rows[0] || null;
}

/**
 * @param {{
 *   pool: object[],
 *   defaultListItems: object[],
 *   now?: Date,
 *   excludeContentIds?: Set<string>,
 *   zeroWindowRegion?: boolean,
 * }} input
 */
export function buildFestivalSoonWiden(input) {
  const {
    pool,
    defaultListItems,
    now = new Date(),
    excludeContentIds = new Set(),
    zeroWindowRegion = false,
  } = input;
  const today = seoulTodayYmd(now);
  const defaultCount = (defaultListItems || []).length;
  if (!zeroWindowRegion && defaultCount >= SOON_WIDEN_THRESHOLD) {
    return {
      items: [],
      stage: null,
      rangeStartYmd: '',
      rangeEndYmd: '',
      nearestFallback: null,
    };
  }
  const defaultIds = new Set(
    (defaultListItems || []).map((row) => String(row?.contentId || '')).filter(Boolean),
  );
  const excludeIds = excludeContentIds instanceof Set ? excludeContentIds : new Set();

  const stage1Start = addDaysYmd(today, 30);
  const stage1End = addDaysYmd(today, 59);
  const stage2Start = addDaysYmd(today, 60);
  const stage2End = addDaysYmd(today, 89);

  const picked = new Set();
  let soon = pickSoonInWindow(pool, stage1Start, stage1End, defaultIds, excludeIds, picked);
  for (const row of soon) picked.add(String(row.contentId));
  let stage = soon.length ? 1 : null;
  let rangeEnd = stage1End;

  const needMore =
    zeroWindowRegion || defaultCount + soon.length < SOON_WIDEN_THRESHOLD;
  if (needMore) {
    const extra = pickSoonInWindow(
      pool,
      stage2Start,
      stage2End,
      defaultIds,
      excludeIds,
      picked,
    );
    if (extra.length) {
      soon = [...soon, ...extra];
      stage = 2;
      rangeEnd = stage2End;
    }
  }

  soon = sortSoonItems(soon).slice(0, SOON_WIDEN_MAX_CARDS);

  let nearestFallback = null;
  if (!soon.length && zeroWindowRegion) {
    nearestFallback = findNearestUpcomingFestival(pool, today, excludeIds);
  }

  return {
    items: soon,
    stage,
    rangeStartYmd: stage1Start,
    rangeEndYmd: rangeEnd,
    nearestFallback,
  };
}

/**
 * @param {{
 *   rangeStartYmd: string,
 *   rangeEndYmd: string,
 *   count: number,
 *   todayYmd: string,
 *   locale?: string,
 *   countLabel?: string,
 *   sortLabel?: string,
 * }} p
 */
export function formatFestivalSoonSectionSubline(p) {
  const range = formatFestivalRangeLabel(
    p.rangeStartYmd,
    p.rangeEndYmd,
    p.todayYmd,
  );
  const parts = [range, p.countLabel, p.sortLabel].filter(Boolean);
  return parts.join(' · ');
}

/**
 * @param {object[]} timedItems
 * @param {string} areaCode
 */
export function isZeroWindowSidoSelection(timedItems, areaCode) {
  if (!SHOW_ZERO_WINDOW_SIDO_CHIPS) return false;
  if (!areaCode || areaCode === 'all') return false;
  return filterByRegion(timedItems, { areaCode }).length === 0;
}