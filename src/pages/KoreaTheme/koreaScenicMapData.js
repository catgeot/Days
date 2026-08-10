import { scenicSpotLngLat } from './nearbyScenicRank.js';

const KR_VIEW = {
  longitude: 127.8,
  latitude: 36.2,
  zoom: 5.6,
};

/**
 * 명승 좌표 bbox → 지도 포커스
 * @param {object[]} items
 * @returns {{ west: number, south: number, east: number, north: number, maxZoom?: number } | { lng: number, lat: number, zoom: number } | null}
 */
export function focusViewFromScenicItems(items) {
  /** @type {{ lng: number, lat: number }[]} */
  const pts = [];
  for (const item of items || []) {
    const pt = scenicSpotLngLat(item);
    if (pt) pts.push(pt);
  }
  if (!pts.length) return null;
  if (pts.length === 1) {
    return { lng: pts[0].lng, lat: pts[0].lat, zoom: 10 };
  }
  let west = Infinity;
  let east = -Infinity;
  let south = Infinity;
  let north = -Infinity;
  for (const { lng, lat } of pts) {
    west = Math.min(west, lng);
    east = Math.max(east, lng);
    south = Math.min(south, lat);
    north = Math.max(north, lat);
  }
  const padLng = Math.max((east - west) * 0.18, 0.04);
  const padLat = Math.max((north - south) * 0.18, 0.04);
  return {
    west: west - padLng,
    south: south - padLat,
    east: east + padLng,
    north: north + padLat,
    maxZoom: 11.5,
  };
}

export const KOREA_SCENIC_MAP_OVERVIEW = {
  lng: KR_VIEW.longitude,
  lat: KR_VIEW.latitude,
  zoom: KR_VIEW.zoom,
};

function shortTitle(title) {
  const s = String(title || '').trim();
  if (s.length <= 10) return s;
  return `${s.slice(0, 9)}…`;
}

/**
 * @param {object[]} items
 */
export function buildScenicMapGeoJson(items) {
  /** @type {GeoJSON.Feature[]} */
  const features = [];
  /** @type {Set<string>} */
  const seen = new Set();
  for (const item of items || []) {
    const spotId = String(item?.id || '').trim();
    if (!spotId || seen.has(spotId)) continue;
    const pt = scenicSpotLngLat(item);
    if (!pt) continue;
    seen.add(spotId);
    const title = String(item?.name || item?.title || '');
    features.push({
      type: 'Feature',
      properties: {
        spotId,
        title,
        titleShort: shortTitle(title),
      },
      geometry: {
        type: 'Point',
        coordinates: [pt.lng, pt.lat],
      },
    });
  }
  return { type: 'FeatureCollection', features };
}
