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
    2: { name: '인천', hubIds: ['incheon'] },
    3: { name: '대전', hubIds: ['daejeon'] },
    4: { name: '대구', hubIds: ['daegu'] },
    5: { name: '광주', hubIds: ['gwangju'] },
    6: { name: '부산', hubIds: ['busan'] },
    7: { name: '울산', hubIds: ['ulsan'] },
    31: { name: '경기', hubIds: ['suwon', 'gapyeong'] },
    32: {
      name: '강원',
      hubIds: ['gangneung', 'sokcho', 'chuncheon', 'pyeongchang', 'yangyang'],
    },
    33: { name: '충북', hubIds: ['cheongju'] },
    34: { name: '충남', hubIds: ['boryeong', 'gongju', 'taean'] },
    35: { name: '경북', hubIds: ['gyeongju', 'andong', 'pohang'] },
    36: { name: '경남', hubIds: ['tongyeong', 'jinju', 'geoje', 'namhae'] },
    39: { name: '제주', hubIds: ['jeju'] },
  },
};
