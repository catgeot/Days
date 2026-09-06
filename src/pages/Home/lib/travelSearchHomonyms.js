const HOMONYM_MIN_KM = 400;

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

function isKoreaPlace(item) {
  const blob = `${item?.country || ''} ${item?.country_en || ''}`.toLowerCase();
  return /korea|대한민국|한국/.test(blob);
}

/** Mapbox 동명 — 한국 POI·근접 중복 제외, 다른 나라 여행지만 */
export function isDistinctTravelPlace(candidate, anchors, minKm = HOMONYM_MIN_KM) {
  if (!candidate) return false;
  if (isKoreaPlace(candidate)) return false;
  if (candidate.kind === 'poi' || candidate.badge === '명소') return false;
  return (anchors || []).every((anchor) => placeDistanceKm(candidate, anchor) >= minKm);
}
