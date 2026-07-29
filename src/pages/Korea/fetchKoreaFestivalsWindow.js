import { fetchTourApiFestivals } from '../../utils/fetchTourApiFestivals';
import { monthRangeYmd, rolling12MonthCursors } from './festivalTimeFilter';

const CACHE_KEY = 'gateo:korea-festivals:v1:rolling12';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
/** TourAPI 429 방지 — 월 단위 동시 호출 상한 */
const MONTH_CONCURRENCY = 2;
const PAGE_ROWS = 50;
const BETWEEN_PAGE_MS = 120;

/** @type {Promise<{ ok: boolean, items: object[], fromCache: boolean, error?: string }> | null} */
let inflight = null;

/**
 * @param {number} ms
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @template T, R
 * @param {T[]} items
 * @param {number} concurrency
 * @param {(item: T, index: number) => Promise<R>} fn
 * @returns {Promise<R[]>}
 */
async function mapPool(items, concurrency, fn) {
  const results = new Array(items.length);
  let next = 0;
  const workers = Array.from(
    { length: Math.min(Math.max(1, concurrency), items.length || 1) },
    async () => {
      while (next < items.length) {
        const i = next;
        next += 1;
        results[i] = await fn(items[i], i);
      }
    },
  );
  await Promise.all(workers);
  return results;
}

/**
 * @param {object[]} pages
 * @returns {object[]}
 */
function mergeFestivalPages(pages) {
  const seen = new Set();
  /** @type {object[]} */
  const merged = [];
  for (const data of pages) {
    if (!data?.ok || !Array.isArray(data.items)) continue;
    for (const item of data.items) {
      const key = String(item?.contentId || `${item?.title}-${item?.eventStartDate}`);
      if (!key || seen.has(key)) continue;
      if (!item?.title || !/^\d{8}$/.test(String(item.eventStartDate || ''))) continue;
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

/**
 * @returns {{ items: object[], fetchedAt: number } | null}
 */
function readCache() {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.items) || typeof parsed.fetchedAt !== 'number') {
      return null;
    }
    if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {object[]} items
 */
function writeCache(items) {
  if (typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ items, fetchedAt: Date.now() }),
    );
  } catch {
    /* quota */
  }
}

/**
 * @param {{ eventStartDate: string, eventEndDate: string }} range
 * @returns {Promise<object[]>}
 */
async function fetchMonthPages(range) {
  const base = {
    eventStartDate: range.eventStartDate,
    eventEndDate: range.eventEndDate,
    numOfRows: PAGE_ROWS,
  };
  const page1 = await fetchTourApiFestivals({ ...base, pageNo: 1 });
  /** @type {object[]} */
  const pages = [page1];
  const full =
    page1?.ok &&
    Array.isArray(page1.items) &&
    page1.items.length >= PAGE_ROWS;
  if (full) {
    await sleep(BETWEEN_PAGE_MS);
    pages.push(await fetchTourApiFestivals({ ...base, pageNo: 2 }));
  }
  return pages;
}

/**
 * @param {{ force?: boolean, now?: Date }} [opts]
 */
async function fetchKoreaFestivalsRolling12Uncached(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const cursors = rolling12MonthCursors(now);
  const monthPages = await mapPool(cursors, MONTH_CONCURRENCY, async ({ year, month0 }) => {
    const range = monthRangeYmd(year, month0);
    return fetchMonthPages(range);
  });
  const pages = monthPages.flat();
  const anyOk = pages.some((p) => p?.ok);
  if (!anyOk) {
    return {
      ok: false,
      items: [],
      fromCache: false,
      error: '축제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  const items = mergeFestivalPages(pages);
  writeCache(items);
  return { ok: true, items, fromCache: false };
}

/**
 * 롤링 12개월 LIVE fetch (월당 page1, 가득 찰 때만 page2).
 * sessionStorage HIT면 재사용. 동시 진입은 inflight 공유.
 * @param {{ force?: boolean, now?: Date }} [opts]
 * @returns {Promise<{ ok: boolean, items: object[], fromCache: boolean, error?: string }>}
 */
export async function fetchKoreaFestivalsRolling12(opts = {}) {
  if (!opts.force) {
    const cached = readCache();
    if (cached) {
      return { ok: true, items: cached.items, fromCache: true };
    }
  }

  if (inflight && !opts.force) {
    return inflight;
  }

  const job = fetchKoreaFestivalsRolling12Uncached(opts).finally(() => {
    if (inflight === job) inflight = null;
  });
  inflight = job;
  return job;
}

export { CACHE_KEY as KOREA_FESTIVAL_CACHE_KEY };
