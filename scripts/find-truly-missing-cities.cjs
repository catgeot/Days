// 실제로 누락된 주요 도시만 찾는 스크립트
const fs = require('fs');
const path = require('path');

// travelSpots.js 읽기
const travelSpotsPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const travelSpotsContent = fs.readFileSync(travelSpotsPath, 'utf-8');

// travelSpots.js에서 name, name_en, slug 추출
const spotsInFile = new Set();

// slug 추출 (가장 정확한 매칭 기준)
const slugMatches = travelSpotsContent.matchAll(/"slug":\s*"([^"]+)"/g);
for (const match of slugMatches) {
  const slug = match[1];
  spotsInFile.add(slug);
  // slug의 변형들도 추가
  spotsInFile.add(slug.replace(/-/g, ' '));
  spotsInFile.add(slug.replace(/-/g, ''));
}

// name 추출
const nameMatches = travelSpotsContent.matchAll(/"name":\s*"([^"]+)"/g);
for (const match of nameMatches) {
  spotsInFile.add(match[1]);
}

// name_en 추출
const nameEnMatches = travelSpotsContent.matchAll(/"name_en":\s*"([^"]+)"/g);
for (const match of nameEnMatches) {
  spotsInFile.add(match[1]);
}

console.log('📁 travelSpots.js에 있는 여행지:', spotsInFile.size, '개');

// 트립링크에 매핑된 주요 도시들 (국가명 제외)
const importantCities = {
  // 국내
  '제주': { region: '국내', priority: 'high', coords: { lat: 33.4996, lng: 126.5312 } },
  '서귀포': { region: '국내', priority: 'medium', coords: { lat: 33.2541, lng: 126.5601 } },

  // 일본
  '나라': { region: '일본', priority: 'medium', coords: { lat: 34.6851, lng: 135.8048 } },
  '고베': { region: '일본', priority: 'medium', coords: { lat: 34.6901, lng: 135.1955 } },
  '나가사키': { region: '일본', priority: 'medium', coords: { lat: 32.7503, lng: 129.8779 } },
  '구마모토': { region: '일본', priority: 'low', coords: { lat: 32.8031, lng: 130.7079 } },
  '가나자와': { region: '일본', priority: 'medium', coords: { lat: 36.5619, lng: 136.6562 } },
  '요코하마': { region: '일본', priority: 'medium', coords: { lat: 35.4437, lng: 139.6380 } },
  '대마도': { region: '일본', priority: 'medium', coords: { lat: 34.2048, lng: 129.2887 } },
  '이시가키': { region: '일본', priority: 'low', coords: { lat: 24.3364, lng: 124.1559 } },

  // 동남아
  '마닐라': { region: '동남아', priority: 'high', coords: { lat: 14.5995, lng: 120.9842 } },
  '치앙마이': { region: '동남아', priority: 'high', coords: { lat: 18.7883, lng: 98.9853 } },
  '롬복': { region: '동남아', priority: 'medium', coords: { lat: -8.6500, lng: 116.3242 } },
  '비엔티안': { region: '동남아', priority: 'medium', coords: { lat: 17.9757, lng: 102.6331 } },
  '방비엥': { region: '동남아', priority: 'low', coords: { lat: 18.9333, lng: 102.4481 } },

  // 중국/홍콩
  '마카오': { region: '중국', priority: 'high', coords: { lat: 22.1987, lng: 113.5439 } },

  // 유럽
  '부다페스트': { region: '동유럽', priority: 'high', coords: { lat: 47.4979, lng: 19.0402 } },
  '자그레브': { region: '동유럽', priority: 'medium', coords: { lat: 45.8150, lng: 15.9819 } },
  '바르샤바': { region: '동유럽', priority: 'medium', coords: { lat: 52.2297, lng: 21.0122 } },
  '헬싱키': { region: '북유럽', priority: 'high', coords: { lat: 60.1699, lng: 24.9384 } },
  '레이캬비크': { region: '북유럽', priority: 'high', coords: { lat: 64.1466, lng: -21.9426 } },

  // 북미
  '필라델피아': { region: '북미', priority: 'medium', coords: { lat: 39.9526, lng: -75.1652 } },
  '샌디에이고': { region: '북미', priority: 'medium', coords: { lat: 32.7157, lng: -117.1611 } },

  // 오세아니아
  '브리즈번': { region: '오세아니아', priority: 'high', coords: { lat: -27.4698, lng: 153.0251 } },
  '골드코스트': { region: '오세아니아', priority: 'medium', coords: { lat: -28.0167, lng: 153.4000 } },
};

// 누락된 도시 찾기
const missingCities = [];

for (const [cityName, info] of Object.entries(importantCities)) {
  let found = false;

  // 한글 이름으로 체크
  if (spotsInFile.has(cityName)) {
    found = true;
  }

  // 영어 변형들 체크
  const englishVariations = {
    '제주': ['jeju', 'jejudo'],
    '서귀포': ['seogwipo'],
    '나라': ['nara'],
    '고베': ['kobe'],
    '나가사키': ['nagasaki'],
    '구마모토': ['kumamoto'],
    '가나자와': ['kanazawa'],
    '요코하마': ['yokohama'],
    '대마도': ['tsushima'],
    '이시가키': ['ishigaki'],
    '마닐라': ['manila'],
    '치앙마이': ['chiang mai', 'chiangmai'],
    '롬복': ['lombok'],
    '비엔티안': ['vientiane'],
    '방비엥': ['vang vieng', 'vangvieng'],
    '마카오': ['macau', 'macao'],
    '부다페스트': ['budapest'],
    '자그레브': ['zagreb'],
    '바르샤바': ['warsaw'],
    '헬싱키': ['helsinki'],
    '레이캬비크': ['reykjavik'],
    '필라델피아': ['philadelphia'],
    '샌디에이고': ['san diego', 'sandiego'],
    '브리즈번': ['brisbane'],
    '골드코스트': ['gold coast', 'goldcoast'],
  };

  if (englishVariations[cityName]) {
    for (const variation of englishVariations[cityName]) {
      if (spotsInFile.has(variation) || spotsInFile.has(variation.replace(/ /g, '-'))) {
        found = true;
        break;
      }
    }
  }

  if (!found) {
    missingCities.push({ name: cityName, ...info });
  }
}

console.log('\n❌ 실제로 누락된 주요 도시:', missingCities.length, '개\n');

// 우선순위별로 정렬
const priorityOrder = { high: 1, medium: 2, low: 3 };
missingCities.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

// 지역별로 그룹화하여 출력
const regions = {};
for (const city of missingCities) {
  if (!regions[city.region]) {
    regions[city.region] = [];
  }
  regions[city.region].push(city);
}

for (const [region, cities] of Object.entries(regions)) {
  console.log(`\n[${region}]`);
  for (const city of cities) {
    const priorityMark = city.priority === 'high' ? '⭐' : city.priority === 'medium' ? '🔸' : '▪️';
    console.log(`  ${priorityMark} ${city.name} (${city.coords.lat}, ${city.coords.lng})`);
  }
}

console.log('\n\n📊 우선순위 요약:');
const highPriority = missingCities.filter(c => c.priority === 'high');
const mediumPriority = missingCities.filter(c => c.priority === 'medium');
const lowPriority = missingCities.filter(c => c.priority === 'low');

console.log(`⭐ High (${highPriority.length}개): ${highPriority.map(c => c.name).join(', ')}`);
console.log(`🔸 Medium (${mediumPriority.length}개): ${mediumPriority.map(c => c.name).join(', ')}`);
console.log(`▪️ Low (${lowPriority.length}개): ${lowPriority.map(c => c.name).join(', ')}`);

// JSON 형식으로 출력 (추가할 때 사용)
console.log('\n\n📝 추가할 데이터 (JSON):');
console.log(JSON.stringify(missingCities, null, 2));
