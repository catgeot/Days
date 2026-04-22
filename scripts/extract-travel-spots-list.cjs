// travelSpots.js에서 여행지 목록만 추출하여 JSON 파일로 저장
// 이 파일을 사용하면 전체 travelSpots.js를 읽지 않고도 검증 가능
const fs = require('fs');
const path = require('path');

const travelSpotsPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const travelSpotsContent = fs.readFileSync(travelSpotsPath, 'utf-8');

// 여행지 목록 추출
const spots = [];

// 각 여행지 객체 추출 (간단한 정규식으로)
const spotMatches = travelSpotsContent.matchAll(/\{\s*"id":\s*(\d+),\s*"slug":\s*"([^"]+)",\s*"name":\s*"([^"]+)",\s*"name_en":\s*"([^"]+)",\s*"country":\s*"([^"]+)"/g);

for (const match of spotMatches) {
  const [, id, slug, name, name_en, country] = match;
  spots.push({
    id: parseInt(id),
    slug,
    name,
    name_en,
    country,
    // 검색을 위한 정규화된 키들
    searchKeys: [
      slug,
      name.toLowerCase(),
      name_en.toLowerCase(),
      slug.replace(/-/g, ' '),
      slug.replace(/-/g, ''),
      name_en.toLowerCase().replace(/ /g, ''),
    ]
  });
}

// 정렬 (id 순)
spots.sort((a, b) => a.id - b.id);

// JSON 파일로 저장
const outputPath = path.join(__dirname, '../src/pages/Home/data/travelSpots-list.json');
fs.writeFileSync(outputPath, JSON.stringify(spots, null, 2), 'utf-8');

console.log(`✅ 여행지 목록 추출 완료: ${spots.length}개`);
console.log(`📁 저장 위치: ${outputPath}`);
console.log(`\n최초 5개 샘플:`);
console.log(JSON.stringify(spots.slice(0, 5), null, 2));
console.log(`\n마지막 5개 샘플:`);
console.log(JSON.stringify(spots.slice(-5), null, 2));
