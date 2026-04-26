const fs = require('fs');
const path = require('path');

/**
 * 특정 도시 간 거리 정밀 분석
 * 프라하, 빈, 로마, 베니스, 피렌체, 밀라노 등
 */

// 데이터 로드
const dataPath = path.join(__dirname, '../src/pages/Home/data/travelSpots.js');
const dataContent = fs.readFileSync(dataPath, 'utf8');
const dataMatch = dataContent.match(/export\s+const\s+TRAVEL_SPOTS\s*=\s*(\[[\s\S]*\]);/);

const spots = eval(dataMatch[1]);

// Haversine 거리 계산
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

// 특정 도시 찾기
function findCity(name) {
    return spots.find(s =>
        s.name.includes(name) ||
        s.name_en.toLowerCase().includes(name.toLowerCase())
    );
}

console.log('📍 주요 유럽 도시 간 거리 분석');
console.log('━'.repeat(80));
console.log('');

// 중부 유럽
console.log('🇪🇺 중부 유럽:');
const prague = findCity('Prague');
const vienna = findCity('Vienna');
const munich = findCity('Munich');
const berlin = findCity('Berlin');

const pairs1 = [
    ['프라하', prague, '빈', vienna],
    ['프라하', prague, '베를린', berlin],
    ['빈', vienna, '뮌헨', munich],
];

pairs1.forEach(([name1, city1, name2, city2]) => {
    if (city1 && city2) {
        const dist = Math.round(getDistance(city1.lat, city1.lng, city2.lat, city2.lng));
        const show1 = city1.showOnGlobe !== false ? '✅' : '❌';
        const show2 = city2.showOnGlobe !== false ? '✅' : '❌';
        console.log(`  ${dist}km  ${show1} ${name1.padEnd(10)} - ${show2} ${name2.padEnd(10)}  [T${city1.tier} / T${city2.tier}]`);
    }
});

console.log('');

// 이탈리아
console.log('🇮🇹 이탈리아:');
const rome = findCity('Rome');
const venice = findCity('Venice');
const florence = findCity('Florence');
const milan = findCity('Milan');

const pairs2 = [
    ['로마', rome, '피렌체', florence],
    ['로마', rome, '베니스', venice],
    ['피렌체', florence, '베니스', venice],
    ['피렌체', florence, '밀라노', milan],
    ['베니스', venice, '밀라노', milan],
];

pairs2.forEach(([name1, city1, name2, city2]) => {
    if (city1 && city2) {
        const dist = Math.round(getDistance(city1.lat, city1.lng, city2.lat, city2.lng));
        const show1 = city1.showOnGlobe !== false ? '✅' : '❌';
        const show2 = city2.showOnGlobe !== false ? '✅' : '❌';
        console.log(`  ${dist}km  ${show1} ${name1.padEnd(10)} - ${show2} ${name2.padEnd(10)}  [T${city1.tier} / T${city2.tier}]`);
    }
});

console.log('');

// 서유럽
console.log('🇫🇷🇬🇧 서유럽:');
const paris = findCity('Paris');
const london = findCity('London');
const amsterdam = findCity('Amsterdam');
const brussels = findCity('Brussels');

const pairs3 = [
    ['파리', paris, '런던', london],
    ['파리', paris, '암스테르담', amsterdam],
    ['파리', paris, '브뤼셀', brussels],
    ['암스테르담', amsterdam, '브뤼셀', brussels],
];

pairs3.forEach(([name1, city1, name2, city2]) => {
    if (city1 && city2) {
        const dist = Math.round(getDistance(city1.lat, city1.lng, city2.lat, city2.lng));
        const show1 = city1.showOnGlobe !== false ? '✅' : '❌';
        const show2 = city2.showOnGlobe !== false ? '✅' : '❌';
        console.log(`  ${dist}km  ${show1} ${name1.padEnd(10)} - ${show2} ${name2.padEnd(10)}  [T${city1.tier} / T${city2.tier}]`);
    }
});

console.log('');

// 스페인
console.log('🇪🇸 스페인:');
const barcelona = findCity('Barcelona');
const madrid = findCity('Madrid');
const seville = findCity('Seville');

const pairs4 = [
    ['바르셀로나', barcelona, '마드리드', madrid],
    ['마드리드', madrid, '세비야', seville],
];

pairs4.forEach(([name1, city1, name2, city2]) => {
    if (city1 && city2) {
        const dist = Math.round(getDistance(city1.lat, city1.lng, city2.lat, city2.lng));
        const show1 = city1.showOnGlobe !== false ? '✅' : '❌';
        const show2 = city2.showOnGlobe !== false ? '✅' : '❌';
        console.log(`  ${dist}km  ${show1} ${name1.padEnd(10)} - ${show2} ${name2.padEnd(10)}  [T${city1.tier} / T${city2.tier}]`);
    }
});

console.log('');
console.log('━'.repeat(80));
console.log('');

// 150km 이내 쌍 찾기
console.log('🔴 150km 이내 표시 중인 쌍:');
console.log('━'.repeat(80));

const europeanSpots = spots.filter(spot => {
    const lat = spot.lat;
    const lng = spot.lng;
    return lat >= 35 && lat <= 72 && lng >= -10 && lng <= 40 && spot.showOnGlobe !== false;
});

const overlaps150 = [];

for (let i = 0; i < europeanSpots.length; i++) {
    for (let j = i + 1; j < europeanSpots.length; j++) {
        const s1 = europeanSpots[i];
        const s2 = europeanSpots[j];
        const dist = getDistance(s1.lat, s1.lng, s2.lat, s2.lng);

        if (dist < 150) {
            overlaps150.push({
                spot1: s1,
                spot2: s2,
                distance: Math.round(dist)
            });
        }
    }
}

overlaps150.sort((a, b) => a.distance - b.distance);

console.log(`총 ${overlaps150.length}쌍`);
console.log('');

overlaps150.forEach(({ spot1, spot2, distance }) => {
    const t1 = spot1.tier === 1 ? '⚠️T1' : `T${spot1.tier}`;
    const t2 = spot2.tier === 1 ? '⚠️T1' : `T${spot2.tier}`;
    console.log(`${String(distance).padStart(3)}km  ${t1} ${spot1.name.padEnd(12)} - ${t2} ${spot2.name.padEnd(12)}  [${spot1.category} / ${spot2.category}]`);
});

console.log('');
console.log('━'.repeat(80));
console.log('');

// 추천: 숨김 처리 목록
console.log('💡 개선 제안:');
console.log('━'.repeat(80));
console.log('');

console.log('1. Tier 1이지만 밀집 지역에서 숨김 처리 가능:');
const tier1Overlaps = overlaps150.filter(({ spot1, spot2, distance }) =>
    distance < 120 && (spot1.tier === 1 || spot2.tier === 1)
);

const hideCandidates = new Map();
tier1Overlaps.forEach(({ spot1, spot2 }) => {
    // 더 낮은 인기도 또는 Tier 2를 숨김
    const hide = (spot1.tier > spot2.tier || (spot1.tier === spot2.tier && (spot1.popularity || 0) < (spot2.popularity || 0))) ? spot1 : spot2;
    if (!hideCandidates.has(hide.id)) {
        hideCandidates.set(hide.id, { spot: hide, count: 0 });
    }
    hideCandidates.get(hide.id).count++;
});

Array.from(hideCandidates.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
    .forEach(({ spot, count }) => {
        console.log(`   ${count}회 중첩  T${spot.tier} ${spot.name.padEnd(15)} (${spot.category})`);
    });

console.log('');
console.log('2. 150km 최소 거리 적용 시:');
console.log(`   - 현재 150km 이내: ${overlaps150.length}쌍`);
console.log(`   - 권장: 유럽 지역 150km 최소 거리 강제 적용`);
console.log(`   - 예상 감소: ${Math.round(overlaps150.length / 2)}쌍 → ${Math.round(overlaps150.length / 2 - 10)}쌍`);

console.log('');
