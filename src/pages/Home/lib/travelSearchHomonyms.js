const HOMONYM_MIN_KM = 400;

const normalizeKey = (s) =>
  String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');

export function placeDistanceKm(a, b) {
  const lat1 = Number(a?.lat);
  const lng1 = Number(a?.lng);
  const lat2 = Number(b?.lat);
  const lng2 = Number(b?.lng);
  if (![lat1, lng1, lat2, lng2].every(Number.isFinite)) return Infinity;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function isKoreaPlace(item) {
  const blob = `${item?.country || ''} ${item?.country_en || ''} ${item?.place_formatted || ''}`.toLowerCase();
  return /korea|대한민국|한국/.test(blob);
}

/** 히트 표기가 검색어(섬 접미 무시)를 덮는지 — 파포스≠파로스 */
export function hitCoversSearchQuery(hit, query) {
  const q = normalizeKey(query).replace(/섬$/u, '').replace(/islands?$/i, '');
  if (!q) return false;
  const names = [hit?.name, hit?.name_en, hit?.name_ko]
    .map((value) => normalizeKey(value).replace(/섬$/u, '').replace(/islands?$/i, ''))
    .filter((value) => value.length >= 2);
  return names.some((name) => name === q || name.includes(q) || (name.length >= 3 && q.includes(name)));
}

/**
 * Search Box가 비었거나, 한글 쿼리를 해외 지명으로 못 덮으면 Geocoding 보강.
 * 미등록 지명(케팔로니아·시프노스)은 Search Box 공백·한국 POI가 잦다.
 */
export function shouldSupplementGeocodeHits(query, hits) {
  const list = Array.isArray(hits) ? hits : [];
  if (!list.length) return true;
  if (!/[\uAC00-\uD7A3]/.test(String(query || ''))) return false;
  return !list.some((hit) => hitCoversSearchQuery(hit, query) && !isKoreaPlace(hit));
}

/** Mapbox 동명 — 한국 POI·근접 중복 제외, 다른 나라 여행지만 */
export function isDistinctTravelPlace(candidate, anchors, minKm = HOMONYM_MIN_KM) {
  if (!candidate) return false;
  if (isKoreaPlace(candidate)) return false;
  if (candidate.kind === 'poi' || candidate.badge === '명소') return false;
  return (anchors || []).every((anchor) => placeDistanceKm(candidate, anchor) >= minKm);
}

/** 좌표 우선 — 한글명「사바」끼리 카리브/말레이시아를 합치지 않음 */
export function homonymIdentityKey(item) {
  const lat = Number(item?.lat);
  const lng = Number(item?.lng);
  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return `${lat.toFixed(2)},${lng.toFixed(2)}`;
  }
  return `${normalizeKey(item?.name_en || item?.name)}|${normalizeKey(item?.country_en || item?.country)}`;
}

export function relabelHomonymDisplay(item, anchors) {
  if (!item) return item;
  const nameKey = normalizeKey(item.name);
  if (!nameKey) return item;
  const collides = (anchors || []).some((anchor) => normalizeKey(anchor?.name) === nameKey);
  const latin = String(item.name_en || '').trim();
  const latinKey = normalizeKey(latin);
  if (collides && /^[A-Za-z]/.test(latin) && latinKey && latinKey !== nameKey) {
    return { ...item, name: latin };
  }
  return item;
}

/**
 * Mapbox ko가 카리브 Saba를「사바」로 주면 SSOT 사바와 이름 충돌로 카드가 사라짐.
 * 사바섬 Enter는 말레이시아 여행지 뒤 고정 동명으로 유지.
 */
export const CARIBBEAN_SABA_HOMONYM = {
  id: 'homonym-saba-caribbean',
  kind: 'city',
  badge: '장소',
  name: '사바섬',
  name_en: 'Saba',
  country: '네덜란드',
  country_en: 'Caribbean Netherlands',
  lat: 17.635,
  lng: -63.232,
  source: 'homonym',
  uiPlace: true,
  desc: '카리브해 네덜란드령 사바섬입니다. 공식 영문명은 Saba이며, 말레이시아 사바주와는 다른 여행지입니다.',
};

const KNOWN_HOMONYMS_BY_QUERY = new Map([
  ['사바섬', [CARIBBEAN_SABA_HOMONYM]],
  ['sabaisland', [CARIBBEAN_SABA_HOMONYM]],
]);

export function collectKnownTravelHomonyms(query, anchors) {
  const listed = KNOWN_HOMONYMS_BY_QUERY.get(normalizeKey(query)) || [];
  return listed.filter((place) => isDistinctTravelPlace(place, anchors));
}
