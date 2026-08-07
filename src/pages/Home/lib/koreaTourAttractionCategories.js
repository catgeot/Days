/**
 * TourAPI contentType 12(관광지) 서비스 분류 — 한국관광공사 cat1/cat2.
 * 대분류(cat1) 아래 중분류(cat2)를 UI 소분류로 씀.
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
 * @returns {TourCatChip[]}
 */
export function listTourAttractionCat2(cat1) {
  const major = normalizeTourAttractionCat1(cat1);
  if (!major) return [];
  return TOUR_ATTRACTION_CAT2_BY_CAT1[major] || [];
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
