/**
 * Supabase `place_toolkit.place_id` → `travelSpots.js` slug 별칭.
 * DB에 저장된 한글·약칭·띄어쓰기와 SSOT 공식명이 다를 때 동기화 스크립트가 사용합니다.
 *
 * - 값은 반드시 `travelSpots.js`에 존재하는 slug여야 합니다.
 * - `citiesData`만 있는 지명(코코스·핏케언·그린란드 등)은 여기 넣어도 매핑되지 않습니다 → travelSpots 추가가 필요합니다.
 *
 * @type {Record<string, string>}
 */
export const TRAVEL_SPOT_PLACE_ID_ALIASES = {
  // —— 사용자 예시·확실한 약칭 ——
  '에베레스트': 'everest-base-camp',
  '에베레스트 캠프': 'everest-base-camp',
  '에베레스트베이스캠프': 'everest-base-camp',
  '우유니': 'uyuni-salt-flat',
  '우유니 사막': 'uyuni-salt-flat',
  '우유니소금사막': 'uyuni-salt-flat',
  '플리트비체': 'plitvice-lakes',
  '플리트비체 국립공원': 'plitvice-lakes',
  '플리트비체호수': 'plitvice-lakes',

  // —— 남극·알래스카 ——
  '맥머도': 'antarctica',
  '맥머도 기지': 'antarctica',
  '남극해': 'antarctica',
  '앵커리지': 'alaska',

  // —— 발리·아이슬란드·오키나와(야에야마 권) ——
  '우붓': 'bali',
  '레이니스퍄라': 'reykjavik',
  '레이클라비크': 'reykjavik',
  '오키나와': 'ishigaki',
  '오키나와현': 'ishigaki',

  // —— 갈라파고스(찰스 다윈·다윈섬 검색 혼동) ——
  '다윈': 'galapagos',
  '다윈섬': 'galapagos',

  // —— 태국·말레이시아·필리핀 권역 ——
  '태국 파타야': 'phuket',
  '파타야': 'phuket',
  '브루나이': 'borneo',
  '쿠알라셀랑고르': 'kuala-lumpur',
  '마나도': 'borneo',

  // —— 에티오피아·보홀 등 ——
  '아디스아바바': 'lalibela',
  '보홀': 'bohol',

  // —— 미국 서부 (DB에 영문 place_id로 저장된 경우) ——
  'Seattle': 'seattle',
  'seattle': 'seattle',

  // —— 영문·표기 변형 ——
  'Ilulissat': 'iceland',
  '일룰리사트': 'iceland',
  '일루리삿': 'iceland',
  'Ilulissat Icefjord': 'iceland',
  'Reykjavik': 'reykjavik',
  'Ubud': 'bali',
  'Anchorage': 'alaska',
  'McMurdo Station': 'antarctica',
  'McMurdo': 'antarctica',
  'Everest': 'everest-base-camp',
  'Uyuni': 'uyuni-salt-flat',
  'Plitvice': 'plitvice-lakes',
  'Plitvice Lakes National Park': 'plitvice-lakes',
  'Okinawa': 'ishigaki',
  'Darwin': 'galapagos',
  'Pattaya': 'phuket',
  'Brunei': 'borneo',
  'Addis Ababa': 'lalibela',
  'Bohol': 'bohol'
};

/** @type {Set<string>} 여행지 SSOT에 없거나 매칭하면 안 되는 place_id */
export const TRAVEL_SPOT_PLACE_ID_BLOCKLIST = new Set(
  [
    '닭갈비',
    '트럼프',
    '하이원팰리스호텔',
    'England',
    '와일드호스',
    'Ad Dakhiliyah Governorate',
    'Maroantsetra',
    'Îles Glorieuses',
    '달',
    '독도',
    '강화도',
    '춘천',
    '춘천시',
    '수원',
    '강릉시',
    '사뭇쁘라깐주',
    '아오시마',
    '이슬라마바드'
  ].map((s) => s.toLowerCase().replace(/\s+/g, ''))
);
