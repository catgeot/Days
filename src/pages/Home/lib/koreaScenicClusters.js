import clustersJson from '../data/koreaScenicClusters.json' with { type: 'json' };
import {
  listScenicRegionAreas,
  scenicAreaCodeForHubId,
} from './koreaTourAttractionMap.js';

/**
 * @typedef {{ id: string, label: string, hubIds: string[] }} ScenicClusterDef
 * @typedef {{ id: string, label: string, count: number }} ScenicClusterChip
 */

/**
 * @param {string | null | undefined} areaCode
 * @returns {ScenicClusterDef[]}
 */
export function listScenicClusterDefs(areaCode) {
  const code = String(areaCode || '').trim();
  if (!code) return [];
  const list = clustersJson?.areas?.[code]?.clusters;
  return Array.isArray(list) ? list : [];
}

/**
 * @param {string | null | undefined} areaCode
 * @returns {boolean}
 */
export function areaHasScenicClusters(areaCode) {
  return listScenicClusterDefs(areaCode).length >= 2;
}

/**
 * 시도 중분류가 1개뿐인 권역(강원·제주 등)에서 세권용 areaCode.
 * @param {string | null | undefined} region
 * @param {string | null | undefined} areaCode
 * @returns {string | null}
 */
export function resolveScenicClusterAreaCode(region, areaCode) {
  const direct = String(areaCode || '').trim();
  if (direct && areaHasScenicClusters(direct)) return direct;
  const areas = listScenicRegionAreas(region);
  if (areas.length === 1 && areaHasScenicClusters(areas[0].code)) {
    return areas[0].code;
  }
  if (direct) return direct || null;
  return null;
}

/**
 * @param {string | null | undefined} hubId
 * @returns {string | null}
 */
export function scenicClusterIdForHubId(hubId) {
  const key = String(hubId || '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  const ref = clustersJson?.byHubId?.[key];
  return ref?.clusterId ? String(ref.clusterId) : null;
}

/**
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} clusterId
 * @returns {string | null}
 */
export function normalizeScenicClusterId(areaCode, clusterId) {
  const id = String(clusterId || '').trim();
  if (!id) return null;
  const hit = listScenicClusterDefs(areaCode).find((c) => c.id === id);
  return hit ? hit.id : null;
}

/**
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} clusterId
 * @returns {string | null}
 */
export function labelScenicClusterId(areaCode, clusterId) {
  const id = normalizeScenicClusterId(areaCode, clusterId);
  if (!id) return null;
  return listScenicClusterDefs(areaCode).find((c) => c.id === id)?.label || null;
}

/**
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} clusterId
 * @returns {Set<string>}
 */
export function scenicClusterHubIdSet(areaCode, clusterId) {
  const id = normalizeScenicClusterId(areaCode, clusterId);
  if (!id) return new Set();
  const def = listScenicClusterDefs(areaCode).find((c) => c.id === id);
  return new Set((def?.hubIds || []).map((h) => String(h).toLowerCase()));
}

/**
 * hub가 현재 시도·세권 필터에 속하는지.
 * @param {string | null | undefined} hubId
 * @param {string | null | undefined} areaCode
 * @param {string | null | undefined} clusterId
 */
export function hubMatchesScenicCluster(hubId, areaCode, clusterId) {
  const key = String(hubId || '')
    .trim()
    .toLowerCase();
  if (!key) return false;
  if (areaCode && scenicAreaCodeForHubId(key) !== String(areaCode)) {
    return false;
  }
  if (!clusterId) return true;
  return scenicClusterHubIdSet(areaCode, clusterId).has(key);
}
