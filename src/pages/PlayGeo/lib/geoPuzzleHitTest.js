import { GLOBE_COUNTRY_CATALOG } from '../../Home/lib/globeCountryCatalog.js';

/**
 * @param {number} lng
 * @param {number} lat
 * @param {[number, number, number, number]} bbox [W,S,E,N]
 */
export function pointInBbox(lng, lat, bbox) {
  if (!Array.isArray(bbox) || bbox.length < 4) return false;
  const [w, s, e, n] = bbox;
  if (!(Number.isFinite(lng) && Number.isFinite(lat))) return false;
  if (e < w) {
    return lat >= s && lat <= n && (lng >= w || lng <= e);
  }
  return lng >= w && lng <= e && lat >= s && lat <= n;
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
 * 드롭 지점 → 카탈로그 id (벡터 ISO 우선 · bbox 폴백)
 * @param {{ map?: import('mapbox-gl').Map | null, point?: { x: number, y: number }, lngLat?: { lng: number, lat: number }, candidateIds: string[] }} args
 */
export function resolveDropCountryId({ map, point, lngLat, candidateIds }) {
  const candidates = (candidateIds || []).filter((id) => GLOBE_COUNTRY_CATALOG[id]);
  if (!candidates.length) return null;

  const isoToId = new Map();
  for (const id of candidates) {
    const iso = String(GLOBE_COUNTRY_CATALOG[id]?.iso || '').toUpperCase();
    if (iso) isoToId.set(iso, id);
  }

  if (map && point && typeof map.queryRenderedFeatures === 'function') {
    try {
      const layerIds = ['gateo-geo-puzzle-hit-fill', 'gateo-geo-puzzle-placed-fill']
        .filter((id) => map.getLayer(id));
      const feats = map.queryRenderedFeatures(
        [point.x, point.y],
        layerIds.length ? { layers: layerIds } : undefined,
      );
      for (const f of feats || []) {
        const iso = isoFromCountryFeature(f);
        if (iso && isoToId.has(iso)) return isoToId.get(iso);
      }
    } catch {
      /* ignore */
    }
  }

  const lng = Number(lngLat?.lng);
  const lat = Number(lngLat?.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;

  let best = null;
  let bestArea = Infinity;
  for (const id of candidates) {
    const bbox = GLOBE_COUNTRY_CATALOG[id]?.bbox;
    if (!pointInBbox(lng, lat, bbox)) continue;
    const [w, s, e, n] = bbox;
    const width = e >= w ? e - w : (180 - w) + (e + 180);
    const area = Math.max(width, 0.01) * Math.max(n - s, 0.01);
    if (area < bestArea) {
      bestArea = area;
      best = id;
    }
  }
  return best;
}
