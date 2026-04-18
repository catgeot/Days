const fs = require('fs');
const path = require('path');

const newSpots = [
  {
    "id": 331,
    "slug": "hokkaido",
    "name": "북해도",
    "name_en": "Hokkaido",
    "country": "일본",
    "country_en": "Japan",
    "lat": 43.2203,
    "lng": 142.8635,
    "tier": 2,
    "popularity": 85,
    "continent": "asia",
    "categories": ["nature", "adventure"],
    "primaryCategory": "nature",
    "category": "nature",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "사계절 내내 각기 다른 매력을 뽐내는 대자연의 보고입니다. 겨울에는 세계 최고 수준의 파우더 스노우를, 여름에는 끝없이 펼쳐진 라벤더 밭과 시원한 드라이브 코스를 만끽할 수 있습니다.",
    "keywords": ["아시아", "대자연", "설경", "라벤더", "온천"]
  },
  {
    "id": 332,
    "slug": "sant-joan",
    "name": "Sant Joan",
    "name_en": "Sant Joan de Labritja",
    "country": "스페인",
    "country_en": "Spain",
    "lat": 39.0775,
    "lng": 1.5134,
    "tier": 3,
    "popularity": 60,
    "continent": "europe",
    "categories": ["paradise", "culture"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": false,
    "denseRegion": "europe",
    "desc": "이비자 섬 북부의 평화롭고 조용한 마을입니다. 섬 남부의 화려한 파티 문화와는 대조적으로 때묻지 않은 자연 해변과 보헤미안 감성의 로컬 마켓, 그리고 여유로운 휴식을 즐길 수 있습니다.",
    "keywords": ["유럽", "이비자", "히피마켓", "조용한휴양지", "지중해"]
  },
  {
    "id": 333,
    "slug": "miyakojima",
    "name": "미야코지마",
    "name_en": "Miyakojima",
    "country": "일본",
    "country_en": "Japan",
    "lat": 24.8055,
    "lng": 125.2811,
    "tier": 2,
    "popularity": 72,
    "continent": "asia",
    "categories": ["paradise", "nature"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": false,
    "denseRegion": "east-asia",
    "desc": "'미야코 블루'라 불리는 숨막히게 아름다운 청록색 바다를 품은 산호섬입니다. 일본 최고의 해변으로 꼽히는 요나하 마에하마 비치와 스쿠버 다이빙 포인트가 넘쳐납니다.",
    "keywords": ["아시아", "오키나와", "산호초", "스쿠버다이빙", "미야코블루"]
  },
  {
    "id": 334,
    "slug": "kala-patthar",
    "name": "Kala Patthar",
    "name_en": "Kala Patthar",
    "country": "네팔",
    "country_en": "Nepal",
    "lat": 27.9959,
    "lng": 86.8284,
    "tier": 3,
    "popularity": 55,
    "continent": "asia",
    "categories": ["adventure", "nature"],
    "primaryCategory": "adventure",
    "category": "adventure",
    "showOnGlobe": false,
    "denseRegion": "south-asia",
    "desc": "해발 5,545m에 위치한 세계 최고의 에베레스트 전망대입니다. 세계 최고봉을 가장 가까이서, 그리고 가장 웅장하게 감상할 수 있는 트레커들의 궁극적인 목적지입니다.",
    "keywords": ["아시아", "히말라야", "트레킹", "에베레스트전망대", "고산지대"]
  },
  {
    "id": 335,
    "slug": "faroe-islands",
    "name": "페로 제도",
    "name_en": "Faroe Islands",
    "country": "덴마크",
    "country_en": "Denmark",
    "lat": 61.8926,
    "lng": -6.9118,
    "tier": 2,
    "popularity": 65,
    "continent": "europe",
    "categories": ["nature", "adventure"],
    "primaryCategory": "nature",
    "category": "nature",
    "showOnGlobe": true,
    "denseRegion": null,
    "desc": "북대서양 한가운데 솟아오른 18개의 화산섬으로 이루어진 미지의 영토입니다. 깎아지른 절벽, 초록빛 지붕의 집들, 그리고 퍼핀 새들이 어우러진 동화 같은 풍경을 선사합니다.",
    "keywords": ["유럽", "북대서양", "절벽", "트레킹", "신비로운자연"]
  },
  {
    "id": 336,
    "slug": "kiribati",
    "name": "키리바시",
    "name_en": "Kiribati",
    "country": "키리바시",
    "country_en": "Kiribati",
    "lat": -1.3333,
    "lng": 173.0,
    "tier": 3,
    "popularity": 45,
    "continent": "oceania",
    "categories": ["paradise", "nature"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": true,
    "denseRegion": null,
    "desc": "태평양 한가운데 적도를 가로지르는 산호초 섬나라입니다. 기후 변화로 인해 사라질 위기에 처해 있어, 원시적인 산호 라군과 고요한 열대의 아름다움을 만날 수 있는 마지막 기회일지도 모릅니다.",
    "keywords": ["오세아니아", "산호섬", "라군", "기후변화", "미지의섬"]
  },
  {
    "id": 337,
    "slug": "cape-verde",
    "name": "카보베르데",
    "name_en": "Cape Verde",
    "country": "카보베르데",
    "country_en": "Cape Verde",
    "lat": 16.5388,
    "lng": -23.0418,
    "tier": 3,
    "popularity": 50,
    "continent": "africa",
    "categories": ["paradise", "culture"],
    "primaryCategory": "paradise",
    "category": "paradise",
    "showOnGlobe": true,
    "denseRegion": null,
    "desc": "아프리카 대륙 서쪽 대서양에 위치한 군도로, 아프리카와 포르투갈, 브라질의 문화가 혼합된 독특한 매력을 발산합니다. 연중 따뜻한 기후와 화산 풍경, 흥겨운 로컬 음악이 여행자를 반깁니다.",
    "keywords": ["아프리카", "대서양군도", "모르나음악", "화산섬", "다문화"]
  },
  {
    "id": 338,
    "slug": "bled",
    "name": "블레드",
    "name_en": "Bled",
    "country": "슬로베니아",
    "country_en": "Slovenia",
    "lat": 46.3683,
    "lng": 14.1146,
    "tier": 2,
    "popularity": 78,
    "continent": "europe",
    "categories": ["nature", "culture"],
    "primaryCategory": "nature",
    "category": "nature",
    "showOnGlobe": true,
    "denseRegion": "europe",
    "desc": "알프스 산맥의 만년설이 녹아 만들어진 에메랄드빛 블레드 호수가 있는 동화 속 마을입니다. 호수 한가운데 떠 있는 작은 섬과 그 위의 성당, 그리고 절벽 위의 블레드 성이 완벽한 절경을 만들어냅니다.",
    "keywords": ["유럽", "알프스", "블레드호수", "소원종", "동화마을"]
  },
  {
    "id": 339,
    "slug": "la-spezia",
    "name": "라스페치아",
    "name_en": "La Spezia",
    "country": "이탈리아",
    "country_en": "Italy",
    "lat": 44.1025,
    "lng": 9.8241,
    "tier": 2,
    "popularity": 68,
    "continent": "europe",
    "categories": ["urban", "culture"],
    "primaryCategory": "urban",
    "category": "urban",
    "showOnGlobe": false,
    "denseRegion": "europe",
    "desc": "세계적인 절경을 자랑하는 해안 마을 '친퀘테레'로 향하는 관문 도시입니다. 리구리아 해의 아름다운 항구 풍경과 해산물 요리, 그리고 여유로운 이탈리아의 일상을 엿볼 수 있습니다.",
    "keywords": ["유럽", "친퀘테레", "항구도시", "리구리아해", "해산물"]
  },
  {
    "id": 340,
    "slug": "kotor",
    "name": "코토르",
    "name_en": "Kotor",
    "country": "몬테네그로",
    "country_en": "Montenegro",
    "lat": 42.4247,
    "lng": 18.7712,
    "tier": 2,
    "popularity": 75,
    "continent": "europe",
    "categories": ["culture", "nature"],
    "primaryCategory": "culture",
    "category": "culture",
    "showOnGlobe": true,
    "denseRegion": "europe",
    "desc": "유럽 최남단의 피오르드라 불리는 코토르 만 깊숙한 곳에 자리한 중세 도시입니다. 아드리아 해안의 아름다운 자연과 잘 보존된 베네치아 양식의 성벽 구시가지가 세계문화유산으로 지정되어 있습니다.",
    "keywords": ["유럽", "피오르드", "발칸반도", "성벽도시", "유네스코"]
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
