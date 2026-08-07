/**
 * TourAPI contentType 12(관광지) 서비스 분류 — 한국관광공사 cat1/cat2/cat3.
 * UI: 대분류(cat1) → 중분류(cat2) → 소분류(cat3).
 */

/** @typedef {{ code: string, label: string }} TourCatChip */

/** @type {TourCatChip[]} */
export const TOUR_ATTRACTION_CAT1 = [
  { code: 'A01', label: '자연' },
  { code: 'A02', label: '인문' },
];

/** @type {Record<string, TourCatChip[]>} */
export const TOUR_ATTRACTION_CAT2_BY_CAT1 = {
  A01: [
    { code: 'A0101', label: '자연관광지' },
    { code: 'A0102', label: '관광자원' },
  ],
  A02: [
    { code: 'A0201', label: '역사관광지' },
    { code: 'A0202', label: '휴양관광지' },
    { code: 'A0203', label: '체험관광지' },
    { code: 'A0204', label: '산업관광지' },
    { code: 'A0205', label: '건축·조형물' },
  ],
};

/** @type {Record<string, TourCatChip[]>} */
export const TOUR_ATTRACTION_CAT3_BY_CAT2 = {
  A0101: [
    { code: 'A01010100', label: '국립공원' },
    { code: 'A01010200', label: '도립공원' },
    { code: 'A01010300', label: '군립공원' },
    { code: 'A01010400', label: '산' },
    { code: 'A01010500', label: '자연생태관광지' },
    { code: 'A01010600', label: '자연휴양림' },
    { code: 'A01010700', label: '수목원' },
    { code: 'A01010800', label: '폭포' },
    { code: 'A01010900', label: '계곡' },
    { code: 'A01011000', label: '약수터' },
    { code: 'A01011100', label: '해안절경' },
    { code: 'A01011200', label: '해수욕장' },
    { code: 'A01011300', label: '섬' },
    { code: 'A01011400', label: '항구·포구' },
    { code: 'A01011600', label: '등대' },
    { code: 'A01011700', label: '호수' },
    { code: 'A01011800', label: '강' },
    { code: 'A01011900', label: '동굴' },
  ],
  A0102: [
    { code: 'A01020100', label: '희귀동·식물' },
    { code: 'A01020200', label: '기암괴석' },
  ],
  A0201: [
    { code: 'A02010100', label: '고궁' },
    { code: 'A02010200', label: '성' },
    { code: 'A02010300', label: '문' },
    { code: 'A02010400', label: '고택' },
    { code: 'A02010500', label: '생가' },
    { code: 'A02010600', label: '민속마을' },
    { code: 'A02010700', label: '유적지·사적지' },
    { code: 'A02010800', label: '사찰' },
    { code: 'A02010900', label: '종교성지' },
    { code: 'A02011000', label: '안보관광' },
  ],
  A0202: [
    { code: 'A02020200', label: '관광단지' },
    { code: 'A02020300', label: '온천·스파' },
    { code: 'A02020400', label: '이색찜질방' },
    { code: 'A02020500', label: '헬스투어' },
    { code: 'A02020600', label: '테마공원' },
    { code: 'A02020700', label: '공원' },
    { code: 'A02020800', label: '유람선·잠수함' },
  ],
  A0203: [
    { code: 'A02030100', label: '농산어촌 체험' },
    { code: 'A02030200', label: '전통체험' },
    { code: 'A02030300', label: '산사체험' },
    { code: 'A02030400', label: '이색체험' },
    { code: 'A02030600', label: '이색거리' },
  ],
  A0204: [
    { code: 'A02040400', label: '발전소' },
    { code: 'A02040600', label: '식음료' },
    { code: 'A02040800', label: '기타' },
    { code: 'A02040900', label: '전자·반도체' },
    { code: 'A02041000', label: '자동차' },
  ],
  A0205: [
    { code: 'A02050100', label: '다리·대교' },
    { code: 'A02050200', label: '기념탑·전망대' },
    { code: 'A02050300', label: '분수' },
    { code: 'A02050400', label: '동상' },
    { code: 'A02050500', label: '터널' },
    { code: 'A02050600', label: '유명건물' },
  ],
};

const CAT1_CODES = new Set(TOUR_ATTRACTION_CAT1.map((c) => c.code));

/**
 * @param {string | null | undefined} cat1
 * @returns {string | null}
 */
export function normalizeTourAttractionCat1(cat1) {
  const code = String(cat1 || '').trim().toUpperCase();
  return CAT1_CODES.has(code) ? code : null;
}

/**
 * @param {string | null | undefined} cat1
 * @param {string | null | undefined} cat2
 * @returns {string | null}
 */
export function normalizeTourAttractionCat2(cat1, cat2) {
  const major = normalizeTourAttractionCat1(cat1);
  if (!major) return null;
  const code = String(cat2 || '').trim().toUpperCase();
  const subs = TOUR_ATTRACTION_CAT2_BY_CAT1[major] || [];
  return subs.some((c) => c.code === code) ? code : null;
}

/**
 * @param {string | null | undefined} cat1
 * @param {string | null | undefined} cat2
 * @param {string | null | undefined} cat3
 * @returns {string | null}
 */
export function normalizeTourAttractionCat3(cat1, cat2, cat3) {
  const mid = normalizeTourAttractionCat2(cat1, cat2);
  if (!mid) return null;
  const code = String(cat3 || '').trim().toUpperCase();
  const subs = TOUR_ATTRACTION_CAT3_BY_CAT2[mid] || [];
  return subs.some((c) => c.code === code) ? code : null;
}

/**
 * @param {string | null | undefined} cat1
 * @returns {TourCatChip[]}
 */
export function listTourAttractionCat2(cat1) {
  const major = normalizeTourAttractionCat1(cat1);
  if (!major) return [];
  return TOUR_ATTRACTION_CAT2_BY_CAT1[major] || [];
}

/**
 * @param {string | null | undefined} cat1
 * @param {string | null | undefined} cat2
 * @returns {TourCatChip[]}
 */
export function listTourAttractionCat3(cat1, cat2) {
  const mid = normalizeTourAttractionCat2(cat1, cat2);
  if (!mid) return [];
  return TOUR_ATTRACTION_CAT3_BY_CAT2[mid] || [];
}

/**
 * @param {string | null | undefined} cat1
 * @returns {string | null}
 */
export function labelTourAttractionCat1(cat1) {
  const code = normalizeTourAttractionCat1(cat1);
  if (!code) return null;
  return TOUR_ATTRACTION_CAT1.find((c) => c.code === code)?.label || null;
}

/**
 * @param {string | null | undefined} cat1
 * @param {string | null | undefined} cat2
 * @returns {string | null}
 */
export function labelTourAttractionCat2(cat1, cat2) {
  const code = normalizeTourAttractionCat2(cat1, cat2);
  if (!code) return null;
  const major = normalizeTourAttractionCat1(cat1);
  return (TOUR_ATTRACTION_CAT2_BY_CAT1[major] || []).find((c) => c.code === code)?.label || null;
}

/**
 * @param {string | null | undefined} cat1
 * @param {string | null | undefined} cat2
 * @param {string | null | undefined} cat3
 * @returns {string | null}
 */
export function labelTourAttractionCat3(cat1, cat2, cat3) {
  const code = normalizeTourAttractionCat3(cat1, cat2, cat3);
  if (!code) return null;
  const mid = normalizeTourAttractionCat2(cat1, cat2);
  return (TOUR_ATTRACTION_CAT3_BY_CAT2[mid] || []).find((c) => c.code === code)?.label || null;
}
