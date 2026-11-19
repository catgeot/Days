import { fetchTourApiFestivals } from '../../../utils/fetchTourApiFestivals.js';
import { addDaysYmd, isYmd, seoulTodayYmd } from '../festivalDateFilter.js';

/** Inclusive offsets from Seoul today. Chips stay on the 30-day list. */
const HORIZON_SLICES = [
  [30, 59],
  [60, 89],
  [90, 179],
];

const PAGE_ROWS = 50;
const MAX_PAGES = 4;

/**
 * Bounded searchFestival windows for «곧 열려요» and the nearest fallback.
 * festivalWindow (rolling 12) is the chip/list payload. A short searchFestival
 * range can still return a later start that the list payload does not carry.
 * @param {Date} [now]
 * @returns {{ eventStartDate: string, eventEndDate: string }[]}
 */
export function festivalSoonHorizonRanges(now = new Date()) {
  const today = seoulTodayYmd(now);
  if (!isYmd(today)) return [];
  return HORIZON_SLICES.map(([fromDay, toDay]) => ({
    eventStartDate: addDaysYmd(today, fromDay),
    eventEndDate: addDaysYmd(today, toDay),
  }));
}

/**
 * @param {object[]} baseItems
 * @param {object[]} horizonItems
 */
export function mergeFestivalSoonHorizon(baseItems, horizonItems) {
  const list = Array.isArray(baseItems) ? [...baseItems] : [];
  const seen = new Set(list.map((row) => String(row?.contentId || '')).filter(Boolean));
  for (const item of horizonItems || []) {
    const id = String(item?.contentId || '');
    const start = String(item?.eventStartDate || '');
    if (!id || seen.has(id) || !isYmd(start)) continue;
    seen.add(id);
    list.push(item);
  }
  return list;
}

/**
 * @param {{ eventStartDate: string, eventEndDate: string, pageNo: number }} range
 */
async function defaultFetchPage(range) {
  return fetchTourApiFestivals({
    eventStartDate: range.eventStartDate,
    eventEndDate: range.eventEndDate,
    numOfRows: PAGE_ROWS,
    pageNo: range.pageNo,
  });
}

/**
 * @param {(range: { eventStartDate: string, eventEndDate: string, pageNo: number }) => Promise<{ ok?: boolean, items?: object[] } | null>} fetchPage
 * @param {{ eventStartDate: string, eventEndDate: string }} range
 */
async function fetchRangePages(fetchPage, range) {
  /** @type {object[]} */
  const items = [];
  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo += 1) {
    let data = null;
    try {
      data = await fetchPage({ ...range, pageNo });
    } catch {
      break;
    }
    const page = Array.isArray(data?.items) ? data.items : [];
    items.push(...page);
    if (!data?.ok || page.length < PAGE_ROWS) break;
  }
  return items;
}

/** @type {Map<string, Promise<object[]>>} */
const horizonInflight = new Map();

export function resetFestivalSoonHorizonForTests() {
  horizonInflight.clear();
}

/**
 * @param {Date} [now]
 * @param {{ fetchPage?: typeof defaultFetchPage }} [deps]
 * @returns {Promise<object[]>}
 */
export async function fetchFestivalSoonHorizon(now = new Date(), deps = {}) {
  const ranges = festivalSoonHorizonRanges(now);
  if (!ranges.length) return [];
  const fetchPage = deps.fetchPage || defaultFetchPage;
  const useCache = !deps.fetchPage;
  const cacheKey = ranges.map((range) => `${range.eventStartDate}:${range.eventEndDate}`).join('|');
  if (useCache) {
    const pending = horizonInflight.get(cacheKey);
    if (pending) return pending;
  }

  const job = (async () => {
    const pages = await Promise.all(ranges.map((range) => fetchRangePages(fetchPage, range)));
    return mergeFestivalSoonHorizon([], pages.flat());
  })();

  if (useCache) {
    horizonInflight.set(cacheKey, job);
    job.catch(() => {
      if (horizonInflight.get(cacheKey) === job) horizonInflight.delete(cacheKey);
    });
  }
  return job;
}
