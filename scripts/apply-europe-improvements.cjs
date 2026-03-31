const fs = require('fs');
const path = require('path');

/**
 * 유럽 밀집도 개선 적용 스크립트
 *
 * 변경사항:
 * 1. 피렌체 숨김 (showOnGlobe = false)
 * 2. 카테고리 재분류 5개 (Urban → Culture)
 *    - 에딘버러, 암스테르담, 스톡홀름, 모스크바, 베를린
 */

// 데이터 로드
const dataPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const dataMatch = dataContent.match(/export\s+const\s+TRAVEL_SPOTS\s*=\s*(\[[\s\S]*\]);/);

if (!dataMatch) {
    console.error('❌ 데이터를 파싱할 수 없습니다.');
    process.exit(1);
}

let spots = eval(dataMatch[1]);
console.log(`✅ 데이터 로드: ${spots.length}개`);
console.log('');

// ============================================
// 변경 사항 적용
// ============================================

console.log('🔧 변경 사항 적용 중...');
console.log('━'.repeat(70));
console.log('');

let changes = 0;

// 1. 피렌체 숨김
spots = spots.map(spot => {
    if (spot.name === '피렌체' || spot.name_en === 'Florence') {
        console.log(`✅ 피렌체 숨김 처리 (ID: ${spot.id})`);
        console.log(`   ${spot.showOnGlobe !== false ? '표시' : '숨김'} → 숨김`);
        changes++;
        return { ...spot, showOnGlobe: false };
    }
    return spot;
});

console.log('');

// 2. 카테고리 재분류 (Urban → Culture)
const recategorize = [
    { name: '에딘버러', name_en: 'Edinburgh' },
    { name: '암스테르담', name_en: 'Amsterdam' },
    { name: '스톡홀름', name_en: 'Stockholm' },
    { name: '모스크바', name_en: 'Moscow' },
    { name: '베를린', name_en: 'Berlin' }
];

console.log('📝 카테고리 재분류 (Urban → Culture):');
console.log('');

spots = spots.map(spot => {
    const match = recategorize.find(r =>
        spot.name === r.name || spot.name_en === r.name_en
    );

    if (match) {
        const oldCat = spot.category || spot.primaryCategory;
        console.log(`✅ ${spot.name.padEnd(12)} (ID: ${spot.id})`);
        console.log(`   ${oldCat} → culture`);
        changes++;

        return {
            ...spot,
            category: 'culture',
            primaryCategory: 'culture',
            categories: ['culture', 'urban'] // 둘 다 포함
        };
    }
    return spot;
});

console.log('');
console.log(`✅ 총 ${changes}개 항목 변경 완료`);
console.log('');

// ============================================
// 통계 출력
// ============================================

console.log('📊 변경 후 통계:');
console.log('━'.repeat(70));
console.log('');

// 카테고리별 통계
const categoryStats = {};
spots.forEach(spot => {
    const cat = spot.category || spot.primaryCategory || 'unknown';
    if (!categoryStats[cat]) {
        categoryStats[cat] = { total: 0, visible: 0 };
    }
    categoryStats[cat].total++;
    if (spot.showOnGlobe !== false) {
        categoryStats[cat].visible++;
    }
});

console.log('카테고리별 분포:');
Object.entries(categoryStats).sort((a, b) => b[1].total - a[1].total).forEach(([cat, stats]) => {
    const ratio = Math.round(stats.visible / stats.total * 100);
    console.log(`  ${cat.padEnd(15)} 총: ${String(stats.total).padStart(2)}개  표시: ${String(stats.visible).padStart(2)}개  비율: ${String(ratio).padStart(2)}%`);
});

console.log('');

// 유럽 지역 통계
const europeanSpots = spots.filter(spot => {
    const lat = spot.lat;
    const lng = spot.lng;
    return lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40;
});

console.log('유럽 지역:');
console.log(`  총 개수: ${europeanSpots.length}개`);
console.log(`  표시: ${europeanSpots.filter(s => s.showOnGlobe !== false).length}개`);
console.log(`  숨김: ${europeanSpots.filter(s => s.showOnGlobe === false).length}개`);

console.log('');

// 유럽 카테고리별
const euroCategories = {};
europeanSpots.filter(s => s.showOnGlobe !== false).forEach(spot => {
    const cat = spot.category || spot.primaryCategory || 'unknown';
    euroCategories[cat] = (euroCategories[cat] || 0) + 1;
});

console.log('유럽 카테고리별 (표시 중):');
Object.entries(euroCategories).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
    console.log(`  ${cat}: ${count}개`);
});

console.log('');

// ============================================
// 파일 저장
// ============================================

const outputContent = `/**
 * Travel Spots Data - Europe Density Optimized
 *
 * Total: ${spots.length}개
 * Globe Display: ${spots.filter(s => s.showOnGlobe !== false).length}개
 *
 * Europe Improvements:
 * - Florence: Hidden from globe (accessible via search/list)
 * - 5 Cities recategorized: Urban → Culture
 *   (Edinburgh, Amsterdam, Stockholm, Moscow, Berlin)
 *
 * Last Updated: ${new Date().toISOString().split('T')[0]}
 */

export const TRAVEL_SPOTS = ${JSON.stringify(spots, null, 2)};
`;

const backupPath = path.join(__dirname, '../src/pages/Home/data/travelSpots-before-europe-optimization.js');
fs.copyFileSync(dataPath, backupPath);
console.log(`💾 백업 생성: ${backupPath}`);
console.log('');

fs.writeFileSync(dataPath, outputContent, 'utf8');
console.log(`✅ 파일 저장 완료: ${dataPath}`);
console.log('');

console.log('🎉 유럽 밀집도 개선 완료!');
console.log('━'.repeat(70));
console.log('');
console.log('다음 단계:');
console.log('1. 개발 서버 확인 (자동 리로드)');
console.log('2. 지구본 시각적 확인');
console.log('3. 피렌체 검색 테스트 (숨겨진 상태에서도 접근 가능)');
console.log('4. 카테고리 리스트 확인');
console.log('');
