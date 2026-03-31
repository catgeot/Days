// scripts/rebalance-globe-display.js
// 지구본 표시 재조정: "특별한 여행지" 중심 전략

import fs from 'fs';

console.log('🎯 지구본 표시 재조정: "특별한 여행지" 중심 전략\n');

// 기존 데이터 로드
const rawData = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf-8');
const match = rawData.match(/export const TRAVEL_SPOTS = \[([\s\S]*)\];/);
const jsonStr = '[' + match[1] + ']';
const spots = JSON.parse(jsonStr);

console.log(`📊 총 여행지: ${spots.length}개\n`);

// 흔한 대도시 목록
const commonCities = [
  'Paris', 'London', 'New York', 'Tokyo', 'Rome', 'Barcelona',
  'Amsterdam', 'Dubai', 'Singapore', 'Hong Kong', 'Sydney',
  'Los Angeles', 'San Francisco', 'Bangkok', 'Seoul', 'Istanbul',
  'Berlin', 'Moscow', 'Cairo', 'Rio de Janeiro', 'Chicago',
  'Miami', 'Las Vegas', 'Boston', 'Vienna', 'Prague', 'Lisbon',
  'Stockholm', 'Copenhagen', 'Brussels', 'Milan', 'Venice',
  'Florence', 'Athens', 'Dublin', 'Edinburgh', 'Madrid', 'Munich'
];

// 지역 균형을 위해 반드시 표시할 Tier 1 대도시 (20개)
const mustShowCities = [
  'New York', 'London', 'Tokyo', 'Paris', 'Sydney',      // 5대륙 대표
  'Cape Town', 'Cairo', 'Nairobi',                      // 아프리카 3개
  'Rio de Janeiro', 'Buenos Aires',                     // 남미 2개
  'Singapore', 'Dubai',                                 // 아시아/중동 2개
  'Moscow', 'Istanbul',                                 // 유라시아 2개
  'Rome', 'Barcelona',                                  // 유럽 문화 2개
  'Bangkok', 'Seoul',                                   // 동아시아 2개
  'Ushuaia', 'Chicago'                                  // 특수 지역 2개
];

// 재조정 로직
const rebalanced = spots.map(spot => {
  const tier = spot.tier || 2;
  const nameEn = spot.name_en;
  const isCommon = commonCities.some(city =>
    nameEn.toLowerCase().includes(city.toLowerCase())
  );

  let newShowOnGlobe = spot.showOnGlobe;

  // 규칙 1: Tier 3 (희귀한 곳) - 거의 모두 표시
  if (tier === 3) {
    newShowOnGlobe = true;
  }

  // 규칙 2: Tier 1 흔한 대도시 - 필수 20개만 표시
  if (tier === 1 && isCommon) {
    const isMustShow = mustShowCities.some(city =>
      nameEn.toLowerCase().includes(city.toLowerCase())
    );
    newShowOnGlobe = isMustShow;
  }

  // 규칙 3: Tier 1 특별한 곳 - 모두 표시
  if (tier === 1 && !isCommon) {
    newShowOnGlobe = true;
  }

  // 규칙 4: Tier 2 - 특별한 곳 우선, 카테고리별 균형
  if (tier === 2) {
    const category = spot.primaryCategory || spot.category;

    // Paradise, Nature, Adventure는 대부분 특별하므로 표시
    if (['paradise', 'nature', 'adventure'].includes(category)) {
      if (!isCommon) {
        newShowOnGlobe = true;
      } else {
        newShowOnGlobe = false; // 혹시 있을 흔한 곳은 제외
      }
    }

    // Urban, Culture는 선별적
    if (['urban', 'culture'].includes(category)) {
      if (isCommon) {
        newShowOnGlobe = false; // 흔한 도시는 제외
      }
      // 특별한 곳은 기존 설정 유지
    }
  }

  return {
    ...spot,
    showOnGlobe: newShowOnGlobe
  };
});

// 통계
const oldCount = spots.filter(s => s.showOnGlobe).length;
const newCount = rebalanced.filter(s => s.showOnGlobe).length;

console.log('📊 변경 전후 비교:\n');
console.log(`지구본 표시: ${oldCount}개 → ${newCount}개\n`);

// Tier별 통계
const tierStats = {
  1: { before: 0, after: 0, total: 0 },
  2: { before: 0, after: 0, total: 0 },
  3: { before: 0, after: 0, total: 0 }
};

spots.forEach((spot, i) => {
  const tier = spot.tier || 2;
  tierStats[tier].total++;
  if (spot.showOnGlobe) tierStats[tier].before++;
  if (rebalanced[i].showOnGlobe) tierStats[tier].after++;
});

console.log('📊 Tier별 변화:\n');
Object.entries(tierStats).forEach(([tier, stats]) => {
  const beforePct = ((stats.before / stats.total) * 100).toFixed(1);
  const afterPct = ((stats.after / stats.total) * 100).toFixed(1);
  const change = stats.after - stats.before;
  const changeStr = change > 0 ? `+${change}` : change;
  console.log(`Tier ${tier}: ${stats.before}개 (${beforePct}%) → ${stats.after}개 (${afterPct}%) [${changeStr}]`);
});
console.log('');

// 카테고리별 통계
const categoryStats = {};
['paradise', 'nature', 'adventure', 'urban', 'culture'].forEach(cat => {
  const before = spots.filter(s => (s.primaryCategory || s.category) === cat && s.showOnGlobe).length;
  const after = rebalanced.filter(s => (s.primaryCategory || s.category) === cat && s.showOnGlobe).length;
  categoryStats[cat] = { before, after, change: after - before };
});

console.log('📊 카테고리별 변화:\n');
Object.entries(categoryStats).forEach(([cat, stats]) => {
  const changeStr = stats.change > 0 ? `+${stats.change}` : stats.change;
  console.log(`${cat}: ${stats.before}개 → ${stats.after}개 [${changeStr}]`);
});
console.log('');

// 제거된 흔한 대도시 목록
const removed = spots.filter((spot, i) =>
  spot.showOnGlobe && !rebalanced[i].showOnGlobe
);

console.log(`🔻 지구본에서 제거된 여행지 (${removed.length}개):\n`);
removed.forEach(spot => {
  console.log(`  - ${spot.name} (${spot.name_en}) [Tier ${spot.tier}]`);
});
console.log('');

// 추가된 특별한 여행지 목록
const added = spots.filter((spot, i) =>
  !spot.showOnGlobe && rebalanced[i].showOnGlobe
);

console.log(`🔺 지구본에 추가된 여행지 (${added.length}개):\n`);
added.forEach(spot => {
  console.log(`  - ${spot.name} (${spot.name_en}) [Tier ${spot.tier}]`);
});
console.log('');

// 파일 저장
let content = `/**
 * Travel Spots Data - Globe Display Rebalanced
 *
 * Total: ${rebalanced.length}개
 * Globe Display: ${newCount}개 (${((newCount/rebalanced.length)*100).toFixed(1)}%)
 *
 * Globe Display Strategy: "Special Destinations First"
 * - Tier 1 Common Cities: ${tierStats[1].after}/${tierStats[1].total}개 (${((tierStats[1].after/tierStats[1].total)*100).toFixed(1)}%)
 * - Tier 2 Special Places: ${tierStats[2].after}/${tierStats[2].total}개 (${((tierStats[2].after/tierStats[2].total)*100).toFixed(1)}%)
 * - Tier 3 Hidden Gems: ${tierStats[3].after}/${tierStats[3].total}개 (${((tierStats[3].after/tierStats[3].total)*100).toFixed(1)}%)
 *
 * Last Updated: ${new Date().toISOString().split('T')[0]}
 */

export const TRAVEL_SPOTS = [\n`;

rebalanced.forEach((dest, index) => {
  content += `  {\n`;
  content += `    "id": ${dest.id},\n`;
  content += `    "slug": "${dest.slug}",\n`;
  content += `    "name": "${dest.name}",\n`;
  content += `    "name_en": "${dest.name_en}",\n`;
  content += `    "country": "${dest.country}",\n`;
  content += `    "country_en": "${dest.country_en}",\n`;
  content += `    "lat": ${dest.lat},\n`;
  content += `    "lng": ${dest.lng},\n`;
  content += `    "tier": ${dest.tier},\n`;
  content += `    "popularity": ${dest.popularity},\n`;
  content += `    "continent": "${dest.continent}",\n`;
  content += `    "categories": ${JSON.stringify(dest.categories)},\n`;
  content += `    "primaryCategory": "${dest.primaryCategory}",\n`;
  content += `    "category": "${dest.category}",\n`;
  content += `    "showOnGlobe": ${dest.showOnGlobe},\n`;
  content += `    "denseRegion": ${dest.denseRegion ? `"${dest.denseRegion}"` : 'null'},\n`;
  content += `    "desc": "${(dest.desc || '').replace(/"/g, '\\"').replace(/\n/g, ' ')}",\n`;
  content += `    "keywords": ${JSON.stringify(dest.keywords || [])}\n`;
  content += `  }${index < rebalanced.length - 1 ? ',' : ''}\n`;
});

content += `];\n`;

// 백업
const backupPath = 'src/pages/Home/data/travelSpots-before-rebalance.js';
fs.writeFileSync(backupPath, rawData, 'utf-8');
console.log(`💾 백업 생성: ${backupPath}\n`);

// 저장
fs.writeFileSync('src/pages/Home/data/travelSpots.js', content, 'utf-8');
console.log('✅ travelSpots.js 업데이트 완료\n');

console.log('🎉 지구본 재조정 완료!');
console.log('\n💡 결과:');
console.log(`  • 흔한 대도시 최소화 (지역 균형 유지)`);
console.log(`  • 특별한 여행지 우선 표시`);
console.log(`  • Tier 3 희귀한 곳 대부분 표시`);
console.log(`  • 총 ${newCount}개 지구본 마커 (목표: 90-100개)`);
