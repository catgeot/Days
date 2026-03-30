# Phase 9-2: 여행지 데이터 최적화 - 최종 실행 가이드

## 📊 현재 진행 상황

### ✅ 완료된 단계 (Step 1-3)

| 단계 | 내용 | 결과물 | 상태 |
|------|------|--------|------|
| **Step 1** | 현재 데이터 분석 | 80개 분석, 주요 누락 도시 파악 | ✅ 완료 |
| **Step 2** | Tier 1 확정 | 50개 핵심 여행지 목록 | ✅ 완료 |
| **Step 3** | AI 프롬프트 준비 | 5개 카테고리별 프롬프트 | ✅ 완료 |

### 📋 결과물
- [`phase9-2-tier1-destinations.md`](phase9-2-tier1-destinations.md) - Tier 1 50개 확정 목록
- [`phase9-2-ai-prompts.md`](phase9-2-ai-prompts.md) - AI 추출 프롬프트

---

## 🎯 남은 단계 개요 (Step 4-8)

### 두 가지 실행 방식

#### 방식 A: AI 자동화 (권장) ⭐
- **장점**: 빠르고 객관적, 150개 자동 생성
- **단점**: Gemini API 키 필요, 검증 필수
- **예상 시간**: 3-4시간
- **적합**: 개발 환경이 준비된 경우

#### 방식 B: 수동 큐레이션
- **장점**: 품질 보장, 정확도 높음
- **단점**: 시간 소요 큼, 반복 작업
- **예상 시간**: 6-8시간
- **적합**: AI 결과 검증이 어려운 경우

---

## 🚀 실행 계획: 방식 A (AI 자동화)

### Step 4: Tier 2-3 여행지 AI 추출 (2시간)

#### 4-1. 스크립트 파일 생성
```bash
# 프로젝트 루트에 scripts 디렉토리 생성
mkdir -p scripts
```

**파일**: `scripts/extract-destinations-ai.js`
```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// API 키는 환경변수에서 가져오기
const API_KEY = process.env.GEMINI_API_KEY || "YOUR_API_KEY_HERE";
const genAI = new GoogleGenerativeAI(API_KEY);

// 프롬프트 정의 (phase9-2-ai-prompts.md에서 복사)
const PROMPTS = {
  paradise: `당신은 세계의 모든 휴양지를 두루 섭렵한 럭셔리 여행 전문가입니다...`,
  nature: `당신은 내셔널 지오그래픽의 수석 사진작가이자 자연경관 전문가입니다...`,
  urban: `당신은 세계 500개 대도시를 탐방한 도시 여행 큐레이터입니다...`,
  culture: `당신은 UNESCO 세계문화유산 전문가이자 역사학자입니다...`,
  adventure: `당신은 익스트림 여행 전문가이자 탐험가입니다...`
};

async function extractCategory(category, prompt) {
  console.log(`\n🤖 Extracting ${category.toUpperCase()}...`);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.3
    }
  });
  
  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const data = JSON.parse(text);
    
    console.log(`✅ ${category}: Tier 2 = ${data.tier2.length}, Tier 3 = ${data.tier3.length}`);
    return data;
  } catch (error) {
    console.error(`❌ Error in ${category}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Phase 9-2 Step 4: AI 여행지 추출 시작\n');
  
  const results = {};
  
  for (const [category, prompt] of Object.entries(PROMPTS)) {
    results[category] = await extractCategory(category, prompt);
    
    // Rate limit 방지 (2초 대기)
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 결과 저장
  fs.writeFileSync(
    'plans/phase9-2-ai-results.json',
    JSON.stringify(results, null, 2),
    'utf-8'
  );
  
  console.log('\n📊 추출 완료! 결과 파일: plans/phase9-2-ai-results.json');
  
  // 통계 출력
  let totalTier2 = 0, totalTier3 = 0;
  for (const [category, data] of Object.entries(results)) {
    if (data) {
      totalTier2 += data.tier2?.length || 0;
      totalTier3 += data.tier3?.length || 0;
    }
  }
  
  console.log(`\n📈 총 추출: Tier 2 = ${totalTier2}개, Tier 3 = ${totalTier3}개`);
}

main().catch(console.error);
```

#### 4-2. 스크립트 실행
```bash
# package.json에 type: "module" 추가되어 있는지 확인
node scripts/extract-destinations-ai.js
```

#### 4-3. 결과 검증
- `plans/phase9-2-ai-results.json` 파일 확인
- 각 카테고리별 수량 검증
- 좌표, 국가명 오류 확인

---

### Step 5: 중복 제거 및 데이터 병합 (30분)

#### 5-1. 병합 스크립트 생성

**파일**: `scripts/merge-destinations.js`
```javascript
import fs from 'fs';

// Tier 1 수동 데이터 (phase9-2-tier1-destinations.md 기반)
const TIER1_DESTINATIONS = [
  // 추가 필요한 20개 도시 (파리, 바르셀로나 등)
  {
    id: 301,
    slug: "paris",
    name: "파리",
    name_en: "Paris",
    country: "프랑스",
    country_en: "France",
    lat: 48.8566,
    lng: 2.3522,
    tier: 1,
    popularity: 98,
    continent: "europe",
    categories: ["urban", "culture"],
    primaryCategory: "urban",
    desc: "에펠탑과 루브르 박물관이 있는 예술과 낭만의 도시...",
    keywords: ["에펠탑", "루브르", "센강", "샹젤리제"]
  },
  // ... 나머지 19개
];

// AI 추출 결과 로드
const aiResults = JSON.parse(
  fs.readFileSync('plans/phase9-2-ai-results.json', 'utf-8')
);

// 기존 80개 데이터 로드
import { TRAVEL_SPOTS } from '../src/pages/Home/data/travelSpots.js';

function mergeDes

tinations() {
  console.log('🔄 Step 5: 데이터 병합 시작\n');
  
  // 1. 기존 80개에서 Tier 1 등급 부여
  const existing80 = TRAVEL_SPOTS.map((spot, index) => {
    // 주요 도시인 경우 Tier 1, 아니면 Tier 2로 분류
    const isTier1 = checkIfTier1(spot);
    return {
      ...spot,
      tier: isTier1 ? 1 : 2,
      popularity: calculatePopularity(spot),
      continent: getContinent(spot.country_en),
      categories: [spot.category], // 기존은 단일 카테고리
      primaryCategory: spot.category,
      showOnGlobe: true, // 일단 전부 표시
      denseRegion: null // 나중에 분석
    };
  });
  
  // 2. Tier 1 추가 도시 병합
  const tier1Complete = [...existing80.filter(s => s.tier === 1), ...TIER1_DESTINATIONS];
  
  // 3. AI 추출 Tier 2-3 병합
  const tier2and3 = [];
  let nextId = 600; // ID 600번부터 시작
  
  for (const [category, data] of Object.entries(aiResults)) {
    if (!data) continue;
    
    // Tier 2
    data.tier2?.forEach(dest => {
      tier2and3.push({
        id: nextId++,
        slug: slugify(dest.name_en),
        ...dest,
        tier: 2,
        continent: getContinent(dest.country_en),
        categories: [category],
        primaryCategory: category,
        showOnGlobe: true,
        denseRegion: null,
        desc: dest.reason || "",
        keywords: dest.keywords || []
      });
    });
    
    // Tier 3
    data.tier3?.forEach(dest => {
      tier2and3.push({
        id: nextId++,
        slug: slugify(dest.name_en),
        ...dest,
        tier: 3,
        continent: getContinent(dest.country_en),
        categories: [category],
        primaryCategory: category,
        showOnGlobe: false, // Tier 3는 일단 지구본 미표시
        denseRegion: null,
        desc: dest.reason || "",
        keywords: dest.keywords || []
      });
    });
  }
  
  // 4. 중복 제거 (name_en 기준)
  const allDestinations = [...tier1Complete, ...existing80.filter(s => s.tier !== 1), ...tier2and3];
  const uniqueDestinations = removeDuplicates(allDestinations);
  
  console.log(`\n📊 병합 결과:`);
  console.log(`  Tier 1: ${uniqueDestinations.filter(d => d.tier === 1).length}개`);
  console.log(`  Tier 2: ${uniqueDestinations.filter(d => d.tier === 2).length}개`);
  console.log(`  Tier 3: ${uniqueDestinations.filter(d => d.tier === 3).length}개`);
  console.log(`  총합: ${uniqueDestinations.length}개`);
  
  // 결과 저장
  fs.writeFileSync(
    'plans/phase9-2-merged-destinations.json',
    JSON.stringify(uniqueDestinations, null, 2)
  );
  
  console.log('\n✅ 병합 완료: plans/phase9-2-merged-destinations.json');
}

// 헬퍼 함수들
function slugify(str) {
  return str.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

function checkIfTier1(spot) {
  const tier1Cities = ["New York", "London", "Tokyo", "Rome", "Istanbul", "Prague", "Dubai", "Singapore", "Seoul", "Sydney"];
  return tier1Cities.some(city => spot.name_en.includes(city));
}

function calculatePopularity(spot) {
  // 간단한 인기도 계산 (실제로는 방문객 수 데이터 필요)
  return spot.tier === 1 ? 90 : 70;
}

function getContinent(countryEn) {
  const continentMap = {
    "France": "europe", "United Kingdom": "europe", "Italy": "europe",
    "Japan": "asia", "China": "asia", "Thailand": "asia",
    "United States": "north_america", "Canada": "north_america",
    "Australia": "oceania", "New Zealand": "oceania",
    "Egypt": "africa", "South Africa": "africa",
    "Brazil": "south_america", "Argentina": "south_america"
    // ... 더 추가
  };
  return continentMap[countryEn] || "unknown";
}

function removeDuplicates(destinations) {
  const seen = new Set();
  return destinations.filter(dest => {
    const key = dest.name_en.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

mergeDest inations();
```

---

### Step 6: 지구본 밀집도 분석 (1시간)

#### 6-1. 밀집 지역 분석 스크립트

**파일**: `scripts/analyze-globe-density.js`
```javascript
import fs from 'fs';

// 밀집 지역 정의
const DENSE_REGIONS = {
  'western-europe': {
    name: '서유럽',
    latRange: [45, 55],
    lngRange: [-5, 15],
    maxMarkers: 15, // 최대 15개만 지구본 표시
    cities: []
  },
  'southeast-asia': {
    name: '동남아시아',
    latRange: [-10, 25],
    lngRange: [95, 125],
    maxMarkers: 20,
    cities: []
  },
  'east-asia': {
    name: '동아시아',
    latRange: [30, 45],
    lngRange: [110, 145],
    maxMarkers: 18,
    cities: []
  },
  'us-east-coast': {
    name: '미국 동부',
    latRange: [35, 45],
    lngRange: [-80, -70],
    maxMarkers: 12,
    cities: []
  }
};

function analyzeDensity() {
  console.log('🗺️ Step 6: 지구본 밀집도 분석 시작\n');
  
  const destinations = JSON.parse(
    fs.readFileSync('plans/phase9-2-merged-destinations.json', 'utf-8')
  );
  
  // 각 여행지를 밀집 지역에 할당
  destinations.forEach(dest => {
    for (const [regionId, region] of Object.entries(DENSE_REGIONS)) {
      const inRegion = 
        dest.lat >= region.latRange[0] && dest.lat <= region.latRange[1] &&
        dest.lng >= region.lngRange[0] && dest.lng <= region.lngRange[1];
      
      if (inRegion) {
        region.cities.push(dest);
        dest.denseRegion = regionId;
        break;
      }
    }
  });
  
  // 밀집 지역별로 우선순위 정렬 후 showOnGlobe 설정
  for (const [regionId, region] of Object.entries(DENSE_REGIONS)) {
    console.log(`\n📍 ${region.name} (${regionId})`);
    console.log(`   총 여행지: ${region.cities.length}개`);
    
    // Tier 1 우선, popularity 순으로 정렬
    region.cities.sort((a, b) => {
      if (a.tier !== b.tier) return a.tier - b.tier;
      return (b.popularity || 0) - (a.popularity || 0);
    });
    
    // 상위 maxMarkers개만 지구본 표시
    region.cities.forEach((city, index) => {
      city.showOnGlobe = index < region.maxMarkers;
    });
    
    const visible = region.cities.filter(c => c.showOnGlobe).length;
    console.log(`   지구본 표시: ${visible}개 / ${region.cities.length}개`);
  }
  
  // 밀집 지역이 아닌 곳은 전부 표시
  const nonDense = destinations.filter(d => !d.denseRegion);
  nonDense.forEach(d => d.showOnGlobe = true);
  
  console.log(`\n🌍 밀집 지역 외: ${nonDense.length}개 (전부 표시)`);
  
  // 최종 통계
  const totalVisible = destinations.filter(d => d.showOnGlobe).length;
  console.log(`\n📊 최종 지구본 마커 수: ${totalVisible}개 / ${destinations.length}개`);
  
  // 저장
  fs.writeFileSync(
    'plans/phase9-2-final-destinations.json',
    JSON.stringify(destinations, null, 2)
  );
  
  console.log('✅ 분석 완료: plans/phase9-2-final-destinations.json');
}

analyzeDensity();
```

---

### Step 7: 최종 파일 생성 (30분)

#### 7-1. JavaScript 파일 생성 스크립트

**파일**: `scripts/generate-travelspots-file.js`
```javascript
import fs from 'fs';

function generateFile() {
  console.log('📝 Step 7: travelSpots-optimized.js 생성 시작\n');
  
  const destinations = JSON.parse(
    fs.readFileSync('plans/phase9-2-final-destinations.json', 'utf-8')
  );
  
  // JavaScript 파일 생성
  let content = `// src/pages/Home/data/travelSpots-optimized.js
// 🚀 Phase 9-2: 여행지 데이터 최적화 (200개)
// 생성일: ${new Date().toISOString().split('T')[0]}

export const TRAVEL_SPOTS = [\n`;
  
  destinations.forEach((dest, index) => {
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
    content += `    "popularity": ${dest.popularity || 70},\n`;
    content += `    "continent": "${dest.continent}",\n`;
    content += `    "categories": ${JSON.stringify(dest.categories)},\n`;
    content += `    "primaryCategory": "${dest.primaryCategory}",\n`;
    content += `    "category": "${dest.primaryCategory}",\n`; // 하위 호환
    content += `    "showOnGlobe": ${dest.showOnGlobe},\n`;
    content += `    "denseRegion": ${dest.denseRegion ? `"${dest.denseRegion}"` : 'null'},\n`;
    content += `    "desc": "${(dest.desc || '').replace(/"/g, '\\"')}",\n`;
    content += `    "keywords": ${JSON.stringify(dest.keywords || [])}\n`;
    content += `  }${index < destinations.length - 1 ? ',' : ''}\n`;
  });
  
  content += `];\n\n`;
  content += `// 통계\n`;
  content += `// Tier 1: ${destinations.filter(d => d.tier === 1).length}개\n`;
  content += `// Tier 2: ${destinations.filter(d => d.tier === 2).length}개\n`;
  content += `// Tier 3: ${destinations.filter(d => d.tier === 3).length}개\n`;
  content += `// 지구본 표시: ${destinations.filter(d => d.showOnGlobe).length}개\n`;
  
  fs.writeFileSync('src/pages/Home/data/travelSpots-optimized.js', content);
  
  console.log('✅ 생성 완료: src/pages/Home/data/travelSpots-optimized.js');
  console.log(`📊 총 ${destinations.length}개 여행지`);
}

generateFile();
```

---

### Step 8: 기존 파일 교체 및 테스트 (30분)

#### 8-1. 백업 및 교체
```bash
# 기존 파일 백업
cp src/pages/Home/data/travelSpots.js src/pages/Home/data/travelSpots.backup.js

# 새 파일로 교체
cp src/pages/Home/data/travelSpots-optimized.js src/pages/Home/data/travelSpots.js

echo "✅ 파일 교체 완료"
```

#### 8-2. 테스트 포인트
```javascript
// 개발 서버 실행
npm run dev

// 테스트 항목:
// 1. 지구본에 마커가 80-100개 표시되는지
// 2. 파리, 바르셀로나 등 주요 도시 검색 가능한지
// 3. 카테고리 필터링 작동하는지
// 4. PlaceCard 상세 정보 정상 표시되는지
// 5. 좌표 오류로 인한 지구본 렌더링 문제 없는지
```

#### 8-3. 최종 커밋
```bash
git add src/pages/Home/data/travelSpots.js
git add plans/phase9-2-*.md
git add plans/phase9-2-*.json

git commit -m "feat(data): 여행지 데이터 최적화 완료 (200개)

Phase 9-2 구현:
- Tier 1: 50개 (필수 여행지)
- Tier 2: 120개 (인기 여행지)
- Tier 3: 30개 (특화 여행지)
- 메타데이터 추가 (tier, popularity, continent, showOnGlobe)
- 지구본 밀집도 분석 및 최적화
- AI(Gemini) 기반 카테고리별 자동 추출

주요 개선:
- 파리, 바르셀로나, 방콕 등 주요 도시 추가
- 대륙별 균형 배치
- 지구본 표시 80-100개로 최적화
- 카테고리 트리용 전체 200개 데이터

관련 문서:
- plans/phase9-2-tier1-destinations.md
- plans/phase9-2-ai-prompts.md
- plans/phase9-2-implementation-guide.md"
```

---

## 🎯 대안: 방식 B (수동 큐레이션)

AI를 사용하지 않는 경우, 다음 리소스를 참고하여 수동으로 데이터 수집:

### 참고 자료
1. **TripAdvisor Travelers' Choice**
   - https://www.tripadvisor.com/TravelersChoice
2. **Lonely Planet Best in Travel**
   - https://www.lonelyplanet.com/best-in-travel
3. **UNESCO World Heritage Sites**
   - https://whc.unesco.org/en/list/
4. **Wikipedia 여행지 리스트**
   - https://en.wikipedia.org/wiki/List_of_most-visited_cities

---

## 📊 예상 결과

### 최종 데이터 구조
```javascript
{
  id: 301,
  slug: "paris",
  name: "파리",
  name_en: "Paris",
  country: "프랑스",
  country_en: "France",
  lat: 48.8566,
  lng: 2.3522,
  tier: 1,                    // 👈 NEW
  popularity: 98,             // 👈 NEW
  continent: "europe",        // 👈 NEW
  categories: ["urban", "culture"], // 👈 NEW (다중)
  primaryCategory: "urban",   // 👈 NEW
  category: "urban",          // 하위 호환
  showOnGlobe: true,          // 👈 NEW
  denseRegion: "western-europe", // 👈 NEW
  desc: "에펠탑과 루브르...",
  keywords: ["에펠탑", "루브르"]
}
```

### 최종 통계 목표
- **총 여행지**: 200개
- **Tier 1** (필수): 50개 (25%)
- **Tier 2** (인기): 120개 (60%)
- **Tier 3** (특화): 30개 (15%)
- **지구본 표시**: 80-100개 (40-50%)
- **카테고리 트리**: 200개 전체 (100%)

---

## 🚨 주의사항

### 데이터 품질
- ✅ 모든 좌표는 -90~90 (lat), -180~180 (lng) 범위
- ✅ `name_en`은 영문 표기로 통일
- ✅ `slug`는 소문자 + 하이픈 (SEO)
- ✅ `country_en`은 공식 영문 국가명

### API 사용
- ⚠️ Gemini API Rate Limit: 분당 60회
- ⚠️ 각 카테고리 실행 후 2초 대기 필수
- ⚠️ API 키는 환경변수로 관리 (`.env.local`)

### 테스트
- 🧪 지구본 렌더링 확인
- 🧪 검색 기능 작동 확인
- 🧪 카테고리 필터링 확인
- 🧪 PlaceCard 상세 정보 표시 확인

---

## 📞 다음 단계 진행 방법

### Option 1: Code 모드로 전환하여 자동화 구현
```
"Code 모드로 전환하여 Phase 9-2 Step 4-8을 실행해줘"
```

### Option 2: 단계별 수동 진행
```
"Step 4부터 하나씩 진행하자. 먼저 AI 추출 스크립트를 만들어줘"
```

### Option 3: 수동 큐레이션 방식
```
"AI 없이 수동으로 200개 여행지 목록을 만들자"
```

---

**작성일**: 2026-03-30  
**Phase**: 9-2 (Step 1-3 완료)  
**다음 단계**: Step 4-8 실행 (AI 또는 수동)  
**예상 완료**: 3-4시간 (AI 자동화) / 6-8시간 (수동)
