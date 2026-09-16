/**
 * MRT 숙소 클라 캐시 — 목록(요금)과 호텔 좌표를 분리.
 * 좌표 Photon은 Edge 12s 예산이라 목록 페인트와 분리한다.
 * listing: localStorage 30분 · 원점 없음(일정·인원·키워드만).
 * coords: localStorage 히트 14일 / 미스 24시간 · itemId.
 */
import { parseStayCoordPair } from './mrtStayDistance.js';

export const MRT_STAY_LISTING_CACHE_PREFIX = 'gateo:mrt-stays:v23:';
export const MRT_STAY_COORD_CACHE_KEY = 'gateo:mrt-stay-coords:v1';
export const MRT_STAY_LISTING_TTL_MS = 30 * 60 * 1000;
export const MRT_STAY_COORD_HIT_TTL_MS = 14 * 24 * 60 * 60 * 1000;
export const MRT_STAY_COORD_MISS_TTL_MS = 24 * 60 * 60 * 1000;
const COORD_MAP_MAX = 800;
const LEGACY_LISTING_PREFIXES = ['gateo:mrt-stays:v22:'];

function pickStorage(explicit) {
  if (explicit) return explicit;
  try {
    if (typeof localStorage === 'undefined') return null;
    return localStorage;
  } catch {
    return null;
  }
}

function nowMs(now) {
  return Number.isFinite(Number(now)) ? Number(now) : Date.now();
}

export function mrtStayListingCacheKey({
  keyword,
  isDomestic,
  countryHint,
  countryHintAlts,
  cityHints,
  checkIn,
  checkOut,
  adultCount,
  childCount,
} = {}) {
  const cityKey = Array.isArray(cityHints) && cityHints.length
    ? cityHints.join(',')
    : '-';
  const countryKey = [countryHint, ...(Array.isArray(countryHintAlts) ? countryHintAlts : [])]
    .map((c) => String(c || '').trim())
    .filter(Boolean)
    .join('|') || '-';
  return `${MRT_STAY_LISTING_CACHE_PREFIX}${isDomestic ? 'd' : 'i'}:${countryKey}:${cityKey}:${checkIn}:${checkOut}:a${adultCount}c${childCount}:${keyword}`;
}

export function dropLegacyMrtStayListingCaches(storage) {
  const stores = [];
  if (storage) stores.push(storage);
  try {
    if (typeof sessionStorage !== 'undefined') stores.push(sessionStorage);
  } catch {
    /* private mode */
  }
  try {
    if (typeof localStorage !== 'undefined' && storage !== localStorage) {
      stores.push(localStorage);
    }
  } catch {
    /* private mode */
  }
  for (const store of stores) {
    try {
      const keys = [];
      for (let i = 0; i < store.length; i += 1) {
        const k = store.key(i);
        if (k && LEGACY_LISTING_PREFIXES.some((p) => k.startsWith(p))) keys.push(k);
      }
      keys.forEach((k) => store.removeItem(k));
    } catch {
      /* quota / opaque */
    }
  }
}

export function readMrtStayListingCache(key, { storage, now } = {}) {
  const store = pickStorage(storage);
  if (!store || !key) return null;
  try {
    const raw = store.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.fetchedAt || nowMs(now) - parsed.fetchedAt > MRT_STAY_LISTING_TTL_MS) {
      store.removeItem(key);
      return null;
    }
    const payload = parsed.payload ?? null;
    if (!payload || typeof payload !== 'object') return null;
    return payload;
  } catch {
    return null;
  }
}

export function writeMrtStayListingCache(key, payload, { storage, now } = {}) {
  const store = pickStorage(storage);
  if (!store || !key || !payload) return;
  try {
    store.setItem(key, JSON.stringify({ fetchedAt: nowMs(now), payload }));
  } catch {
    dropLegacyMrtStayListingCaches(store);
    try {
      store.setItem(key, JSON.stringify({ fetchedAt: nowMs(now), payload }));
    } catch {
      /* quota */
    }
  }
}

function readCoordMap(store) {
  try {
    const raw = store.getItem(MRT_STAY_COORD_CACHE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function writeCoordMap(store, map) {
  try {
    store.setItem(MRT_STAY_COORD_CACHE_KEY, JSON.stringify(map));
  } catch {
    /* quota */
  }
}

function pruneCoordMap(map, now) {
  const entries = Object.entries(map || {});
  const kept = {};
  for (const [id, row] of entries) {
    if (!row || typeof row !== 'object') continue;
    const at = Number(row.at);
    if (!Number.isFinite(at)) continue;
    const ttl = row.miss ? MRT_STAY_COORD_MISS_TTL_MS : MRT_STAY_COORD_HIT_TTL_MS;
    if (now - at > ttl) continue;
    kept[id] = row;
  }
  const keys = Object.keys(kept);
  if (keys.length <= COORD_MAP_MAX) return kept;
  keys
    .sort((a, b) => Number(kept[a].at) - Number(kept[b].at))
    .slice(0, keys.length - COORD_MAP_MAX)
    .forEach((id) => {
      delete kept[id];
    });
  return kept;
}

function stayItemId(item) {
  const n = Number(item?.itemId);
  return Number.isFinite(n) && n > 0 ? String(n) : '';
}

export function hydrateMrtStayCoords(items, { storage, now } = {}) {
  const list = Array.isArray(items) ? items : [];
  const store = pickStorage(storage);
  if (!store || !list.length) return list;
  const map = pruneCoordMap(readCoordMap(store), nowMs(now));
  return list.map((item) => {
    if (parseStayCoordPair(item)) return item;
    const id = stayItemId(item);
    if (!id) return item;
    const row = map[id];
    if (!row || row.miss) return item;
    const lat = Number(row.lat);
    const lng = Number(row.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return item;
    return { ...item, lat, lng };
  });
}

export function persistMrtStayCoords(items, { storage, now, misses = [] } = {}) {
  const store = pickStorage(storage);
  if (!store) return;
  const ts = nowMs(now);
  const map = pruneCoordMap(readCoordMap(store), ts);
  const list = Array.isArray(items) ? items : [];
  for (const item of list) {
    const id = stayItemId(item);
    if (!id) continue;
    const pt = parseStayCoordPair(item);
    if (!pt) continue;
    map[id] = { lat: pt.lat, lng: pt.lng, at: ts };
  }
  for (const item of Array.isArray(misses) ? misses : []) {
    const id = stayItemId(item);
    if (!id) continue;
    if (map[id] && !map[id].miss && Number.isFinite(Number(map[id].lat))) continue;
    map[id] = { miss: true, at: ts };
  }
  writeCoordMap(store, pruneCoordMap(map, ts));
}

export function mergeMrtStayCoords(items, sourced) {
  const list = Array.isArray(items) ? items : [];
  const byId = new Map();
  for (const it of Array.isArray(sourced) ? sourced : []) {
    const id = stayItemId(it);
    const pt = parseStayCoordPair(it);
    if (id && pt) byId.set(id, pt);
  }
  if (!byId.size) return list;
  return list.map((item) => {
    if (parseStayCoordPair(item)) return item;
    const pt = byId.get(stayItemId(item));
    return pt ? { ...item, lat: pt.lat, lng: pt.lng } : item;
  });
}

export function itemsNeedingStayGeocode(items, { storage, now } = {}) {
  const list = Array.isArray(items) ? items : [];
  const store = pickStorage(storage);
  const map = store ? pruneCoordMap(readCoordMap(store), nowMs(now)) : {};
  const ts = nowMs(now);
  return list.filter((item) => {
    if (parseStayCoordPair(item)) return false;
    const id = stayItemId(item);
    if (!id) return false;
    const row = map[id];
    if (row?.miss && ts - Number(row.at) <= MRT_STAY_COORD_MISS_TTL_MS) return false;
    if (row && !row.miss && Number.isFinite(Number(row.lat)) && Number.isFinite(Number(row.lng))) {
      return false;
    }
    return true;
  });
}

export function isCurrentMrtStayFetch(activeKey, startedKey) {
  return Boolean(startedKey) && activeKey === startedKey;
}

/** 화면에 먼저 보이는 요금有 숙소부터 Photon — 12초 예산이 뒷번호만 돌지 않게 */
export function orderStayItemsForGeocode(items, missing) {
  const need = new Set((Array.isArray(missing) ? missing : []).map(stayItemId).filter(Boolean));
  const ordered = [];
  const seen = new Set();
  const push = (it) => {
    const id = stayItemId(it);
    if (!id || !need.has(id) || seen.has(id)) return;
    seen.add(id);
    ordered.push(it);
  };
  const pricedFirst = (Array.isArray(items) ? items.slice() : []).sort((a, b) => {
    const ap = Number(a?.salePrice) > 0 ? 1 : 0;
    const bp = Number(b?.salePrice) > 0 ? 1 : 0;
    return bp - ap;
  });
  for (const it of pricedFirst) push(it);
  for (const it of Array.isArray(missing) ? missing : []) push(it);
  return ordered;
}
