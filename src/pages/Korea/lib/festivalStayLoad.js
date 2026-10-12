import { attachMrtStayDistances } from '../../../utils/mrtStayDistance.js';
import { isFestivalLodgingAsk } from '../../../shared/korea/mooniKoreaFestivalAssist.js';

const published = new Map();
const waiters = new Map();
const loads = new Map();

function stayTypeLabel(item) {
  const raw = String(
    item?.type || item?.categoryName || item?.propertyType || item?.grade || '',
  ).replace(/\s+/g, ' ').trim();
  if (!raw || raw.length > 12) return '';
  return raw;
}

function stayRows(items, origin) {
  const list = Array.isArray(items) ? items : [];
  const distanced = origin ? attachMrtStayDistances(list, origin) : list;
  const rows = [];
  const seen = new Set();
  for (const item of distanced) {
    const name = String(item?.itemName || item?.name || '').replace(/\s+/g, ' ').trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const distKm = Number(item?.distanceKm ?? item?.distKm ?? item?.distance);
    const type = stayTypeLabel(item);
    rows.push({
      name,
      distKm: Number.isFinite(distKm) && distKm > 0 ? distKm : null,
      ...(type ? { type } : {}),
    });
    if (rows.length >= 12) break;
  }
  return rows;
}

/** Closest stays with a distance. Names still go out when every stay lacks one. */
export function topFestivalLodgingStays(items, origin, limit = 3) {
  const rows = stayRows(items, origin);
  rows.sort((a, b) => {
    const da = a.distKm > 0 ? a.distKm : Number.POSITIVE_INFINITY;
    const db = b.distKm > 0 ? b.distKm : Number.POSITIVE_INFINITY;
    return da - db;
  });
  const withDist = rows.filter((row) => row.distKm > 0);
  return (withDist.length ? withDist : rows).slice(0, Math.max(1, limit));
}

/** Lodging-card stays for a festival, so a lodging question can name them. */
export function publishFestivalLodgingStays(contentId, items, origin) {
  const key = String(contentId || '').trim();
  if (!key) return [];
  const rows = stayRows(items, origin);
  published.set(key, rows);
  const pending = waiters.get(key) || [];
  waiters.delete(key);
  for (const resolve of pending) resolve(rows);
  return rows;
}

/** The lodging card's in-flight fetch, so a lodging question can wait for the same list. */
export function beginFestivalLodgingLoad(contentId, promise) {
  const key = String(contentId || '').trim();
  if (!key || !promise) return promise;
  const tracked = Promise.resolve(promise).catch(() => []);
  loads.set(key, tracked);
  return tracked;
}

export function resetFestivalLodgingStays(contentId) {
  if (contentId == null) {
    published.clear();
    waiters.clear();
    loads.clear();
    return;
  }
  const key = String(contentId).trim();
  published.delete(key);
  waiters.delete(key);
  loads.delete(key);
}

/**
 * Stays already on the context win. Otherwise wait for the lodging card fetch, up to timeoutMs.
 * @param {string} contentId
 * @param {{ stays?: unknown, timeoutMs?: number, origin?: { lat?: number, lng?: number } | null }} [options]
 */
export function waitForFestivalLodgingStays(contentId, options = {}) {
  const origin = options.origin || null;
  const ready = topFestivalLodgingStays(options.stays, origin);
  if (ready.length) return Promise.resolve(ready);
  const key = String(contentId || '').trim();
  if (!key) return Promise.resolve([]);
  if (published.has(key)) {
    const rows = topFestivalLodgingStays(published.get(key) || [], origin);
    if (rows.length) return Promise.resolve(rows);
  }
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 3000;
  const pending = loads.get(key);
  const publishedWait = new Promise((resolve) => {
    const timer = setTimeout(() => {
      const left = (waiters.get(key) || []).filter((fn) => fn !== finish);
      if (left.length) waiters.set(key, left);
      else waiters.delete(key);
      resolve(topFestivalLodgingStays(published.get(key) || [], origin));
    }, timeoutMs);
    const finish = (rows) => {
      clearTimeout(timer);
      resolve(topFestivalLodgingStays(rows, origin));
    };
    const list = waiters.get(key) || [];
    list.push(finish);
    waiters.set(key, list);
  });
  if (!pending) return publishedWait;
  const fromLoad = Promise.resolve(pending).then((items) => topFestivalLodgingStays(items, origin));
  return Promise.race([fromLoad, publishedWait]);
}

/**
 * Lodging questions carry the card's closest stays into festivalContext.
 * @param {Record<string, unknown> | null | undefined} festivalContext
 * @param {{ userText?: string, chipId?: string, timeoutMs?: number }} [ask]
 */
export async function loadFestivalLodgingForAsk(festivalContext, ask = {}) {
  if (!festivalContext || !isFestivalLodgingAsk(ask)) return festivalContext ?? null;
  const origin = {
    lat: festivalContext.lat,
    lng: festivalContext.lng,
  };
  const loaded = await waitForFestivalLodgingStays(festivalContext.contentId, {
    stays: festivalContext.nearbyStays,
    timeoutMs: ask.timeoutMs,
    origin,
  });
  return { ...festivalContext, nearbyStays: loaded };
}
