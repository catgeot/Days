/**
 * 해역 칩 레일 — 뷰포트 교차 해역 우선 · 순서 안정화 · 상한까지 표시.
 */
import coastJson from '../data/travelSpotCoast.json' with { type: 'json' };
import { GLOBE_FACE_CENTER_BY_CATEGORY } from './globeCategoryFocus.js';
import { listChipSeaBasins } from './seaBasinResolve.js';

const coastSpots = coastJson.spots || {};

/** 모바일 해역 칩 레일 — 뷰포트·거리 우선 후 최대 표시 개수 */
export const SEA_BASIN_LIST_MAX_COUNT = 12;

/** @param {string} basinId */
export function getSpotSlugsForSeaBasin(basinId) {
  if (!basinId) return [];
  return Object.entries(coastSpots)
    .filter(([, entry]) => entry.seaPrimary === basinId || (entry.seaIds || []).includes(basinId))
    .map(([slug]) => slug);
}

/**
 * @param {[number, number, number, number] | null | undefined} bbox [W,S,E,N]
 * @param {[number, number, number, number] | null | undefined} view [W,S,E,N]
 */
function bboxIntersectsView(bbox, view) {
  if (!Array.isArray(bbox) || bbox.length !== 4 || !Array.isArray(view) || view.length !== 4) {
    return false;
  }
  const [bw, bs, be, bn] = bbox;
  const [vw, vs, ve, vn] = view;
  return bw <= ve && be >= vw && bs <= vn && bn >= vs;
}

function centerDistanceDeg(basin, lng, lat) {
  const c = basin?.center;
  if (!c || !Number.isFinite(lng) || !Number.isFinite(lat)) return Number.POSITIVE_INFINITY;
  const dLat = (Number(c.lat) || 0) - lat;
  let dLng = Math.abs((Number(c.lng) || 0) - lng);
  if (dLng > 180) dLng = 360 - dLng;
  return Math.hypot(dLat, dLng);
}

function scoreBasin(basin, viewBounds, refLng, refLat) {
  const intersects = bboxIntersectsView(basin.bbox, viewBounds);
  const dist = centerDistanceDeg(basin, refLng, refLat);
  const tierBoost = basin.tier === 1 ? 0 : 12;
  return {
    basin,
    intersects,
    score: (intersects ? 0 : 40) + tierBoost + dist,
  };
}

function sortScoredRows(rows) {
  return [...rows].sort((a, b) => {
    if (a.intersects !== b.intersects) return a.intersects ? -1 : 1;
    if (a.score !== b.score) return a.score - b.score;
    return (b.basin.spotCount || 0) - (a.basin.spotCount || 0);
  });
}

/**
 * 동일 멤버면 이전 순서·참조 유지 — 회전 시 칩 재배치만으로 생기는 혼란 방지.
 * @param {Array<{ id: string }>} previous
 * @param {Array<{ id: string }>} next
 */
export function stabilizeSeaBasinList(previous = [], next = [], { preventShrink = false } = {}) {
  if (!next.length) return next;
  if (!previous.length) return next;

  const nextIds = new Set(next.map((b) => b.id));
  const prevIds = new Set(previous.map((b) => b.id));
  const sameSet = previous.length === next.length && previous.every((b) => nextIds.has(b.id));
  if (sameSet) return previous;

  if (preventShrink && next.length < previous.length) {
    const nextById = new Map(next.map((b) => [b.id, b]));
    const merged = [];
    for (const basin of previous) {
      merged.push(nextById.get(basin.id) || basin);
    }
    for (const basin of next) {
      if (!prevIds.has(basin.id)) merged.push(basin);
    }
    return merged.slice(0, SEA_BASIN_LIST_MAX_COUNT);
  }

  const nextById = new Map(next.map((b) => [b.id, b]));
  const kept = previous
    .filter((b) => nextById.has(b.id))
    .map((b) => nextById.get(b.id));
  const added = next.filter((b) => !prevIds.has(b.id));
  return [...kept, ...added];
}

function unionBbox(a, b) {
  if (!Array.isArray(a) || a.length !== 4) return b;
  if (!Array.isArray(b) || b.length !== 4) return a;
  return [
    Math.min(a[0], b[0]),
    Math.min(a[1], b[1]),
    Math.max(a[2], b[2]),
    Math.max(a[3], b[3]),
  ];
}

function expandBbox(bbox, padRatio = 0.12) {
  if (!Array.isArray(bbox) || bbox.length !== 4) return bbox;
  const [west, south, east, north] = bbox;
  const lngPad = Math.max((east - west) * padRatio, 2);
  const latPad = Math.max((north - south) * padRatio, 2);
  return [west - lngPad, south - latPad, east + lngPad, north + latPad];
}

/** 줌 인 시 뷰포트가 너무 좁아져 해역 칩이 1~2개로 줄지 않도록 최소 스팬 보장 */
export function ensureMinPickBounds(
  bounds,
  { minSpanLng = 28, minSpanLat = 20 } = {},
) {
  if (!Array.isArray(bounds) || bounds.length !== 4) return bounds;
  const [west, south, east, north] = bounds;
  if (![west, south, east, north].every((n) => Number.isFinite(n))) return bounds;

  const centerLng = (west + east) / 2;
  const centerLat = (south + north) / 2;
  const halfLng = Math.max((east - west) / 2, minSpanLng / 2);
  const halfLat = Math.max((north - south) / 2, minSpanLat / 2);
  return [
    centerLng - halfLng,
    centerLat - halfLat,
    centerLng + halfLng,
    centerLat + halfLat,
  ];
}

/**
 * 해역 선택 후 fly로 뷰가 좁아져도 칩·탐색 맥락이 붕괴되지 않도록
 * 상위 해역(parentOcean) bbox를 리스트 pick 범위로 쓴다.
 * @param {string | null | undefined} selectedBasinId
 */
export function resolveSeaBasinListPickBounds(selectedBasinId) {
  if (!selectedBasinId) return null;
  const basin = getSeaBasinById(selectedBasinId);
  if (!basin?.bbox) return null;

  let bounds = [...basin.bbox];
  const parent = basin.parentOcean ? getSeaBasinById(basin.parentOcean) : null;
  if (parent?.bbox) {
    bounds = unionBbox(bounds, parent.bbox);
  } else {
    bounds = expandBbox(bounds);
  }
  return bounds;
}

/**
 * 바다 모드 레일 — 줌·팬마다 뷰포트만으로 칩이 줄어드는 것 방지.
 * @param {{
 *   viewBounds?: [number, number, number, number] | null,
 *   viewCenter?: { lng?: number, lat?: number } | null,
 *   category?: string | null,
 *   selectedBasinId?: string | null,
 *   seaMode?: boolean,
 * }} opts
 */
export function pickSeaBasinsForRail({
  viewBounds = null,
  viewCenter = null,
  category = null,
  selectedBasinId = null,
  seaMode = false,
} = {}) {
  let bounds = viewBounds;
  if (seaMode) {
    if (selectedBasinId) {
      bounds = resolveSeaBasinListPickBounds(selectedBasinId) || bounds;
    } else if (bounds) {
      bounds = ensureMinPickBounds(bounds);
    }
  }
  return pickVisibleSeaBasins({
    viewBounds: bounds,
    viewCenter,
    category,
    minCount: seaMode ? 6 : 3,
  });
}

/**
 * @param {{
 *   viewBounds?: [number, number, number, number] | null,
 *   viewCenter?: { lng?: number, lat?: number } | null,
 *   category?: string | null,
 *   minCount?: number,
 *   maxCount?: number,
 * }} opts
 */
export function pickVisibleSeaBasins({
  viewBounds = null,
  viewCenter = null,
  category = null,
  minCount = 3,
  maxCount = SEA_BASIN_LIST_MAX_COUNT,
} = {}) {
  const candidates = listChipSeaBasins(1);
  if (!candidates.length) return [];

  const faceCenter = category ? GLOBE_FACE_CENTER_BY_CATEGORY[category] : null;
  const refLng = Number.isFinite(viewCenter?.lng) ? viewCenter.lng : faceCenter?.lng;
  const refLat = Number.isFinite(viewCenter?.lat) ? viewCenter.lat : faceCenter?.lat;

  const scored = sortScoredRows(
    candidates.map((basin) => scoreBasin(basin, viewBounds, refLng, refLat)),
  );

  const intersecting = scored.filter((row) => row.intersects).map((row) => row.basin);
  const picked = [...intersecting];
  const pickedIds = new Set(picked.map((b) => b.id));

  if (picked.length < minCount) {
    for (const row of scored) {
      if (picked.length >= minCount) break;
      if (!pickedIds.has(row.basin.id)) {
        picked.push(row.basin);
        pickedIds.add(row.basin.id);
      }
    }
  }

  const cap = Math.max(minCount, Math.min(maxCount, picked.length));
  if (picked.length <= cap) return picked;

  const ranked = sortScoredRows(
    picked.map((basin) => scoreBasin(basin, viewBounds, refLng, refLat)),
  );
  return ranked.slice(0, cap).map((row) => row.basin);
}

/** @param {string} basinId */
export function getSeaBasinById(basinId) {
  return listChipSeaBasins(1).find((b) => b.id === basinId) || null;
}

/**
 * flyToRegion용 region 객체.
 * @param {{ id: string, name: string, center: { lat: number, lng: number }, bbox: number[] }} basin
 */
export function seaBasinToFlyRegion(basin) {
  if (!basin?.center) return null;
  return {
    id: basin.id,
    labelKo: basin.name,
    lat: basin.center.lat,
    lng: basin.center.lng,
    bbox: basin.bbox,
    seaBasinId: basin.id,
  };
}
