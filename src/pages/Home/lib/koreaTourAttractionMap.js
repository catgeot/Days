import koreaAreaCodes from '../data/koreaAreaCodes.json' with { type: 'json' };
import { formatTourAttractionLocality } from './koreaTourAttractionLocality.js';

export { formatTourAttractionLocality } from './koreaTourAttractionLocality.js';

export const SCENIC_REGION_AREA_CODES = {
  수도권: ['1', '2', '31'],
  강원: ['32'],
  충청: ['3', '8', '33', '34'],
  전라: ['5', '37', '38'],
  경상: ['4', '6', '7', '35', '36'],
  제주: ['39'],
};

export const SCENIC_REGION_ORDER = ['수도권', '강원', '충청', '전라', '경상', '제주'];

/** koreaAreaCodes에 없는 TourAPI 시도 라벨 */
const AREA_LABEL_FALLBACK = {
  8: '세종',
};

/** @typedef {{ code: string, label: string }} ScenicAreaChip */

const AREA_TO_REGION = (() => {
  /** @type {Record<string, string>} */
  const map = {};
  for (const [region, codes] of Object.entries(SCENIC_REGION_AREA_CODES)) {
    for (const code of codes) map[code] = region;
  }
  return map;
})();

/**
 * @param {string | null | undefined} areaCode
 * @returns {string | null}
 */
export function scenicRegionForAreaCode(areaCode) {
  const code = String(areaCode || '').trim();
  return AREA_TO_REGION[code] || null;
}

/**
 * @param {string | null | undefined} areaCode
 * @returns {string | null}
 */
export function labelScenicAreaCode(areaCode) {
  const code = String(areaCode || '').trim();
  if (!code) return null;
  const fromSsot = koreaAreaCodes?.areas?.[code]?.name;
  if (fromSsot) return String(fromSsot);
  return AREA_LABEL_FALLBACK[code] || null;
}

/**
 * 권역(대분류)에 속한 시도(소분류) 칩 — 상위 권역을 승계.
 * @param {string | null | undefined} region
 * @returns {ScenicAreaChip[]}
 */
export function listScenicRegionAreas(region) {
  const codes = SCENIC_REGION_AREA_CODES[String(region || '').trim()] || [];
  return codes
    .map((code) => {
      const label = labelScenicAreaCode(code);
      return label ? { code, label } : null;
    })
    .filter(Boolean);
}

/**
 * @param {string | null | undefined} region
 * @param {string | null | undefined} areaCode
 * @returns {string | null}
 */
export function normalizeScenicAreaCode(region, areaCode) {
  const code = String(areaCode || '').trim();
  if (!code) return null;
  const codes = SCENIC_REGION_AREA_CODES[String(region || '').trim()] || [];
  return codes.includes(code) ? code : null;
}

/**
 * hubId → TourAPI areaCode (권역 소분류 승계용).
 * @param {string | null | undefined} hubId
 * @returns {string | null}
 */
export function scenicAreaCodeForHubId(hubId) {
  const id = String(hubId || '').trim();
  if (!id) return null;
  const code = koreaAreaCodes?.byHubId?.[id];
  return code != null ? String(code) : null;
}

/**
 * @typedef {{
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   region: string,
 *   locality: string,
 *   hubId: string | null,
 *   attractionName: string,
 *   attractionNameEn: string | null,
 *   placeSlug: string | null,
 *   lat: number | null,
 *   lng: number | null,
 *   contentId: string,
 *   firstImage: string | null,
 *   areaCode: string | null,
 *   areaLabel: string | null,
 *   cat1: string | null,
 *   cat2: string | null,
 *   cat3: string | null,
 *   source: 'db',
 * }} KoreaTourAttractionSpot
 */

/**
 * @param {Record<string, unknown>} row
 * @returns {KoreaTourAttractionSpot | null}
 */
export function mapTourAttractionRow(row) {
  const contentId = String(row?.content_id || '').trim();
  const title = String(row?.title || '').trim();
  if (!contentId || !title) return null;
  const areaCode = row?.area_code != null ? String(row.area_code) : null;
  const region = scenicRegionForAreaCode(areaCode) || '기타';
  const areaLabel = labelScenicAreaCode(areaCode);
  const lat = Number(row?.mapy);
  const lng = Number(row?.mapx);
  const addr1 = row?.addr1 != null ? String(row.addr1) : '';
  const addr2 = row?.addr2 != null ? String(row.addr2) : '';
  const addr = [addr1, addr2].filter(Boolean).join(' ').trim();
  const locality = formatTourAttractionLocality(addr1, addr2);
  const cat1 = row?.cat1 != null ? String(row.cat1).trim() || null : null;
  const cat2 = row?.cat2 != null ? String(row.cat2).trim() || null : null;
  const cat3 = row?.cat3 != null ? String(row.cat3).trim() || null : null;
  return {
    id: contentId,
    name: title,
    blurb: addr || 'TourAPI 관광지',
    region,
    locality,
    addr1: addr1 || null,
    addr2: addr2 || null,
    hubId: null,
    attractionName: title,
    attractionNameEn: null,
    placeSlug: null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    contentId,
    firstImage: row?.first_image ? String(row.first_image) : null,
    areaCode,
    areaLabel,
    cat1,
    cat2,
    cat3,
    source: 'db',
  };
}
