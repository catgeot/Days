export const SCENIC_REGION_AREA_CODES = {
  수도권: ['1', '2', '31'],
  강원: ['32'],
  충청: ['3', '8', '33', '34'],
  전라: ['5', '37', '38'],
  경상: ['4', '6', '7', '35', '36'],
  제주: ['39'],
};

export const SCENIC_REGION_ORDER = ['수도권', '강원', '충청', '전라', '경상', '제주'];

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
 * @typedef {{
 *   id: string,
 *   name: string,
 *   blurb: string,
 *   region: string,
 *   hubId: string | null,
 *   attractionName: string,
 *   attractionNameEn: string | null,
 *   placeSlug: string | null,
 *   lat: number | null,
 *   lng: number | null,
 *   contentId: string,
 *   firstImage: string | null,
 *   areaCode: string | null,
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
  const lat = Number(row?.mapy);
  const lng = Number(row?.mapx);
  const addr = [row?.addr1, row?.addr2].filter(Boolean).join(' ').trim();
  return {
    id: contentId,
    name: title,
    blurb: addr || 'TourAPI 관광지',
    region,
    hubId: null,
    attractionName: title,
    attractionNameEn: null,
    placeSlug: null,
    lat: Number.isFinite(lat) ? lat : null,
    lng: Number.isFinite(lng) ? lng : null,
    contentId,
    firstImage: row?.first_image ? String(row.first_image) : null,
    areaCode,
    source: 'db',
  };
}
