import { fetchTourApiFestivals } from '../../utils/fetchTourApiFestivals';
import { monthRangeYmd, rolling12MonthCursors } from './festivalTimeFilter';

const CACHE_KEY = 'gateo:korea-festivals:v1:rolling12';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

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
 * 롤링 12개월 LIVE fetch (월당 page 1–2). sessionStorage HIT면 재사용.
 * @param {{ force?: boolean, now?: Date }} [opts]
 * @returns {Promise<{ ok: boolean, items: object[], fromCache: boolean, error?: string }>}
 */
export async function fetchKoreaFestivalsRolling12(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  if (!opts.force) {
    const cached = readCache();
    if (cached) {
      return { ok: true, items: cached.items, fromCache: true };
    }
  }

  const cursors = rolling12MonthCursors(now);
  /** @type {Promise<object|null>[]} */
  const jobs = [];
  for (const { year, month0 } of cursors) {
    const range = monthRangeYmd(year, month0);
    const base = {
      eventStartDate: range.eventStartDate,
      eventEndDate: range.eventEndDate,
      numOfRows: 50,
    };
    jobs.push(fetchTourApiFestivals({ ...base, pageNo: 1 }));
    jobs.push(fetchTourApiFestivals({ ...base, pageNo: 2 }));
  }

  const pages = await Promise.all(jobs);
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

export { CACHE_KEY as KOREA_FESTIVAL_CACHE_KEY };
