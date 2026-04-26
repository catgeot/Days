// scripts/add-phase2-21destinations.js
// Phase 9-2: 21개 여행지 추가 (179개 → 200개)
// Paradise 7개, Nature 8개, Adventure 6개

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scriptOutputs = path.join(__dirname, 'outputs');

console.log('🚀 Phase 9-2: 21개 여행지 추가 시작\n');

// 기존 179개 데이터 로드
const rawData = fs.readFileSync('src/pages/Home/data/travelSpots.js', 'utf-8');
const match = rawData.match(/export const TRAVEL_SPOTS = \[([\s\S]*)\];/);
if (!match) {
  console.error('❌ 기존 데이터를 읽을 수 없습니다.');
  process.exit(1);
}

const jsonStr = '[' + match[1] + ']';
const existingSpots = JSON.parse(jsonStr);

console.log(`📊 기존 여행지: ${existingSpots.length}개\n`);

// 대륙 매핑
const continentMap = {
  "Indonesia": "asia",
  "Philippines": "asia",
  "Thailand": "asia",
  "Vietnam": "asia",
  "Malaysia": "asia",
  "United States": "north_america",
  "Chile": "south_america",
  "New Zealand": "oceania",
  "Croatia": "europe",
  "China": "asia",
  "Switzerland": "europe",
  "Nepal": "asia",
  "Tanzania": "africa"
};

// Paradise 7개
const paradiseDestinations = [
  {
    name: "길리 메노",
    name_en: "Gili Meno",
    country: "인도네시아",
    country_en: "Indonesia",
    lat: -8.35,
    lng: 116.05,
    tier: 3,
    popularity: 68,
    desc: "인도네시아 롬복 근처에 위치한 세 개의 길리 섬 중 가장 조용하고 한적한 섬입니다. 백사장 해변과 투명한 바다, 거북이와 함께 스노클링할 수 있는 천국 같은 휴양지입니다.",
    keywords: ["섬", "스노클링", "거북이", "휴양"],
    showOnGlobe: true // 천국 테마 핵심
  },
  {
    name: "엘 니도",
    name_en: "El Nido",
    country: "필리핀",
    country_en: "Philippines",
    lat: 11.19,
    lng: 119.40,
    tier: 2,
    popularity: 78,
    desc: "필리핀 팔라완 북부의 숨겨진 보석으로, 석회암 절벽과 에메랄드빛 석호, 비밀스러운 라군이 어우러진 천상의 풍경을 자랑합니다. 아일랜드 호핑 투어가 인기입니다.",
    keywords: ["라군", "절벽", "카약", "다이빙"],
    showOnGlobe: true
  },
  {
    name: "코타오",
    name_en: "Koh Tao",
    country: "태국",
    country_en: "Thailand",
    lat: 10.09,
    lng: 99.84,
    tier: 2,
    popularity: 72,
    desc: "태국 남부의 작은 섬으로 세계적인 스쿠버 다이빙 메카입니다. 저렴한 다이빙 자격증 취득으로 유명하며, 고래상어와 만날 수 있는 다이빙 포인트가 많습니다.",
    keywords: ["다이빙", "스쿠버", "백팩커", "섬"],
    showOnGlobe: false // 동남아 밀집
  },
  {
    name: "나트랑",
    name_en: "Nha Trang",
    country: "베트남",
    country_en: "Vietnam",
    lat: 12.24,
    lng: 109.19,
    tier: 2,
    popularity: 76,
    desc: "베트남 최고의 해변 휴양지로 6km에 달하는 아름다운 해변과 맑은 바닷물을 자랑합니다. 머드 스파, 온천, 스노클링 등 다양한 액티비티를 즐길 수 있습니다.",
    keywords: ["해변", "리조트", "스파", "스노클링"],
    showOnGlobe: false // 동남아 밀집
  },
  {
    name: "랑카위",
    name_en: "Langkawi",
    country: "말레이시아",
    country_en: "Malaysia",
    lat: 6.35,
    lng: 99.80,
    tier: 2,
    popularity: 80,
    desc: "말레이시아의 면세 섬으로 럭셔리 리조트와 열대우림, 맹그로브 숲이 공존하는 휴양지입니다. 스카이브릿지와 케이블카에서 바라보는 전망이 압권입니다.",
    keywords: ["면세", "리조트", "케이블카", "열대우림"],
    showOnGlobe: true
  },
  {
    name: "푸켓",
    name_en: "Phuket",
    country: "태국",
    country_en: "Thailand",
    lat: 7.88,
    lng: 98.39,
    tier: 2,
    popularity: 85,
    desc: "태국 최대의 섬이자 동남아시아를 대표하는 휴양지입니다. 파통 비치의 활기찬 나이트라이프부터 고급 리조트까지, 모든 여행 스타일을 만족시킵니다.",
    keywords: ["해변", "나이트라이프", "리조트", "피피섬"],
    showOnGlobe: true
  },
  {
    name: "코사무이",
    name_en: "Koh Samui",
    country: "태국",
    country_en: "Thailand",
    lat: 9.51,
    lng: 100.00,
    tier: 2,
    popularity: 82,
    desc: "태국의 프리미엄 휴양 섬으로 야자수가 늘어선 해변과 고급 리조트가 조화를 이룹니다. 차웽 비치와 라마이 비치가 유명하며, 풀문 파티의 본거지 코팡안이 인근에 있습니다.",
    keywords: ["리조트", "해변", "럭셔리", "풀문파티"],
    showOnGlobe: true
  }
];

// Nature 8개
const natureDestinations = [
  {
    name: "요세미티 국립공원",
    name_en: "Yosemite National Park",
    country: "미국",
    country_en: "United States",
    lat: 37.87,
    lng: -119.54,
    tier: 2,
    popularity: 82,
    desc: "캘리포니아의 대표적인 국립공원으로 엘 캐피탄 암벽, 하프돔, 요세미티 폭포 등 웅장한 화강암 절벽과 폭포가 장관을 이룹니다. 세계적인 암벽 등반의 성지입니다.",
    keywords: ["국립공원", "폭포", "암벽등반", "하이킹"],
    showOnGlobe: true
  },
  {
    name: "그랜드 캐니언",
    name_en: "Grand Canyon",
    country: "미국",
    country_en: "United States",
    lat: 36.11,
    lng: -112.11,
    tier: 2,
    popularity: 88,
    desc: "세계 7대 자연경관 중 하나로 콜로라도 강이 수백만 년에 걸쳐 깎아낸 거대한 협곡입니다. 일출과 일몰 시 붉게 물드는 협곡의 모습은 경이로움 그 자체입니다.",
    keywords: ["협곡", "국립공원", "일출", "하이킹"],
    showOnGlobe: true
  },
  {
    name: "토레스 델 파이네",
    name_en: "Torres del Paine",
    country: "칠레",
    country_en: "Chile",
    lat: -51.00,
    lng: -73.00,
    tier: 3,
    popularity: 65,
    desc: "파타고니아의 정수를 보여주는 칠레 국립공원으로 거대한 화강암 봉우리, 빙하, 호수가 어우러진 절경을 자랑합니다. W 트레킹 코스가 세계적으로 유명합니다.",
    keywords: ["파타고니아", "트레킹", "빙하", "국립공원"],
    showOnGlobe: true
  },
  {
    name: "밀포드 사운드",
    name_en: "Milford Sound",
    country: "뉴질랜드",
    country_en: "New Zealand",
    lat: -44.67,
    lng: 167.93,
    tier: 2,
    popularity: 78,
    desc: "뉴질랜드 남섬의 피오르드랜드 국립공원에 위치한 피오르드로 수직으로 솟은 절벽과 폭포가 압도적인 장관을 연출합니다. 세계 8번째 불가사의로 불립니다.",
    keywords: ["피오르드", "폭포", "크루즈", "절벽"],
    showOnGlobe: false
  },
  {
    name: "플리트비체 호수 국립공원",
    name_en: "Plitvice Lakes National Park",
    country: "크로아티아",
    country_en: "Croatia",
    lat: 44.88,
    lng: 15.62,
    tier: 2,
    popularity: 75,
    desc: "크로아티아의 보석으로 16개의 에메랄드빛 호수가 계단식 폭포로 연결된 동화 같은 풍경을 자랑합니다. UNESCO 세계자연유산으로 등재되어 있습니다.",
    keywords: ["호수", "폭포", "국립공원", "에메랄드"],
    showOnGlobe: false
  },
  {
    name: "장가계 국립산림공원",
    name_en: "Zhangjiajie National Forest Park",
    country: "중국",
    country_en: "China",
    lat: 29.32,
    lng: 110.44,
    tier: 2,
    popularity: 80,
    desc: "영화 아바타의 배경이 된 곳으로 3,000개 이상의 거대한 사암 기둥이 하늘을 찌를 듯 솟아 있습니다. 세계에서 가장 높은 야외 엘리베이터와 유리 스카이워크가 있습니다.",
    keywords: ["아바타", "기둥", "스카이워크", "산림"],
    showOnGlobe: false
  },
  {
    name: "하롱베이",
    name_en: "Ha Long Bay",
    country: "베트남",
    country_en: "Vietnam",
    lat: 20.91,
    lng: 107.18,
    tier: 2,
    popularity: 83,
    desc: "베트남 북부의 UNESCO 세계자연유산으로 약 2,000개의 석회암 섬과 카르스트 지형이 에메랄드빛 바다 위에 펼쳐진 절경입니다. 크루즈 투어가 필수입니다.",
    keywords: ["카르스트", "크루즈", "석회암", "UNESCO"],
    showOnGlobe: false
  },
  {
    name: "체르마트",
    name_en: "Zermatt",
    country: "스위스",
    country_en: "Switzerland",
    lat: 45.98,
    lng: 7.75,
    tier: 3,
    popularity: 72,
    desc: "알프스의 명봉 마터호른의 전망대 역할을 하는 스위스의 고산 휴양지입니다. 친환경 무공해 마을로 전기차만 운행되며, 사계절 등산과 스키를 즐길 수 있습니다.",
    keywords: ["마터호른", "알프스", "스키", "등산"],
    showOnGlobe: false
  }
];

// Adventure 6개
const adventureDestinations = [
  {
    name: "에베레스트 베이스캠프",
    name_en: "Everest Base Camp",
    country: "네팔",
    country_en: "Nepal",
    lat: 28.00,
    lng: 86.85,
    tier: 3,
    popularity: 70,
    desc: "세계 최고봉 에베레스트(8,849m)의 베이스캠프까지 이어지는 트레킹 코스입니다. 해발 5,364m에서 바라보는 히말라야 설산의 장엄한 풍경은 평생 잊지 못할 경험입니다.",
    keywords: ["에베레스트", "트레킹", "히말라야", "베이스캠프"],
    showOnGlobe: true
  },
  {
    name: "안나푸르나 서킷",
    name_en: "Annapurna Circuit",
    country: "네팔",
    country_en: "Nepal",
    lat: 28.60,
    lng: 83.82,
    tier: 2,
    popularity: 68,
    desc: "세계 3대 트레킹 코스 중 하나로 안나푸르나 산군을 한 바퀴 도는 160km의 장대한 여정입니다. 다양한 기후대와 문화를 경험할 수 있는 최고의 트레킹 루트입니다.",
    keywords: ["안나푸르나", "트레킹", "히말라야", "서킷"],
    showOnGlobe: false
  },
  {
    name: "킬리만자로",
    name_en: "Mount Kilimanjaro",
    country: "탄자니아",
    country_en: "Tanzania",
    lat: -3.07,
    lng: 37.35,
    tier: 2,
    popularity: 73,
    desc: "아프리카 최고봉(5,895m)이자 세계 7대륙 최고봉 중 하나입니다. 특별한 등반 기술 없이도 정상에 도달할 수 있어 많은 트레커들의 버킷리스트로 꼽힙니다.",
    keywords: ["킬리만자로", "등반", "아프리카", "최고봉"],
    showOnGlobe: true
  },
  {
    name: "코모도 국립공원",
    name_en: "Komodo National Park",
    country: "인도네시아",
    country_en: "Indonesia",
    lat: -8.54,
    lng: 119.49,
    tier: 2,
    popularity: 75,
    desc: "세계에서 유일하게 코모도 왕도마뱀을 볼 수 있는 국립공원입니다. 핑크 비치의 독특한 풍경과 함께 다이빙 명소로도 유명하며, 만타 가오리와 함께 수영할 수 있습니다.",
    keywords: ["코모도", "도마뱀", "핑크비치", "다이빙"],
    showOnGlobe: true
  },
  {
    name: "라자 암팟",
    name_en: "Raja Ampat",
    country: "인도네시아",
    country_en: "Indonesia",
    lat: -0.23,
    lng: 130.52,
    tier: 3,
    popularity: 62,
    desc: "인도네시아 동부 파푸아에 위치한 세계 최고의 다이빙 천국입니다. 지구상에서 해양 생물 다양성이 가장 높은 곳으로 1,500종 이상의 물고기와 600종의 산호가 서식합니다.",
    keywords: ["다이빙", "산호초", "해양", "생물다양성"],
    showOnGlobe: false
  },
  {
    name: "보르네오",
    name_en: "Borneo",
    country: "말레이시아",
    country_en: "Malaysia",
    lat: 0.96,
    lng: 114.55,
    tier: 2,
    popularity: 70,
    desc: "세계에서 세 번째로 큰 섬으로 열대우림과 오랑우탄이 서식하는 원시림의 보고입니다. 키나발루 산 등반과 정글 트레킹, 야생동물 관찰이 주요 액티비티입니다.",
    keywords: ["열대우림", "오랑우탄", "정글", "키나발루"],
    showOnGlobe: false
  }
];

// 모든 신규 여행지 통합
const newDestinations = [
  ...paradiseDestinations,
  ...natureDestinations,
  ...adventureDestinations
];

// 카테고리와 대륙 정보 추가
const enhancedDestinations = newDestinations.map((dest, index) => {
  const category = index < 7 ? 'paradise' :
                   index < 15 ? 'nature' : 'adventure';

  return {
    id: 180 + index,
    slug: dest.name_en.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, ''),
    ...dest,
    continent: continentMap[dest.country_en] || "unknown",
    categories: [category],
    primaryCategory: category,
    category: category,
    denseRegion: null
  };
});

console.log('✅ 21개 여행지 데이터 생성 완료\n');

// 중복 검증
console.log('🔍 중복 검증 시작...\n');

const duplicates = [];
enhancedDestinations.forEach(newDest => {
  existingSpots.forEach(existing => {
    if (existing.name === newDest.name || existing.name_en === newDest.name_en) {
      duplicates.push({ new: newDest.name, existing: existing.name });
    }
    // 좌표 기반 중복 체크 (50km 이내)
    const latDiff = Math.abs(existing.lat - newDest.lat);
    const lngDiff = Math.abs(existing.lng - newDest.lng);
    if (latDiff < 0.5 && lngDiff < 0.5 && existing.name !== newDest.name) {
      duplicates.push({
        new: newDest.name,
        existing: existing.name,
        reason: '좌표 근접'
      });
    }
  });
});

if (duplicates.length > 0) {
  console.log('⚠️  중복 발견:');
  duplicates.forEach(dup => {
    console.log(`   - ${dup.new} ↔ ${dup.existing} ${dup.reason || ''}`);
  });
  console.log('');
} else {
  console.log('✅ 중복 없음\n');
}

// 통계 출력
console.log('📊 추가되는 여행지 통계:\n');
console.log(`Paradise: ${paradiseDestinations.length}개`);
console.log(`Nature: ${natureDestinations.length}개`);
console.log(`Adventure: ${adventureDestinations.length}개`);
console.log(`총합: ${enhancedDestinations.length}개\n`);

const showOnGlobeCount = enhancedDestinations.filter(d => d.showOnGlobe).length;
console.log(`지구본 표시: ${showOnGlobeCount}개`);
console.log(`  - Paradise: ${paradiseDestinations.filter(d => d.showOnGlobe).length}개`);
console.log(`  - Nature: ${natureDestinations.filter(d => d.showOnGlobe).length}개`);
console.log(`  - Adventure: ${adventureDestinations.filter(d => d.showOnGlobe).length}개\n`);

// 최종 병합
const finalSpots = [...existingSpots, ...enhancedDestinations];

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
  console.log(`  ${cat}: ${count}개`);
});
console.log('');

const finalGlobeCount = finalSpots.filter(s => s.showOnGlobe).length;
console.log(`🌍 지구본 표시 총계: ${finalGlobeCount}개\n`);

// JavaScript 파일 생성
let content = `/**
 * Travel Spots Data - Phase 2 Complete
 *
 * Total: ${finalSpots.length}개
 * Globe Display: ${finalGlobeCount}개
 *
 * Phase 2 Additions (21 new destinations):
 * - Paradise: ${paradiseDestinations.length}개 (Southeast Asia focused)
 * - Nature: ${natureDestinations.length}개 (World-class natural wonders)
 * - Adventure: ${adventureDestinations.length}개 (Trekking & diving destinations)
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

// 백업(소스 외 `scripts/outputs/`, .gitignore)
fs.mkdirSync(scriptOutputs, { recursive: true });
const backupPath = path.join(scriptOutputs, 'travelSpots-phase2-before-addon.js');
fs.writeFileSync(backupPath, rawData, 'utf-8');
console.log(`💾 백업 파일 생성: ${backupPath}\n`);

// 새 파일 저장
fs.writeFileSync('src/pages/Home/data/travelSpots.js', content, 'utf-8');
console.log('✅ travelSpots.js 업데이트 완료\n');

// JSON(아카이브, 기존 `plans/archive/misc`와 동일)
const jsonOut = path.join(__dirname, '..', 'plans', 'archive', 'misc', 'phase9-2-addon-21destinations.json');
fs.writeFileSync(
  jsonOut,
  JSON.stringify(enhancedDestinations, null, 2),
  'utf-8'
);
console.log('✅ JSON 저장: plans/archive/misc/phase9-2-addon-21destinations.json\n');

console.log('🎉 Phase 2 완료! 179개 → 200개 여행지 달성');
console.log('\n📌 다음 단계: 브라우저에서 테스트 확인');
