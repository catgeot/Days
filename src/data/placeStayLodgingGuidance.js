/**
 * Place pages that ban overnight stays on-site — guidance copy + 숙소 검색 기준 지역(stayBaseArea).
 * @type {Record<string, {
 *   stayBaseArea: { ko: string, en: string, countryKo?: string, countryEn?: string },
 *   linkSlug?: string,
 *   linkLabel_ko?: string,
 *   linkLabel_en?: string,
 *   messageBefore_ko: string,
 *   messageAfter_ko?: string,
 *   messageBefore_en: string,
 *   messageAfter_en?: string,
 * }>}
 */
export const PLACE_STAY_LODGING_GUIDANCE = {
  'similan-islands': {
    stayBaseArea: {
      ko: '카오락',
      en: 'Khao Lak',
      countryKo: '태국',
      countryEn: 'Thailand',
    },
    messageBefore_ko: '시미란 국립공원은 모든 섬에서 숙박이 금지돼 있어요. ',
    linkSlug: 'khao-lak',
    linkLabel_ko: '카오락',
    messageAfter_ko: '에서 묵어요.',
    messageBefore_en: 'All Similan islands ban overnight stays. Stay in ',
    linkLabel_en: 'Khao Lak',
    messageAfter_en: '.',
  },
};

export function getPlaceStayLodgingGuidance(slug) {
  const key = String(slug || '').trim().toLowerCase();
  if (!key) return null;
  return PLACE_STAY_LODGING_GUIDANCE[key] || null;
}

/** @param {string} slug */
export function getPlaceStayBaseArea(slug) {
  const row = getPlaceStayLodgingGuidance(slug);
  return row?.stayBaseArea && typeof row.stayBaseArea === 'object' ? row.stayBaseArea : null;
}
