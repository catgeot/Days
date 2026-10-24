/** TourAPI festivalWindow pagination — stable sort + completeness guards. */

import { addDaysYmd } from "./intro_homepage.mjs";

export const FESTIVAL_WINDOW_ARRANGE = "A";
export const FESTIVAL_WINDOW_PAGE_ROWS = 500;
export const FESTIVAL_WINDOW_MAX_PAGES = 12;
export const FESTIVAL_WINDOW_SPLIT_MONTHS = 2;
/** Unique rows may be below TourAPI totalCount by this many (dupes / malformed upstream). */
export const FESTIVAL_WINDOW_TOTAL_COUNT_TOLERANCE = 3;
/** Extra full-window fetches after the first (retry only). */
export const FESTIVAL_WINDOW_MAX_RETRY = 1;
/** Max date-range chunks per recovery pass (each chunk is one paginated fetch). */
export const FESTIVAL_WINDOW_MAX_CHUNK_RANGES = 6;

/**
 * @param {Array<{ ok?: boolean, items?: unknown[], rawCount?: number }>} pages
 */
export function mergeFestivalPages(pages) {
  const seen = new Set();
  const merged = [];
  for (const data of pages) {
    if (!data?.ok || !Array.isArray(data.items)) continue;
    for (const item of data.items) {
      const key = String(
        item?.contentId || `${item?.title}-${item?.eventStartDate}`,
      );
      if (!key || seen.has(key)) continue;
      if (
        !item?.title ||
        !/^\d{8}$/.test(String(item.eventStartDate || ""))
      ) {
        continue;
      }
      seen.add(key);
      merged.push(item);
    }
  }
  return merged;
}

/**
 * @param {Array<{ ok?: boolean, rawCount?: number }>} pages
 */
export function maxFestivalWindowTotalCount(pages) {
  let max = 0;
  for (const p of pages) {
    if (!p?.ok) continue;
    const n = Number(p.rawCount);
    if (Number.isFinite(n) && n > max) max = n;
  }
  return max;
}

/**
 * @param {unknown} item
 */
export function isValidFestivalWindowItem(item) {
  const id = String(item?.contentId || "").trim();
  return (
    Boolean(id) &&
    Boolean(item?.title) &&
    /^\d{8}$/.test(String(item?.eventStartDate || ""))
  );
}

/**
 * @param {unknown[][]} lists
 */
export function unionFestivalItemsByContentId(...lists) {
  const seen = new Set();
  const merged = [];
  for (const list of lists) {
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const id = String(item?.contentId || "").trim();
      if (!id || seen.has(id)) continue;
      if (!isValidFestivalWindowItem(item)) continue;
      seen.add(id);
      merged.push(item);
    }
  }
  return merged;
}

/**
 * @param {number} uniqueCount — deduped valid items
 * @param {number} totalCount — TourAPI totalCount (0 = unknown → not incomplete)
 * @param {number} [tolerance]
 */
export function festivalWindowFetchLooksIncomplete(
  uniqueCount,
  totalCount,
  tolerance = FESTIVAL_WINDOW_TOTAL_COUNT_TOLERANCE,
) {
  if (!Number.isFinite(totalCount) || totalCount <= 0) return false;
  const unique = Number(uniqueCount) || 0;
  return unique + tolerance < totalCount;
}

/**
 * @param {string} ymd — YYYYMMDD
 * @param {number} deltaMonths — positive or negative
 */
export function addMonthsYmd(ymd, deltaMonths) {
  const y = Number(ymd.slice(0, 4));
  const m = Number(ymd.slice(4, 6)) - 1;
  const d = Number(ymd.slice(6, 8));
  const dt = new Date(Date.UTC(y, m + deltaMonths, d));
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

/**
 * Split [startYmd, endYmd] into contiguous chunks (~splitMonths each).
 * @param {string} startYmd
 * @param {string} endYmd
 * @param {number} [splitMonths]
 * @returns {Array<{ eventStartDate: string, eventEndDate: string }>}
 */
export function splitFestivalWindowRange(startYmd, endYmd, splitMonths = FESTIVAL_WINDOW_SPLIT_MONTHS) {
  const chunks = [];
  let cursor = startYmd;
  while (cursor <= endYmd) {
    const monthBoundary = addMonthsYmd(cursor, splitMonths);
    const tentativeEnd = addDaysYmd(monthBoundary, -1);
    const eventEndDate =
      tentativeEnd && tentativeEnd <= endYmd ? tentativeEnd : endYmd;
    chunks.push({ eventStartDate: cursor, eventEndDate });
    if (eventEndDate >= endYmd) break;
    const next = addDaysYmd(eventEndDate, 1);
    if (!next || next > endYmd) break;
    cursor = next;
  }
  return chunks.length ? chunks : [{ eventStartDate: startYmd, eventEndDate: endYmd }];
}
