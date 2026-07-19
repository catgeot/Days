/**
 * /place/search-… · /place/loc-… 처럼 URL만으로는 표시명을 복구할 수 없을 때(외부 페이지 갔다가
 * 뒤로가기로 Home이 다시 마운트되는 경우) sessionStorage에 마지막 장소 객체를 보관합니다.
 *
 * v2: Explore/Global 등 placeholder 국가가 섞인 v1 캐시를 폐기(키 prefix 변경).
 */
const KEY_PREFIX = 'gateo_place_loc_v2:';
const LEGACY_KEY_PREFIX = 'gateo_place_loc_v1:';

let legacyCachePurged = false;

/** 한 탭 세션에서 v1 깨진 캐시 1회 제거 — 마커 재클릭 Global 잔존 방지 */
function purgeLegacyPlaceCacheOnce() {
  if (legacyCachePurged || typeof sessionStorage === 'undefined') return;
  legacyCachePurged = true;
  try {
    const keys = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k && k.startsWith(LEGACY_KEY_PREFIX)) keys.push(k);
    }
    keys.forEach((k) => sessionStorage.removeItem(k));
  } catch {
    // private mode
  }
}

function isCacheableId(id) {
  if (id == null) return false;
  const s = String(id);
  return s.startsWith('search-') || s.startsWith('loc-') || s.startsWith('label-');
}

function isCacheableSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  const s = slug.trim().toLowerCase();
  return s && !s.startsWith('search-') && !s.startsWith('loc-') && !s.startsWith('city-');
}

function isPlaceholderCachedCountry(country) {
  const c = String(country ?? '').trim().toLowerCase();
  return !c || c === 'explore' || c === 'global' || c === 'searching' || c === 'searching...';
}

/** placeholder 국가만 있는 캐시는 쓰지 않음(재클릭 Global 재발 방지) */
function sanitizeCachedLocation(loc) {
  if (!loc || typeof loc !== 'object') return null;
  if (isPlaceholderCachedCountry(loc.country) && isPlaceholderCachedCountry(loc.country_en)) {
    return null;
  }
  return loc;
}

export function cachePlaceLocation(loc) {
  if (!loc) return;
  purgeLegacyPlaceCacheOnce();
  if (isPlaceholderCachedCountry(loc.country) && isPlaceholderCachedCountry(loc.country_en)) {
    return;
  }
  try {
    if (loc.id && isCacheableId(loc.id)) {
      sessionStorage.setItem(KEY_PREFIX + String(loc.id), JSON.stringify(loc));
    }
    if (isCacheableSlug(loc.slug)) {
      sessionStorage.setItem(`${KEY_PREFIX}slug:${loc.slug.trim().toLowerCase()}`, JSON.stringify(loc));
    }
  } catch {
    // quota / private mode
  }
}

/** Mapbox 지명·uiPlace slug (예: tahaa) — 즐겨찾기 복원용 */
export function readCachedPlaceBySlug(slug) {
  purgeLegacyPlaceCacheOnce();
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return null;
  try {
    const raw = sessionStorage.getItem(`${KEY_PREFIX}slug:${normalized}`);
    if (!raw) return null;
    return sanitizeCachedLocation(JSON.parse(raw));
  } catch {
    return null;
  }
}

/**
 * @param {string} placeKey — URL 세그먼트와 동일한 id (예: search-37.88-127.73)
 */
export function readCachedPlaceLocation(placeKey) {
  purgeLegacyPlaceCacheOnce();
  if (!placeKey || typeof placeKey !== 'string') return null;
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + placeKey);
    if (!raw) return null;
    return sanitizeCachedLocation(JSON.parse(raw));
  } catch {
    return null;
  }
}

function coordsClose(a, b, eps = 0.002) {
  return (
    typeof a === 'number' &&
    typeof b === 'number' &&
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) < eps
  );
}

/**
 * 캐시가 URL의 좌표와 일치할 때만 사용 (세션 조작·구버전 캐시 완화)
 */
export function mergeCachedPlaceIfCoordsMatch(targetSlug, parsedLat, parsedLng) {
  const cached = readCachedPlaceLocation(targetSlug);
  if (
    cached &&
    coordsClose(cached.lat, parsedLat) &&
    coordsClose(cached.lng, parsedLng)
  ) {
    return cached;
  }
  return null;
}
