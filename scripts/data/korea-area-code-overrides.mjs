/**
 * TourAPI areaCode ↔ cityAttractionHubs.hubId SSOT.
 * `npm run generate:korea-area-codes` → koreaAreaCodes.json
 *
 * 금지: gallery `tourapi-content-id-overrides`에 축제·지역 혼용.
 *
 * G0 시드: 서울(1)·부산(6)·제주(39). 이후 시도 배치로 areas append.
 *
 * @type {{
 *   defaultHubIds: string[],
 *   areas: Record<string, { name: string, hubIds: string[] }>,
 * }}
 */
export const KOREA_AREA_CODE_OVERRIDES = {
  defaultHubIds: [
    'seoul',
    'busan',
    'jeju',
    'gangneung',
    'gyeongju',
    'jeonju',
    'sokcho',
    'yeosu',
  ],
  areas: {
    1: { name: '서울', hubIds: ['seoul'] },
    6: { name: '부산', hubIds: ['busan'] },
    39: { name: '제주', hubIds: ['jeju'] },
  },
};
