/**
 * 「11월의 여행지」 카드 사진 — 출처·라이선스는 exploreMonthlyPickImageAudit.md 참고.
 */
export const EXPLORE_MONTHLY_PICK_VERIFIED_HERO_URLS = {
  kyoto:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/Tofukuji-maple-autumn-2017-Luka-Peternel.jpg/1280px-Tofukuji-maple-autumn-2017-Luka-Peternel.jpg',
  'chiang-mai':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Yi_Peng_lanterns_in_Chiang_Mai_%2811067469754%29.jpg/1280px-Yi_Peng_lanterns_in_Chiang_Mai_%2811067469754%29.jpg',
  'phu-quoc':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Beautiful_beach_on_Phu_Quoc_island_Vietnam_%2839543775721%29.jpg/1280px-Beautiful_beach_on_Phu_Quoc_island_Vietnam_%2839543775721%29.jpg',
  jeju: 'https://tong.visitkorea.or.kr/cms2/website/26/1921326.jpg',
  dubai:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg',
  melbourne:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flemington_main_stand,_2013_Melbourne_Cup.jpg/1280px-Flemington_main_stand,_2013_Melbourne_Cup.jpg',
};

/** object-position for object-fit:cover — 사진별 주제(단풍·랜턴 등)에 맞춤 */
export const EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION = {
  kyoto: '50% 38%',
  'chiang-mai': '50% 45%',
  'phu-quoc': '50% 55%',
  jeju: '50% 45%',
  dubai: '50% 35%',
  melbourne: '50% 40%',
};

/** 로드 전 메이슨리 wide 분할용(1280px 썸 경로 기준 ffprobe) */
export const EXPLORE_MONTHLY_PICK_HERO_INTRINSIC_SIZE = {
  kyoto: { width: 1280, height: 853 },
  'chiang-mai': { width: 1280, height: 854 },
  'phu-quoc': { width: 1280, height: 853 },
  jeju: { width: 1280, height: 853 },
  dubai: { width: 1280, height: 853 },
  melbourne: { width: 1280, height: 960 },
};
