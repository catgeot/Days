const CACHE_PREFIX = 'gateo:nearby-attractions:v1:';
const CACHE_TTL_MS = 30 * 60 * 1000;
const memory = new Map();

function storageList() {
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

export function nearbyAttractionCacheKey({ lat, lng, radiusKm = 8, limit = 8 } = {}) {
  const radius = Math.min(Math.max(Number(radiusKm) || 5, 0.5), 50);
  const cap = Math.min(Math.max(Number(limit) || 12, 1), 40);
  return `${CACHE_PREFIX}${Number(lat).toFixed(3)}:${Number(lng).toFixed(3)}:${radius}:${cap}`;
}

function readEntry(raw, now) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.spots) || typeof parsed.at !== 'number') return null;
    if (now - parsed.at > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {{ lat: number, lng: number, radiusKm?: number, limit?: number }} opts
 * @param {Storage[]} [stores]
 * @returns {object[] | null}
 */
export function readNearbyAttractionCache(opts, stores = storageList()) {
  const key = nearbyAttractionCacheKey(opts);
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && now - mem.at <= CACHE_TTL_MS) return mem.spots;
  for (const store of stores) {
    let raw = null;
    try {
      raw = store.getItem(key);
    } catch {
      continue;
    }
    const parsed = readEntry(raw, now);
    if (!parsed) continue;
    memory.set(key, parsed);
    return parsed.spots;
  }
  return null;
}

/**
 * @param {{ lat: number, lng: number, radiusKm?: number, limit?: number }} opts
 * @param {object[]} spots
 * @param {Storage[]} [stores]
 */
export function writeNearbyAttractionCache(opts, spots, stores = storageList()) {
  const key = nearbyAttractionCacheKey(opts);
  const entry = { spots, at: Date.now() };
  memory.set(key, entry);
  const raw = JSON.stringify(entry);
  for (const store of stores) {
    try {
      store.setItem(key, raw);
    } catch {
      /* quota */
    }
  }
}
