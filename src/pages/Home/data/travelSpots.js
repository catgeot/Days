// src/pages/Home/data/travelSpots.js
// 🚨 [Fix/New] 수정 이유:
// 1. [UX] 지구본 탐색의 본연의 가치를 살리기 위해 모든 카테고리가 전 세계 대륙별로 고르게 분포되도록 전면 개편.
// 2. [New] 기존 30개에서 60개 마커로 확장하여 섹터별 12개 마커 배치 (대륙당 2개씩).
// 3. [Quality] 대륙별(북미, 남미, 유럽, 아프리카, 아시아, 오세아니아) 안배를 최우선으로 하여 줌인 시 편중 없는 시각적 밸런스 유지.

export const TRAVEL_SPOTS = [
  {
    id: 101,
    name: "보라보라",
    name_en: "Bora Bora",
    country: "프랑스령 폴리네시아",
    country_en: "French Polynesia",
    lat: -16.5,
    lng: -151.74,
    category: "paradise",
    desc: "남태평양의 진주라 불리는 지구상에서 가장 낭만적인 섬입니다. 맑고 투명한 라군 위에 지어진 오버워터 방갈로에서 완벽한 휴식을 취할 수 있습니다. 상어와 가오리와 함께 수영하는 경이로운 경험을 놓치지 마세요.",
    keywords: [
      "오세아니아",
      "라군",
      "방갈로",
      "신혼여행"
    ]
  },
  {
    id: 102,
    name: "산토리니",
    name_en: "Santorini",
    country: "그리스",
    country_en: "Greece",
    lat: 36.39,
    lng: 25.46,
    category: "paradise",
    desc: "하얀 외벽과 파란 지붕이 코발트빛 지중해와 눈부신 대비를 이루는 낭만의 섬입니다. 절벽 위에서 바라보는 붉은 일몰은 전 세계 여행자들의 버킷리스트로 꼽힙니다. 골목골목 숨겨진 아름다운 카페와 상점들을 탐험해 보세요.",
    keywords: [
      "유럽",
      "지중해",
      "일몰",
      "화이트"
    ]
  },
  {
    id: 103,
    name: "칸쿤",
    name_en: "Cancun",
    country: "멕시코",
    country_en: "Mexico",
    lat: 21.16,
    lng: -86.85,
    category: "paradise",
    desc: "카리브해의 매혹적인 청록색 바다와 마야 문명의 신비로움이 공존하는 북미 최고의 휴양지입니다. 올인클루시브 리조트에서의 여유로운 시간은 물론, 천연 우물인 세노테에서의 신비로운 수영도 즐길 수 있습니다.",
    keywords: [
      "북미",
      "카리브해",
      "세노테",
      "올인클루시브"
    ]
  },
  {
    id: 104,
    name: "몰디브",
    name_en: "Maldives",
    country: "몰디브",
    country_en: "Maldives",
    lat: 3.2,
    lng: 73.22,
    category: "paradise",
    desc: "인도양에 흩뿌려진 수천 개의 산호섬으로 이루어진 궁극의 럭셔리 휴양지입니다. 섬 하나에 리조트 하나가 자리하여 완벽한 프라이버시를 보장받을 수 있습니다. 객실에서 바로 투명한 바다로 뛰어드는 로망을 실현해 보세요.",
    keywords: [
      "아시아",
      "인도양",
      "럭셔리",
      "수중환경"
    ]
  },
  {
    id: 105,
    name: "세이셸",
    name_en: "Seychelles",
    country: "세이셸",
    country_en: "Seychelles",
    lat: -4.67,
    lng: 55.49,
    category: "paradise",
    desc: "아프리카 인도양의 최후의 낙원이라 불리며, 거대한 화강암 바위들이 해변을 감싸고 있는 독특한 절경을 자랑합니다. 사람의 손길이 닿지 않은 원시림과 에메랄드빛 바다가 완벽한 조화를 이룹니다.",
    keywords: [
      "아프리카",
      "원시림",
      "해변",
      "휴양"
    ]
  },
  {
    id: 106,
    name: "페르난두지노로냐",
    name_en: "Fernando de Noronha",
    country: "브라질",
    country_en: "Brazil",
    lat: -3.84,
    lng: -32.42,
    category: "paradise",
    desc: "남미 브라질 연안에 위치한 엄격히 보호받는 해양 국립공원입니다. 돌고래 떼와 바다거북을 일상처럼 마주할 수 있으며, 투명한 바다와 야생 그대로의 자연이 경이로움을 선사합니다.",
    keywords: [
      "남미",
      "에코투어",
      "바다거북",
      "돌고래"
    ]
  },
  {
    id: 107,
    name: "버뮤다",
    name_en: "Bermuda",
    country: "버뮤다",
    country_en: "Bermuda",
    lat: 32.3078,
    lng: -64.7505,
    category: "paradise",
    desc: "북대서양의 미스터리한 전설을 품은 섬입니다. 실제로는 분홍빛 모래사장인 핑크 샌드 비치와 파스텔톤 주택들이 그림처럼 아름다운 곳입니다.",
    keywords: [
      "대륙",
      "휴양",
      "낭만"
    ]
  },
  {
    id: 108,
    name: "남태평양",
    name_en: "South Pacific",
    country: "바다",
    country_en: "Ocean",
    lat: -40,
    lng: -130,
    category: "paradise",
    desc: "수만 개의 아름다운 산호섬들이 별처럼 흩뿌려져 있는 지상 최후의 낙원이자 탐험가들의 영원한 로망입니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "휴양"
    ]
  },
  {
    id: 109,
    name: "아조레스 제도",
    name_en: "Azores",
    country: "포르투갈",
    country_en: "Portugal",
    lat: 37.7412,
    lng: -25.6756,
    category: "paradise",
    desc: "대서양 한가운데 떠 있는 포르투갈령 화산섬입니다. 에메랄드빛 칼데라 호수와 푸른 초원이 빚어내는 유럽의 하와이입니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "휴양"
    ]
  },
  {
    id: 110,
    name: "잔지바르",
    name_en: "Zanzibar",
    country: "탄자니아",
    country_en: "Tanzania",
    lat: -6.1659,
    lng: 39.2026,
    category: "paradise",
    desc: "아프리카 탄자니아 앞바다에 떠 있는 향신료의 섬입니다. 아랍풍의 구시가지 스톤타운과 새하얀 백사장이 묘한 조화를 이룹니다.",
    keywords: [
      "대륙",
      "휴양",
      "역사/문화",
      "낭만"
    ]
  },
  {
    id: 111,
    name: "인도양",
    name_en: "Indian Ocean",
    country: "바다",
    country_en: "Ocean",
    lat: -20,
    lng: 80,
    category: "paradise",
    desc: "에메랄드빛 바다와 열대 섬들이 가득한 따뜻한 대양입니다. 다채로운 해양 생물과 향신료 무역의 역사가 교차합니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "휴양"
    ]
  },
  {
    id: 112,
    name: "오세아니아",
    name_en: "Oceania",
    country: "대륙",
    country_en: "Continent",
    lat: -25,
    lng: 135,
    category: "paradise",
    desc: "수많은 섬과 산호초로 이루어진 남태평양의 거대한 영역입니다. 지구상 어디에도 없는 고유한 생태계를 자랑합니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "휴양"
    ]
  },
  {
    id: 201,
    name: "밴프 국립공원",
    name_en: "Banff National Park",
    country: "캐나다",
    country_en: "Canada",
    lat: 51.17,
    lng: -115.57,
    category: "nature",
    desc: "북미 로키산맥의 심장부로, 에메랄드빛 루이스 호수와 웅장한 빙하가 장관을 이룹니다. 대자연 속에서 엘크와 곰 같은 야생동물과 조우하며 하이킹, 카누 등 다양한 아웃도어 활동을 즐기기에 최적입니다.",
    keywords: [
      "북미",
      "로키산맥",
      "호수",
      "하이킹"
    ]
  },
  {
    id: 202,
    name: "이구아수 폭포",
    name_en: "Iguazu Falls",
    country: "아르헨티나",
    country_en: "Argentina",
    lat: -25.69,
    lng: -54.43,
    category: "nature",
    desc: "남미 대륙을 가로지르며 엄청난 굉음과 함께 쏟아져 내리는 세계 최대의 폭포입니다. '악마의 목구멍'이라 불리는 하이라이트 구간에 서면 대자연의 압도적인 힘과 경외감을 온몸으로 느낄 수 있습니다.",
    keywords: [
      "남미",
      "폭포",
      "정글",
      "경이로움"
    ]
  },
  {
    id: 203,
    name: "아이슬란드",
    name_en: "Iceland",
    country: "아이슬란드",
    country_en: "Iceland",
    lat: 64.96,
    lng: -19.02,
    category: "nature",
    desc: "불과 얼음의 나라로 불리며, 거대한 빙하와 활화산이 공존하는 유럽의 외딴섬입니다. 겨울에는 신비로운 오로라가 하늘을 수놓고, 여름에는 백야의 태양 아래 장엄한 폭포들이 빛을 발합니다.",
    keywords: [
      "유럽",
      "오로라",
      "빙하",
      "폭포"
    ]
  },
  {
    id: 204,
    name: "빅토리아 폭포",
    name_en: "Victoria Falls",
    country: "잠비아",
    country_en: "Zambia",
    lat: -17.92,
    lng: 25.85,
    category: "nature",
    desc: "아프리카 대륙을 가르는 잠베지 강이 빚어낸 거대한 물보라의 기적입니다. 현지어로 '천둥 치는 연기'라 불리며, 폭포를 내려다보는 헬기 투어나 악마의 수영장에서의 아찔한 경험을 즐길 수 있습니다.",
    keywords: [
      "아프리카",
      "폭포",
      "무지개",
      "자연"
    ]
  },
  {
    id: 205,
    name: "후지산",
    name_en: "Mount Fuji",
    country: "일본",
    country_en: "Japan",
    lat: 35.36,
    lng: 138.72,
    category: "nature",
    desc: "아시아를 대표하는 완벽한 대칭형의 웅장한 화산으로, 사계절 내내 각기 다른 아름다움을 뽐냅니다. 산봉우리에 내려앉은 만년설과 그 주변을 감싸는 평화로운 호수들이 빚어내는 풍경은 한 폭의 그림 같습니다.",
    keywords: [
      "아시아",
      "화산",
      "하이킹",
      "풍경"
    ]
  },
  {
    id: 206,
    name: "그레이트 배리어 리프",
    name_en: "Great Barrier Reef",
    country: "호주",
    country_en: "Australia",
    lat: -18.28,
    lng: 147.69,
    category: "nature",
    desc: "오세아니아 우주에서도 보인다는 세계 최대의 산호초 군락입니다. 수만 종의 해양 생물이 살아 숨 쉬는 바닷속 생태계의 보고로, 스쿠버 다이빙과 스노클링을 통해 신비로운 수중 세계를 탐험할 수 있습니다.",
    keywords: [
      "오세아니아",
      "산호초",
      "다이빙",
      "바다"
    ]
  },
  {
    id: 207,
    name: "북태평양",
    name_en: "North Pacific",
    country: "바다",
    country_en: "Ocean",
    lat: 40,
    lng: -170,
    category: "nature",
    desc: "아시아와 북미 대륙 사이를 흐르는 거대한 바다로, 다이내믹한 해류와 풍부한 해양 생태계를 자랑합니다.",
    keywords: [
      "대륙",
      "자연/오지"
    ]
  },
  {
    id: 208,
    name: "태평양",
    name_en: "Pacific Ocean",
    country: "바다",
    country_en: "Ocean",
    lat: 0,
    lng: -160,
    category: "nature",
    desc: "지구 표면적의 3분의 1을 차지하는 세계에서 가장 거대하고 깊은 대양입니다. 수많은 산호초와 미지의 심해를 품고 있는 푸른 심장입니다.",
    keywords: [
      "대륙",
      "자연/오지"
    ]
  },
  {
    id: 209,
    name: "북극해",
    name_en: "Arctic Ocean",
    country: "바다",
    country_en: "Ocean",
    lat: 85,
    lng: 0,
    category: "nature",
    desc: "두꺼운 빙하와 눈으로 덮인 지구의 북쪽 끝입니다. 기후 변화의 최전선이자 극한의 아름다움을 간직한 곳입니다.",
    keywords: [
      "대륙",
      "자연/오지"
    ]
  },
  {
    id: 210,
    name: "남대서양",
    name_en: "South Atlantic",
    country: "바다",
    country_en: "Ocean",
    lat: -35,
    lng: -15,
    category: "nature",
    desc: "남미와 아프리카 사이의 광활한 바다로, 독특한 해류 시스템과 웅장한 자연의 힘을 느낄 수 있는 곳입니다.",
    keywords: [
      "대륙",
      "자연/오지"
    ]
  },
  {
    id: 211,
    name: "안다만 제도",
    name_en: "Andaman Islands",
    country: "인도",
    country_en: "India",
    lat: 11.7401,
    lng: 92.6586,
    category: "nature",
    desc: "인도양 한가운데 숨겨진 열대의 낙원으로, 문명의 때가 묻지 않은 순백의 해변과 울창한 맹그로브 숲을 자랑합니다.",
    keywords: [
      "대륙",
      "휴양",
      "자연/오지"
    ]
  },
  {
    id: 212,
    name: "팔라우",
    name_en: "Palau",
    country: "팔라우",
    country_en: "Palau",
    lat: 7.515,
    lng: 134.5825,
    category: "nature",
    desc: "신들의 바다 정원이라 불리며, 세계 최고 수준의 수중 환경과 무독성 해파리 호수를 품고 있는 청정 국가입니다.",
    keywords: [
      "대륙",
      "휴양",
      "액티비티",
      "자연/오지"
    ]
  },
  {
    id: 301,
    name: "뉴욕",
    name_en: "New York",
    country: "미국",
    country_en: "USA",
    lat: 40.71,
    lng: -74,
    category: "urban",
    desc: "북미를 넘어 전 세계의 문화, 패션, 금융이 교차하는 진정한 세계의 수도입니다. 타임스퀘어의 화려한 네온사인과 브로드웨이의 열정, 그리고 엠파이어 스테이트 빌딩의 압도적인 스카이라인을 경험해 보세요.",
    keywords: [
      "북미",
      "타임스퀘어",
      "야경",
      "쇼핑"
    ]
  },
  {
    id: 302,
    name: "리우데자네이루",
    name_en: "Rio de Janeiro",
    country: "브라질",
    country_en: "Brazil",
    lat: -22.9,
    lng: -43.17,
    category: "urban",
    desc: "남미 특유의 열정과 눈부신 자연이 거대한 도시와 완벽하게 융합된 곳입니다. 코파카바나 해변의 여유로움과 코르코바도 산 꼭대기에서 도시를 굽어보는 거대한 구세주 그리스도상이 잊지 못할 인상을 남깁니다.",
    keywords: [
      "남미",
      "예수상",
      "해변",
      "삼바"
    ]
  },
  {
    id: 303,
    name: "런던",
    name_en: "London",
    country: "영국",
    country_en: "UK",
    lat: 51.5,
    lng: -0.12,
    category: "urban",
    desc: "유럽의 고풍스러운 랜드마크와 현대적인 도시 풍경이 우아하게 어우러집니다. 무료로 개방되는 세계적 수준의 박물관들, 템스강 위를 가로지르는 타워브리지, 그리고 웨스트엔드의 감동적인 뮤지컬을 즐겨보세요.",
    keywords: [
      "유럽",
      "빅벤",
      "박물관",
      "뮤지컬"
    ]
  },
  {
    id: 304,
    name: "케이프타운",
    name_en: "Cape Town",
    country: "남아프리카공화국",
    country_en: "South Africa",
    lat: -33.92,
    lng: 18.42,
    category: "urban",
    desc: "아프리카 대륙의 끝단에서 세련된 도시 문화와 장엄한 자연을 동시에 만끽할 수 있습니다. 구름이 내려앉는 테이블 마운틴을 배경으로, 감각적인 카페와 갤러리들이 가득한 트렌디한 도심을 거닐어 보세요.",
    keywords: [
      "아프리카",
      "항구도시",
      "테이블마운틴",
      "트렌디"
    ]
  },
  {
    id: 305,
    name: "도쿄",
    name_en: "Tokyo",
    country: "일본",
    country_en: "Japan",
    lat: 35.67,
    lng: 139.76,
    category: "urban",
    desc: "아시아 초현대적인 마천루와 전통 신사가 골목 하나를 사이에 두고 공존하는 메가시티입니다. 세계 최고의 미식부터 화려한 팝컬처와 쉴 새 없이 변하는 트렌드까지, 모든 것이 집약되어 있습니다.",
    keywords: [
      "아시아",
      "쇼핑",
      "미식",
      "네온사인"
    ]
  },
  {
    id: 306,
    name: "시드니",
    name_en: "Sydney",
    country: "호주",
    country_en: "Australia",
    lat: -33.86,
    lng: 151.2,
    category: "urban",
    desc: "오세아니아를 대표하는 아름다운 항구 도시입니다. 조가비를 엎어 놓은 듯한 시드니 오페라 하우스와 웅장한 하버 브리지가 빚어내는 스카이라인은 전 세계에서 가장 상징적이고 활기찬 도시 풍경을 선사합니다.",
    keywords: [
      "오세아니아",
      "오페라하우스",
      "하버브리지",
      "항구"
    ]
  },
  {
    id: 307,
    name: "북아메리카",
    name_en: "North America",
    country: "대륙",
    country_en: "Continent",
    lat: 45,
    lng: -100,
    category: "urban",
    desc: "거대한 빙하부터 뜨거운 사막까지 모든 기후를 품은 대륙입니다. 다이나믹한 대도시와 장엄한 국립공원들이 공존합니다.",
    keywords: [
      "대륙",
      "대도시",
      "자연/오지"
    ]
  },
  {
    id: 308,
    name: "우수아이아",
    name_en: "Ushuaia",
    country: "아르헨티나",
    country_en: "Argentina",
    lat: -54.8019,
    lng: -68.303,
    category: "urban",
    desc: "아르헨티나에 위치한 세상의 끝 도시입니다. 남극으로 떠나는 탐험선들의 베이스캠프이자 거친 대자연이 시작되는 관문입니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "대도시"
    ]
  },
  {
    id: 309,
    name: "모스크바",
    name_en: "Moscow",
    country: "러시아",
    country_en: "Russia",
    lat: 55.7558,
    lng: 37.6173,
    category: "urban",
    desc: "테트리스 성으로 유명한 성 바실리 대성당과 붉은 광장의 심장부입니다. 러시아 제국의 웅장한 건축 예술을 목격할 수 있습니다.",
    keywords: [
      "대륙",
      "대도시",
      "역사/문화"
    ]
  },
  {
    id: 310,
    name: "카이로",
    name_en: "Cairo",
    country: "이집트",
    country_en: "Egypt",
    lat: 30.0444,
    lng: 31.2357,
    category: "urban",
    desc: "도심 한가운데서 피라미드와 스핑크스를 볼 수 있는 고대 문명의 요람입니다. 모래바람과 이슬람 문명의 신비로움이 가득합니다.",
    keywords: [
      "대륙",
      "대도시",
      "역사/문화"
    ]
  },
  {
    id: 311,
    name: "아시아",
    name_en: "Asia",
    country: "대륙",
    country_en: "Continent",
    lat: 45,
    lng: 90,
    category: "urban",
    desc: "지구상에서 가장 넓고 인구가 많은 대륙입니다. 수천 년의 오래된 문화와 초현대적인 도시들이 눈부시게 교차합니다.",
    keywords: [
      "대륙",
      "대도시",
      "역사/문화"
    ]
  },
  {
    id: 312,
    name: "뉴칼레도니아",
    name_en: "New Caledonia",
    country: "뉴칼레도니아",
    country_en: "New Caledonia",
    lat: -20.9043,
    lng: 165.618,
    category: "urban",
    desc: "태평양의 프렌치 리비에라로 불립니다. 프랑스의 세련미와 멜라네시아의 자연이 혼합된 우아한 휴양지입니다.",
    keywords: [
      "대륙",
      "휴양",
      "낭만",
      "대도시"
    ]
  },
  {
    id: 401,
    name: "치첸이트사",
    name_en: "Chichen Itza",
    country: "멕시코",
    country_en: "Mexico",
    lat: 20.68,
    lng: -88.56,
    category: "culture",
    desc: "북미 정글 한가운데 솟아오른 고대 마야 문명의 신비로운 피라미드입니다. 천문학과 수학에 능통했던 마야인들의 놀라운 지혜가 깃든 쿠쿨칸의 신전에서 수천 년 전의 신비로운 숨결을 느껴보세요.",
    keywords: [
      "북미",
      "마야문명",
      "피라미드",
      "유적지"
    ]
  },
  {
    id: 402,
    name: "마추픽추",
    name_en: "Machu Picchu",
    country: "페루",
    country_en: "Peru",
    lat: -13.16,
    lng: -72.54,
    category: "culture",
    desc: "남미 안데스 산맥의 가파른 봉우리 위에 숨겨진 잉카 제국의 공중 도시입니다. 구름이 걷히며 서서히 드러나는 거대한 돌로 쌓은 고대 도시의 웅장함은 여행자들에게 형언할 수 없는 전율을 안겨줍니다.",
    keywords: [
      "남미",
      "잉카",
      "안데스",
      "잃어버린도시"
    ]
  },
  {
    id: 403,
    name: "로마",
    name_en: "Rome",
    country: "이탈리아",
    country_en: "Italy",
    lat: 41.9,
    lng: 12.49,
    category: "culture",
    desc: "유럽 발길 닿는 모든 곳이 유적인 거대한 야외 박물관 같은 영원의 도시입니다. 콜로세움과 포로 로마노의 장엄한 폐허 속을 거닐며, 한 시대를 호령했던 로마 제국의 위대한 역사를 직접 대면해 보세요.",
    keywords: [
      "유럽",
      "콜로세움",
      "로마제국",
      "역사"
    ]
  },
  {
    id: 404,
    name: "기자 피라미드",
    name_en: "Giza Pyramids",
    country: "이집트",
    country_en: "Egypt",
    lat: 29.97,
    lng: 31.13,
    category: "culture",
    desc: "아프리카 대륙 나일강 변 사막 위에 우뚝 솟은 인류 역사상 가장 위대한 건축물입니다. 수천 년의 세월을 견뎌낸 스핑크스와 거대한 파라오의 무덤 앞에서 인간의 경이로운 한계를 체감하게 됩니다.",
    keywords: [
      "아프리카",
      "스핑크스",
      "고대문명",
      "사막"
    ]
  },
  {
    id: 405,
    name: "앙코르 와트",
    name_en: "Angkor Wat",
    country: "캄보디아",
    country_en: "Cambodia",
    lat: 13.41,
    lng: 103.86,
    category: "culture",
    desc: "아시아 캄보디아 밀림 속에 오랫동안 잠들어 있던 크메르 제국의 거대한 종교 건축물입니다. 정교한 석조 부조들과 거대한 뿌리로 사원을 뒤덮은 나무들이 얽힌 풍경은 신비롭고도 장엄합니다.",
    keywords: [
      "아시아",
      "크메르",
      "불교/힌두교",
      "유적"
    ]
  },
  {
    id: 406,
    name: "페트라",
    name_en: "Petra",
    country: "요르단",
    country_en: "Jordan",
    lat: 30.32,
    lng: 35.44,
    category: "culture",
    desc: "중동의 붉은 사암 절벽을 깎아 만든 나바테아인들의 잃어버린 고대 도시입니다. 좁은 협곡을 지나 마주하는 장미빛 알 카즈네 신전은 영화 속 인디아나 존스가 된 듯한 강렬한 모험심을 불러일으킵니다.",
    keywords: [
      "중동",
      "장미빛도시",
      "사막",
      "고대유적"
    ]
  },
  {
    id: 407,
    name: "미드웨이 환초",
    name_en: "Midway Atoll",
    country: "미국",
    country_en: "USA",
    lat: 28.2072,
    lng: -177.3735,
    category: "culture",
    desc: "알바트로스 새들의 최대 서식지이자 제2차 세계대전의 주요 격전지였던 태평양 한가운데의 고립된 환초입니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    id: 408,
    name: "남아메리카",
    name_en: "South America",
    country: "대륙",
    country_en: "Continent",
    lat: -15,
    lng: -60,
    category: "culture",
    desc: "아마존의 심장 박동과 안데스 산맥의 위용이 느껴지는 열정의 대륙입니다. 신비로운 고대 문명의 흔적이 곳곳에 남아 있습니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    id: 409,
    name: "유럽",
    name_en: "Europe",
    country: "대륙",
    country_en: "Continent",
    lat: 50,
    lng: 20,
    category: "culture",
    desc: "수많은 국가들이 촘촘히 모여 각기 다른 문화와 낭만을 뽐내는 대륙입니다. 발길 닿는 모든 곳이 역사박물관 같습니다.",
    keywords: [
      "대륙",
      "역사/문화",
      "낭만"
    ]
  },
  {
    id: 410,
    name: "아프리카",
    name_en: "Africa",
    country: "대륙",
    country_en: "Continent",
    lat: 5,
    lng: 22,
    category: "culture",
    desc: "인류의 발상지이자 야생동물들의 거대한 놀이터입니다. 끝없는 사막과 광활한 사바나가 펼쳐진 대자연의 경이로움 그 자체입니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    id: 411,
    name: "바간",
    name_en: "Bagan",
    country: "미얀마",
    country_en: "Myanmar",
    lat: 21.1717,
    lng: 94.8585,
    category: "culture",
    desc: "미얀마의 광활한 평원 위로 솟아오른 수천 개의 불탑들이 압도적인 곳입니다. 열기구를 타고 내려다보는 일출은 평생의 감동입니다.",
    keywords: [
      "대륙",
      "역사/문화",
      "낭만"
    ]
  },
  {
    id: 412,
    name: "피지",
    name_en: "Fiji",
    country: "피지",
    country_en: "Fiji",
    lat: -17.7134,
    lng: 178.065,
    category: "culture",
    desc: "300개가 넘는 섬으로 이루어진 다채로운 국가입니다. 원주민들의 친절한 미소와 다이내믹한 해양 스포츠가 기다립니다.",
    keywords: [
      "대륙",
      "휴양",
      "액티비티",
      "역사/문화"
    ]
  },
  {
    id: 501,
    name: "알래스카",
    name_en: "Alaska",
    country: "미국",
    country_en: "USA",
    lat: 64.2,
    lng: -149.49,
    category: "adventure",
    desc: "북미 최북단의 야생이 살아 숨 쉬는 거대한 얼음의 땅입니다. 빙하가 무너져 내리는 장관을 목격하고, 고래와 불곰 등 거대한 야생동물들의 생태계를 관찰하는 진정한 탐험가의 목적지입니다.",
    keywords: [
      "북미",
      "빙하",
      "야생동물",
      "오지"
    ]
  },
  {
    id: 502,
    name: "아마존 열대우림",
    name_en: "Amazon Rainforest",
    country: "브라질",
    country_en: "Brazil",
    lat: -3.46,
    lng: -62.21,
    category: "adventure",
    desc: "남미 지구의 허파라 불리는 세계에서 가장 크고 깊은 미지의 정글입니다. 거대한 아마존 강을 따라 보트를 타며 핑크 돌고래와 희귀한 조류들을 관찰하는 날것 그대로의 생태 탐험을 떠나보세요.",
    keywords: [
      "남미",
      "정글",
      "생태탐험",
      "야생"
    ]
  },
  {
    id: 503,
    name: "스발바르 제도",
    name_en: "Svalbard",
    country: "노르웨이",
    country_en: "Norway",
    lat: 78.22,
    lng: 15.65,
    category: "adventure",
    desc: "유럽 대륙 북쪽, 북극점과 가장 가까운 인간의 거주지입니다. 끝없는 설원 위를 걷는 북극곰의 발자취를 쫓고, 영구 동토층의 빙동굴을 탐험하며 혹한이 빚어낸 순백의 고립을 경험할 수 있습니다.",
    keywords: [
      "북유럽",
      "북극곰",
      "설원",
      "오로라"
    ]
  },
  {
    id: 504,
    name: "세렝게티",
    name_en: "Serengeti",
    country: "탄자니아",
    country_en: "Tanzania",
    lat: -2.33,
    lng: 34.83,
    category: "adventure",
    desc: "아프리카의 끝없는 초원 위에서 펼쳐지는 야생동물들의 서사시를 직접 목격할 수 있습니다. 수백만 마리의 누떼가 이동하는 대자연의 스펙터클 한가운데로 사파리 지프를 타고 뛰어들어 보세요.",
    keywords: [
      "아프리카",
      "사파리",
      "대자연",
      "초원"
    ]
  },
  {
    id: 505,
    name: "울루루",
    name_en: "Uluru",
    country: "호주",
    country_en: "Australia",
    lat: -25.34,
    lng: 131.03,
    category: "adventure",
    desc: "오세아니아 대륙의 붉은 심장, 아웃백 한가운데 솟아오른 거대한 단일 바위입니다. 시간과 햇빛에 따라 붉게 타오르는 듯 변하는 바위의 색조와 원주민의 신성한 에너지를 오프로드를 달리며 느껴보세요.",
    keywords: [
      "오세아니아",
      "아웃백",
      "사막",
      "원주민"
    ]
  },
  {
    id: 506,
    name: "남극 대륙",
    name_en: "Antarctica",
    country: "남극",
    country_en: "Antarctica",
    lat: -80,
    lng: 0,
    category: "adventure",
    desc: "지구상에 남은 마지막 진정한 오지이자 빙하로 뒤덮인 극한의 대륙입니다. 쇄빙선을 타고 얼어붙은 바다를 가르며 펭귄 군락과 거대한 빙산들이 떠다니는 초현실적인 세계로 들어가는 궁극의 모험입니다.",
    keywords: [
      "남극",
      "펭귄",
      "빙산",
      "극한의탐험"
    ]
  },
  {
    id: 507,
    name: "로스앤젤레스",
    name_en: "Los Angeles",
    country: "미국",
    country_en: "USA",
    lat: 34.0522,
    lng: -118.2437,
    category: "adventure",
    desc: "할리우드의 글래머러스한 매력과 연중 따뜻한 캘리포니아의 햇살이 가득한 천사의 도시입니다. 해변에서 롤러스케이트를 타는 여유가 있습니다.",
    keywords: [
      "대륙",
      "대도시",
      "휴양",
      "액티비티"
    ]
  },
  {
    id: 508,
    name: "통가",
    name_en: "Tonga",
    country: "통가",
    country_en: "Tonga",
    lat: -21.179,
    lng: -175.1982,
    category: "adventure",
    desc: "남태평양 유일의 왕국입니다. 매년 혹등고래가 짝짓기를 위해 찾아오는 경이로운 생태의 현장을 목격할 수 있습니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "액티비티",
      "역사/문화"
    ]
  },
  {
    id: 509,
    name: "베를린",
    name_en: "Berlin",
    country: "독일",
    country_en: "Germany",
    lat: 52.52,
    lng: 13.405,
    category: "adventure",
    desc: "분단의 아픔을 이겨내고 세계에서 가장 힙한 언더그라운드 클럽과 전위적인 예술가들이 모여드는 자유롭고 쿨한 독일의 수도입니다.",
    keywords: [
      "대륙",
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    id: 510,
    name: "레위니옹",
    name_en: "La Reunion",
    country: "프랑스령 레위니옹",
    country_en: "La Reunion",
    lat: -21.1151,
    lng: 55.5364,
    category: "adventure",
    desc: "인도양의 알프스라 불리는 프랑스령 화산섬입니다. 활화산 등반과 헬기 투어 등 스릴 넘치는 대자연의 경관을 뽐냅니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "액티비티"
    ]
  },
  {
    id: 511,
    name: "서울",
    name_en: "Seoul",
    country: "한국",
    country_en: "South Korea",
    lat: 37.5665,
    lng: 126.978,
    category: "adventure",
    desc: "잠들지 않는 역동성의 도시입니다. 600년 역사의 고궁 주변으로 화려한 스카이라인과 최첨단 트렌드가 쉴 새 없이 교차합니다.",
    keywords: [
      "대륙",
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    id: 512,
    name: "바누아투",
    name_en: "Vanuatu",
    country: "바누아투",
    country_en: "Vanuatu",
    lat: -15.3767,
    lng: 166.9592,
    category: "adventure",
    desc: "활화산을 가까이서 볼 수 있는 모험의 섬입니다. 원시 부족의 문화와 자연 그대로의 생태계가 매력적입니다.",
    keywords: [
      "대륙",
      "자연/오지",
      "액티비티",
      "역사/문화"
    ]
  }
];
