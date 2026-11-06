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

/**
 * 카드 출처 링크 아래 표시 — Wikimedia는 파일 페이지·라이선스명, VisitKorea는 매체 고지 링크.
 * @type {Record<string, { ko: string, en: string, filePageUrl: string }>}
 */
export const EXPLORE_MONTHLY_PICK_PHOTO_CREDIT = {
  kyoto: {
    ko: '저작 Luka Peternel (Path-x21) · CC BY-SA 4.0',
    en: 'By Luka Peternel (Path-x21) · CC BY-SA 4.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Tofukuji-maple-autumn-2017-Luka-Peternel.jpg',
  },
  'chiang-mai': {
    ko: '저작 Nik Cyclist (Flickr) · CC BY 2.0',
    en: 'By Nik Cyclist (Flickr) · CC BY 2.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Yi_Peng_lanterns_in_Chiang_Mai_%2811067469754%29.jpg',
  },
  'phu-quoc': {
    ko: '저작 dronepicr (Flickr) · CC BY 2.0',
    en: 'By dronepicr (Flickr) · CC BY 2.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Beautiful_beach_on_Phu_Quoc_island_Vietnam_%2839543775721%29.jpg',
  },
  jeju: {
    ko: '한국관광공사 VisitJeju 매체 — 이용·표기는 출처 페이지 안내에 따름',
    en: 'KTO VisitJeju media — see source page for terms',
    filePageUrl:
      'https://www.visitjeju.net/kr/detail/view?contentsid=CONT_000000000500309',
  },
  dubai: {
    ko: '저작 Norlando Pobre · CC BY 2.0',
    en: 'By Norlando Pobre · CC BY 2.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Dubai_Marina_Skyline.jpg',
  },
  melbourne: {
    ko: '저작 Jupiter Firelyte (Flickr) · CC BY 2.0',
    en: 'By Jupiter Firelyte (Flickr) · CC BY 2.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Flemington_main_stand%2C_2013_Melbourne_Cup.jpg',
  },
};
