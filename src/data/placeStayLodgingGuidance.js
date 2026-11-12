/** Place pages that ban overnight stays on-site — show lodging guidance instead of MRT search. */
export const PLACE_STAY_LODGING_GUIDANCE = {
  'similan-islands': {
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
