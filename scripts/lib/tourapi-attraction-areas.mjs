/** TourAPI areaBasedList2 시도 코드 — sync·smoke 공유 */

export const TOURAPI_AREA_CODES = [
  ['1', '서울'],
  ['2', '인천'],
  ['3', '대전'],
  ['4', '대구'],
  ['5', '광주'],
  ['6', '부산'],
  ['7', '울산'],
  ['8', '세종'],
  ['31', '경기'],
  ['32', '강원'],
  ['33', '충북'],
  ['34', '충남'],
  ['35', '경북'],
  ['36', '경남'],
  ['37', '전북'],
  ['38', '전남'],
  ['39', '제주'],
];

/** 테마 scenic 권역 칩 ↔ area_code */
export const SCENIC_REGION_AREA_CODES = {
  수도권: ['1', '2', '31'],
  강원: ['32'],
  충청: ['3', '8', '33', '34'],
  전라: ['5', '37', '38'],
  경상: ['4', '6', '7', '35', '36'],
  제주: ['39'],
};

export const SCENIC_REGION_ORDER = ['수도권', '강원', '충청', '전라', '경상', '제주'];

export function scenicRegionForAreaCode(areaCode) {
  const code = String(areaCode || '').trim();
  if (!code) return null;
  for (const [region, codes] of Object.entries(SCENIC_REGION_AREA_CODES)) {
    if (codes.includes(code)) return region;
  }
  return null;
}
