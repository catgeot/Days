import { fetchTourApiFestivals } from '../../utils/fetchTourApiFestivals';
import { rolling12MonthRangeYmd } from './festivalTimeFilter';

const CACHE_KEY = 'gateo:korea-festivals:v1:rolling12';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const PAGE_ROWS = 50;
/** 전국 1년치 — 페이지당 50 · 상한으로 폭주 방지 */
const MAX_PAGES = 12;

/** @type {Promise<{ ok: boolean, items: object[], fromCache: boolean, error?: string }> | null} */
let inflight = null;

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
 * 롤링 12개월을 한 구간으로 요청하고, S2처럼 페이지를 이어 붙인다.
 * (월×2 Promise.all 24건 금지 — TourAPI 429 회귀 원인)
 * @param {{ force?: boolean, now?: Date }} [opts]
 */
async function fetchKoreaFestivalsRolling12Uncached(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const range = rolling12MonthRangeYmd(now);
  const base = {
    eventStartDate: range.eventStartDate,
    eventEndDate: range.eventEndDate,
    numOfRows: PAGE_ROWS,
  };

  /** @type {object[]} */
  const pages = [];
  for (let pageNo = 1; pageNo <= MAX_PAGES; pageNo += 1) {
    const data = await fetchTourApiFestivals({ ...base, pageNo });
    pages.push(data);
    if (!data?.ok) break;
    const count = Array.isArray(data.items) ? data.items.length : 0;
    if (count < PAGE_ROWS) break;
  }

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
 * 롤링 12개월 LIVE fetch (한 구간 · 순차 페이지).
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
