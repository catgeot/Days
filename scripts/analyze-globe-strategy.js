// scripts/analyze-globe-strategy.js
// 지구본 표시 전략 분석 - "특별한 여행지" 중심으로

import fs from 'fs';

console.log('🔍 현재 지구본 표시 전략 분석\n');

// 기존 데이터 로드
const rawData = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf-8');
const match = rawData.match(/export const TRAVEL_SPOTS = \[([\s\S]*)\];/);
const jsonStr = '[' + match[1] + ']';
const spots = JSON.parse(jsonStr);

console.log(`📊 총 여행지: ${spots.length}개\n`);

// Tier별 지구본 표시 현황
const tierGlobeStats = {
  1: { total: 0, onGlobe: 0 },
  2: { total: 0, onGlobe: 0 },
  3: { total: 0, onGlobe: 0 }
};

spots.forEach(spot => {
  const tier = spot.tier || 2;
  tierGlobeStats[tier].total++;
  if (spot.showOnGlobe) {
    tierGlobeStats[tier].onGlobe++;
  }
});

console.log('📊 Tier별 지구본 표시 현황:\n');
Object.entries(tierGlobeStats).forEach(([tier, stats]) => {
  const percentage = ((stats.onGlobe / stats.total) * 100).toFixed(1);
  console.log(`Tier ${tier}: ${stats.onGlobe}/${stats.total}개 표시 (${percentage}%)`);
});
console.log('');

// "흔한 vs 특별한" 분류
const commonCities = [
  'Paris', 'London', 'New York', 'Tokyo', 'Rome', 'Barcelona',
  'Amsterdam', 'Dubai', 'Singapore', 'Hong Kong', 'Sydney',
  'Los Angeles', 'San Francisco', 'Bangkok', 'Seoul', 'Istanbul',
  'Berlin', 'Moscow', 'Cairo', 'Rio de Janeiro', 'Chicago',
  'Miami', 'Las Vegas', 'Boston', 'Vienna', 'Prague', 'Lisbon',
  'Stockholm', 'Copenhagen', 'Brussels', 'Milan', 'Venice',
  'Florence', 'Athens', 'Dublin', 'Edinburgh', 'Madrid'
];

const specialDestinations = spots.filter(spot => {
  const isCommon = commonCities.some(city =>
    spot.name_en.toLowerCase().includes(city.toLowerCase())
  );
  return !isCommon && spot.showOnGlobe;
});

const commonOnGlobe = spots.filter(spot => {
  const isCommon = commonCities.some(city =>
    spot.name_en.toLowerCase().includes(city.toLowerCase())
  );
  return isCommon && spot.showOnGlobe;
});

console.log('🎯 "흔한 vs 특별한" 분석:\n');
console.log(`흔한 대도시 (지구본 표시): ${commonOnGlobe.length}개`);
console.log(`특별한 여행지 (지구본 표시): ${specialDestinations.length}개`);
console.log('');

console.log('📋 지구본에 표시되는 흔한 대도시 (제거 고려 대상):\n');
commonOnGlobe.slice(0, 20).forEach(spot => {
  console.log(`  - ${spot.name} (${spot.name_en}) [Tier ${spot.tier}]`);
});
if (commonOnGlobe.length > 20) {
  console.log(`  ... 외 ${commonOnGlobe.length - 20}개`);
}
console.log('');

// 카테고리별 "특별한" 여행지 추천
console.log('✨ 카테고리별 "특별한" 여행지 (지구본 우선 추천):\n');

const categories = ['paradise', 'nature', 'adventure', 'urban', 'culture'];
categories.forEach(cat => {
  const catSpots = spots.filter(s => s.primaryCategory === cat);
  const special = catSpots.filter(spot => {
    const isCommon = commonCities.some(city =>
      spot.name_en.toLowerCase().includes(city.toLowerCase())
    );
    return !isCommon;
  });

  console.log(`\n${cat.toUpperCase()} (${special.length}개 특별한 곳):`);
  special.slice(0, 5).forEach(spot => {
    const status = spot.showOnGlobe ? '🌍' : '  ';
    console.log(`  ${status} ${spot.name} (${spot.name_en}) [Tier ${spot.tier}]`);
  });
  if (special.length > 5) {
    console.log(`  ... 외 ${special.length - 5}개`);
  }
});

console.log('\n\n💡 권장 전략:\n');
console.log('1. Tier 1 대도시: 지구본 표시 최소화 (20-30개만)');
console.log('   → 파리, 뉴욕, 도쿄 등은 검색/리스트에서만 표시');
console.log('');
console.log('2. Tier 2-3 특별한 곳: 지구본 표시 우선');
console.log('   → 길리 메노, 스발바르, 라자 암팟 등');
console.log('');
console.log('3. 목표: 지구본 100개 중');
console.log('   - 흔한 대도시: 20-25개 (20-25%)');
console.log('   - 특별한 여행지: 75-80개 (75-80%)');
console.log('');
console.log('4. 우선순위:');
console.log('   a) Tier 3 (오지/희귀) → 거의 모두 표시');
console.log('   b) Tier 2 특별한 곳 → 선별 표시');
console.log('   c) Tier 1 대도시 → 최소한만 표시 (지역 균형용)');
