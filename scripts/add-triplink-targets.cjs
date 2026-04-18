const fs = require('fs');
const path = require('path');

const newSpots = [
  {
    "id": 321,
    "slug": "da-nang",
    "name": "다낭",
    "name_en": "Da Nang",
    "country": "베트남",
    "country_en": "Vietnam",
    "lat": 16.0544,
    "lng": 108.2022,
    "tier": 2,
    "popularity": 85,
    "continent": "asia",
    "categories": ["paradise", "urban"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "아름다운 해변과 저렴한 물가로 한국인에게 가장 사랑받는 베트남 대표 휴양지입니다. 인근 호이안과 연계하여 가족 여행으로 완벽한 코스를 자랑합니다.",
    "keywords": ["아시아", "가족여행", "가성비", "해변", "효도여행"]
  },
  {
    "id": 322,
    "slug": "sapporo",
    "name": "삿포로",
    "name_en": "Sapporo",
    "country": "일본",
    "country_en": "Japan",
    "lat": 43.0618,
    "lng": 141.3545,
    "tier": 2,
    "popularity": 80,
    "continent": "asia",
    "categories": ["urban", "nature"],
    "primaryCategory": "urban",
    "category": "urban",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "눈의 왕국 홋카이도의 중심지입니다. 겨울에는 아름다운 설경과 눈축제를, 여름에는 시원하고 쾌적한 날씨 속에서 라벤더 축제를 즐길 수 있습니다.",
    "keywords": ["아시아", "겨울여행", "설경", "미식", "가족여행"]
  },
  {
    "id": 323,
    "slug": "osaka",
    "name": "오사카",
    "name_en": "Osaka",
    "country": "일본",
    "country_en": "Japan",
    "lat": 34.6937,
    "lng": 135.5023,
    "tier": 1,
    "popularity": 92,
    "continent": "asia",
    "categories": ["urban", "culture"],
    "primaryCategory": "urban",
    "category": "urban",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "'먹다가 망한다'는 말이 있을 정도로 식도락 여행의 성지입니다. 도톤보리의 화려한 네온사인과 유니버설 스튜디오 재팬, 그리고 인근 교토와의 접근성이 뛰어납니다.",
    "keywords": ["아시아", "미식", "유니버설스튜디오", "도톤보리", "가족여행"]
  },
  {
    "id": 324,
    "slug": "fukuoka",
    "name": "후쿠오카",
    "name_en": "Fukuoka",
    "country": "일본",
    "country_en": "Japan",
    "lat": 33.5902,
    "lng": 130.4017,
    "tier": 2,
    "popularity": 88,
    "continent": "asia",
    "categories": ["urban"],
    "primaryCategory": "urban",
    "category": "urban",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "한국에서 가장 가깝고 가볍게 떠날 수 있는 일본의 미식 도시입니다. 돈코츠 라멘의 본고장이자, 나카스 포장마차 거리에서 현지의 밤 문화를 만끽할 수 있습니다.",
    "keywords": ["아시아", "단거리", "미식", "온천", "효도여행"]
  },
  {
    "id": 325,
    "slug": "qingdao",
    "name": "칭다오",
    "name_en": "Qingdao",
    "country": "중국",
    "country_en": "China",
    "lat": 36.0671,
    "lng": 120.3826,
    "tier": 2,
    "popularity": 70,
    "continent": "asia",
    "categories": ["urban", "culture"],
    "primaryCategory": "urban",
    "category": "urban",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "붉은 지붕과 푸른 바다가 어우러져 '동양의 나폴리'라 불립니다. 세계적인 명성의 칭다오 맥주와 함께 유럽풍 건축물이 가득한 구시가지를 산책해보세요.",
    "keywords": ["아시아", "맥주", "청도", "유럽풍", "가족여행"]
  },
  {
    "id": 326,
    "slug": "dubrovnik",
    "name": "두브로브니크",
    "name_en": "Dubrovnik",
    "country": "크로아티아",
    "country_en": "Croatia",
    "lat": 42.6507,
    "lng": 18.0944,
    "tier": 1,
    "popularity": 86,
    "continent": "europe",
    "categories": ["culture", "paradise"],
    "primaryCategory": "culture",
    "category": "culture",
    "showOnGlobe": true,
    "denseRegion": "europe",
    "desc": "아드리아 해의 진주라 불리는 아름다운 성벽 도시입니다. 붉은 지붕들 사이로 펼쳐지는 짙푸른 바다의 풍경은 '왕좌의 게임' 촬영지로도 유명합니다.",
    "keywords": ["유럽", "아드리아해", "성벽투어", "왕좌의게임", "유럽소도시"]
  },
  {
    "id": 327,
    "slug": "saipan",
    "name": "사이판",
    "name_en": "Saipan",
    "country": "북마리아나 제도",
    "country_en": "Northern Mariana Islands",
    "lat": 15.1909,
    "lng": 145.7467,
    "tier": 2,
    "popularity": 82,
    "continent": "oceania",
    "categories": ["paradise"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": true,
    "denseRegion": null,
    "desc": "때묻지 않은 자연과 맑은 바다를 간직한 가족 휴양의 성지입니다. 마나가하 섬에서의 스노클링과 별빛 투어는 잊지 못할 추억을 선사합니다.",
    "keywords": ["오세아니아", "마나가하섬", "휴양지", "스노클링", "가족여행"]
  },
  {
    "id": 328,
    "slug": "phu-quoc",
    "name": "푸꾸옥",
    "name_en": "Phu Quoc",
    "country": "베트남",
    "country_en": "Vietnam",
    "lat": 10.2289,
    "lng": 103.9573,
    "tier": 2,
    "popularity": 84,
    "continent": "asia",
    "categories": ["paradise"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "베트남의 몰디브라 불리는 청정 섬입니다. 세계에서 가장 긴 해상 케이블카를 타고 환상적인 일몰을 감상하며 고급 리조트에서 여유를 만끽하세요.",
    "keywords": ["아시아", "휴양지", "일몰", "케이블카", "신혼여행"]
  },
  {
    "id": 329,
    "slug": "kota-kinabalu",
    "name": "코타키나발루",
    "name_en": "Kota Kinabalu",
    "country": "말레이시아",
    "country_en": "Malaysia",
    "lat": 5.9804,
    "lng": 116.0735,
    "tier": 2,
    "popularity": 81,
    "continent": "asia",
    "categories": ["paradise", "nature"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": true,
    "denseRegion": "east-asia",
    "desc": "세계 3대 석양으로 꼽히는 황홀한 일몰과 함께, 반딧불이 투어로 신비로운 대자연을 체험할 수 있는 완벽한 힐링 여행지입니다.",
    "keywords": ["아시아", "세계3대석양", "반딧불이", "휴양지", "가족여행"]
  },
  {
    "id": 330,
    "slug": "honolulu",
    "name": "호놀룰루",
    "name_en": "Honolulu",
    "country": "미국",
    "country_en": "United States",
    "lat": 21.3099,
    "lng": -157.8581,
    "tier": 1,
    "popularity": 89,
    "continent": "north_america",
    "categories": ["paradise", "urban"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": true,
    "denseRegion": null,
    "desc": "와이키키 해변의 활기와 다이아몬드 헤드의 장관이 어우러진 하와이의 심장입니다. 세계 최고의 휴양과 쇼핑, 대자연의 경이로움을 동시에 누릴 수 있습니다.",
    "keywords": ["북미", "와이키키", "하와이", "쇼핑", "신혼여행"]
  }
];

const targetPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
let fileContent = fs.readFileSync(targetPath, 'utf8');

// Find the end of the array
const lastBracketIndex = fileContent.lastIndexOf(']');
if (lastBracketIndex !== -1) {
  // Convert new objects to string
  const newSpotsStr = newSpots.map(spot => JSON.stringify(spot, null, 2).split('\n').map(line => '  ' + line).join('\n')).join(',\n');

  // Check if we need a comma before adding
  const arrayContent = fileContent.substring(0, lastBracketIndex).trim();
  const needsComma = !arrayContent.endsWith(',');

  const contentToInsert = (needsComma ? ',\n' : '\n') + newSpotsStr + '\n';

  const finalContent = fileContent.substring(0, lastBracketIndex) + contentToInsert + fileContent.substring(lastBracketIndex);

  fs.writeFileSync(targetPath, finalContent, 'utf8');
  console.log('Successfully added 10 missing travel spots.');
} else {
  console.log('Error: Could not find the end of the TRAVEL_SPOTS array.');
}
