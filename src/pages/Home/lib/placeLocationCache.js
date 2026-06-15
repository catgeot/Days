/**
 * /place/search-… · /place/loc-… 처럼 URL만으로는 표시명을 복구할 수 없을 때(외부 페이지 갔다가
 * 뒤로가기로 Home이 다시 마운트되는 경우) sessionStorage에 마지막 장소 객체를 보관합니다.
 */
const KEY_PREFIX = 'gateo_place_loc_v1:';

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

export function cachePlaceLocation(loc) {
  if (!loc) return;
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
  const normalized = String(slug ?? '').trim().toLowerCase();
  if (!normalized) return null;
  try {
    const raw = sessionStorage.getItem(`${KEY_PREFIX}slug:${normalized}`);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string} placeKey — URL 세그먼트와 동일한 id (예: search-37.88-127.73)
 */
export function readCachedPlaceLocation(placeKey) {
  if (!placeKey || typeof placeKey !== 'string') return null;
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + placeKey);
    if (!raw) return null;
    return JSON.parse(raw);
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
