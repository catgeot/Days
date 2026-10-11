import { attachMrtStayDistances } from '../../../utils/mrtStayDistance.js';

const published = new Map();
const waiters = new Map();

function stayRows(items, origin) {
  const list = Array.isArray(items) ? items : [];
  const distanced = origin ? attachMrtStayDistances(list, origin) : list;
  const rows = [];
  const seen = new Set();
  for (const item of distanced) {
    const name = String(item?.itemName || item?.name || '').replace(/\s+/g, ' ').trim();
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const distKm = Number(item?.distanceKm ?? item?.distKm);
    rows.push({ name, distKm: Number.isFinite(distKm) && distKm > 0 ? distKm : null });
    if (rows.length >= 12) break;
  }
  return rows;
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

export function resetFestivalLodgingStays(contentId) {
  if (contentId == null) {
    published.clear();
    waiters.clear();
    return;
  }
  const key = String(contentId).trim();
  published.delete(key);
  waiters.delete(key);
}

/**
 * Stays already on the context win. Otherwise wait until the lodging card publishes, up to timeoutMs.
 * @param {string} contentId
 * @param {{ stays?: unknown, timeoutMs?: number }} [options]
 */
export function waitForFestivalLodgingStays(contentId, options = {}) {
  const ready = stayRows(options.stays);
  if (ready.length) return Promise.resolve(ready);
  const key = String(contentId || '').trim();
  if (!key) return Promise.resolve([]);
  if (published.has(key)) return Promise.resolve(published.get(key) || []);
  const timeoutMs = Number(options.timeoutMs) > 0 ? Number(options.timeoutMs) : 3000;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      const left = (waiters.get(key) || []).filter((fn) => fn !== finish);
      if (left.length) waiters.set(key, left);
      else waiters.delete(key);
      resolve(published.get(key) || []);
    }, timeoutMs);
    const finish = (rows) => {
      clearTimeout(timer);
      resolve(rows);
    };
    const list = waiters.get(key) || [];
    list.push(finish);
    waiters.set(key, list);
  });
}
