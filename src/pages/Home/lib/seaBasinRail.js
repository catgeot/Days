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
export function stabilizeSeaBasinList(previous = [], next = []) {
  if (!next.length) return next;
  if (!previous.length) return next;

  const nextIds = new Set(next.map((b) => b.id));
  const prevIds = new Set(previous.map((b) => b.id));
  const sameSet = previous.length === next.length && previous.every((b) => nextIds.has(b.id));
  if (sameSet) return previous;

  const nextById = new Map(next.map((b) => [b.id, b]));
  const kept = previous
    .filter((b) => nextById.has(b.id))
    .map((b) => nextById.get(b.id));
  const added = next.filter((b) => !prevIds.has(b.id));
  return [...kept, ...added];
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
