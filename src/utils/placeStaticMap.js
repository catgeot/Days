/**
 * 여행 스케치 — Mapbox Static Images URL 빌더.
 * 좌표(lat/lng) 기반. Wikidata P242·GL 미니맵과 무관.
 */

/** 지역 맥락(대륙·해역) + 핀이 읽히는 기본 줌 */
export const PLACE_STATIC_MAP_ZOOM = 4.75;

export const PLACE_STATIC_MAP_STYLE = 'mapbox/outdoors-v12';

/** CSS 픽셀 기준 (요청은 @2x) — 매거진 풀폭·3:2 */
export const PLACE_STATIC_MAP_SIZE = { width: 1200, height: 800 };

/** 사이트 amber 톤 핀 */
const PIN_COLOR = 'f59e0b';

/**
 * @param {unknown} value
 * @returns {number | null}
 */
export function parseCoord(value) {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {{ lat?: unknown, lng?: unknown, latitude?: unknown, longitude?: unknown } | null | undefined} location
 * @returns {{ lat: number, lng: number } | null}
 */
export function resolvePlaceCoords(location) {
  if (!location) return null;
  const lat = parseCoord(location.lat ?? location.latitude);
  const lng = parseCoord(location.lng ?? location.longitude);
  if (lat == null || lng == null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

/**
 * @param {{ lat: number, lng: number }} coords
 * @param {{
 *   accessToken?: string,
 *   zoom?: number,
 *   width?: number,
 *   height?: number,
 *   style?: string,
 *   retina?: boolean,
 * }} [options]
 * @returns {string | null}
 */
export function buildPlaceStaticMapUrl(coords, options = {}) {
  const token = options.accessToken || import.meta.env.VITE_MAPBOX_TOKEN;
  if (!token || typeof token !== 'string' || !token.trim()) return null;
  if (!coords || !Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return null;

  const zoom = options.zoom ?? PLACE_STATIC_MAP_ZOOM;
  const width = options.width ?? PLACE_STATIC_MAP_SIZE.width;
  const height = options.height ?? PLACE_STATIC_MAP_SIZE.height;
  const style = options.style ?? PLACE_STATIC_MAP_STYLE;
  const retina = options.retina !== false;

  const lon = Number(coords.lng.toFixed(5));
  const lat = Number(coords.lat.toFixed(5));
  const overlay = `pin-l+${PIN_COLOR}(${lon},${lat})`;
  const size = `${width}x${height}${retina ? '@2x' : ''}`;

  // attribution/logo는 UI 캡션(SSOT)으로 표시 — 이미지 내 중복 방지
  const params = new URLSearchParams({
    access_token: token.trim(),
    attribution: 'false',
    logo: 'false',
  });

  return (
    `https://api.mapbox.com/styles/v1/${style}/static/` +
    `${overlay}/${lon},${lat},${zoom},0/${size}?${params.toString()}`
  );
}

/**
 * @param {{ lat?: unknown, lng?: unknown, latitude?: unknown, longitude?: unknown } | null | undefined} location
 * @param {{ accessToken?: string, zoom?: number }} [options]
 * @returns {{ imageUrl: string, lat: number, lng: number } | null}
 */
export function resolvePlaceStaticMap(location, options = {}) {
  const coords = resolvePlaceCoords(location);
  if (!coords) return null;
  const imageUrl = buildPlaceStaticMapUrl(coords, options);
  if (!imageUrl) return null;
  return { imageUrl, lat: coords.lat, lng: coords.lng };
}
