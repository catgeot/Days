import { supabase } from '../shared/api/supabase';
import { fetchTourApiFestivalWindow } from '../../utils/fetchTourApiFestivals';
import { rolling12MonthRangeYmd } from './festivalTimeFilter';

const CACHE_KEY = 'gateo:korea-festivals:v1:rolling12';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** @type {Promise<{ ok: boolean, items: object[], fromCache: boolean, stale?: boolean, error?: string }> | null} */
let inflight = null;

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
 * Edge festivalWindow 1회 (서버 페이지 merge + DB 캐시).
 * @param {{ force?: boolean, now?: Date }} [opts]
 */
async function fetchKoreaFestivalsRolling12Uncached(opts = {}) {
  const now = opts.now instanceof Date ? opts.now : new Date();
  const range = rolling12MonthRangeYmd(now);
  const data = await fetchTourApiFestivalWindow({
    eventStartDate: range.eventStartDate,
    eventEndDate: range.eventEndDate,
    force: Boolean(opts.force),
  });

  if (!data?.ok || !Array.isArray(data.items)) {
    return {
      ok: false,
      items: [],
      fromCache: false,
      error:
        data?.message ||
        data?.error ||
        '축제 목록을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.',
    };
  }

  const items = data.items.filter(
    (item) =>
      item?.title && /^\d{8}$/.test(String(item.eventStartDate || '')),
  );
  writeCache(items);
  return {
    ok: true,
    items,
    fromCache: Boolean(data.fromCache),
    stale: Boolean(data.stale),
  };
}

/**
 * 롤링 12개월 축제 목록.
 * sessionStorage L1 → Edge festivalWindow (DB HIT / LIVE / stale).
 * @param {{ force?: boolean, now?: Date }} [opts]
 * @returns {Promise<{ ok: boolean, items: object[], fromCache: boolean, stale?: boolean, error?: string }>}
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
