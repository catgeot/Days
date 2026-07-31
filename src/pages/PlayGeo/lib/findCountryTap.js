import { GLOBE_COUNTRY_CATALOG, getGlobeCountryById } from '../../Home/lib/globeCountryCatalog.js';
import { isCorrectPieceDrop } from './geoPuzzleHitTest.js';

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
 * @param {{ lng: number, lat: number }} lngLat
 * @param {string[]} candidateIds
 */
export function resolveCountryIdByBbox(lngLat, candidateIds = []) {
  const lng = Number(lngLat?.lng);
  const lat = Number(lngLat?.lat);
  if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
  let bestId = null;
  let bestArea = Infinity;
  for (const id of candidateIds) {
    const c = GLOBE_COUNTRY_CATALOG[id];
    if (!c?.bbox || !pointInBbox(lng, lat, c.bbox)) continue;
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
 * 피스 선택 후 지구본 탭 정답 판정.
 * ISO 벡터 → bbox(후보 중 최소면적) → 픽셀 스냅 순.
 * @param {{
 *   iso?: string,
 *   lngLat?: { lng: number, lat: number },
 *   point?: { x: number, y: number },
 *   map?: import('mapbox-gl').Map | null,
 *   targetId: string,
 *   candidateIds?: string[],
 * }} args
 */
export function isCorrectFindTap({ iso, lngLat, point, map, targetId, candidateIds }) {
  const target = getGlobeCountryById(targetId);
  if (!target) return false;
  const pool = candidateIds?.length ? candidateIds : [targetId];
  const up = String(iso || '').toUpperCase();
  if (up && String(target.iso || '').toUpperCase() === up && !target.iso3166_2) {
    return true;
  }
  if (lngLat && resolveCountryIdByBbox(lngLat, pool) === targetId) {
    return true;
  }
  if (map && point) {
    return isCorrectPieceDrop({
      map,
      point,
      lngLat,
      targetId,
      candidateIds: pool,
    });
  }
  return false;
}

/**
 * 클리어·찾기 성공 직후 지구본에 채울 id 목록.
 * @param {string[]} clearedIds
 * @param {{ phase?: string, countryId?: string | null } | null} session
 * @param {string[]} foundPhases CAPITAL·RESULT 등 찾기 성공 이후 phase
 */
export function resolveGlobeFilledIds(clearedIds = [], session = null, foundPhases = ['capital', 'result']) {
  const ids = new Set((clearedIds || []).map(String).filter(Boolean));
  const phase = session?.phase;
  const countryId = session?.countryId;
  if (countryId && foundPhases.includes(phase)) {
    ids.add(String(countryId));
  }
  return [...ids];
}
