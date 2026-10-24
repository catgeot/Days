/** TourAPI festivalWindow pagination — stable sort + completeness guards. */

import { addDaysYmd } from "./intro_homepage.mjs";

export const FESTIVAL_WINDOW_ARRANGE = "A";
export const FESTIVAL_WINDOW_PAGE_ROWS = 500;
export const FESTIVAL_WINDOW_MAX_PAGES = 12;
export const FESTIVAL_WINDOW_SPLIT_MONTHS = 2;

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
 * @param {Array<{ ok?: boolean, items?: unknown[] }>} pages
 */
export function countRawFestivalPageItems(pages) {
  let n = 0;
  for (const p of pages) {
    if (!p?.ok || !Array.isArray(p.items)) continue;
    n += p.items.length;
  }
  return n;
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
 * @param {Array<{ ok?: boolean, items?: unknown[], rawCount?: number }>} pages
 * @param {unknown[]} mergedItems
 */
export function festivalWindowFetchLooksIncomplete(pages, mergedItems) {
  const merged = mergedItems.length;
  const rawFetched = countRawFestivalPageItems(pages);
  const totalCount = maxFestivalWindowTotalCount(pages);
  if (rawFetched > merged) return true;
  if (totalCount > 0 && merged < totalCount) return true;
  return false;
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
