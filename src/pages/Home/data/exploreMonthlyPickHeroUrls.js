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
    'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f8/Seongsan%2C_Jeju_Island.jpg/1280px-Seongsan%2C_Jeju_Island.jpg',
  dubai:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e6/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg',
  melbourne:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Melbourne_Botanic_Gardens_view_towards_St_Kilda_Road_20180726-021.jpg/1280px-Melbourne_Botanic_Gardens_view_towards_St_Kilda_Road_20180726-021.jpg',
  sapporo:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Hokkaido_Sapporo_Odori_Park.jpg/1280px-Hokkaido_Sapporo_Odori_Park.jpg',
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
  okinawa:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Nago-jyo_Park_Sakura.JPG/1280px-Nago-jyo_Park_Sakura.JPG',
  'kuala-lumpur':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/Batu_Caves_Temple_Cave_Stairs_2015.jpg/1280px-Batu_Caves_Temple_Cave_Stairs_2015.jpg',
  'banff-national-park':
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bc/Frozen_Lake_Louise_in_Banff_1.jpg/1280px-Frozen_Lake_Louise_in_Banff_1.jpg',
  zermatt:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Matterhorn_in_winter_with_Zermatt_village.jpg/1280px-Matterhorn_in_winter_with_Zermatt_village.jpg',
  maldives:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/7/70/Water_bungalow_at_sunset_-_Rannalhi%2C_Maldives_-_2016.jpg/1280px-Water_bungalow_at_sunset_-_Rannalhi%2C_Maldives_-_2016.jpg',
  hawaii:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/8/88/HIHWNMS_--_Breaching_Humpback_Whale_%2836619848411%29.jpg/1280px-HIHWNMS_--_Breaching_Humpback_Whale_%2836619848411%29.jpg',
  bangkok:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/Templo_Wat_Arun%2C_Bangkok%2C_Tailandia%2C_2013-08-22%2C_DD_30.jpg/1280px-Templo_Wat_Arun%2C_Bangkok%2C_Tailandia%2C_2013-08-22%2C_DD_30.jpg',
  perth:
    'https://upload.wikimedia.org/wikipedia/commons/thumb/6/69/Perth_%28AU%29%2C_Elizabeth_Quay_--_2019_--_0331-3.jpg/1280px-Perth_%28AU%29%2C_Elizabeth_Quay_--_2019_--_0331-3.jpg',
};

/** object-position for object-fit:cover — 사진별 주제(단풍·랜턴 등)에 맞춤 */
export const EXPLORE_MONTHLY_PICK_HERO_OBJECT_POSITION = {
  kyoto: '50% 42%',
  'chiang-mai': '50% 62%',
  'phu-quoc': '42% 50%',
  jeju: '50% 45%',
  dubai: '58% 48%',
  melbourne: '50% 38%',
  sapporo: '50% 42%',
  vienna: '50% 40%',
  'hong-kong': '50% 35%',
  seoul: '50% 45%',
  sydney: '50% 38%',
  reykjavik: '50% 30%',
  okinawa: '50% 30%',
  'kuala-lumpur': '50% 42%',
  'banff-national-park': '50% 38%',
  zermatt: '32% 42%',
  maldives: '35% 48%',
  hawaii: '58% 48%',
  bangkok: '42% 42%',
  perth: '50% 38%',
};

/** 로드 전 그리드 variant·종횡비 힌트(1280px 썸 경로 기준 ffprobe) */
export const EXPLORE_MONTHLY_PICK_HERO_INTRINSIC_SIZE = {
  kyoto: { width: 1280, height: 853 },
  'chiang-mai': { width: 1280, height: 854 },
  'phu-quoc': { width: 1280, height: 853 },
  jeju: { width: 1280, height: 720 },
  dubai: { width: 1280, height: 853 },
  melbourne: { width: 1280, height: 961 },
  sapporo: { width: 1280, height: 960 },
  vienna: { width: 1280, height: 853 },
  'hong-kong': { width: 1280, height: 853 },
  seoul: { width: 1280, height: 1920 },
  sydney: { width: 1280, height: 960 },
  reykjavik: { width: 1280, height: 853 },
  okinawa: { width: 1280, height: 853 },
  'kuala-lumpur': { width: 1280, height: 1920 },
  'banff-national-park': { width: 1280, height: 960 },
  zermatt: { width: 1280, height: 853 },
  maldives: { width: 1280, height: 864 },
  hawaii: { width: 1280, height: 853 },
  bangkok: { width: 1280, height: 855 },
  perth: { width: 1280, height: 853 },
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
    ko: '저작 Bernard Gagnon · CC0 1.0',
    en: 'By Bernard Gagnon · CC0 1.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Seongsan,_Jeju_Island.jpg',
  },
  dubai: {
    ko: '저작 Norlando Pobre · CC BY 2.0',
    en: 'By Norlando Pobre · CC BY 2.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Dubai_Marina_Skyline.jpg',
  },
  melbourne: {
    ko: '저작 Gary Houston · CC0 1.0',
    en: 'By Gary Houston · CC0 1.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Melbourne_Botanic_Gardens_view_towards_St_Kilda_Road_20180726-021.jpg',
  },
  sapporo: {
    ko: '저작 Nkns · CC BY-SA 3.0',
    en: 'By Nkns · CC BY-SA 3.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Hokkaido_Sapporo_Odori_Park.jpg',
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
  okinawa: {
    ko: '저작 아라츠크 · CC BY-SA 4.0',
    en: 'By アラツク · CC BY-SA 4.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Nago-jyo_Park_Sakura.JPG',
  },
  'kuala-lumpur': {
    ko: '저작 KQuhen · CC BY-SA 4.0',
    en: 'By KQuhen · CC BY-SA 4.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Batu_Caves_Temple_Cave_Stairs_2015.jpg',
  },
  'banff-national-park': {
    ko: '저작 Rschroeder1985 · CC0 1.0',
    en: 'By Rschroeder1985 · CC0 1.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Frozen_Lake_Louise_in_Banff_1.jpg',
  },
  zermatt: {
    ko: '저작 Deralpinbergsteiger · CC BY-SA 4.0',
    en: 'By Deralpinbergsteiger · CC BY-SA 4.0',
    filePageUrl: 'https://commons.wikimedia.org/wiki/File:Matterhorn_in_winter_with_Zermatt_village.jpg',
  },
  maldives: {
    ko: '저작 Saumesh Kumar · CC0 1.0',
    en: 'By Saumesh Kumar · CC0 1.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Water_bungalow_at_sunset_-_Rannalhi,_Maldives_-_2016.jpg',
  },
  hawaii: {
    ko: '저작 National Marine Sanctuaries · 퍼블릭 도메인',
    en: 'By National Marine Sanctuaries · Public domain',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:HIHWNMS_--_Breaching_Humpback_Whale_(36619848411).jpg',
  },
  bangkok: {
    ko: '저작 Diego Delso · CC BY-SA 3.0',
    en: 'By Diego Delso · CC BY-SA 3.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Templo_Wat_Arun,_Bangkok,_Tailandia,_2013-08-22,_DD_30.jpg',
  },
  perth: {
    ko: '저작 Dietmar Rabich · CC BY-SA 4.0',
    en: 'By Dietmar Rabich · CC BY-SA 4.0',
    filePageUrl:
      'https://commons.wikimedia.org/wiki/File:Perth_(AU),_Elizabeth_Quay_--_2019_--_0331-3.jpg',
  },
};
