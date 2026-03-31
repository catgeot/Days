// scripts/analyze-current-status.js
// 현재 179개 여행지의 정확한 상태 분석

import fs from 'fs';

console.log('🔍 현재 여행지 분석 시작\n');

// 기존 데이터 로드
const rawData = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf-8');
const match = rawData.match(/export const TRAVEL_SPOTS = \[([\s\S]*)\];/);
const jsonStr = '[' + match[1] + ']';
const spots = JSON.parse(jsonStr);

console.log(`📊 총 여행지: ${spots.length}개\n`);

// 카테고리별 분포
const categoryStats = {};
spots.forEach(spot => {
  const cat = spot.primaryCategory || spot.category;
  categoryStats[cat] = (categoryStats[cat] || 0) + 1;
});

console.log('📊 카테고리별 분포:');
Object.entries(categoryStats).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}개`);
});
console.log('');

// 지구본 표시 통계
const globeCount = spots.filter(s => s.showOnGlobe).length;
console.log(`🌍 지구본 표시: ${globeCount}개 / ${spots.length}개\n`);

// 카테고리별 지구본 표시
const globeByCat = {};
spots.filter(s => s.showOnGlobe).forEach(spot => {
  const cat = spot.primaryCategory || spot.category;
  globeByCat[cat] = (globeByCat[cat] || 0) + 1;
});

console.log('🌍 카테고리별 지구본 표시:');
Object.entries(globeByCat).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
  console.log(`  ${cat}: ${count}개`);
});
console.log('');

// 목표와 현재 비교 (200개 기준)
const targets = {
  paradise: 33,
  nature: 33,
  adventure: 32,
  urban: 47,
  culture: 55
};

console.log('🎯 목표 대비 현황 (200개 기준):');
Object.entries(targets).forEach(([cat, target]) => {
  const current = categoryStats[cat] || 0;
  const diff = target - current;
  const status = diff > 0 ? `➕ ${diff}개 필요` : diff < 0 ? `➖ ${Math.abs(diff)}개 초과` : '✅ 목표 달성';
  console.log(`  ${cat}: ${current}/${target}개 ${status}`);
});
console.log('');

// Tier 분포
const tierStats = {};
spots.forEach(spot => {
  const tier = spot.tier || 'unknown';
  tierStats[tier] = (tierStats[tier] || 0) + 1;
});

console.log('📊 Tier 분포:');
Object.entries(tierStats).sort((a, b) => a[0] - b[0]).forEach(([tier, count]) => {
  console.log(`  Tier ${tier}: ${count}개`);
});
console.log('');

// 각 카테고리의 주요 여행지 목록 (이름만)
console.log('📋 카테고리별 주요 여행지:');
['paradise', 'nature', 'adventure', 'urban', 'culture'].forEach(cat => {
  const catSpots = spots.filter(s => (s.primaryCategory || s.category) === cat);
  console.log(`\n${cat} (${catSpots.length}개):`);
  catSpots.slice(0, 10).forEach(s => {
    console.log(`  - ${s.name} (${s.name_en})`);
  });
  if (catSpots.length > 10) {
    console.log(`  ... 외 ${catSpots.length - 10}개`);
  }
});

console.log('\n✅ 분석 완료');
