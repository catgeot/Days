const fs = require('fs');
const path = require('path');

/**
 * Phase 2 밀집도 분석 및 showOnGlobe 최적화 스크립트
 *
 * 목표: 179개 중 ~100개만 지구본 표시 (55%)
 *
 * 우선순위:
 * 1. Tier 1 (무조건 표시)
 * 2. 천국 테마 (라로통가, 길리메노, 엘니도 등)
 * 3. 밀집 지역 최소화
 * 4. 좌표 기반 거리 유지 (50-100km)
 */

// 병합된 데이터(`merge-phase2.cjs` → scripts/outputs/)
const mergedPath = path.join(__dirname, 'outputs', 'travelSpots-phase2-merged.js');
if (!fs.existsSync(mergedPath)) {
  console.error('❌ 먼저: node scripts/merge-phase2.cjs');
  process.exit(1);
}
const mergedContent = fs.readFileSync(mergedPath, 'utf8');
const mergedMatch = mergedContent.match(/export\s+const\s+TRAVEL_SPOTS\s*=\s*(\[[\s\S]*\]);/);

if (!mergedMatch) {
    console.error('❌ 병합 데이터를 파싱할 수 없습니다.');
    process.exit(1);
}

let spots = eval(mergedMatch[1]);
console.log(`✅ 데이터 로드: ${spots.length}개`);
console.log('');

// ============================================
// 1. 우선순위 점수 계산
// ============================================

console.log('🎯 우선순위 점수 계산 중...');

function calculatePriorityScore(spot) {
    let score = 0;

    // Tier 1 최우선 (무조건 표시)
    if (spot.tier === 1) {
        score += 10000;
    }

    // 천국 테마 키워드 (높은 우선순위)
    const paradiseKeywords = ['천국', '낙원', '라로통가', '길리메노', '엘니도', '보라보라', '몰디브', '팔라우', '세이셸'];
    const spotText = `${spot.name} ${spot.desc || ''}`.toLowerCase();
    if (paradiseKeywords.some(kw => spotText.includes(kw.toLowerCase()))) {
        score += 5000;
    }

    // Paradise 카테고리 우대
    if (spot.category === 'paradise' || spot.primaryCategory === 'paradise') {
        score += 3000;
    }

    // 인기도
    score += (spot.popularity || 50) * 10;

    // 밀집 지역은 감점
    if (spot.denseRegion) {
        score -= 2000;
    }

    // 이미 showOnGlobe가 false인 경우 감점
    if (spot.showOnGlobe === false) {
        score -= 1000;
    }

    return score;
}

spots = spots.map(spot => ({
    ...spot,
    priorityScore: calculatePriorityScore(spot)
}));

console.log('✅ 우선순위 점수 계산 완료');
console.log('');

// ============================================
// 2. Haversine 거리 계산 함수
// ============================================

function getDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // 지구 반지름 (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ============================================
// 3. showOnGlobe 설정 (좌표 기반)
// ============================================

console.log('📍 showOnGlobe 설정 중...');

// 우선순위로 정렬
const sorted = spots.sort((a, b) => b.priorityScore - a.priorityScore);

const selected = [];
const targetCount = 100; // 목표 개수

// 거리 기준 (밀집 지역은 더 엄격하게)
const minDistanceDefault = 80; // km
const minDistanceDense = 120; // km (밀집 지역)

for (const spot of sorted) {
    // 이미 목표 개수에 도달하면 나머지는 모두 false
    if (selected.length >= targetCount) {
        spot.showOnGlobe = false;
        continue;
    }

    // Tier 1은 무조건 선택
    if (spot.tier === 1) {
        spot.showOnGlobe = true;
        selected.push(spot);
        continue;
    }

    // 거리 체크
    const minDist = spot.denseRegion ? minDistanceDense : minDistanceDefault;
    const tooClose = selected.some(s => {
        const dist = getDistance(spot.lat, spot.lng, s.lat, s.lng);
        return dist < minDist;
    });

    if (!tooClose) {
        spot.showOnGlobe = true;
        selected.push(spot);
    } else {
        spot.showOnGlobe = false;
    }
}

// 나머지는 false
spots.forEach(spot => {
    if (!selected.includes(spot)) {
        spot.showOnGlobe = false;
    }
});

console.log(`✅ 지구본 표시: ${selected.length}개`);
console.log(`📋 홈화면 전용: ${spots.length - selected.length}개`);
console.log('');

// ============================================
// 4. 밀집 지역별 통계
// ============================================

console.log('📊 밀집 지역별 통계:');
console.log('━'.repeat(70));

const regionStats = {};
spots.forEach(spot => {
    const region = spot.denseRegion || 'other';
    if (!regionStats[region]) {
        regionStats[region] = { total: 0, visible: 0 };
    }
    regionStats[region].total++;
    if (spot.showOnGlobe !== false) {
        regionStats[region].visible++;
    }
});

Object.entries(regionStats).sort((a, b) => b[1].total - a[1].total).forEach(([region, stats]) => {
    const ratio = Math.round(stats.visible / stats.total * 100);
    console.log(`  ${region.padEnd(20)} 총: ${String(stats.total).padStart(2)}개  표시: ${String(stats.visible).padStart(2)}개  비율: ${String(ratio).padStart(2)}%`);
});
console.log('');

// ============================================
// 5. 카테고리별 통계
// ============================================

console.log('📊 카테고리별 통계:');
console.log('━'.repeat(70));

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

Object.entries(categoryStats).sort((a, b) => b[1].total - a[1].total).forEach(([cat, stats]) => {
    const ratio = Math.round(stats.visible / stats.total * 100);
    console.log(`  ${cat.padEnd(15)} 총: ${String(stats.total).padStart(2)}개  표시: ${String(stats.visible).padStart(2)}개  비율: ${String(ratio).padStart(2)}%`);
});
console.log('');

// ============================================
// 6. Tier별 통계
// ============================================

console.log('📊 Tier별 통계:');
console.log('━'.repeat(70));

const tierStats = {};
spots.forEach(spot => {
    const tier = spot.tier || 'unknown';
    if (!tierStats[tier]) {
        tierStats[tier] = { total: 0, visible: 0 };
    }
    tierStats[tier].total++;
    if (spot.showOnGlobe !== false) {
        tierStats[tier].visible++;
    }
});

Object.entries(tierStats).sort((a, b) => a[0] - b[0]).forEach(([tier, stats]) => {
    const ratio = Math.round(stats.visible / stats.total * 100);
    console.log(`  Tier ${tier}      총: ${String(stats.total).padStart(2)}개  표시: ${String(stats.visible).padStart(2)}개  비율: ${String(ratio).padStart(2)}%`);
});
console.log('');

// ============================================
// 7. 천국 테마 여행지 확인
// ============================================

console.log('🏝️ 천국 테마 필수 여행지 확인:');
console.log('━'.repeat(70));

const paradiseSpots = [
    '라로통가', 'Rarotonga',
    '길리메노', 'Gili Meno', 'Gili Meno',
    '엘니도', 'El Nido'
];

paradiseSpots.forEach(name => {
    const spot = spots.find(s =>
        s.name.includes(name) ||
        s.name_en.includes(name)
    );
    if (spot) {
        const status = spot.showOnGlobe !== false ? '✅ 표시' : '❌ 숨김';
        console.log(`  ${status} ${spot.name} (${spot.name_en})`);
    }
});
console.log('');

// ============================================
// 8. 파일 저장
// ============================================

// priorityScore 제거 (출력용이었음)
const finalSpots = spots.map(({ priorityScore: _p, ...spot }) => spot);

// ID 순서로 다시 정렬
finalSpots.sort((a, b) => a.id - b.id);

const outputContent = `/**
 * Travel Spots Data - Phase 2 Optimized
 *
 * Total: ${finalSpots.length}개
 * Globe Display: ${selected.length}개 (${Math.round(selected.length / finalSpots.length * 100)}%)
 * List Only: ${finalSpots.length - selected.length}개 (${Math.round((finalSpots.length - selected.length) / finalSpots.length * 100)}%)
 *
 * Optimization Applied:
 * - Tier 1: 무조건 표시
 * - Paradise Theme: 우선 표시
 * - Dense Regions: 최소화
 * - Distance: 80-120km 간격 유지
 *
 * Last Updated: ${new Date().toISOString().split('T')[0]}
 */

export const TRAVEL_SPOTS = ${JSON.stringify(finalSpots, null, 2)};
`;

const scriptOutputs = path.join(__dirname, 'outputs');
fs.mkdirSync(scriptOutputs, { recursive: true });
const outputPath = path.join(scriptOutputs, 'travelSpots-phase2-optimized.js');
fs.writeFileSync(outputPath, outputContent, 'utf8');

console.log(`✅ 최적화 파일 생성: ${outputPath}`);
console.log('');

// ============================================
// 9. 최종 요약
// ============================================

console.log('🎉 최적화 완료!');
console.log('━'.repeat(70));
console.log(`총 여행지: ${finalSpots.length}개`);
console.log(`지구본 표시: ${selected.length}개 (${Math.round(selected.length / finalSpots.length * 100)}%)`);
console.log(`홈화면 전용: ${finalSpots.length - selected.length}개 (${Math.round((finalSpots.length - selected.length) / finalSpots.length * 100)}%)`);
console.log('');
console.log('🎯 다음 단계:');
console.log('1. 결과 확인: scripts/outputs/travelSpots-phase2-optimized.js');
console.log('2. prod 반영: 내용을 src/pages/Home/data/travelSpots.js에 병합(수동)');
console.log('3. npm run dev 로 검증');
console.log('');
