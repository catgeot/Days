import scenicJson from '../data/koreaScenicSpots.json' with { type: 'json' };
import { resolveCityAttractionHub } from './cityAttractionHubs.js';
import {
  hubMatchesScenicCluster,
  listScenicClusterDefs,
  resolveScenicClusterAreaCode,
} from './koreaScenicClusters.js';
import {
  scenicAreaCodeForHubId,
  SCENIC_REGION_ORDER,
} from './koreaTourAttractionMap.js';

/**
 * @typedef {{
 *   order: number,
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   region: string,
 *   hubId: string,
 *   attractionName: string,
 *   attractionNameEn: string,
 *   placeSlug: string,
 *   lat: number,
 *   lng: number,
 *   contentId: string | null,
 *   imageUrl: string | null,
 * }} KoreaScenicSpot
 */

/** @typedef {{ hubId: string, label: string, count: number }} KoreaScenicHubChip */
/** @typedef {{ id: string, label: string, count: number }} KoreaScenicClusterChip */

const REGION_ORDER = SCENIC_REGION_ORDER;

/** @returns {KoreaScenicSpot[]} */
export function listKoreaScenicSpots(region = null) {
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  const sorted = list.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (!region || region === '전체') return sorted;
  return sorted.filter((s) => s.region === region);
}

/** @returns {string[]} */
export function listKoreaScenicRegions() {
  const list = Array.isArray(scenicJson?.spots) ? scenicJson.spots : [];
  const present = new Set(list.map((s) => s.region).filter(Boolean));
  return REGION_ORDER.filter((r) => present.has(r));
}

/** @returns {string} */
export function koreaScenicSpotsDisclaimer() {
  return (
    scenicJson?.meta?.disclaimer ||
    '많이 찾는 인기 관광지를 골랐습니다.'
  );
}

/**
 * 명소 권역(대분류) 칩 건수.
 * @returns {Record<string, number>}
 */
export function countKoreaScenicSpotsByRegion() {
  /** @type {Record<string, number>} */
  const out = {};
  for (const r of REGION_ORDER) out[r] = 0;
  for (const s of Array.isArray(scenicJson?.spots) ? scenicJson.spots : []) {
    if (out[s.region] != null) out[s.region] += 1;
  }
  return out;
}

/**
 * 명소 시도(중분류) 칩 건수 — 현재 권역 안.
 * @param {string | null | undefined} region
 * @returns {Record<string, number>}
 */
export function countKoreaScenicSpotsByTourArea(region) {
  const spots = listKoreaScenicSpots(region);
  /** @type {Record<string, number>} */
  const out = {};
  for (const s of spots) {
    const code = scenicAreaCodeForHubId(s.hubId);
    if (!code) continue;
    out[code] = (out[code] || 0) + 1;
  }
  return out;
}

/**
 * 명소 세권 칩 — 시도(또는 단일 시도 권역) 안.
 * @param {string | null | undefined} region
 * @param {string | null | undefined} areaCode
 * @returns {KoreaScenicClusterChip[]}
 */
export function listKoreaScenicClusterChips(region, areaCode = null) {
  const clusterArea = resolveScenicClusterAreaCode(region, areaCode);
  const defs = listScenicClusterDefs(clusterArea);
  if (!defs.length) return [];
  const spots = listKoreaScenicSpots(region).filter((s) => {
    if (!clusterArea) return true;
    return scenicAreaCodeForHubId(s.hubId) === clusterArea;
  });
  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const s of spots) {
    const hubId = String(s.hubId || '')
      .trim()
      .toLowerCase();
    if (!hubId) continue;
    for (const def of defs) {
      if (def.hubIds.includes(hubId)) {
        counts.set(def.id, (counts.get(def.id) || 0) + 1);
        break;
      }
    }
  }
  return defs
    .map((def) => ({
      id: def.id,
      label: def.label,
      count: counts.get(def.id) || 0,
    }))
    .filter((c) => c.count > 0);
}

/**
 * 명소 여행지(소분류) 칩 — 권역·시도·세권 안 hub.
 * @param {string | null | undefined} region
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} clusterId
 * @returns {KoreaScenicHubChip[]}
 */
export function listKoreaScenicHubChips(
  region,
  areaCode = null,
  clusterId = null,
) {
  const area = String(areaCode || '').trim();
  const cluster = String(clusterId || '').trim();
  const clusterArea = cluster
    ? resolveScenicClusterAreaCode(region, area || null)
    : area;
  const spots = listKoreaScenicSpots(region).filter((s) => {
    if (cluster) {
      return hubMatchesScenicCluster(s.hubId, clusterArea, cluster);
    }
    if (!area) return true;
    return scenicAreaCodeForHubId(s.hubId) === area;
  });
  /** @type {Map<string, KoreaScenicHubChip>} */
  const byHub = new Map();
  for (const s of spots) {
    const hubId = String(s.hubId || '')
      .trim()
      .toLowerCase();
    if (!hubId) continue;
    const prev = byHub.get(hubId);
    if (prev) {
      prev.count += 1;
      continue;
    }
    const hub = resolveCityAttractionHub(hubId);
    byHub.set(hubId, {
      hubId,
      label: String(hub?.name || s.hubId || hubId).trim(),
      count: 1,
    });
  }
  return [...byHub.values()].sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label, 'ko');
  });
}
