/** 지구본 flyTo·클릭 — 경도 래핑·마커 스크린 히트 */

export function normalizeLngNear(fromLng, toLng) {
  if (typeof fromLng !== 'number' || typeof toLng !== 'number') return toLng;
  let lng = toLng;
  while (lng - fromLng > 180) lng -= 360;
  while (lng - fromLng < -180) lng += 360;
  return lng;
}

export function getMarkerDisplayCoords(marker) {
  if (!marker) return null;
  const lat = Number(marker.lat);
  const lng = Number(marker.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return {
    lat: lat + (Number(marker._offsetLat) || 0),
    lng: lng + (Number(marker._offsetLng) || 0)
  };
}

/**
 * Mapbox map.project 와 event.point 동일 좌표계.
 * 마커 DOM 위 클릭인데 지도 lngLat 가 반대편으로 잡히는 경우 차단.
 */
export function findMarkerAtScreenPoint(map, point, markers, thresholdPx = 30) {
  if (!map || !point || !Array.isArray(markers) || markers.length === 0) return null;

  let best = null;
  let bestDist = thresholdPx;

  for (const marker of markers) {
    const coords = getMarkerDisplayCoords(marker);
    if (!coords) continue;
    try {
      const projected = map.project([coords.lng, coords.lat]);
      const dist = Math.hypot(projected.x - point.x, projected.y - point.y);
      if (dist <= bestDist) {
        best = marker;
        bestDist = dist;
      }
    } catch {
      // ignore projection failures during style transitions
    }
  }

  return best;
}
