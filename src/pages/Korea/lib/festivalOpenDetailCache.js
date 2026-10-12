import { festivalItemFromDetail } from '../festivalDeepLinkItem.js';

const CACHE_PREFIX = 'gateo:festival-open-detail:v1:';
const CACHE_TTL_MS = 30 * 60 * 1000;
const memory = new Map();

function stores() {
  const out = [];
  try {
    if (typeof sessionStorage !== 'undefined') out.push(sessionStorage);
  } catch {
    /* private mode */
  }
  try {
    if (typeof localStorage !== 'undefined') out.push(localStorage);
  } catch {
    /* private mode */
  }
  return out;
}

function cacheKey(contentId) {
  return `${CACHE_PREFIX}${String(contentId || '').trim()}`;
}

/** Fields the deep link needs to open a sheet before TourAPI detail returns. */
export function slimFestivalOpenDetail(detail) {
  const built = festivalItemFromDetail(detail);
  if (!built?.contentId || !built.mapx || !built.mapy) return null;
  return {
    ok: true,
    contentId: built.contentId,
    common: {
      contentid: built.contentId,
      title: built.title,
      addr1: built.addr1,
      mapx: built.mapx,
      mapy: built.mapy,
      firstimage: built.firstimage,
      tel: built.tel,
    },
    intro: {
      contentid: built.contentId,
      title: built.title,
      eventstartdate: built.eventStartDate,
      eventenddate: built.eventEndDate,
      mapx: built.mapx,
      mapy: built.mapy,
    },
  };
}

export function readFestivalOpenDetail(contentId, storeList = stores()) {
  const key = cacheKey(contentId);
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && now - mem.at <= CACHE_TTL_MS) return mem.detail;
  for (const store of storeList) {
    try {
      const raw = store.getItem(key);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      if (!parsed?.detail || typeof parsed.at !== 'number') continue;
      if (now - parsed.at > CACHE_TTL_MS) continue;
      memory.set(key, parsed);
      return parsed.detail;
    } catch {
      /* opaque */
    }
  }
  return null;
}

export function writeFestivalOpenDetail(contentId, detail, storeList = stores()) {
  const slim = slimFestivalOpenDetail(detail);
  if (!slim) return;
  const key = cacheKey(slim.contentId || contentId);
  const entry = { detail: slim, at: Date.now() };
  memory.set(key, entry);
  const raw = JSON.stringify(entry);
  for (const store of storeList) {
    try {
      store.setItem(key, raw);
    } catch {
      /* quota */
    }
  }
}
