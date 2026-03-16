// src/pages/Home/data/citiesData.js
// 🚨 [Fix/New] 수정 이유:
// 1. [Data Enrichment] 꼬꼬무 검색의 '대륙 교차 필터링'을 위한 6대 핵심 범용 태그(tags) 일괄 주입 완료
// 2. [Fact Check] 60개의 주요 랜드마크를 travelSpots.js(아이콘 마커)로 승격시키고, 텍스트 라벨 중복(데이터 겹침)을 방지하기 위해 완전히 분리(삭제)함.

export const citiesData = [
  {
    "name": "대서양",
    "name_en": "Atlantic Ocean",
    "slug": "atlantic-ocean",
    "country": "바다",
    "country_en": "Ocean",
    "lat": 10,
    "lng": -30,
    "priority": 1,
    "desc": "아메리카 대륙과 유럽, 아프리카를 잇는 역동적인 바다입니다. 대항해 시대의 역사와 수많은 이야기를 품고 있습니다.",
    "tags": [
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    "name": "북대서양",
    "name_en": "North Atlantic",
    "slug": "north-atlantic",
    "country": "바다",
    "country_en": "Ocean",
    "lat": 45,
    "lng": -30,
    "priority": 1,
    "desc": "차갑고 거친 파도 속에서도 수많은 해양 생명체가 살아 숨 쉬는 북반구의 거대한 해양 루트입니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "남극해",
    "name_en": "Southern Ocean",
    "slug": "southern-ocean",
    "country": "바다",
    "country_en": "Ocean",
    "lat": -65,
    "lng": 120,
    "priority": 1,
    "desc": "남극 대륙을 둘러싸고 있는 세상에서 가장 춥고 거친 바다입니다. 고래와 펭귄 등 극지방 생물들의 든든한 서식처입니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "아이투타키",
    "name_en": "Aitutaki",
    "slug": "aitutaki",
    "country": "쿡 제도",
    "country_en": "Cook Islands",
    "lat": -18.8579,
    "lng": -159.7853,
    "priority": 2,
    "desc": "세계에서 가장 아름다운 라군 중 하나를 보유한 섬입니다. 투명한 청록색 바다 위 프라이빗한 휴양을 선사합니다.",
    "tags": [
      "휴양",
      "낭만"
    ]
  },
  {
    "name": "모오레아",
    "name_en": "Moorea",
    "slug": "moorea",
    "country": "프랑스령 폴리네시아",
    "country_en": "French Polynesia",
    "lat": -17.5388,
    "lng": -149.8295,
    "priority": 2,
    "desc": "타히티 섬 근처에 위치한 화산섬으로, 뾰족한 산봉우리와 짙은 녹음이 빚어내는 극적인 풍경이 일품입니다.",
    "tags": [
      "휴양",
      "자연/오지"
    ]
  },
  {
    "name": "솔로몬 제도",
    "name_en": "Solomon Islands",
    "slug": "solomon-islands",
    "country": "솔로몬 제도",
    "country_en": "Solomon Islands",
    "lat": -9.6457,
    "lng": 160.1562,
    "priority": 2,
    "desc": "제2차 세계대전의 역사가 바다 아래 잠들어 있는 곳으로, 난파선 다이빙의 성지이자 오염되지 않은 미지의 군도입니다.",
    "tags": [
      "자연/오지",
      "액티비티",
      "역사/문화"
    ]
  },
  {
    "name": "투발루",
    "name_en": "Tuvalu",
    "slug": "tuvalu",
    "country": "투발루",
    "country_en": "Tuvalu",
    "lat": -7.1095,
    "lng": 177.6493,
    "priority": 2,
    "desc": "기후 변화로 인해 사라질 위기에 처한 산호섬 국가입니다. 눈부시게 맑은 바다 이면에 자연 보호의 절실함을 일깨워줍니다.",
    "tags": [
      "자연/오지",
      "휴양"
    ]
  },
  {
    "name": "키리바시",
    "name_en": "Kiribati",
    "slug": "kiribati",
    "country": "키리바시",
    "country_en": "Kiribati",
    "lat": 1.8709,
    "lng": -157.3632,
    "priority": 2,
    "desc": "세계에서 가장 먼저 해가 뜨는 나라입니다. 적도 부근의 맑은 바다와 여유로운 섬 생활의 정수를 경험할 수 있습니다.",
    "tags": [
      "자연/오지",
      "휴양"
    ]
  },
  {
    "name": "마셜 제도",
    "name_en": "Marshall Islands",
    "slug": "marshall-islands",
    "country": "마셜 제도",
    "country_en": "Marshall Islands",
    "lat": 7.1315,
    "lng": 171.1845,
    "priority": 2,
    "desc": "천여 개의 산호섬과 환초로 이루어진 곳입니다. 투명한 바다와 독특한 미크로네시아 문화를 엿볼 수 있습니다.",
    "tags": [
      "휴양",
      "자연/오지"
    ]
  },
  {
    "name": "핏케언 제도",
    "name_en": "Pitcairn Islands",
    "slug": "pitcairn-islands",
    "country": "영국령 핏케언 제도",
    "country_en": "Pitcairn Islands",
    "lat": -25.0667,
    "lng": -130.1,
    "priority": 2,
    "desc": "바운티호의 반란 선원들이 정착한 역사를 지닌 곳으로, 지구상에서 인구가 가장 적고 고립된 영토 중 하나입니다.",
    "tags": [
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    "name": "소코트라 섬",
    "name_en": "Socotra",
    "slug": "socotra",
    "country": "예멘",
    "country_en": "Yemen",
    "lat": 12.4634,
    "lng": 53.8237,
    "priority": 2,
    "desc": "기괴한 우산 모양의 용혈수 나무가 자라는 예멘의 외딴 섬입니다. 마치 다른 행성에 불시착한 듯한 독보적인 생태계를 지녔습니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "라자암팟",
    "name_en": "Raja Ampat",
    "slug": "raja-ampat",
    "country": "인도네시아",
    "country_en": "Indonesia",
    "lat": -0.2333,
    "lng": 130.5167,
    "priority": 2,
    "desc": "인도네시아 파푸아에 위치한 세계 해양 생물 다양성의 진원지입니다. 다이버들에게는 최후의 성지이자 궁극의 목표로 불립니다.",
    "tags": [
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "코모도 섬",
    "name_en": "Komodo",
    "slug": "komodo",
    "country": "인도네시아",
    "country_en": "Indonesia",
    "lat": -8.5569,
    "lng": 119.4374,
    "priority": 2,
    "desc": "현존하는 마지막 공룡이라 불리는 코모도왕도마뱀의 서식지입니다. 독특한 핑크 비치와 스펙터클한 조류 다이빙 포인트가 있습니다.",
    "tags": [
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "마데이라",
    "name_en": "Madeira",
    "slug": "madeira",
    "country": "포르투갈",
    "country_en": "Portugal",
    "lat": 32.7607,
    "lng": -16.9595,
    "priority": 2,
    "desc": "대서양의 진주로 불리며, 일 년 내내 봄날 같은 날씨를 자랑합니다. 울창한 숲을 따라 걷는 레바다(Levada) 하이킹이 유명합니다.",
    "tags": [
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "카보베르데",
    "name_en": "Cape Verde",
    "slug": "cape-verde",
    "country": "카보베르데",
    "country_en": "Cape Verde",
    "lat": 16.5388,
    "lng": -23.0418,
    "priority": 2,
    "desc": "서아프리카 앞바다에 위치한 섬나라로, 아프리카와 브라질 문화가 매혹적으로 혼합된 독특한 음악과 해변의 고향입니다.",
    "tags": [
      "휴양",
      "역사/문화"
    ]
  },
  {
    "name": "페르난두 지 노로냐",
    "name_en": "Fernando de Noronha",
    "slug": "fernando-de-noronha",
    "country": "브라질",
    "country_en": "Brazil",
    "lat": -3.8577,
    "lng": -32.4242,
    "priority": 2,
    "desc": "엄격한 환경 보호로 하루 입장객을 제한하는 브라질 최고의 청정 섬입니다. 야생 돌고래 떼와 수영할 수 있는 기적의 바다입니다.",
    "tags": [
      "자연/오지",
      "휴양"
    ]
  },
  {
    "name": "페로 제도",
    "name_en": "Faroe Islands",
    "slug": "faroe-islands",
    "country": "페로 제도",
    "country_en": "Faroe Islands",
    "lat": 61.8926,
    "lng": -6.9118,
    "priority": 2,
    "desc": "아이슬란드와 노르웨이 사이의 척박하고 거친 화산섬입니다. 절벽 위 호수와 초록 지붕을 이고 있는 집들이 압도적인 자연미를 보여줍니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "그린란드",
    "name_en": "Greenland",
    "slug": "greenland",
    "country": "그린란드",
    "country_en": "Greenland",
    "lat": 71.7069,
    "lng": -42.6043,
    "priority": 2,
    "desc": "세계에서 가장 큰 섬이자 영토의 대부분이 거대한 빙상으로 덮인 곳입니다. 웅장한 빙산 사이로 고래들이 유영하는 장관을 볼 수 있습니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "일룰리사트",
    "name_en": "Ilulissat",
    "slug": "ilulissat",
    "country": "그린란드",
    "country_en": "Greenland",
    "lat": 69.2167,
    "lng": -51.1,
    "priority": 2,
    "desc": "그린란드에서 가장 활발하게 거대한 빙산들이 부서져 바다로 떠내려가는 아이스피오르드가 있는 유네스코 세계자연유산입니다.",
    "tags": [
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    "name": "남극점",
    "name_en": "South Pole",
    "slug": "south-pole",
    "country": "남극",
    "country_en": "Antarctica",
    "lat": -90,
    "lng": 0,
    "priority": 2,
    "desc": "지구의 최남단 좌표입니다. 극한의 추위 속에서 수많은 탐험가들의 피와 땀이 서려 있는 도달하기 가장 어려운 극지방입니다.",
    "tags": [
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "맥머도 기지",
    "name_en": "McMurdo Station",
    "slug": "mcmurdo-station",
    "country": "남극",
    "country_en": "Antarctica",
    "lat": -77.8463,
    "lng": 166.6682,
    "priority": 2,
    "desc": "남극에서 가장 큰 과학 연구 기지입니다. 하얀 얼음 사막 위에서 우주와 기후의 비밀을 풀기 위해 연구자들이 거주하는 곳입니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "어센션 섬",
    "name_en": "Ascension",
    "slug": "ascension",
    "country": "영국령 어센션 섬",
    "country_en": "Ascension Island",
    "lat": -7.9467,
    "lng": -14.3733,
    "priority": 2,
    "desc": "남대서양 한가운데 솟아오른 거친 화산섬입니다. 우주 통신 기지와 거북이 산란지로 유명한 전략적이고 독특한 요충지입니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "트리스탄 다 쿠냐",
    "name_en": "Tristan da Cunha",
    "slug": "tristan-da-cunha",
    "country": "영국령 트리스탄 다 쿠냐",
    "country_en": "Tristan da Cunha",
    "lat": -37.1052,
    "lng": -12.2777,
    "priority": 2,
    "desc": "지구상에서 가장 외딴 유인도로 기네스북에 등재된 남대서양의 섬입니다. 문명과 완전히 단절된 극한의 오지 탐험을 상징합니다.",
    "tags": [
      "자연/오지"
    ]
  },
  {
    "name": "베이징",
    "name_en": "Beijing",
    "slug": "beijing",
    "country": "중국",
    "country_en": "China",
    "lat": 39.9042,
    "lng": 116.4073,
    "priority": 2,
    "desc": "만리장성과 자금성을 품고 있는 거대한 스케일의 도시입니다. 수천 년 대륙의 장대한 역사와 현재의 발전상이 공존합니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "상하이",
    "name_en": "Shanghai",
    "slug": "shanghai",
    "country": "중국",
    "country_en": "China",
    "lat": 31.2304,
    "lng": 121.4737,
    "priority": 2,
    "desc": "황푸강을 화려하게 수놓은 와이탄의 야경이 압도적인 금융 중심지입니다. 동양의 파리라 불렸던 근대적 매력이 남아있습니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "노보시비르스크",
    "name_en": "Novosibirsk",
    "slug": "novosibirsk",
    "country": "러시아",
    "country_en": "Russia",
    "lat": 55.0084,
    "lng": 82.9357,
    "priority": 2,
    "desc": "끝없이 펼쳐진 시베리아의 수도이자 학문의 도시입니다. 시베리아 횡단 열차가 쉬어가는 거대한 내륙의 오아시스입니다.",
    "tags": [
      "대도시",
      "자연/오지"
    ]
  },
  {
    "name": "블라디보스토크",
    "name_en": "Vladivostok",
    "slug": "vladivostok",
    "country": "러시아",
    "country_en": "Russia",
    "lat": 43.1198,
    "lng": 131.8869,
    "priority": 2,
    "desc": "가장 가까운 유럽이라 불리는 극동 러시아의 항구입니다. 시베리아 횡단 열차의 장대한 출발점이자 종착역입니다.",
    "tags": [
      "대도시",
      "낭만"
    ]
  },
  {
    "name": "이르쿠츠크",
    "name_en": "Irkutsk",
    "slug": "irkutsk",
    "country": "러시아",
    "country_en": "Russia",
    "lat": 52.287,
    "lng": 104.305,
    "priority": 2,
    "desc": "시베리아의 파리라 불리며, 세계에서 가장 깊은 민물 호수인 신비로운 바이칼 호수로 향하는 관문 도시입니다.",
    "tags": [
      "대도시",
      "자연/오지",
      "낭만"
    ]
  },
  {
    "name": "아스타나",
    "name_en": "Astana",
    "slug": "astana",
    "country": "카자흐스탄",
    "country_en": "Kazakhstan",
    "lat": 51.1694,
    "lng": 71.4491,
    "priority": 2,
    "desc": "중앙아시아의 대초원 위에 세워진 초현대적인 미래 도시입니다. 독특하고 거대한 랜드마크들이 SF 영화 속 한 장면을 연상시킵니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "타슈켄트",
    "name_en": "Tashkent",
    "slug": "tashkent",
    "country": "우즈베키스탄",
    "country_en": "Uzbekistan",
    "lat": 41.2995,
    "lng": 69.2401,
    "priority": 2,
    "desc": "실크로드의 교차로이자 우즈베키스탄의 활기찬 수도입니다. 이슬람 사원과 소련식 건축물이 묘한 앙상블을 이룹니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "테헤란",
    "name_en": "Tehran",
    "slug": "tehran",
    "country": "이란",
    "country_en": "Iran",
    "lat": 35.6892,
    "lng": 51.389,
    "priority": 2,
    "desc": "만년설이 쌓인 알보르즈 산맥 아래 펼쳐진 이란의 대도시입니다. 화려한 바자르(시장)와 페르시아 제국의 장엄한 유물이 가득합니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "뭄바이",
    "name_en": "Mumbai",
    "slug": "mumbai",
    "country": "인도",
    "country_en": "India",
    "lat": 19.076,
    "lng": 72.8777,
    "priority": 2,
    "desc": "발리우드의 고향이자 인도에서 가장 부유하면서도 복잡한 에너지를 뿜어내는 해안 도시입니다. 식민지 시대의 웅장한 건축물이 남아 있습니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    "name": "뉴델리",
    "name_en": "New Delhi",
    "slug": "new-delhi",
    "country": "인도",
    "country_en": "India",
    "lat": 28.6139,
    "lng": 77.209,
    "priority": 2,
    "desc": "인도의 수도로, 혼돈 속의 질서를 느낄 수 있는 강렬한 매력의 도시입니다. 소와 자동차가 뒤엉킨 거리 너머로 찬란한 무굴 제국의 유산이 돋보입니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "방콕",
    "name_en": "Bangkok",
    "slug": "bangkok",
    "country": "태국",
    "country_en": "Thailand",
    "lat": 13.7563,
    "lng": 100.5018,
    "priority": 2,
    "desc": "배낭여행자들의 영원한 성지, 카오산 로드가 있는 태국의 심장입니다. 길거리 미식의 천국이자 화려한 불교 사원이 여행자를 반깁니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    "name": "자카르타",
    "name_en": "Jakarta",
    "slug": "jakarta",
    "country": "인도네시아",
    "country_en": "Indonesia",
    "lat": -6.2088,
    "lng": 106.8456,
    "priority": 2,
    "desc": "수천만 명의 인구가 밀집한 인도네시아의 거대한 메트로폴리스입니다. 고층 빌딩과 열대의 열기가 뒤섞인 아시아의 다이너모입니다.",
    "tags": [
      "대도시",
      "액티비티"
    ]
  },
  {
    "name": "마닐라",
    "name_en": "Manila",
    "slug": "manila",
    "country": "필리핀",
    "country_en": "Philippines",
    "lat": 14.5995,
    "lng": 120.9842,
    "priority": 2,
    "desc": "스페인 식민 시대의 유적지 인트라무로스가 보존된 성벽 도시입니다. 아름다운 마닐라 베이의 석양은 필리핀 여행의 백미입니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "팀북투",
    "name_en": "Timbuktu",
    "slug": "timbuktu",
    "country": "말리",
    "country_en": "Mali",
    "lat": 16.7666,
    "lng": -3.0026,
    "priority": 2,
    "desc": "과거 황금 무역의 중심지였던 서아프리카 말리의 전설적인 사막 도시입니다. 흙으로 빚은 진흙 모스크가 신비로운 분위기를 자아냅니다.",
    "tags": [
      "역사/문화",
      "자연/오지"
    ]
  },
  {
    "name": "다카르",
    "name_en": "Dakar",
    "slug": "dakar",
    "country": "세네갈",
    "country_en": "Senegal",
    "lat": 14.7167,
    "lng": -17.4677,
    "priority": 2,
    "desc": "대서양을 마주한 세네갈의 활기찬 항구 도시입니다. 다카르 랠리의 출발점으로 유명하며 강렬한 아프리카 예술의 색채를 띠고 있습니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    "name": "라고스",
    "name_en": "Lagos",
    "slug": "lagos",
    "country": "나이지리아",
    "country_en": "Nigeria",
    "lat": 6.5244,
    "lng": 3.3792,
    "priority": 2,
    "desc": "아프리카 대륙에서 가장 빠르게 성장하는 나이지리아의 메가시티입니다. 엄청난 인파와 함께 강력한 아프리카 비트가 도시를 울립니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "아디스아바바",
    "name_en": "Addis Ababa",
    "slug": "addis-ababa",
    "country": "에티오피아",
    "country_en": "Ethiopia",
    "lat": 9.0331,
    "lng": 38.7444,
    "priority": 2,
    "desc": "새로운 꽃이라는 뜻을 가진 에티오피아의 수도입니다. 진한 향기의 커피 원조국이며, 아프리카 연합의 본부가 있는 정치적 심장입니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "킨샤사",
    "name_en": "Kinshasa",
    "slug": "kinshasa",
    "country": "콩고민주공화국",
    "country_en": "DR Congo",
    "lat": -4.4419,
    "lng": 15.2663,
    "priority": 2,
    "desc": "콩고 강을 끼고 형성된 중앙아프리카 최대의 음악과 예술의 도시입니다. 거칠지만 에너지가 넘치는 룸바 댄스의 진원지입니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "밴쿠버",
    "name_en": "Vancouver",
    "slug": "vancouver",
    "country": "캐나다",
    "country_en": "Canada",
    "lat": 49.2827,
    "lng": -123.1207,
    "priority": 2,
    "desc": "눈 덮인 로키산맥과 푸른 바다를 동시에 즐길 수 있는 세계에서 가장 살기 좋은 도시 중 하나입니다. 대자연 속 도시 라이프의 정석입니다.",
    "tags": [
      "대도시",
      "자연/오지",
      "휴양"
    ]
  },
  {
    "name": "멕시코시티",
    "name_en": "Mexico City",
    "slug": "mexico-city",
    "country": "멕시코",
    "country_en": "Mexico",
    "lat": 19.4326,
    "lng": -99.1332,
    "priority": 2,
    "desc": "과거 아즈텍 문명의 거대한 호수 위에 지어진 고지대 메가시티입니다. 강렬한 색채의 프리다 칼로 예술과 매운 타코의 맛이 강렬합니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "아바나",
    "name_en": "Havana",
    "slug": "havana",
    "country": "쿠바",
    "country_en": "Cuba",
    "lat": 23.1136,
    "lng": -82.3666,
    "priority": 2,
    "desc": "시간이 멈춘 듯한 올드카들이 시가를 문 사람들을 태우고 달리는 쿠바의 낭만 도시입니다. 해변의 방파제 말레콘에서 듣는 라틴 음악이 매력적입니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "보고타",
    "name_en": "Bogota",
    "slug": "bogota",
    "country": "콜롬비아",
    "country_en": "Colombia",
    "lat": 4.711,
    "lng": -74.0721,
    "priority": 2,
    "desc": "안데스 산맥 해발 2,600m에 위치한 콜롬비아의 수도입니다. 그래피티로 가득한 골목과 황금 박물관이 여행자의 시선을 사로잡습니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "아마존 분지",
    "name_en": "Amazon Basin",
    "slug": "amazon-basin",
    "country": "브라질",
    "country_en": "Brazil",
    "lat": -3.4653,
    "lng": -62.2159,
    "priority": 2,
    "desc": "지구의 허파라 불리는 세계 최대의 열대 우림입니다. 미지의 정글 속에서 분홍 돌고래와 희귀한 야생 동식물을 마주할 수 있는 생태의 보고입니다.",
    "tags": [
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "리마",
    "name_en": "Lima",
    "slug": "lima",
    "country": "페루",
    "country_en": "Peru",
    "lat": -12.0464,
    "lng": -77.0428,
    "priority": 2,
    "desc": "태평양 해안 절벽 위에 세워진 페루의 수도입니다. 남미 최고의 미식 도시로 꼽히며, 마추픽추로 향하는 잉카 탐험의 거대한 출발점입니다.",
    "tags": [
      "대도시",
      "역사/문화"
    ]
  },
  {
    "name": "산티아고",
    "name_en": "Santiago",
    "slug": "santiago",
    "country": "칠레",
    "country_en": "Chile",
    "lat": -33.4489,
    "lng": -70.6693,
    "priority": 2,
    "desc": "눈 덮인 안데스 산맥이 병풍처럼 둘러싸고 있는 칠레의 수도입니다. 훌륭한 와이너리 투어와 현대적인 남미의 라이프스타일을 엿볼 수 있습니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "파리",
    "name_en": "Paris",
    "slug": "paris",
    "country": "프랑스",
    "country_en": "France",
    "lat": 48.8566,
    "lng": 2.3522,
    "priority": 2,
    "desc": "에펠탑이 반짝이는 예술과 낭만의 절대적 상징입니다. 센 강변을 걷거나 노천카페에 앉아 바게트와 와인을 즐기는 것만으로도 영화의 주인공이 됩니다.",
    "tags": [
      "대도시",
      "낭만",
      "역사/문화"
    ]
  },
  {
    "name": "오슬로",
    "name_en": "Oslo",
    "slug": "oslo",
    "country": "노르웨이",
    "country_en": "Norway",
    "lat": 59.9139,
    "lng": 10.7522,
    "priority": 2,
    "desc": "깨끗한 피오르드 자연환경과 혁신적인 스칸디나비아 디자인이 어우러진 노르웨이의 평화로운 수도입니다. 바이킹의 역사와 뭉크의 절규를 만날 수 있습니다.",
    "tags": [
      "대도시",
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    "name": "레이캬비크",
    "name_en": "Reykjavik",
    "slug": "reykjavik",
    "country": "아이슬란드",
    "country_en": "Iceland",
    "lat": 64.1466,
    "lng": -21.9426,
    "priority": 2,
    "desc": "세계에서 가장 북쪽에 위치한 수도로, 오로라와 화산 지대 탐험의 베이스캠프입니다. 동화 같은 색감의 집들이 아기자기하게 모여 있습니다.",
    "tags": [
      "대도시",
      "자연/오지",
      "낭만"
    ]
  },
  {
    "name": "앨리스스프링스",
    "name_en": "Alice Springs",
    "slug": "alice-springs",
    "country": "호주",
    "country_en": "Australia",
    "lat": -23.698,
    "lng": 133.8807,
    "priority": 2,
    "desc": "호주 대륙 정중앙의 붉은 사막지대인 아웃백의 중심입니다. 거대한 붉은 바위 울루루를 보기 위해 전 세계 모험가들이 모여드는 거점입니다.",
    "tags": [
      "자연/오지",
      "역사/문화"
    ]
  },
  {
    "name": "퍼스",
    "name_en": "Perth",
    "slug": "perth",
    "country": "호주",
    "country_en": "Australia",
    "lat": -31.9505,
    "lng": 115.8605,
    "priority": 2,
    "desc": "서호주 특유의 느긋함과 쾌청한 날씨가 돋보이는 고립된 대도시입니다. 눈부시게 하얀 해변과 쿼카가 사는 로트네스트 섬으로 유명합니다.",
    "tags": [
      "대도시",
      "휴양",
      "자연/오지"
    ]
  },
  {
    "name": "다윈",
    "name_en": "Darwin",
    "slug": "darwin",
    "country": "호주",
    "country_en": "Australia",
    "lat": -12.4634,
    "lng": 130.8456,
    "priority": 2,
    "desc": "열대 기후를 띠는 호주 최북단의 거친 개척 마을 같은 도시입니다. 야생 악어 크루즈와 원시 대자연이 살아 숨 쉬는 카카두 국립공원으로 향하는 관문입니다.",
    "tags": [
      "대도시",
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "오클랜드",
    "name_en": "Auckland",
    "slug": "auckland",
    "country": "뉴질랜드",
    "country_en": "New Zealand",
    "lat": -36.8484,
    "lng": 174.7633,
    "priority": 2,
    "desc": "돛단의 도시라 불릴 만큼 수많은 요트가 정박해 있는 뉴질랜드 북섬의 최대 도시입니다. 화산 지형과 아름다운 항만이 완벽한 조화를 이룹니다.",
    "tags": [
      "대도시",
      "휴양",
      "자연/오지"
    ]
  },
  {
    "name": "크라이스트처치",
    "name_en": "Christchurch",
    "slug": "christchurch",
    "country": "뉴질랜드",
    "country_en": "New Zealand",
    "lat": -43.5321,
    "lng": 172.6362,
    "priority": 2,
    "desc": "영국 밖에서 가장 영국다운 도시라 불리며, 정원의 도시라는 별명답게 아름다운 꽃과 나무가 가득합니다. 남섬 빙하와 알프스 탐험의 출발점입니다.",
    "tags": [
      "대도시",
      "낭만",
      "자연/오지"
    ]
  },
  {
    "name": "길리 메노",
    "name_en": "Gili Meno",
    "slug": "gili-meno",
    "country": "인도네시아",
    "country_en": "Indonesia",
    "lat": -8.35,
    "lng": 116.0556,
    "offLat": -0.3,
    "offLng": 0.2,
    "priority": 2,
    "desc": "자동차와 오토바이가 없는 완벽한 청정 섬입니다. 바다거북과 함께 수영하고 해저 조각상을 탐험하는 로맨틱한 휴양지입니다.",
    "tags": [
      "휴양",
      "낭만",
      "자연/오지"
    ]
  },
  {
    "name": "세부",
    "name_en": "Cebu",
    "slug": "cebu",
    "country": "필리핀",
    "country_en": "Philippines",
    "lat": 10.3157,
    "lng": 123.8854,
    "priority": 2,
    "desc": "에메랄드빛 바다에서 거대한 고래상어와 헤엄치는 짜릿한 경험을 할 수 있는 필리핀의 대표적인 해양 액티비티 천국입니다.",
    "tags": [
      "휴양",
      "액티비티",
      "자연/오지"
    ]
  },
  {
    "name": "보라카이",
    "name_en": "Boracay",
    "slug": "boracay",
    "country": "필리핀",
    "country_en": "Philippines",
    "lat": 11.9674,
    "lng": 121.9248,
    "priority": 2,
    "desc": "세계 3대 해변으로 꼽히는 화이트 비치의 고운 모래와 붉은 돛단배 너머로 지는 황홀한 선셋이 여행객을 매혹합니다.",
    "tags": [
      "휴양",
      "낭만",
      "액티비티"
    ]
  },
  {
    "name": "보홀",
    "name_en": "Bohol",
    "slug": "bohol",
    "country": "필리핀",
    "country_en": "Philippines",
    "lat": 9.85,
    "lng": 124.1435,
    "offLat": -0.3,
    "offLng": 1,
    "priority": 2,
    "desc": "수백 개의 초콜릿 힐과 세계에서 가장 작은 안경원숭이를 만날 수 있는 곳입니다. 깨끗한 바다 속 거북이와 정어리 떼가 장관입니다.",
    "tags": [
      "휴양",
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "다낭",
    "name_en": "Da Nang",
    "slug": "da-nang",
    "country": "베트남",
    "country_en": "Vietnam",
    "lat": 16.0544,
    "lng": 108.2022,
    "priority": 2,
    "desc": "끝없이 펼쳐진 미케 해변과 바나힐의 이국적인 테마파크가 어우러진 베트남 최고의 휴양 도시입니다.",
    "tags": [
      "휴양",
      "대도시",
      "액티비티"
    ]
  },
  {
    "name": "나트랑",
    "name_en": "Nha Trang",
    "slug": "nha-trang",
    "country": "베트남",
    "country_en": "Vietnam",
    "lat": 12.2388,
    "lng": 109.1967,
    "priority": 2,
    "desc": "동양의 나폴리라 불리는 길게 뻗은 해안선과 머드 온천, 풍부한 해산물을 즐길 수 있는 가족 휴양의 성지입니다.",
    "tags": [
      "휴양",
      "대도시",
      "낭만"
    ]
  },
  {
    "name": "푸꾸옥",
    "name_en": "Phu Quoc",
    "slug": "phu-quoc",
    "country": "베트남",
    "country_en": "Vietnam",
    "lat": 10.2899,
    "lng": 103.984,
    "priority": 2,
    "desc": "베트남의 숨겨진 진주라 불리는 섬으로, 아름다운 석양과 함께 세계 최장 해상 케이블카를 타는 스릴을 만끽할 수 있습니다.",
    "tags": [
      "휴양",
      "액티비티",
      "낭만"
    ]
  },
  {
    "name": "치앙마이",
    "name_en": "Chiang Mai",
    "slug": "chiang-mai",
    "country": "태국",
    "country_en": "Thailand",
    "lat": 18.7953,
    "lng": 98.962,
    "priority": 2,
    "desc": "태국 북부의 평화로운 산악 도시입니다. 디지털 노마드들의 성지이자, 고즈넉한 사원과 트렌디한 카페가 골목마다 가득합니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "푸켓",
    "name_en": "Phuket",
    "slug": "phuket",
    "country": "태국",
    "country_en": "Thailand",
    "lat": 7.8804,
    "lng": 98.3922,
    "priority": 2,
    "desc": "안다만 해의 진주라 불리는 태국 최대의 휴양 섬입니다. 화려한 나이트라이프와 피피섬 등 아름다운 인근 섬 투어가 매력적입니다.",
    "tags": [
      "휴양",
      "액티비티",
      "낭만"
    ]
  },
  {
    "name": "사이판",
    "name_en": "Saipan",
    "slug": "saipan",
    "country": "미국",
    "country_en": "USA",
    "lat": 15.19,
    "lng": 145.7423,
    "priority": 2,
    "desc": "마나가하 섬의 투명한 바다와 그로토(Grotto) 동굴 다이빙이 유명한 곳으로, 훼손되지 않은 자연을 간직한 평화로운 섬입니다.",
    "tags": [
      "휴양",
      "액티비티",
      "자연/오지"
    ]
  },
  {
    "name": "인터라켄",
    "name_en": "Interlaken",
    "slug": "interlaken",
    "country": "스위스",
    "country_en": "Switzerland",
    "lat": 46.6863,
    "lng": 7.8632,
    "offLat": 0,
    "offLng": -1.5,
    "priority": 2,
    "desc": "두 호수 사이에 자리 잡은 알프스 액티비티의 중심지입니다. 융프라우로 향하는 산악 열차가 출발하는 동화 같은 마을입니다.",
    "tags": [
      "자연/오지",
      "액티비티",
      "낭만"
    ]
  },
  {
    "name": "취리히",
    "name_en": "Zurich",
    "slug": "zurich",
    "country": "스위스",
    "country_en": "Switzerland",
    "lat": 47.3769,
    "lng": 8.5417,
    "offLat": 0.5,
    "offLng": 0.3,
    "priority": 2,
    "desc": "스위스 최대의 도시이자 금융 중심지입니다. 맑은 호수와 중세풍의 구시가지가 어우러져 세련된 여유를 선사합니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "루체른",
    "name_en": "Lucerne",
    "slug": "lucerne",
    "country": "스위스",
    "country_en": "Switzerland",
    "lat": 47.0502,
    "lng": 8.3093,
    "offLat": -0.4,
    "offLng": 3.2,
    "priority": 2,
    "desc": "아름다운 카펠교와 로이스 강이 흐르는 낭만적인 도시입니다. 리기산과 필라투스 등 알프스의 명산들이 도시를 감싸고 있습니다.",
    "tags": [
      "대도시",
      "낭만",
      "자연/오지"
    ]
  },
  {
    "name": "체르마트",
    "name_en": "Zermatt",
    "slug": "zermatt",
    "country": "스위스",
    "country_en": "Switzerland",
    "lat": 46.0207,
    "lng": 7.7491,
    "offLat": -0.6,
    "offLng": -1.5,
    "priority": 2,
    "desc": "마테호른의 웅장한 자태를 감상할 수 있는 청정 마을입니다. 휘발유 차량 진입이 전면 금지되어 맑은 알프스의 공기를 자랑합니다.",
    "tags": [
      "자연/오지",
      "낭만",
      "액티비티"
    ]
  },
  {
    "name": "밀라노",
    "name_en": "Milan",
    "slug": "milan",
    "country": "이탈리아",
    "country_en": "Italy",
    "lat": 45.4642,
    "lng": 9.19,
    "offLat": -0.6,
    "offLng": 0.5,
    "priority": 2,
    "desc": "세계 패션과 디자인을 선도하는 트렌디한 도시입니다. 압도적인 규모의 밀라노 대성당과 최후의 만찬 벽화가 여행객을 압도합니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    "name": "피렌체",
    "name_en": "Florence",
    "slug": "florence",
    "country": "이탈리아",
    "country_en": "Italy",
    "lat": 43.7696,
    "lng": 11.2558,
    "offLat": -0.6,
    "offLng": 0,
    "priority": 2,
    "desc": "르네상스 예술이 찬란하게 피어난 낭만의 붉은 지붕 도시입니다. 우피치 미술관과 두오모 성당이 세월의 흔적을 간직하고 있습니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "베네치아",
    "name_en": "Venice",
    "slug": "venice",
    "country": "이탈리아",
    "country_en": "Italy",
    "lat": 45.4408,
    "lng": 12.3155,
    "priority": 2,
    "desc": "수많은 운하와 다리로 연결된 물의 도시입니다. 곤돌라를 타고 골목을 누비며 중세 공화국의 화려했던 영광을 마주합니다.",
    "tags": [
      "역사/문화",
      "낭만",
      "대도시"
    ]
  },
  {
    "name": "마드리드",
    "name_en": "Madrid",
    "slug": "madrid",
    "country": "스페인",
    "country_en": "Spain",
    "lat": 40.4168,
    "lng": -3.7038,
    "priority": 2,
    "desc": "스페인의 심장으로, 프라도 미술관과 거대한 왕궁이 웅장함을 더합니다. 열정적인 플라멩코와 타파스 투어의 본고장입니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    "name": "바르셀로나",
    "name_en": "Barcelona",
    "slug": "barcelona",
    "country": "스페인",
    "country_en": "Spain",
    "lat": 41.3851,
    "lng": 2.1734,
    "priority": 2,
    "desc": "천재 건축가 가우디의 도시입니다. 사그라다 파밀리아의 압도적인 조각과 지중해 해변의 활기찬 에너지가 교차합니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "휴양"
    ]
  },
  {
    "name": "세비야",
    "name_en": "Seville",
    "slug": "seville",
    "country": "스페인",
    "country_en": "Spain",
    "lat": 37.3891,
    "lng": -5.9845,
    "priority": 2,
    "desc": "안달루시아 지방의 매력이 짙게 밴 정열의 도시입니다. 세계에서 가장 큰 고딕 양식의 대성당과 화려한 스페인 광장이 돋보입니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "제주",
    "name_en": "Jeju",
    "slug": "jeju",
    "country": "한국",
    "country_en": "South Korea",
    "lat": 33.4996,
    "lng": 126.5312,
    "priority": 2,
    "desc": "화산 활동이 빚어낸 천혜의 자연을 간직한 평화의 섬입니다. 한라산과 맑은 바다, 독특한 오름들이 세계적인 휴양지를 완성합니다.",
    "tags": [
      "휴양",
      "자연/오지",
      "액티비티"
    ]
  },
  {
    "name": "부산",
    "name_en": "Busan",
    "slug": "busan",
    "country": "한국",
    "country_en": "South Korea",
    "lat": 35.1796,
    "lng": 129.0756,
    "priority": 2,
    "desc": "해운대의 화려한 마천루와 바다 내음 가득한 자갈치 시장이 공존하는 역동적인 항구 도시입니다. 매년 화려한 영화제가 열립니다.",
    "tags": [
      "대도시",
      "휴양",
      "액티비티"
    ]
  },
  {
    "name": "오사카",
    "name_en": "Osaka",
    "slug": "osaka",
    "country": "일본",
    "country_en": "Japan",
    "lat": 34.6937,
    "lng": 135.5023,
    "offLat": 1.5,
    "offLng": 1.5,
    "priority": 2,
    "desc": "먹다 지친다는 뜻의 쿠이다오레의 도시입니다. 도톤보리의 화려한 네온사인과 유니버설 스튜디오가 폭발적인 즐거움을 선사합니다.",
    "tags": [
      "대도시",
      "액티비티"
    ]
  },
  {
    "name": "후쿠오카",
    "name_en": "Fukuoka",
    "slug": "fukuoka",
    "country": "일본",
    "country_en": "Japan",
    "lat": 33.5902,
    "lng": 130.4017,
    "priority": 2,
    "desc": "따뜻한 돈코츠 라멘과 나카스 포장마차 거리가 유명한 규슈 최대의 도시입니다. 한국과 가장 가까운 매력적인 미식 여행지입니다.",
    "tags": [
      "대도시",
      "낭만",
      "액티비티"
    ]
  },
  {
    "name": "삿포로",
    "name_en": "Sapporo",
    "slug": "sapporo",
    "country": "일본",
    "country_en": "Japan",
    "lat": 43.0618,
    "lng": 141.3545,
    "priority": 2,
    "desc": "새하얀 눈과 맥주의 고향입니다. 세계적인 눈 축제와 질 좋은 유제품, 신선한 해산물이 홋카이도 여행의 진수를 보여줍니다.",
    "tags": [
      "대도시",
      "자연/오지",
      "낭만"
    ]
  },
  {
    "name": "오키나와",
    "name_en": "Okinawa",
    "slug": "okinawa",
    "country": "일본",
    "country_en": "Japan",
    "lat": 26.2124,
    "lng": 127.6809,
    "priority": 2,
    "desc": "동양의 하와이라 불리는 일본 최남단의 에메랄드빛 섬입니다. 고유한 류큐 왕국의 문화와 다이빙 명소들이 가득합니다.",
    "tags": [
      "휴양",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    "name": "교토",
    "name_en": "Kyoto",
    "slug": "kyoto",
    "country": "일본",
    "country_en": "Japan",
    "lat": 35.0116,
    "lng": 135.7681,
    "priority": 2,
    "desc": "일본 전통의 아름다움을 간직한 천년 고도입니다. 수많은 신사와 대나무 숲, 고즈넉한 찻집들이 평온한 시간을 선사합니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "타이베이",
    "name_en": "Taipei",
    "slug": "taipei",
    "country": "대만",
    "country_en": "Taiwan",
    "lat": 25.033,
    "lng": 121.5654,
    "priority": 2,
    "desc": "전통 야시장과 현대적인 마천루 타이베이 101이 공존하는 미식의 천국입니다. 친절한 사람들과 펑리수의 달콤함이 반겨줍니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "액티비티"
    ]
  },
  {
    "name": "가오슝",
    "name_en": "Kaohsiung",
    "slug": "kaohsiung",
    "country": "대만",
    "country_en": "Taiwan",
    "lat": 22.6273,
    "lng": 120.3014,
    "priority": 2,
    "desc": "대만 남부의 활기찬 항구 도시입니다. 보얼 예술 특구와 아름다운 류허 야시장이 여행자들에게 낭만적인 밤을 선물합니다.",
    "tags": [
      "대도시",
      "낭만",
      "액티비티"
    ]
  },
  {
    "name": "라스베이거스",
    "name_en": "Las Vegas",
    "slug": "las-vegas",
    "country": "미국",
    "country_en": "USA",
    "lat": 36.1699,
    "lng": -115.1398,
    "priority": 2,
    "desc": "사막 한가운데 세워진 세계 최고의 엔터테인먼트 도시입니다. 화려한 카지노와 메가톤급 쇼가 밤을 잊게 만듭니다.",
    "tags": [
      "대도시",
      "액티비티"
    ]
  },
  {
    "name": "샌프란시스코",
    "name_en": "San Francisco",
    "slug": "san-francisco",
    "country": "미국",
    "country_en": "USA",
    "lat": 37.7749,
    "lng": -122.4194,
    "priority": 2,
    "desc": "붉은 금문교와 안개가 어우러진 언덕의 도시입니다. 실리콘밸리의 혁신과 히피 문화가 독특하게 섞여 있습니다.",
    "tags": [
      "대도시",
      "문화/역사",
      "낭만"
    ]
  },
  {
    "name": "부다페스트",
    "name_en": "Budapest",
    "slug": "budapest",
    "country": "헝가리",
    "country_en": "Hungary",
    "lat": 47.4979,
    "lng": 19.0402,
    "priority": 2,
    "desc": "다뉴브 강의 진주라 불리는 헝가리의 수도입니다. 황금빛으로 물드는 국회의사당의 야경과 독특한 온천 문화가 유명합니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "암스테르담",
    "name_en": "Amsterdam",
    "slug": "amsterdam",
    "country": "네덜란드",
    "country_en": "Netherlands",
    "lat": 52.3676,
    "lng": 4.9041,
    "priority": 2,
    "desc": "거미줄처럼 얽힌 운하를 따라 자전거가 달리는 자유의 도시입니다. 고흐의 예술과 튤립의 향기가 여행객을 반깁니다.",
    "tags": [
      "대도시",
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "니스",
    "name_en": "Nice",
    "slug": "nice",
    "country": "프랑스",
    "country_en": "France",
    "lat": 43.7102,
    "lng": 7.262,
    "priority": 2,
    "desc": "프랑스 남부 코트다쥐르의 중심지입니다. 지중해의 눈부신 햇살과 자갈 해변을 걷는 프롬나드 데 장글레가 예술적입니다.",
    "tags": [
      "휴양",
      "낭만",
      "대도시"
    ]
  },
  {
    "name": "그라나다",
    "name_en": "Granada",
    "slug": "granada",
    "country": "스페인",
    "country_en": "Spain",
    "lat": 37.1773,
    "lng": -3.5986,
    "offLat": -0.5,
    "offLng": 0.2,
    "priority": 2,
    "desc": "이슬람 건축의 최고봉 알함브라 궁전이 도시를 내려다보는 안달루시아의 보석입니다. 기독교와 이슬람 문화의 융합입니다.",
    "tags": [
      "역사/문화",
      "낭만"
    ]
  },
  {
    "name": "골드코스트",
    "name_en": "Gold Coast",
    "slug": "gold-coast",
    "country": "호주",
    "country_en": "Australia",
    "lat": -28.0167,
    "lng": 153.4,
    "priority": 2,
    "desc": "끝없이 펼쳐진 황금빛 모래사장과 아찔한 테마파크가 가득한 호주의 휴양지입니다. 서퍼스 파라다이스의 파도가 여행객을 부릅니다.",
    "tags": [
      "휴양",
      "액티비티",
      "대도시"
    ]
  },
  {
    "name": "퀸스타운",
    "name_en": "Queenstown",
    "slug": "queenstown",
    "country": "뉴질랜드",
    "country_en": "New Zealand",
    "lat": -45.0312,
    "lng": 168.6626,
    "priority": 2,
    "desc": "거대한 빙하 호수와 만년설에 둘러싸인 뉴질랜드 남섬의 보석입니다. 번지점프와 스카이다이빙 등 익스트림 스포츠의 세계적 성지입니다.",
    "tags": [
      "자연/오지",
      "액티비티",
      "낭만"
    ]
  }
];
