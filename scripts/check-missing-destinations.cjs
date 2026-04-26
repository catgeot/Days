// travelSpots.js에 없는 여행지를 tripLinkDestinationMap.js에서 찾는 스크립트
const fs = require('fs');
const path = require('path');

// travelSpots.js 읽기
const travelSpotsPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const travelSpotsContent = fs.readFileSync(travelSpotsPath, 'utf-8');

// tripLinkDestinationMap.js에서 매핑된 여행지 추출
const destinationMapPath = path.join(__dirname, '../src/pages/Home/data/tripLinkDestinationMap.js');
const destinationMapContent = fs.readFileSync(destinationMapPath, 'utf-8');

// tripLinkDestinationMap에서 모든 한글/영문 여행지명 추출
const mappedDestinations = new Set();

// DESTINATION_PACKAGE_MAP의 키들 추출
const destMapMatch = destinationMapContent.match(/export const DESTINATION_PACKAGE_MAP = \{([\s\S]*?)\};/);
if (destMapMatch) {
  const mapContent = destMapMatch[1];
  // '도시명': PACKAGE_MAP 형태의 키들 추출
  const keyMatches = mapContent.matchAll(/'([^']+)':\s*PACKAGE_MAP/g);
  for (const match of keyMatches) {
    mappedDestinations.add(match[1]);
  }
}

console.log('\n📍 트립링크에 매핑된 여행지 총 개수:', mappedDestinations.size);
console.log('\n매핑된 여행지 목록:');
console.log(Array.from(mappedDestinations).sort().join(', '));

// travelSpots.js에서 name(한글)과 name_en(영문), slug 추출
const spotsInFile = new Set();
const nameMatches = travelSpotsContent.matchAll(/"name":\s*"([^"]+)"/g);
for (const match of nameMatches) {
  spotsInFile.add(match[1].toLowerCase());
}
const nameEnMatches = travelSpotsContent.matchAll(/"name_en":\s*"([^"]+)"/g);
for (const match of nameEnMatches) {
  spotsInFile.add(match[1].toLowerCase());
}
const slugMatches = travelSpotsContent.matchAll(/"slug":\s*"([^"]+)"/g);
for (const match of slugMatches) {
  spotsInFile.add(match[1].toLowerCase().replace(/-/g, ' '));
}

console.log('\n📁 travelSpots.js에 있는 여행지 수:', spotsInFile.size);

// 누락된 여행지 찾기
const missingDestinations = [];

for (const destination of mappedDestinations) {
  const normalized = destination.toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  // 여러 변형 체크
  const variations = [
    normalized,
    normalized.replace(/ /g, ''),
    normalized.replace(/ /g, '-'),
  ];

  let found = false;
  for (const variation of variations) {
    if (spotsInFile.has(variation)) {
      found = true;
      break;
    }
  }

  if (!found) {
    missingDestinations.push(destination);
  }
}

console.log('\n❌ travelSpots.js에 누락된 여행지:', missingDestinations.length, '개');

if (missingDestinations.length > 0) {
  console.log('\n누락된 여행지 목록:');

  // 지역별로 그룹화
  const regions = {
    '국내': [],
    '일본': [],
    '동남아': [],
    '동아시아': [],
    '서유럽': [],
    '동유럽': [],
    '북유럽': [],
    '북미': [],
    '오세아니아': [],
    '중남미': [],
    '아프리카': [],
    '중동': [],
    '기타': []
  };

  for (const dest of missingDestinations) {
    const lower = dest.toLowerCase();
    if (['제주', 'jeju', 'jejudo', 'seogwipo', '서귀포', '제주시'].includes(lower)) {
      regions['국내'].push(dest);
    } else if (['삿포로', 'sapporo', 'hokkaido', '홋카이도', '북해도', '나라', 'nara',
                 '고베', 'kobe', '나가사키', 'nagasaki', '구마모토', 'kumamoto',
                 '가나자와', 'kanazawa', '요코하마', 'yokohama', '쓰시마', 'tsushima',
                 '나하', 'naha', '이시가키', 'ishigaki', '대마도'].includes(lower)) {
      regions['일본'].push(dest);
    } else if (['푸꾸옥', 'phu quoc', '호이안', 'hoi an', '방비엥', 'vang vieng',
                 '비엔티안', 'vientiane', '치앙마이', 'chiang mai', '보홀', 'bohol',
                 '마닐라', 'manila', '롬복', 'lombok'].includes(lower)) {
      regions['동남아'].push(dest);
    } else if (['타이중', 'taichung', '가오슝', 'kaohsiung', '베이징', 'beijing',
                 '북경', '상해', '뉴델리', 'new delhi', 'delhi'].includes(lower)) {
      regions['동아시아'].push(dest);
    } else if (['피렌체', 'florence', '베네치아', 'venice', '밀라노', 'milan',
                 '마드리드', 'madrid'].includes(lower)) {
      regions['서유럽'].push(dest);
    } else if (['부다페스트', 'budapest', '빈', 'vienna', '자그레브', 'zagreb',
                 '바르샤바', 'warsaw', '두브로브니크', 'dubrovnik'].includes(lower)) {
      regions['동유럽'].push(dest);
    } else if (['헬싱키', 'helsinki', '레이캬비크', 'reykjavik'].includes(lower)) {
      regions['북유럽'].push(dest);
    } else if (['워싱턴', 'washington', 'washington dc', '필라델피아', 'philadelphia',
                 '샌디에이고', 'san diego', '밴쿠버', 'vancouver', '호놀룰루', 'honolulu',
                 '와이키키', 'waikiki', '마우이', 'maui'].includes(lower)) {
      regions['북미'].push(dest);
    } else if (['브리즈번', 'brisbane', '골드코스트', 'gold coast'].includes(lower)) {
      regions['오세아니아'].push(dest);
    } else if (['리마', 'lima', '칠레', 'chile'].includes(lower)) {
      regions['중남미'].push(dest);
    } else if (['탄자니아', 'tanzania'].includes(lower)) {
      regions['아프리카'].push(dest);
    } else if (['마카오', 'macau', 'macao'].includes(lower)) {
      regions['동아시아'].push(dest);
    } else {
      regions['기타'].push(dest);
    }
  }

  for (const [region, destinations] of Object.entries(regions)) {
    if (destinations.length > 0) {
      console.log(`\n[${region}] (${destinations.length}개)`);
      console.log(destinations.join(', '));
    }
  }
}

console.log('\n✅ 분석 완료!');
