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
  jeju:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/d/dc/Silver_Grass%2C_Sangumburi%2C_Jeju_%28%EC%96%B5%EC%83%88%2C_%EC%A0%9C%EC%A3%BC_%EC%82%B0%EA%B5%BC%EB%B6%80%EB%A6%AC%29_-_panoramio.jpg/1280px-Silver_Grass%2C_Sangumburi%2C_Jeju_%28%EC%96%B5%EC%83%88%2C_%EC%A0%9C%EC%A3%BC_%EC%82%B0%EA%B5%BC%EB%B6%80%EB%A6%AC%29_-_panoramio.jpg',
  dubai:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg',
  melbourne:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Flemington_main_stand,_2013_Melbourne_Cup.jpg/1280px-Flemington_main_stand,_2013_Melbourne_Cup.jpg',
  sapporo:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Sapporo_White_Illumination_2016_%28184517225%29.jpeg/1280px-Sapporo_White_Illumination_2016_%28184517225%29.jpeg',
  vienna:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Carousel_Ride_Rathaus.jpg/1280px-Carousel_Ride_Rathaus.jpg',
  'hong-kong':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Hong_Kong_skyscrapers_in_a_night_of_typhoon.jpg/1280px-Hong_Kong_skyscrapers_in_a_night_of_typhoon.jpg',
  seoul:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/3d/Cheonggyecheon_Stream_in_sunset.jpg/1280px-Cheonggyecheon_Stream_in_sunset.jpg',
  sydney:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/35/Sydney_habour_bridge_%26_opera_house_fireworks_new_year_eve_2008.jpg/1280px-Sydney_habour_bridge_%26_opera_house_fireworks_new_year_eve_2008.jpg',
  reykjavik:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Northern_Lights_above_Iceland_%28Unsplash%29.jpg/1280px-Northern_Lights_above_Iceland_%28Unsplash%29.jpg',
};

/** object-position for object-fit:cover — 사진별 주제(단풍·랜턴 등)에 맞춤 */
export const EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION = {
  kyoto: '50% 42%',
  'chiang-mai': '50% 62%',
  'phu-quoc': '42% 50%',
  jeju: '50% 82%',
  dubai: '58% 48%',
  melbourne: '72% 48%',
  sapporo: '50% 55%',
  vienna: '50% 40%',
  'hong-kong': '50% 35%',
  seoul: '50% 45%',
  sydney: '50% 38%',
  reykjavik: '50% 30%',
};

/** 로드 전 그리드 variant·종횡비 힌트(1280px 썸 경로 기준 ffprobe) */
export const EXPLORE_MONTHLY_PICK_HERO_INTRINSIC_SIZE = {
  kyoto: { width: 1280, height: 853 },
  'chiang-mai': { width: 1280, height: 854 },
  'phu-quoc': { width: 1280, height: 853 },
  jeju: { width: 1280, height: 686 },
  dubai: { width: 1280, height: 853 },
  melbourne: { width: 1280, height: 960 },
  sapporo: { width: 1280, height: 960 },
  vienna: { width: 1280, height: 853 },
  'hong-kong': { width: 1280, height: 853 },
  seoul: { width: 1280, height: 1920 },
  sydney: { width: 1280, height: 960 },
  reykjavik: { width: 1280, height: 853 },
};

/**
 * 카드 본문에 넣지 않는다. 이미지 title과 이 파일·감사 문서에만 둔다.
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
    ko: '저작 골뱅이 (Panoramio) · CC BY-SA 3.0 · 2차 저작(크롭) 표시',
    en: 'By 골뱅이 (Panoramio) · CC BY-SA 3.0 · cropped (derivative)',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Silver_Grass,_Sangumburi,_Jeju_(%EC%96%B5%EC%83%88,_%EC%A0%9C%EC%A3%BC_%EC%82%B0%EA%B5%BC%EB%B6%80%EB%A6%AC)_-_panoramio.jpg',
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
  sapporo: {
    ko: '저작 Sorah Fukumori · CC BY 3.0',
    en: 'By Sorah Fukumori · CC BY 3.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Sapporo_White_Illumination_2016_(184517225).jpeg',
  },
  vienna: {
    ko: '저작 Ooreoluwa4578420 · CC0 1.0',
    en: 'By Ooreoluwa4578420 · CC0 1.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Carousel_Ride_Rathaus.jpg',
  },
  'hong-kong': {
    ko: '저작 Wilfredor · CC0 1.0',
    en: 'By Wilfredor · CC0 1.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Hong_Kong_skyscrapers_in_a_night_of_typhoon.jpg',
  },
  seoul: {
    ko: '저작 서울관광재단 · 공공누리 제1유형',
    en: 'By Seoul Tourism Organization · KOGL Type 1',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Cheonggyecheon_Stream_in_sunset.jpg',
  },
  sydney: {
    ko: '저작 Linh_rOm · CC BY 2.0',
    en: 'By Linh_rOm · CC BY 2.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Sydney_habour_bridge_%26_opera_house_fireworks_new_year_eve_2008.jpg',
  },
  reykjavik: {
    ko: '저작 Vincent Guth (Unsplash) · CC0 1.0',
    en: 'By Vincent Guth (Unsplash) · CC0 1.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Northern_Lights_above_Iceland_(Unsplash).jpg',
  },
};
