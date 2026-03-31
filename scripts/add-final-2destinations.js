// scripts/add-final-2destinations.js
// Phase 9-2: 마지막 2개 여행지 추가 (Nature 카테고리)

import fs from 'fs';

console.log('🚀 Phase 9-2: 마지막 2개 여행지 추가\n');

// 기존 데이터 로드
const rawData = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf-8');
const match = rawData.match(/export const TRAVEL_SPOTS = \[([\s\S]*)\];/);
const jsonStr = '[' + match[1] + ']';
const existingSpots = JSON.parse(jsonStr);

console.log(`📊 현재 여행지: ${existingSpots.length}개\n`);

// Nature 카테고리에 2개 추가
const finalDestinations = [
  {
    id: 199,
    slug: "cinque-terre",
    name: "친퀘테레",
    name_en: "Cinque Terre",
    country: "이탈리아",
    country_en: "Italy",
    lat: 44.12,
    lng: 9.72,
    tier: 2,
    popularity: 79,
    continent: "europe",
    categories: ["nature"],
    primaryCategory: "nature",
    category: "nature",
    showOnGlobe: false,
    denseRegion: null,
    desc: "이탈리아 리구리아 해안의 다섯 마을로 절벽 위에 세워진 형형색색의 집들이 지중해와 어우러져 그림 같은 풍경을 만듭니다. 해안 트레킹 코스가 유명합니다.",
    keywords: ["해안", "마을", "트레킹", "UNESCO"]
  },
  {
    id: 200,
    slug: "mount-bromo",
    name: "브로모 화산",
    name_en: "Mount Bromo",
    country: "인도네시아",
    country_en: "Indonesia",
    lat: -7.94,
    lng: 112.95,
    tier: 2,
    popularity: 76,
    continent: "asia",
    categories: ["nature"],
    primaryCategory: "nature",
    category: "nature",
    showOnGlobe: true,
    denseRegion: null,
    desc: "인도네시아 자바 섬의 활화산으로 거대한 분화구 안에 있는 신비로운 풍경을 자랑합니다. 일출 시 바다 같은 화산재 평원 위로 솟은 분화구가 장관을 이룹니다.",
    keywords: ["화산", "일출", "분화구", "트레킹"]
  }
];

// 최종 병합
const finalSpots = [...existingSpots, ...finalDestinations];

console.log(`✅ 최종 여행지 개수: ${finalSpots.length}개\n`);

// 카테고리별 통계
const categoryStats = {
  paradise: finalSpots.filter(s => s.primaryCategory === 'paradise').length,
  nature: finalSpots.filter(s => s.primaryCategory === 'nature').length,
  adventure: finalSpots.filter(s => s.primaryCategory === 'adventure').length,
  urban: finalSpots.filter(s => s.primaryCategory === 'urban').length,
  culture: finalSpots.filter(s => s.primaryCategory === 'culture').length
};

console.log('📊 최종 카테고리 분포:');
Object.entries(categoryStats).forEach(([cat, count]) => {
  const targets = { paradise: 33, nature: 33, adventure: 32, urban: 47, culture: 55 };
  const status = count === targets[cat] ? '✅' : count < targets[cat] ? '⚠️' : '⚡';
  console.log(`  ${status} ${cat}: ${count}/${targets[cat]}개`);
});
console.log('');

const finalGlobeCount = finalSpots.filter(s => s.showOnGlobe).length;
console.log(`🌍 지구본 표시 총계: ${finalGlobeCount}개\n`);

// Tier 분포
const tierStats = {};
finalSpots.forEach(spot => {
  const tier = spot.tier || 'unknown';
  tierStats[tier] = (tierStats[tier] || 0) + 1;
});

console.log('📊 Tier 분포:');
Object.entries(tierStats).sort((a, b) => a[0] - b[0]).forEach(([tier, count]) => {
  console.log(`  Tier ${tier}: ${count}개`);
});
console.log('');

// JavaScript 파일 생성
let content = `/**
 * Travel Spots Data - Phase 2 Complete (200 Destinations)
 *
 * Total: ${finalSpots.length}개
 * Globe Display: ${finalGlobeCount}개
 *
 * Phase 2 Additions (21 new destinations):
 * - Paradise: 7개 (Mediterranean & Asia-Pacific islands)
 * - Nature: 8개 (Mountains, coasts, natural wonders)
 * - Adventure: 6개 (Extreme trekking & diving)
 *
 * Category Distribution:
 * - Paradise: ${categoryStats.paradise}개
 * - Nature: ${categoryStats.nature}개
 * - Adventure: ${categoryStats.adventure}개
 * - Urban: ${categoryStats.urban}개
 * - Culture: ${categoryStats.culture}개
 *
 * Last Updated: ${new Date().toISOString().split('T')[0]}
 */

export const TRAVEL_SPOTS = [\n`;

finalSpots.forEach((dest, index) => {
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
  content += `  }${index < finalSpots.length - 1 ? ',' : ''}\n`;
});

content += `];\n`;

// 새 파일 저장
fs.writeFileSync('src/pages/Home/data/travelSpots.js', content, 'utf-8');
console.log('✅ travelSpots.js 최종 업데이트 완료\n');

console.log('🎉🎉🎉 Phase 2 완료! 🎉🎉🎉');
console.log('179개 → 200개 여행지 달성!\n');
console.log('📌 브라우저에서 확인: http://localhost:5173');
