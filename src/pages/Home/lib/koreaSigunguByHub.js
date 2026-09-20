import data from '../data/koreaSigunguByHub.json';
import { scenicAreaCodeForHubId } from './koreaTourAttractionMap.js';

/**
 * hubId → TourAPI areaCode + sigunguCode (시·군 단위 주변 조회 폴백용).
 * @param {string | null | undefined} hubId
 * @returns {{ areaCode: string, sigunguCode: string | null } | null}
 */
export function resolveTourAreaForHub(hubId) {
  const key = String(hubId || '')
    .trim()
    .toLowerCase();
  if (!key) return null;
  const hit = data?.byHubId?.[key];
  if (hit?.areaCode && hit?.sigunguCode) {
    return {
      areaCode: String(hit.areaCode),
      sigunguCode: String(hit.sigunguCode),
    };
  }
  const areaCode = scenicAreaCodeForHubId(key);
  if (areaCode) {
    return { areaCode: String(areaCode), sigunguCode: null };
  }
  return null;
}
