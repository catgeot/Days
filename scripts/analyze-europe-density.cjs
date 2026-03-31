const fs = require('fs');
const path = require('path');

/**
 * 유럽 밀집도 상세 분석 스크립트
 *
 * 목표:
 * 1. 유럽 지역 여행지 좌표 기반 거리 계산
 * 2. 중첩되는 여행지 식별 (프라하, 빈, 로마, 베니스 등)
 * 3. 카테고리 재분류 가능 여행지 검토
 * 4. showOnGlobe false 처리 권장 여행지 목록
 */

// 데이터 로드
const dataPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const dataMatch = dataContent.match(/export\s+const\s+TRAVEL_SPOTS\s*=\s*(\[[\s\S]*\]);/);

if (!dataMatch) {
    console.error('❌ 데이터를 파싱할 수 없습니다.');
    process.exit(1);
}

const spots = eval(dataMatch[1]);
console.log(`✅ 데이터 로드: ${spots.length}개`);
console.log('');

// ============================================
// 1. 유럽 지역 필터링
// ============================================

const europeanSpots = spots.filter(spot => {
    const lat = spot.lat;
    const lng = spot.lng;
    // 유럽 범위: 북위 35-72도, 서경 10도 ~ 동경 40도
    return lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40;
});

console.log('🗺️ 유럽 지역 여행지:');
console.log('━'.repeat(70));
console.log(`총 개수: ${europeanSpots.length}개`);
console.log(`표시: ${europeanSpots.filter(s => s.showOnGlobe !== false).length}개`);
console.log(`숨김: ${europeanSpots.filter(s => s.showOnGlobe === false).length}개`);
console.log('');

// ============================================
// 2. Haversine 거리 계산
// ============================================

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ============================================
// 3. 중첩 분석 (100km 기준)
// ============================================

console.log('📍 중첩 분석 (100km 이내):');
console.log('━'.repeat(70));

const visibleEuropean = europeanSpots.filter(s => s.showOnGlobe !== false);
const overlaps = [];

for (let i = 0; i < visibleEuropean.length; i++) {
    for (let j = i + 1; j < visibleEuropean.length; j++) {
        const s1 = visibleEuropean[i];
        const s2 = visibleEuropean[j];
        const dist = getDistance(s1.lat, s1.lng, s2.lat, s2.lng);

        if (dist < 100) {
            overlaps.push({
                spot1: s1,
                spot2: s2,
                distance: Math.round(dist)
            });
        }
    }
}

// 거리순 정렬
overlaps.sort((a, b) => a.distance - b.distance);

console.log(`중첩 쌍: ${overlaps.length}개`);
console.log('');

// 상위 20개 중첩 출력
console.log('🔴 심각한 중첩 (상위 20개):');
console.log('━'.repeat(70));
overlaps.slice(0, 20).forEach(overlap => {
    const { spot1, spot2, distance } = overlap;
    console.log(`${distance}km  ${spot1.name.padEnd(12)} - ${spot2.name.padEnd(12)}  [${spot1.category} / ${spot2.category}]`);
});
console.log('');

// ============================================
// 4. 카테고리별 유럽 여행지
// ============================================

console.log('📊 유럽 카테고리별 분포:');
console.log('━'.repeat(70));

const categoryMap = {};
visibleEuropean.forEach(spot => {
    const cat = spot.category || 'unknown';
    if (!categoryMap[cat]) {
        categoryMap[cat] = [];
    }
    categoryMap[cat].push(spot);
});

Object.entries(categoryMap).forEach(([cat, spots]) => {
    console.log(`\n${cat.toUpperCase()} (${spots.length}개):`);
    spots.forEach(spot => {
        const tier = `T${spot.tier}`;
        console.log(`  ${tier} ${spot.name.padEnd(15)} (${spot.name_en})`);
    });
});
console.log('');

// ============================================
// 5. 카테고리 재분류 후보 (Urban → Culture)
// ============================================

console.log('🔄 카테고리 재분류 후보:');
console.log('━'.repeat(70));

const urbanInEurope = visibleEuropean.filter(s => s.category === 'urban');

console.log('\n📝 Urban → Culture 재분류 가능 후보:');
console.log('(역사적 랜드마크가 주요 명소인 도시)');
console.log('');

urbanInEurope.forEach(spot => {
    // 키워드에 "역사", "문화", "유네스코", "성", "궁전" 등이 있으면 후보
    const culturalKeywords = ['역사', '문화', '유네스코', '성', '궁전', '박물관', '고딕', '바로크', '중세', '르네상스'];
    const hasCultural = culturalKeywords.some(kw =>
        spot.desc?.includes(kw) || spot.keywords?.some(k => k.includes(kw))
    );

    if (hasCultural) {
        console.log(`  ✓ ${spot.name.padEnd(15)} (${spot.name_en})`);
        console.log(`    키워드: ${spot.keywords?.slice(0, 5).join(', ')}`);
    }
});

console.log('');

// ============================================
// 6. showOnGlobe false 권장 목록
// ============================================

console.log('❌ showOnGlobe = false 권장 목록:');
console.log('━'.repeat(70));

// 중첩이 많은 여행지 찾기
const overlapCount = {};
overlaps.forEach(({ spot1, spot2, distance }) => {
    if (distance < 80) { // 80km 이내만
        overlapCount[spot1.id] = (overlapCount[spot1.id] || 0) + 1;
        overlapCount[spot2.id] = (overlapCount[spot2.id] || 0) + 1;
    }
});

const candidates = Object.entries(overlapCount)
    .map(([id, count]) => {
        const spot = visibleEuropean.find(s => s.id === parseInt(id));
        return { spot, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

console.log('\n중첩이 가장 많은 여행지 (Top 10):');
candidates.forEach(({ spot, count }) => {
    const tier = `T${spot.tier}`;
    const status = spot.tier === 1 ? '⚠️ Tier 1' : '✅ 숨김 가능';
    console.log(`  ${count}회  ${tier} ${spot.name.padEnd(15)} (${spot.category.padEnd(10)}) ${status}`);
});

console.log('');

// ============================================
// 7. 최종 권장사항
// ============================================

console.log('💡 최종 권장사항:');
console.log('━'.repeat(70));

console.log('\n1. 즉시 숨김 처리 (showOnGlobe = false):');
const hideList = candidates
    .filter(({ spot }) => spot.tier !== 1) // Tier 1 제외
    .slice(0, 5);

hideList.forEach(({ spot, count }) => {
    console.log(`   - ${spot.name} (${spot.name_en}): ${count}회 중첩`);
});

console.log('\n2. 카테고리 재분류 후 검토:');
console.log('   - Urban → Culture: 역사/문화 중심 도시');
console.log('   - Urban → Nature: 자연 명소 중심 도시');

console.log('\n3. Tier 1 유지 (무조건 표시):');
const tier1Europe = visibleEuropean.filter(s => s.tier === 1);
tier1Europe.forEach(spot => {
    console.log(`   - ${spot.name} (${spot.name_en})`);
});

console.log('\n4. 거리 기준 강화:');
console.log('   - 현재: 80-120km');
console.log('   - 권장: 유럽 150km 이상 (밀집 지역 특별 관리)');

console.log('');

// ============================================
// 8. JSON 출력 (수정용)
// ============================================

const recommendations = {
    hideFromGlobe: hideList.map(({ spot }) => ({
        id: spot.id,
        name: spot.name,
        name_en: spot.name_en,
        reason: 'Europe density - high overlap'
    })),
    recategorize: urbanInEurope
        .filter(spot => {
            const culturalKeywords = ['역사', '문화', '유네스코', '성', '궁전'];
            return culturalKeywords.some(kw =>
                spot.desc?.includes(kw) || spot.keywords?.some(k => k.includes(kw))
            );
        })
        .map(spot => ({
            id: spot.id,
            name: spot.name,
            name_en: spot.name_en,
            from: 'urban',
            to: 'culture'
        }))
};

fs.writeFileSync(
    path.join(__dirname, '../plans/europe-density-recommendations.json'),
    JSON.stringify(recommendations, null, 2),
    'utf8'
);

console.log('✅ 권장사항 저장: plans/europe-density-recommendations.json');
console.log('');
