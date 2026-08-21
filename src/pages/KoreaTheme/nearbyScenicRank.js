import { scenicSpotMapTitle } from '../Home/lib/scenicSpotPlaceLabel.js';

/** 명승 홈 내 주변 — 축제홈 NEAR_FESTIVAL_KM과 동일 반경(탐색 풀) */
export const NEAR_SCENIC_KM = 80;

/** 적응형 표시 반경 단계(km) — 풀 상한은 NEAR_SCENIC_KM */
export const NEAR_RADIUS_STEPS_KM = Object.freeze([20, 40, 60, 80]);

/** 첫 화면 목록·지도 칩 상한 */
export const NEAR_DISPLAY_SOFT_MAX = 12;

/** 적응형 반경이 넘기지 않으려는 목표 건수 */
export const NEAR_RADIUS_TARGET_MAX = 24;

function toRad(d) {
  return (d * Math.PI) / 180;
}

/**
 * @param {number} lat1
 * @param {number} lng1
 * @param {number} lat2
 * @param {number} lng2
 */
export function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * @param {object | null | undefined} spot
 * @returns {{ lat: number, lng: number } | null}
 */
export function scenicSpotLngLat(spot) {
  const lat = Number(spot?.lat);
  const lng = Number(spot?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < 32 || lat > 44 || lng < 123 || lng > 133) return null;
  return { lat, lng };
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @param {number} maxKm
 */
export function spotsWithinKm(items, lat, lng, maxKm) {
  return (items || []).filter((item) => {
    const pt = scenicSpotLngLat(item);
    if (!pt) return false;
    return haversineKm(lat, lng, pt.lat, pt.lng) <= maxKm;
  });
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @returns {{ item: object, km: number }[]}
 */
export function rankSpotsByDistance(items, lat, lng) {
  return (items || [])
    .map((item) => {
      const pt = scenicSpotLngLat(item);
      const km = pt
        ? haversineKm(lat, lng, pt.lat, pt.lng)
        : Number.POSITIVE_INFINITY;
      return { item, km };
    })
    .sort(
      (a, b) =>
        a.km - b.km ||
        String(a.item?.name || '').localeCompare(
          String(b.item?.name || ''),
          'ko',
        ),
    );
}

/**
 * @param {object[]} items
 * @param {number} lat
 * @param {number} lng
 * @param {number} [maxKm]
 * @returns {{ item: object, km: number }[]}
 */
export function rankNearbyScenicSpots(items, lat, lng, maxKm = NEAR_SCENIC_KM) {
  return rankSpotsByDistance(spotsWithinKm(items, lat, lng, maxKm), lat, lng);
}

/**
 * 80km 풀(거리순)에서 표시 반경 선택 — 목표 건수 이하면 넓히고, 초과면 직전/현재 단계.
 * @param {{ km: number }[]} rankedPool
 * @param {{ targetMax?: number, steps?: readonly number[] }} [opts]
 * @returns {number}
 */
export function pickAdaptiveNearRadiusKm(rankedPool, opts = {}) {
  const targetMax = Math.max(
    1,
    Number(opts.targetMax) || NEAR_RADIUS_TARGET_MAX,
  );
  const steps =
    Array.isArray(opts.steps) && opts.steps.length
      ? opts.steps
      : NEAR_RADIUS_STEPS_KM;
  const list = rankedPool || [];
  let chosen = steps[steps.length - 1] ?? NEAR_SCENIC_KM;
  /** @type {number | null} */
  let prevOk = null;
  for (const r of steps) {
    const radius = Number(r);
    if (!Number.isFinite(radius) || radius <= 0) continue;
    let n = 0;
    for (const row of list) {
      if (Number(row?.km) <= radius) n += 1;
    }
    if (n === 0) {
      chosen = radius;
      continue;
    }
    if (n <= targetMax) {
      prevOk = radius;
      chosen = radius;
      continue;
    }
    return prevOk ?? radius;
  }
  return chosen;
}

/**
 * @param {{ item: object, km: number }[]} rankedPool
 * @param {{ radiusKm?: number, limit?: number }} [opts]
 * @returns {{ item: object, km: number }[]}
 */
export function limitNearbyRanked(rankedPool, opts = {}) {
  const radiusKm = Number(opts.radiusKm);
  const limit = Math.max(0, Number(opts.limit) || NEAR_DISPLAY_SOFT_MAX);
  const maxKm = Number.isFinite(radiusKm) ? radiusKm : NEAR_SCENIC_KM;
  const inRadius = (rankedPool || []).filter(
    (row) => Number(row?.km) <= maxKm,
  );
  return inRadius.slice(0, limit);
}

/**
 * @param {string} title
 */
function shortMapChipTitle(title) {
  const name = String(title || '').trim();
  if (!name) return '';
  return name.length > 10 ? `${name.slice(0, 9)}…` : name;
}

/**
 * 지도용 주변 명소·명승 칩(수량 제한분).
 * @param {{ item: object, km: number }[]} rankedLimited
 * @param {{ locale?: string }} [opts]
 * @returns {{
 *   id: string,
 *   kind: 'spot',
 *   label: string,
 *   labelFull?: string,
 *   count: string,
 *   lng: number,
 *   lat: number,
 *   spotId: string,
 * }[]}
 */
export function nearbySpotMapChips(rankedLimited, opts = {}) {
  const locale = opts.locale || 'ko';
  /** @type {{
   *   id: string,
   *   kind: 'spot',
   *   label: string,
   *   labelFull?: string,
   *   count: string,
   *   lng: number,
   *   lat: number,
   *   spotId: string,
   * }[]} */
  const chips = [];
  for (const row of rankedLimited || []) {
    const spot = row?.item;
    const pt = scenicSpotLngLat(spot);
    if (!pt) continue;
    const spotId = String(spot?.id || '').trim();
    if (!spotId) continue;
    const title = scenicSpotMapTitle(spot, locale) || spotId;
    chips.push({
      id: `spot:${spotId}`,
      kind: 'spot',
      label: shortMapChipTitle(title),
      labelFull: title,
      count: formatDistanceKm(row.km),
      lng: pt.lng,
      lat: pt.lat,
      spotId,
    });
  }
  return chips;
}

/**
 * @param {number} km
 */
export function formatDistanceKm(km) {
  if (!Number.isFinite(km)) return '';
  if (km < 1) return `${Math.max(0.1, Math.round(km * 10) / 10)}km`;
  if (km < 10) return `${(Math.round(km * 10) / 10).toFixed(1)}km`;
  return `${Math.round(km)}km`;
}

/**
 * @param {number} currentKm
 * @param {readonly number[]} [steps]
 * @returns {number | null}
 */
export function nextNearRadiusStepKm(currentKm, steps = NEAR_RADIUS_STEPS_KM) {
  const cur = Number(currentKm);
  if (!Number.isFinite(cur)) return steps[0] ?? null;
  for (const step of steps) {
    if (Number(step) > cur) return Number(step);
  }
  return null;
}
