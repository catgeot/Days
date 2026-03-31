// scripts/generate-existing-list.js
// Phase 2: 기존 100개 여행지 리스트 추출
// 목적: AI 프롬프트에서 중복 제외를 위해 사용

const fs = require('fs');
const path = require('path');

// travelSpots.js 파일 읽기
const travelSpotsPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const fileContent = fs.readFileSync(travelSpotsPath, 'utf-8');

// export const TRAVEL_SPOTS = [...] 형태에서 데이터 추출
const match = fileContent.match(/export const TRAVEL_SPOTS = (\[[\s\S]*?\]);/);

if (!match) {
    console.error('❌ TRAVEL_SPOTS 데이터를 찾을 수 없습니다.');
    process.exit(1);
}

const TRAVEL_SPOTS = eval(match[1]);

console.log(`📊 기존 여행지 개수: ${TRAVEL_SPOTS.length}개\n`);

// 제외 리스트 생성 (name, name_en, country만 추출)
const existingList = TRAVEL_SPOTS.map(spot => ({
    name: spot.name,
    name_en: spot.name_en,
    country: spot.country,
    country_en: spot.country_en,
    lat: spot.lat,
    lng: spot.lng,
    category: spot.category
}));

// 카테고리별 통계
const categoryStats = {};
existingList.forEach(spot => {
    if (!categoryStats[spot.category]) {
        categoryStats[spot.category] = 0;
    }
    categoryStats[spot.category]++;
});

console.log('📊 카테고리별 현황:');
Object.entries(categoryStats).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}개`);
});
console.log('');

// JSON 파일로 저장
const outputPath = path.join(__dirname, '../plans/phase2-existing-destinations.json');
fs.writeFileSync(outputPath, JSON.stringify(existingList, null, 2), 'utf-8');

console.log(`✅ 저장 완료: ${outputPath}`);
console.log(`\n📋 이 파일을 AI 프롬프트에 첨부하여 중복 제외 처리하세요.`);

// 간단한 텍스트 리스트도 생성 (프롬프트에 직접 붙여넣기 용)
const textList = existingList.map(s => `${s.name} (${s.name_en}) - ${s.country}`).join('\n');
const textPath = path.join(__dirname, '../plans/phase2-existing-destinations.txt');
fs.writeFileSync(textPath, textList, 'utf-8');

console.log(`✅ 텍스트 리스트: ${textPath}`);
