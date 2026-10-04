const FREE_SEARCH_ID_RE = /^(loc|search|city|label)-/i;

export function isFreeSearchPlaceId(value) {
  return FREE_SEARCH_ID_RE.test(String(value ?? '').trim());
}

/** loc-/search-/city-/label- 은 카탈로그 밖 좌표·검색 핀. 임베드 검색을 하지 않는다. */
export function isFreeSearchLocation(location) {
  if (location == null) return false;
  if (typeof location !== 'object') return isFreeSearchPlaceId(location);
  return [
    location.id,
    location.place_id,
    location.placeId,
    location.slug,
    location.canonical_slug,
  ].some(isFreeSearchPlaceId);
}

/** YouTube 결과 검색어 — 장소 이름과, 이름과 다를 때만 도시. */
export function freeSearchYouTubeQuery(location) {
  const name = String(location?.name || location?.name_en || '').trim();
  const city = String(location?.city || location?.parentCity || '').trim();
  if (!city || city.toLowerCase() === name.toLowerCase()) return name;
  if (!name) return city;
  return `${name} ${city}`;
}

export function freeSearchYouTubeUrl(location) {
  const q = freeSearchYouTubeQuery(location);
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}
