import { scenicSpotMapTitle } from '../Home/lib/scenicSpotPlaceLabel.js';
import { scenicSpotLngLat } from './nearbyScenicRank.js';

const KR_VIEW = {
  longitude: 127.8,
  latitude: 36.2,
  zoom: 5.6,
};

/** hub·경관 리프(대개 ≤20)는 숫자 뭉치 대신 개별 핀으로 윤곽을 보여 줌 */
export const SCENIC_MAP_CLUSTER_MIN_POINTS = 21;
/** 넓은 뷰에서만 약하게 묶음 · 도시 줌(≈11) 전에 개별 핀으로 풀림 */
export const SCENIC_MAP_CLUSTER_RADIUS = 26;
export const SCENIC_MAP_CLUSTER_MAX_ZOOM = 10;

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
  const spanLng = east - west;
  const spanLat = north - south;
  const span = Math.max(spanLng, spanLat);
  const padLng = Math.max(spanLng * 0.22, span < 0.12 ? 0.08 : 0.05);
  const padLat = Math.max(spanLat * 0.22, span < 0.12 ? 0.08 : 0.05);
  /** 좁은 도시 스팬은 과도 줌인 대신 윤곽이 보이도록 maxZoom 완화 */
  const maxZoom = span < 0.08 ? 10.2 : span < 0.18 ? 10.8 : 11.5;
  return {
    west: west - padLng,
    south: south - padLat,
    east: east + padLng,
    north: north + padLat,
    maxZoom,
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
 * @param {{ locale?: string }} [opts]
 */
export function buildScenicMapGeoJson(items, opts = {}) {
  const locale = opts.locale || 'ko';
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
    const title = scenicSpotMapTitle(item, locale);
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
