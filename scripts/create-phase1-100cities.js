// scripts/create-phase1-100cities.js
// Phase 9-2 Step 4a: 기존 80개 + 누락 20개 = 100개 생성

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { TIER1_MISSING_CITIES } from './add-tier1-missing-cities.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptOutputs = path.join(__dirname, 'outputs');

// 기존 80개 데이터 로드
const rawData = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf-8');
const match = rawData.match(/export const TRAVEL_SPOTS = \[([\s\S]*)\];/);
const jsonStr = '[' + match[1] + ']';
const existing80 = JSON.parse(jsonStr);

console.log(`📊 Phase 9-2 Step 4a: 100개 여행지 생성 시작\n`);
console.log(`기존 데이터: ${existing80.length}개`);
console.log(`추가 데이터: ${TIER1_MISSING_CITIES.length}개\n`);

// 대륙 매핑
const continentMap = {
  "France": "europe",
  "French Polynesia": "oceania",
  "Greece": "europe",
  "Mexico": "north_america",
  "Maldives": "asia",
  "Seychelles": "africa",
  "Brazil": "south_america",
  "Bermuda": "north_america",
  "Portugal": "europe",
  "Tanzania": "africa",
  "Cook Islands": "oceania",
  "Samoa": "oceania",
  "Philippines": "asia",
  "Spain": "europe",
  "Indonesia": "asia",
  "United States": "north_america",
  "Guam": "oceania",
  "Canada": "north_america",
  "Argentina": "south_america",
  "United Kingdom": "europe",
  "South Africa": "africa",
  "Japan": "asia",
  "Australia": "oceania",
  "Egypt": "africa",
  "New Caledonia": "oceania",
  "Singapore": "asia",
  "UAE": "middle_east",
  "Kenya": "africa",
  "Chile": "south_america",
  "Russia": "europe",
  "Turkey": "europe",
  "Czechia": "europe",
  "Morocco": "africa",
  "Peru": "south_america",
  "Cambodia": "asia",
  "Jordan": "middle_east",
  "Midway Atoll": "oceania",
  "Myanmar": "asia",
  "Fiji": "oceania",
  "Easter Island": "south_america",
  "Meteora": "europe",
  "Saint Helena": "africa",
  "Mongolia": "asia",
  "French Guiana": "south_america",
  "Tonga": "oceania",
  "La Réunion": "africa",
  "South Korea": "asia",
  "Vanuatu": "oceania",
  "Patagonia": "south_america",
  "Kerguelen Islands": "africa",
  "Germany": "europe",
  "Taiwan": "asia",
  "China": "asia",
  "India": "asia",
  "New Zealand": "oceania",
  "Israel": "middle_east",
  "Austria": "europe",
  "Italy": "europe",
  "Netherlands": "europe",
  "Thailand": "asia"
};

// Tier 1 주요 도시 목록 (인기도 기준)
const tier1Cities = [
  "New York", "Rio de Janeiro", "London", "Cape Town", "Tokyo", "Sydney",
  "Ushuaia", "Moscow", "Cairo", "Nouméa", "Singapore", "Dubai", "Nairobi",
  "Chicago", "Buenos Aires", "Melbourne", "Rome", "Istanbul", "Prague",
  "Marrakesh", "Machu Picchu", "Angkor Wat", "Petra", "Giza Pyramids",
  "Paris", "Barcelona", "Bangkok", "Hong Kong", "Kyoto", "San Francisco"
];

// 밀집 지역 정의
const denseRegions = {
  'western-europe': { latRange: [45, 55], lngRange: [-5, 15] },
  'southern-europe': { latRange: [37, 45], lngRange: [8, 20] },
  'central-europe': { latRange: [47, 53], lngRange: [10, 20] },
  'southeast-asia': { latRange: [-10, 25], lngRange: [95, 125] },
  'east-asia': { latRange: [22, 40], lngRange: [110, 145] },
  'us-east-coast': { latRange: [35, 45], lngRange: [-80, -70] },
  'us-west-coast': { latRange: [32, 48], lngRange: [-125, -115] }
};

// 밀집 지역 판정
function getDenseRegion(lat, lng) {
  for (const [regionId, region] of Object.entries(denseRegions)) {
    if (lat >= region.latRange[0] && lat <= region.latRange[1] &&
        lng >= region.lngRange[0] && lng <= region.lngRange[1]) {
      return regionId;
    }
  }
  return null;
}

// Tier 판정
function getTier(nameEn, category) {
  // Tier 1: 주요 대도시 및 필수 랜드마크
  if (tier1Cities.some(city => nameEn.includes(city))) {
    return 1;
  }

  // Tier 3: 특화/오지
  const tier3Keywords = ["Antarctica", "Svalbard", "Kerguelen", "Saint Helena",
                         "Midway", "Easter Island", "Desolation", "Yakutsk", "Kamchatka"];
  if (tier3Keywords.some(keyword => nameEn.includes(keyword))) {
    return 3;
  }

  // 나머지는 Tier 2
  return 2;
}

// 인기도 계산
function calculatePopularity(tier, category) {
  if (tier === 1) return Math.floor(85 + Math.random() * 10); // 85-95
  if (tier === 2) return Math.floor(65 + Math.random() * 15); // 65-80
  return Math.floor(45 + Math.random() * 15); // 45-60
}

// 기존 80개에 메타데이터 추가
const enhanced80 = existing80.map((spot) => {
  const continent = continentMap[spot.country_en] || "unknown";
  const tier = getTier(spot.name_en, spot.category);
  const popularity = calculatePopularity(tier, spot.category);
  const denseRegion = getDenseRegion(spot.lat, spot.lng);

  // 밀집 지역이 아니거나 Tier 1이면 지구본 표시
  const showOnGlobe = !denseRegion || tier === 1;

  return {
    ...spot,
    tier,
    popularity,
    continent,
    categories: [spot.category], // 기존은 단일 카테고리
    primaryCategory: spot.category,
    showOnGlobe,
    denseRegion
  };
});

console.log('✅ 기존 80개 메타데이터 추가 완료\n');

// 통계 출력
const tier1Count = enhanced80.filter(s => s.tier === 1).length;
const tier2Count = enhanced80.filter(s => s.tier === 2).length;
const tier3Count = enhanced80.filter(s => s.tier === 3).length;

console.log(`📊 기존 80개 분포:`);
console.log(`  Tier 1: ${tier1Count}개`);
console.log(`  Tier 2: ${tier2Count}개`);
console.log(`  Tier 3: ${tier3Count}개\n`);

// 100개 병합
const allDestinations = [...enhanced80, ...TIER1_MISSING_CITIES];

console.log(`✅ 총 ${allDestinations.length}개 여행지 생성 완료\n`);

// 최종 통계
const finalTier1 = allDestinations.filter(d => d.tier === 1).length;
const finalTier2 = allDestinations.filter(d => d.tier === 2).length;
const finalTier3 = allDestinations.filter(d => d.tier === 3).length;
const showOnGlobeCount = allDestinations.filter(d => d.showOnGlobe).length;

console.log(`📊 최종 100개 분포:`);
console.log(`  Tier 1: ${finalTier1}개 (목표: 50개)`);
console.log(`  Tier 2: ${finalTier2}개 (목표: 50개)`);
console.log(`  Tier 3: ${finalTier3}개`);
console.log(`  지구본 표시: ${showOnGlobeCount}개\n`);

// JavaScript 파일 생성
let content = `// src/pages/Home/data/travelSpots-phase1.js
// 🚀 Phase 9-2 Step 4a: 100개 여행지 (기존 80개 + 누락 20개)
// 생성일: ${new Date().toISOString().split('T')[0]}

export const TRAVEL_SPOTS = [\n`;

allDestinations.forEach((dest, index) => {
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
  content += `    "category": "${dest.category || dest.primaryCategory}",\n`;
  content += `    "showOnGlobe": ${dest.showOnGlobe},\n`;
  content += `    "denseRegion": ${dest.denseRegion ? `"${dest.denseRegion}"` : 'null'},\n`;
  content += `    "desc": "${(dest.desc || '').replace(/"/g, '\\"').replace(/\n/g, ' ')}",\n`;
  content += `    "keywords": ${JSON.stringify(dest.keywords || [])}\n`;
  content += `  }${index < allDestinations.length - 1 ? ',' : ''}\n`;
});

content += `];\n\n`;
content += `// 📊 Phase 1 통계\n`;
content += `// Tier 1: ${finalTier1}개\n`;
content += `// Tier 2: ${finalTier2}개\n`;
content += `// Tier 3: ${finalTier3}개\n`;
content += `// 지구본 표시: ${showOnGlobeCount}개\n`;
content += `// 총 여행지: ${allDestinations.length}개\n`;

fs.mkdirSync(scriptOutputs, { recursive: true });
const phase1Path = path.join(scriptOutputs, 'travelSpots-phase1.js');
fs.writeFileSync(phase1Path, content, 'utf-8');

console.log(`✅ 파일 생성 완료: ${phase1Path}\n`);

// JSON(기존 `plans/archive/misc`에 동일)
const jsonPath = path.join(
  __dirname,
  '..',
  'plans',
  'archive',
  'misc',
  'phase9-2-phase1-100cities.json'
);
fs.writeFileSync(jsonPath, JSON.stringify(allDestinations, null, 2), 'utf-8');

console.log('✅ JSON 저장 완료: plans/archive/misc/phase9-2-phase1-100cities.json\n');
console.log('🎉 Phase 1 완료! 다음은 AI로 나머지 100개 추출 (Phase 2)');
