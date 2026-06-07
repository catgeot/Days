/** 카테고리 매칭·카메라 포커스 SSOT (Mapbox·legacy 공통) */

export function spotMatchesCategory(spot, category) {
  if (!category || !spot) return true;
  if (spot.category === category || spot.primaryCategory === category) return true;
  return Array.isArray(spot.categories) && spot.categories.includes(category);
}

/** tier 1(없으면 전체) 인기 가중 중심 — 카테고리 전환 시 부드러운 flyTo */
export function getCategoryFocusView(spots = [], category) {
  if (!category || !spots?.length) return null;

  const inCategory = spots.filter((s) => spotMatchesCategory(s, category));
  if (inCategory.length === 0) return null;

  const tier1 = inCategory.filter((s) => (Number(s.tier) || 3) === 1);
  const pool = tier1.length > 0 ? tier1 : inCategory;

  let weightSum = 0;
  let latSum = 0;
  let lngSum = 0;

  for (const spot of pool) {
    const lat = Number(spot.lat);
    const lng = Number(spot.lng);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    const weight = Math.max(Number(spot.popularity) || 1, 1);
    latSum += lat * weight;
    lngSum += lng * weight;
    weightSum += weight;
  }

  if (weightSum <= 0) return null;

  return {
    lat: latSum / weightSum,
    lng: lngSum / weightSum,
    /** 너무 멀리 있을 때만 살짝 당기는 하한 — 줌 인 상태는 유지 */
    minZoom: 1.85
  };
}
