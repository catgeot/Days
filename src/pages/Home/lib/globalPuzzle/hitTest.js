import { GLOBE_COUNTRY_CATALOG, getGlobeCountryById } from '../globeCountryCatalog.js';
import {
  REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID,
  setupRegionHighlightLayers,
} from '../globeRegionHighlight.js';

export const PUZZLE_HIT_LAYER_ID = 'gateo-puzzle-hit-fill';

/**
 * @param {unknown} feature
 */
export function isoFromCountryFeature(feature) {
  const props = feature?.properties || {};
  const raw = props.iso_3166_1 || props.iso_3166_1_alpha_2 || props.ISO_A2 || '';
  const iso = String(raw).toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
  return /^[A-Z]{2}$/.test(iso) ? iso : '';
}

/** ISO → catalog id (구성국 제외 · 본토 id 우선) */
export function resolveCountryIdFromIso(iso) {
  const up = String(iso || '').toUpperCase();
  if (!/^[A-Z]{2}$/.test(up)) return null;
  const matches = Object.values(GLOBE_COUNTRY_CATALOG).filter(
    (c) => c.iso === up && !c.iso3166_2,
  );
  if (matches.length === 0) {
    const any = Object.values(GLOBE_COUNTRY_CATALOG).find((c) => c.iso === up);
    return any?.id || null;
  }
  if (matches.length === 1) return matches[0].id;
  const direct = matches.find((c) => c.id === up.toLowerCase());
  return direct?.id || matches[0].id;
}

/**
 * @param {number} lng
 * @param {number} lat
 * @param {[number, number, number, number]} bbox
 * @param {number} [padRatio]
 */
export function pointInBbox(lng, lat, bbox, padRatio = 0.08) {
  if (!Array.isArray(bbox) || bbox.length < 4) return false;
  const [w0, s0, e0, n0] = bbox;
  if (!(Number.isFinite(lng) && Number.isFinite(lat))) return false;
  const width = e0 >= w0 ? e0 - w0 : 360 - (w0 - e0);
  const padLng = Math.max(width * padRatio, 0.35);
  const padLat = Math.max((n0 - s0) * padRatio, 0.35);
  const w = w0 - padLng;
  const e = e0 + padLng;
  const s = s0 - padLat;
  const n = n0 + padLat;
  if (e0 < w0 || e < w) {
    return lat >= s && lat <= n && (lng >= w || lng <= e);
  }
  return lng >= w && lng <= e && lat >= s && lat <= n;
}

/**
 * @param {import('mapbox-gl').Map} map
 */
export function ensurePuzzleHitLayer(map) {
  if (!map?.getStyle?.() || !map.isStyleLoaded?.()) return false;
  setupRegionHighlightLayers(map);
  if (map.getLayer(PUZZLE_HIT_LAYER_ID)) return true;
  if (!map.getSource(REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID)) return false;
  try {
    map.addLayer({
      id: PUZZLE_HIT_LAYER_ID,
      type: 'fill',
      source: REGION_HIGHLIGHT_COUNTRIES_SOURCE_ID,
      'source-layer': 'country_boundaries',
      minzoom: 0,
      maxzoom: 22,
      filter: [
        'all',
        ['==', ['get', 'disputed'], 'false'],
        [
          'any',
          ['!', ['has', 'worldview']],
          ['==', ['get', 'worldview'], 'all'],
          ['in', 'US', ['to-string', ['get', 'worldview']]],
        ],
      ],
      layout: { visibility: 'visible' },
      paint: {
        'fill-color': '#000000',
        'fill-opacity': 0.01,
      },
    });
    return Boolean(map.getLayer(PUZZLE_HIT_LAYER_ID));
  } catch {
    return false;
  }
}

/**
 * @param {import('mapbox-gl').Map} map
 * @param {{ x: number, y: number }} point
 */
export function queryIsoAtPoint(map, point) {
  if (!map || !point) return '';
  ensurePuzzleHitLayer(map);
  try {
    const layers = [PUZZLE_HIT_LAYER_ID].filter((id) => map.getLayer(id));
    if (layers.length === 0) return '';
    const features = map.queryRenderedFeatures(point, { layers });
    for (const feature of features || []) {
      const iso = isoFromCountryFeature(feature);
      if (iso) return iso;
    }
  } catch {
    // ignore
  }
  return '';
}

/**
 * @param {{ lng: number, lat: number }} lngLat
 * @param {string[]} [candidateIds]
 */
export function resolveCountryIdByBbox(lngLat, candidateIds = []) {
  const lng = Number(lngLat?.lng);
  const lat = Number(lngLat?.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  const pool = (candidateIds?.length
    ? candidateIds
    : Object.keys(GLOBE_COUNTRY_CATALOG)
  ).filter((id) => GLOBE_COUNTRY_CATALOG[id]);

  let bestId = null;
  let bestArea = Infinity;
  for (const id of pool) {
    const c = GLOBE_COUNTRY_CATALOG[id];
    if (!pointInBbox(lng, lat, c.bbox)) continue;
    const [w, s, e, n] = c.bbox;
    const width = e >= w ? e - w : 360 - (w - e);
    const area = Math.max(width, 0.01) * Math.max(n - s, 0.01);
    if (area < bestArea) {
      bestArea = area;
      bestId = id;
    }
  }
  return bestId;
}

/**
 * @param {{
 *   map?: import('mapbox-gl').Map | null,
 *   point?: { x: number, y: number },
 *   lngLat?: { lng: number, lat: number },
 *   targetId: string,
 *   candidateIds?: string[],
 * }} args
 */
export function isCorrectCountryTap({ map, point, lngLat, targetId, candidateIds }) {
  const target = getGlobeCountryById(targetId);
  if (!target) return false;

  let tappedId = null;
  if (map && point) {
    const iso = queryIsoAtPoint(map, point);
    if (iso) {
      if (String(target.iso || '').toUpperCase() === iso && !target.iso3166_2) {
        return true;
      }
      tappedId = resolveCountryIdFromIso(iso);
      if (tappedId === targetId) return true;
    }
  }

  if (lngLat) {
    const byBbox = resolveCountryIdByBbox(lngLat, candidateIds?.length ? candidateIds : [targetId]);
    if (byBbox === targetId) return true;
    if (!tappedId && byBbox) tappedId = byBbox;
  }

  return tappedId === targetId;
}
