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

  // —— 태국·말레이시아·필리핀·캄보디아 권역 ——
  '태국 파타야': 'phuket',
  '파타야': 'phuket',
  '쿠알라셀랑고르': 'kuala-lumpur',
  '앙코르 와트': 'angkor-wat',
  '시엠립': 'angkor-wat',

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
  'Siem Reap': 'angkor-wat',
  'Angkor Wat': 'angkor-wat',
  'Addis Ababa': 'lalibela',
  'Bohol': 'bohol',

  // —— 파타고니아 권역 (북부·남부 slug 분리) ——
  'Bariloche': 'patagonia',
  '바릴로체': 'patagonia',
  'Patagonia Chile': 'torres-del-paine',
  '파타고니아 칠레': 'torres-del-paine',
  'Tierra del Fuego': 'ushuaia',
  '티에라델푸에고': 'ushuaia'
};

/**
 * 툴킷 DB `place_id` 조회용 동의어 화이트리스트 (slug → 후보 place_id).
 * `buildToolkitPlaceIdCandidates`는 역방향 별칭 전체 주입 대신 이 목록만 사용합니다.
 * (국가·타 도시·잘못된 별칭 제외 — 예: Brunei→borneo는 넣지 않음)
 *
 * @type {Record<string, string[]>}
 */
export const TRAVEL_SPOT_TOOLKIT_SYNONYMS = {
  'angkor-wat': ['Siem Reap', '시엠립', 'Angkor Wat', '앙코르 와트', '앙코르와트'],
  'borneo': ['보르네오', 'Borneo'],
  'everest-base-camp': ['에베레스트', '에베레스트 캠프', '에베레스트베이스캠프', 'Everest'],
  'uyuni-salt-flat': ['우유니', '우유니 사막', '우유니소금사막', 'Uyuni'],
  'plitvice-lakes': [
    '플리트비체',
    '플리트비체 국립공원',
    '플리트비체호수',
    'Plitvice',
    'Plitvice Lakes National Park',
  ],
  'bali': ['우붓', 'Ubud'],
  'reykjavik': ['레이니스퍄라', '레이클라비크', 'Reykjavik'],
  'ishigaki': ['오키나와', '오키나와현', 'Okinawa'],
  'galapagos': ['다윈', '다윈섬', 'Darwin'],
  'phuket': ['태국 파타야', '파타야', 'Pattaya'],
  'kuala-lumpur': ['쿠알라셀랑고르'],
  'lalibela': ['아디스아바바', 'Addis Ababa'],
  'bohol': ['보홀', 'Bohol'],
  'seattle': ['Seattle', 'seattle'],
  'iceland': ['Ilulissat', '일룰리사트', '일루리삿', 'Ilulissat Icefjord'],
  'alaska': ['앵커리지', 'Anchorage'],
  'antarctica': ['맥머도', '맥머도 기지', '남극해', 'McMurdo Station', 'McMurdo'],
  patagonia: ['Bariloche', '바릴로체', 'Patagonia (Northern)'],
  ushuaia: ['Ushuaia', 'Tierra del Fuego', '티에라델푸에고'],
  'torres-del-paine': ['Torres del Paine', '토레스델파이네', 'Parque Nacional Torres del Paine'],
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
