/**
 * TourAPI areaCode ↔ cityAttractionHubs.hubId SSOT.
 * `npm run generate:korea-area-codes` → koreaAreaCodes.json
 *
 * 금지: gallery `tourapi-content-id-overrides`에 축제·지역 혼용.
 *
 * hub 보강(선정 명소 append) 시: 해당 hubId가 areas.*.hubIds에 없으면
 * 시도(중)·여행지(소) 분류칩에 안 뜸 → 여기 append 후 generate 필수.
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
    2: { name: '인천', hubIds: ['incheon', 'ganghwa'] },
    3: { name: '대전', hubIds: ['daejeon'] },
    4: { name: '대구', hubIds: ['daegu'] },
    5: { name: '광주', hubIds: ['gwangju'] },
    6: { name: '부산', hubIds: ['busan'] },
    7: { name: '울산', hubIds: ['ulsan'] },
    31: {
      name: '경기',
      hubIds: [
        'suwon',
        'gapyeong',
        'ansan',
        'anseong',
        'anyang',
        'bucheon',
        'gimpo',
        'goyang',
        'gunpo',
        'guri',
        'gwangmyeong',
        'hanam',
        'namyangju',
        'paju',
        'pocheon',
        'seongnam',
        'siheung',
        'uiwang',
        'yangpyeong',
        'yongin',
      ],
    },
    32: {
      name: '강원',
      hubIds: [
        'gangneung',
        'sokcho',
        'chuncheon',
        'pyeongchang',
        'yangyang',
        'donghae',
        'samcheok',
      ],
    },
    33: { name: '충북', hubIds: ['cheongju', 'danyang', 'jecheon'] },
    34: { name: '충남', hubIds: ['boryeong', 'gongju', 'taean', 'buyeo'] },
    35: {
      name: '경북',
      hubIds: ['gyeongju', 'andong', 'pohang', 'ulleung'],
    },
    36: {
      name: '경남',
      hubIds: [
        'tongyeong',
        'jinju',
        'geoje',
        'namhae',
        'hadong',
        'hapcheon',
      ],
    },
    37: {
      name: '전북',
      hubIds: [
        'jeonju',
        'gunsan',
        'buan',
        'jeongeup',
        'jinan',
        'namwon',
      ],
    },
    38: {
      name: '전남',
      hubIds: [
        'yeosu',
        'suncheon',
        'mokpo',
        'damyang',
        'boseong',
        'gurye',
        'wando',
      ],
    },
    39: { name: '제주', hubIds: ['jeju', 'seogwipo'] },
  },
};
