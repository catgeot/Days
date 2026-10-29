import { fetchTourApiFestivalWindow } from '../../utils/fetchTourApiFestivals';
import { mergeFestivalTitleEn } from './festivalTitleEnMerge';
import { rolling12MonthRangeYmd } from './festivalTimeFilter';

const CACHE_KEY = 'gateo:korea-festivals:v2:rolling12:ko';
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

/** @type {Promise<{ ok: boolean, items: object[], fromCache: boolean, stale?: boolean, error?: string }> | null} */
let inflight = null;

/**
 * @returns {{ items: object[], fetchedAt: number } | null}
 */
function festivalListStores() {
  const stores = [];
  try {
    if (typeof sessionStorage !== 'undefined') stores.push(sessionStorage);
  } catch {
    /* private mode */
  }
  try {
    if (typeof localStorage !== 'undefined') stores.push(localStorage);
  } catch {
    /* private mode */
  }
  return stores;
}

function readCache() {
  for (const store of festivalListStores()) {
    try {
      const raw = store.getItem(CACHE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items) || typeof parsed.fetchedAt !== 'number') {
        continue;
      }
      if (Date.now() - parsed.fetchedAt > CACHE_TTL_MS) continue;
      return parsed;
    } catch {
      /* opaque */
    }
  }
  return null;
}

/**
 * @param {object[]} items
 */
function writeCache(items) {
  const raw = JSON.stringify({ items, fetchedAt: Date.now() });
  for (const store of festivalListStores()) {
    try {
      store.setItem(CACHE_KEY, raw);
    } catch {
      /* quota */
    }
  }
}

function filterFestivalItems(items) {
  return (items || []).filter(
    (item) =>
      item?.title && /^\d{8}$/.test(String(item.eventStartDate || '')),
  );
}

/**
 * KorService2 목록에 EngService2 title만 contentId join.
 * @param {object[]} koItems
 * @param {{ eventStartDate: string, eventEndDate: string, force?: boolean }} range
 */
async function mergeTitleEnOntoItems(koItems, range) {
  if (!koItems.length) return koItems;

  const enData = await fetchTourApiFestivalWindow({
    eventStartDate: range.eventStartDate,
    eventEndDate: range.eventEndDate,
    force: Boolean(range.force),
    locale: 'en',
  });

  if (!enData?.ok || !Array.isArray(enData.items) || !enData.items.length) {
    return koItems;
  }

  return mergeFestivalTitleEn(koItems, enData.items);
}

function itemsNeedTitleEn(items) {
  return (items || []).some((item) => item?.contentId && !item?.titleEn);
}

const MOONI_TITLE_EN_TIMEOUT_MS = 5000;
const MOONI_TITLE_EN_FAILURE_CACHE_MS = 60_000;

/** Successful Eng join: in-memory en items per rolling-12 window (session). Failures: suppress retry 60s. */
/** @type {Map<string, object[]>} */
const mooniTitleEnEnItemsByRange = new Map();
/** @type {Map<string, Promise<object[] | null>>} */
const mooniTitleEnInflightByRange = new Map();
/** @type {Map<string, number>} */
const mooniTitleEnFailureUntilByRange = new Map();

/** @type {typeof fetchTourApiFestivalWindow | null} */
let mooniTitleEnFetchImpl = null;

function mooniTitleEnFetch() {
  return mooniTitleEnFetchImpl ?? fetchTourApiFestivalWindow;
}

/** @param {typeof fetchTourApiFestivalWindow | null} fn */
export function __testSetMooniTitleEnFetch(fn) {
  mooniTitleEnFetchImpl = fn;
}

export function __testResetMooniTitleEnCache() {
  mooniTitleEnEnItemsByRange.clear();
  mooniTitleEnInflightByRange.clear();
  mooniTitleEnFailureUntilByRange.clear();
  mooniTitleEnFetchImpl = null;
}

/**
 * @param {{ eventStartDate: string, eventEndDate: string, force?: boolean, signal?: AbortSignal }} range
 */
async function fetchMooniEnFestivalWindow(range) {
  const controller = new AbortController();
  const timer = setTimeout(() => {
    controller.abort(new Error('mooni titleEn merge timeout'));
  }, MOONI_TITLE_EN_TIMEOUT_MS);
  try {
    return await mooniTitleEnFetch()({
      eventStartDate: range.eventStartDate,
      eventEndDate: range.eventEndDate,
      force: Boolean(range.force),
      locale: 'en',
      timeoutMs: MOONI_TITLE_EN_TIMEOUT_MS,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

function markMooniTitleEnFailure(cacheKey) {
  mooniTitleEnFailureUntilByRange.set(cacheKey, Date.now() + MOONI_TITLE_EN_FAILURE_CACHE_MS);
}

/**
 * @param {{ eventStartDate: string, eventEndDate: string, force?: boolean }} range
 */
async function loadEnFestivalItemsForMooniRange(range) {
  const cacheKey = `${range.eventStartDate}:${range.eventEndDate}`;

  const failUntil = mooniTitleEnFailureUntilByRange.get(cacheKey);
  if (failUntil != null) {
    if (failUntil > Date.now()) return null;
    mooniTitleEnFailureUntilByRange.delete(cacheKey);
  }

  const cached = mooniTitleEnEnItemsByRange.get(cacheKey);
  if (cached) return cached;

  let inflight = mooniTitleEnInflightByRange.get(cacheKey);
  if (!inflight) {
    inflight = fetchMooniEnFestivalWindow(range)
      .then((enData) => {
        if (!enData?.ok || !Array.isArray(enData.items) || !enData.items.length) {
          markMooniTitleEnFailure(cacheKey);
          return null;
        }
        mooniTitleEnEnItemsByRange.set(cacheKey, enData.items);
        return enData.items;
      })
      .catch(() => {
        markMooniTitleEnFailure(cacheKey);
        return null;
      })
      .finally(() => {
        mooniTitleEnInflightByRange.delete(cacheKey);
      });
    mooniTitleEnInflightByRange.set(cacheKey, inflight);
  }

  return inflight;
}

/**
 * MOONi scoped festival — EngService2 title join (flag ON + EN locale only).
 * @param {object[]} items
 * @param {{ scopedFestivalEnabled?: boolean, locale?: string, now?: Date }} [opts]
 */
export async function ensureKoreaFestivalItemsTitleEnForMooni(items, opts = {}) {
  if (!opts.scopedFestivalEnabled) return items;
  if (!String(opts.locale || '').toLowerCase().startsWith('en')) return items;
  if (!items?.length || !itemsNeedTitleEn(items)) return items;

  const now = opts.now instanceof Date ? opts.now : new Date();
  const range = rolling12MonthRangeYmd(now);

  try {
    const enItems = await loadEnFestivalItemsForMooniRange({ ...range, force: false });
    if (!enItems?.length) return items;
    return mergeFestivalTitleEn(items, enItems);
  } catch {
    return items;
  }
}

/**
 * Edge festivalWindow 1회 (서버 페이지 merge + DB 캐시).
 * @param {{ force?: boolean, now?: Date, locale?: string }} [opts]
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

  const filtered = filterFestivalItems(data.items);
  const items = await mergeTitleEnOntoItems(filtered, {
    ...range,
    force: Boolean(opts.force),
  });
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
 * @param {{ force?: boolean, now?: Date, locale?: string }} [opts]
 * @returns {Promise<{ ok: boolean, items: object[], fromCache: boolean, stale?: boolean, error?: string }>}
 */
export async function fetchKoreaFestivalsRolling12(opts = {}) {
  if (!opts.force) {
    const cached = readCache();
    if (cached) {
      let { items } = cached;
      if (itemsNeedTitleEn(items)) {
        const now = opts.now instanceof Date ? opts.now : new Date();
        const range = rolling12MonthRangeYmd(now);
        items = await mergeTitleEnOntoItems(items, range);
        writeCache(items);
      }
      return { ok: true, items, fromCache: true };
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
