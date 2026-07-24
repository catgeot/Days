import koreaAreaCodes from '../Home/data/koreaAreaCodes.json' with { type: 'json' };

/**
 * TourAPI areaCode ↔ hub — SSOT: koreaAreaCodes.json (overrides → generate).
 * 미채움 시도는 LEGACY 폴백 (이후 배치로 SSOT 이관).
 */

/** @type {string[]} */
export const DEFAULT_HUB_SEEDS =
  Array.isArray(koreaAreaCodes?.defaultHubIds) && koreaAreaCodes.defaultHubIds.length > 0
    ? koreaAreaCodes.defaultHubIds.map((id) => String(id).toLowerCase())
    : ['seoul', 'busan', 'jeju', 'gangneung', 'gyeongju', 'jeonju', 'sokcho', 'yeosu'];

/**
 * S3b 미이관 시도 — SSOT areas에 없는 코드만 사용.
 * @type {Record<string, string[]>}
 */
const LEGACY_HUBS_BY_AREA = {
  8: [],
  35: ['gyeongju', 'andong', 'pohang'],
  36: ['tongyeong', 'jinju', 'geoje', 'namhae'],
  37: ['jeonju', 'gunsan'],
  38: ['yeosu', 'suncheon', 'mokpo', 'damyang'],
};

function ssotHubIds(areaCode) {
  const key = String(areaCode);
  const entry = koreaAreaCodes?.areas?.[key];
  if (Array.isArray(entry?.hubIds) && entry.hubIds.length > 0) {
    return entry.hubIds.map((id) => String(id).toLowerCase());
  }
  return null;
}

export function hubIdsForArea(areaCode) {
  if (areaCode == null || areaCode === '' || areaCode === 'all') {
    return DEFAULT_HUB_SEEDS;
  }
  const fromSsot = ssotHubIds(areaCode);
  if (fromSsot) return fromSsot;

  const key = String(areaCode);
  const legacy = LEGACY_HUBS_BY_AREA[key] || LEGACY_HUBS_BY_AREA[Number(key)];
  return Array.isArray(legacy) && legacy.length > 0 ? legacy : DEFAULT_HUB_SEEDS;
}

/**
 * @param {string} hubId
 * @returns {string | null}
 */
export function areaCodeForHubId(hubId) {
  const key = String(hubId || '').toLowerCase();
  if (!key) return null;

  const fromSsot = koreaAreaCodes?.byHubId?.[key];
  if (fromSsot != null && String(fromSsot).trim() !== '') {
    return String(fromSsot);
  }

  for (const [area, hubs] of Object.entries(LEGACY_HUBS_BY_AREA)) {
    if (!Array.isArray(hubs)) continue;
    if (hubs.some((h) => String(h).toLowerCase() === key)) {
      return String(area);
    }
  }
  return null;
}
