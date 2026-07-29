import { GLOBE_COUNTRY_CATALOG } from '../../Home/lib/globeCountryCatalog.js';

/**
 * @param {number} lng
 * @param {number} lat
 * @param {[number, number, number, number]} bbox [W,S,E,N]
 * @param {number} [padRatio]
 */
export function pointInBbox(lng, lat, bbox, padRatio = 0) {
  if (!Array.isArray(bbox) || bbox.length < 4) return false;
  const [w0, s0, e0, n0] = bbox;
  if (!(Number.isFinite(lng) && Number.isFinite(lat))) return false;
  const padLng = Math.max((e0 >= w0 ? e0 - w0 : 360 - (w0 - e0)) * padRatio, 0.6);
  const padLat = Math.max((n0 - s0) * padRatio, 0.6);
  const w = w0 - padLng;
  const e = e0 + padLng;
  const s = s0 - padLat;
  const n = n0 + padLat;
  if (e0 < w0 || e < w) {
    return lat >= s && lat <= n && (lng >= w || lng <= e);
  }
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

/** 대략적 각도 거리 (적도 보정) */
export function approxDegDistance(lng1, lat1, lng2, lat2) {
  const dLat = lat1 - lat2;
  let dLng = lng1 - lng2;
  while (dLng > 180) dLng -= 360;
  while (dLng < -180) dLng += 360;
  const cos = Math.cos((lat1 * Math.PI) / 180);
  return Math.hypot(dLat, dLng * Math.max(cos, 0.2));
}

/**
 * @param {string} countryId
 */
export function snapRadiusDegForCountry(countryId) {
  const c = GLOBE_COUNTRY_CATALOG[countryId];
  const bbox = c?.bbox;
  if (!Array.isArray(bbox) || bbox.length < 4) return 4;
  const [w, s, e, n] = bbox;
  const width = e >= w ? e - w : (180 - w) + (e + 180);
  const height = Math.max(n - s, 0.5);
  const diag = Math.hypot(Math.max(width, 0.5), height);
  return Math.min(18, Math.max(2.5, diag * 0.45));
}

/**
 * 화면 픽셀 기준 스냅 반경 (글로브 투영에서 unproject보다 안정)
 * @param {import('mapbox-gl').Map} map
 * @param {string} countryId
 */
export function snapRadiusPxForCountry(map, countryId) {
  const c = GLOBE_COUNTRY_CATALOG[countryId];
  if (!c || !map?.project) return 48;
  const bbox = c.bbox;
  try {
    if (Array.isArray(bbox) && bbox.length >= 4) {
      const [w, s, e, n] = bbox;
      const sw = map.project([w, s]);
      const ne = map.project([e, n]);
      const diag = Math.hypot(ne.x - sw.x, ne.y - sw.y);
      if (Number.isFinite(diag) && diag > 8) {
        return Math.min(140, Math.max(52, diag * 0.65));
      }
    }
    const zoom = map.getZoom?.() || 2;
    return Math.min(120, Math.max(52, 32 + zoom * 14));
  } catch {
    return 48;
  }
}

/**
 * Mapbox Countries 벡터 피처에서 ISO 추출
 * @param {unknown} feature
 */
export function isoFromCountryFeature(feature) {
  const props = feature?.properties || {};
  const raw = props.iso_3166_1 || props.iso_3166_1_alpha_2 || props.ISO_A2 || '';
  const iso = String(raw).toUpperCase().slice(0, 2);
  return /^[A-Z]{2}$/.test(iso) ? iso : '';
}

/**
 * 드래그 중인 피스가 드롭 지점에 맞는지
 * 글로브: 화면 좌표(project) 우선 · lng/lat bbox·중심 폴백
 * @param {{ map?: import('mapbox-gl').Map | null, point?: { x: number, y: number }, lngLat?: { lng: number, lat: number }, targetId: string, candidateIds?: string[] }} args
 */
export function isCorrectPieceDrop({ map, point, lngLat, targetId, candidateIds }) {
  const target = GLOBE_COUNTRY_CATALOG[targetId];
  if (!target) return false;
  const pool = (candidateIds || [targetId]).filter((id) => GLOBE_COUNTRY_CATALOG[id]);
  if (!pool.includes(targetId)) return false;

  if (map?.project && point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
    try {
      const center = map.project([target.lng, target.lat]);
      const distPx = Math.hypot(point.x - center.x, point.y - center.y);
      const radiusPx = snapRadiusPxForCountry(map, targetId);
      if (distPx <= radiusPx) return true;

      const bbox = target.bbox;
      if (Array.isArray(bbox) && bbox.length >= 4) {
        const [w, s, e, n] = bbox;
        const corners = [
          map.project([w, s]),
          map.project([e, s]),
          map.project([w, n]),
          map.project([e, n]),
          map.project([target.lng, s]),
          map.project([target.lng, n]),
          map.project([w, target.lat]),
          map.project([e, target.lat]),
        ];
        const xs = corners.map((p) => p.x);
        const ys = corners.map((p) => p.y);
        const minX = Math.min(...xs) - 12;
        const maxX = Math.max(...xs) + 12;
        const minY = Math.min(...ys) - 12;
        const maxY = Math.max(...ys) + 12;
        if (point.x >= minX && point.x <= maxX && point.y >= minY && point.y <= maxY) {
          return true;
        }
      }
    } catch {
      /* fall through */
    }
  }

  const lng = Number(lngLat?.lng);
  const lat = Number(lngLat?.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return false;

  if (pointInBbox(lng, lat, target.bbox, 0.25)) return true;

  const radius = snapRadiusDegForCountry(targetId);
  return approxDegDistance(lng, lat, target.lng, target.lat) <= radius;
}

/**
 * @deprecated 호환 — 후보 중 드롭 위치 국가
 */
export function resolveDropCountryId({ map, point, lngLat, candidateIds }) {
  const candidates = (candidateIds || []).filter((id) => GLOBE_COUNTRY_CATALOG[id]);
  if (!candidates.length) return null;

  for (const id of candidates) {
    if (isCorrectPieceDrop({ map, point, lngLat, targetId: id, candidateIds: [id] })) {
      return id;
    }
  }
  return null;
}
