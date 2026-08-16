/**
 * 해역 칩 레일 — 뷰포트·면 근처 tier1–2 해역 3~8개 (Phase 4).
 */
import coastJson from '../data/travelSpotCoast.json' with { type: 'json' };
import { GLOBE_FACE_CENTER_BY_CATEGORY } from './globeCategoryFocus.js';
import { listChipSeaBasins } from './seaBasinResolve.js';

const coastSpots = coastJson.spots || {};

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
  maxCount = 8,
} = {}) {
  const candidates = listChipSeaBasins(2);
  if (!candidates.length) return [];

  const faceCenter = category ? GLOBE_FACE_CENTER_BY_CATEGORY[category] : null;
  const refLng = Number.isFinite(viewCenter?.lng) ? viewCenter.lng : faceCenter?.lng;
  const refLat = Number.isFinite(viewCenter?.lat) ? viewCenter.lat : faceCenter?.lat;

  const scored = candidates.map((basin) => {
    const intersects = bboxIntersectsView(basin.bbox, viewBounds);
    const dist = centerDistanceDeg(basin, refLng, refLat);
    const tierBoost = basin.tier === 1 ? 0 : 12;
    return {
      basin,
      intersects,
      score: (intersects ? 0 : 40) + tierBoost + dist,
    };
  });

  scored.sort((a, b) => {
    if (a.intersects !== b.intersects) return a.intersects ? -1 : 1;
    if (a.score !== b.score) return a.score - b.score;
    return (b.basin.spotCount || 0) - (a.basin.spotCount || 0);
  });

  const cap = Math.max(minCount, Math.min(maxCount, scored.length));
  return scored.slice(0, cap).map((row) => row.basin);
}

/** @param {string} basinId */
export function getSeaBasinById(basinId) {
  return listChipSeaBasins(2).find((b) => b.id === basinId) || null;
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
