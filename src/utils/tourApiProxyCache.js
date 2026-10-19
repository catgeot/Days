const CACHE_PREFIX = 'gateo:tourapi-proxy:v1:';
const CACHE_TTL_MS = 30 * 60 * 1000;
const memory = new Map();

const PERSISTED_ACTIONS = new Set(['locationBasedList', 'areaBasedList']);

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

function roundCoord(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return '';
  return n.toFixed(3);
}

export function isPersistedTourApiAction(action) {
  return PERSISTED_ACTIONS.has(String(action || ''));
}

/**
 * Edge `locationBasedCache`와 같은 좌표 버킷(소수 3자리).
 * 인스턴스 메모리는 재시작 시 사라지고, 이 캐시는 같은 브라우저에서 다시 연다.
 */
export function tourApiProxyCacheKey(body = {}) {
  const mapX = roundCoord(body.mapX ?? body.mapx);
  const mapY = roundCoord(body.mapY ?? body.mapy);
  return [
    CACHE_PREFIX,
    body.action || '',
    body.locale || '',
    String(body.contentId ?? body.contentid ?? ''),
    body.contentTypeId || '',
    mapX,
    mapY,
    body.radius || '',
    body.areaCode || '',
    body.sigunguCode || '',
    body.numOfRows || '',
    body.pageNo || '',
    body.arrange || '',
    body.listYN || '',
  ].join(':');
}

function readEntry(raw, now) {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.data?.ok !== true || typeof parsed.at !== 'number') return null;
    if (now - parsed.at > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * @param {Record<string, unknown>} body
 * @param {Storage[]} [stores]
 * @returns {Record<string, unknown> | null}
 */
export function readTourApiProxyCache(body, stores = storageList()) {
  if (!isPersistedTourApiAction(body?.action)) return null;
  const key = tourApiProxyCacheKey(body);
  const now = Date.now();
  const mem = memory.get(key);
  if (mem && now - mem.at <= CACHE_TTL_MS && mem.data?.ok === true) return mem.data;
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
    return parsed.data;
  }
  return null;
}

/**
 * @param {Record<string, unknown>} body
 * @param {Record<string, unknown>} data
 * @param {Storage[]} [stores]
 */
export function writeTourApiProxyCache(body, data, stores = storageList()) {
  if (!isPersistedTourApiAction(body?.action) || data?.ok !== true) return;
  const key = tourApiProxyCacheKey(body);
  const entry = { data, at: Date.now() };
  memory.set(key, entry);
  let raw = '';
  try {
    raw = JSON.stringify(entry);
  } catch {
    return;
  }
  if (raw.length > 200_000) return;
  for (const store of stores) {
    try {
      store.setItem(key, raw);
    } catch {
      /* quota */
    }
  }
}
