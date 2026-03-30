# Phase 9-2 Phase 2: 다음 세션 실행 가이드

## 📋 현재 상태 (2026-03-30 완료)

### ✅ Phase 1 완료 사항
- 기존 80개 + 누락 20개 = **100개 여행지 생성 완료**
- 메타데이터 추가 완료 (tier, popularity, continent 등)
- 실제 파일 교체 완료 (`travelSpots.js`)
- Tier 1: 42개 / Tier 2: 51개 / Tier 3: 7개

### 🎯 Phase 2 목표
- **나머지 100개 추출** → 총 **200개 달성**
- AI(Gemini) 자동화 사용
- 기존 100개와 중복 방지

---

## 🚀 Phase 2 실행 계획

### Step 1: 기존 100개 목록 확인 (10분)

```bash
# 현재 데이터 로드
node -e "
const fs = require('fs');
const data = fs.readFileSync('plans/phase9-2-phase1-100cities.json', 'utf-8');
const cities = JSON.parse(data);
console.log('현재 100개 도시 목록:');
cities.forEach(c => console.log(\`- \${c.name} (\${c.name_en})\`));
"
```

---

### Step 2: AI 추출 스크립트 작성 (30분)

**파일**: `scripts/extract-phase2-100cities.js`

```javascript
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

// 기존 100개 로드
const phase1Data = JSON.parse(
  fs.readFileSync('plans/phase9-2-phase1-100cities.json', 'utf-8')
);
const existingCities = phase1Data.map(d => d.name_en);

console.log('기존 100개 도시 제외 목록:');
console.log(existingCities.join(', '));

// API 키
const API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(API_KEY);

// 프롬프트 (기존 도시 제외 조건 추가)
const PROMPTS = {
  paradise: `
당신은 세계의 모든 휴양지를 두루 섭렵한 럭셔리 여행 전문가입니다.

### 중요: 다음 도시들은 이미 포함되어 있으므로 절대 선정하지 마세요
제외 목록: ${existingCities.join(', ')}

### 임무
위 도시를 제외하고, 휴양지 카테고리에서 **Tier 2: 15개**, **Tier 3: 5개**를 선정하세요.

### Tier 2 선정 기준 (15개)
- 여행사 패키지 투어 운영
- 5성급 리조트 3개 이상
- 예시: 푸켓, 끄라비, 코사무이, 세부, 나트랑, 랑카위, 페낭, 이비사, 말타

### Tier 3 선정 기준 (5개)
- 특화 럭셔리 휴양지
- 예시: 쿡 제도, 사모아, 세인트루시아, 케이맨 제도

### 출력 형식
{
  "tier2": [
    {
      "name": "푸켓",
      "name_en": "Phuket",
      "country": "태국",
      "country_en": "Thailand",
      "lat": 7.8804,
      "lng": 98.3923,
      "reason": "동남아 최대 휴양지",
      "popularity": 85,
      "keywords": ["해변", "스노클링", "리조트"]
    }
  ],
  "tier3": [...]
}
  `,
  
  nature: `
당신은 내셔널 지오그래픽의 수석 사진작가이자 자연경관 전문가입니다.

제외 목록: ${existingCities.join(', ')}

Tier 2: 20개, Tier 3: 5개 선정
(프롬프트 동일 구조...)
  `,
  
  urban: `
당신은 세계 500개 대도시를 탐방한 도시 여행 큐레이터입니다.

제외 목록: ${existingCities.join(', ')}

Tier 2: 20개, Tier 3: 3개 선정
(프롬프트 동일 구조...)
  `,
  
  culture: `
당신은 UNESCO 세계문화유산 전문가이자 역사학자입니다.

제외 목록: ${existingCities.join(', ')}

Tier 2: 20개, Tier 3: 3개 선정
(프롬프트 동일 구조...)
  `,
  
  adventure: `
당신은 익스트림 여행 전문가이자 탐험가입니다.

제외 목록: ${existingCities.join(', ')}

Tier 2: 15개, Tier 3: 2개 선정
(프롬프트 동일 구조...)
  `
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
  console.log('🚀 Phase 9-2 Phase 2: 나머지 100개 추출 시작\n');
  
  const results = {};
  
  for (const [category, prompt] of Object.entries(PROMPTS)) {
    results[category] = await extractCategory(category, prompt);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // 결과 저장
  fs.writeFileSync(
    'plans/phase9-2-phase2-ai-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📊 추출 완료!');
  
  // 통계
  let totalTier2 = 0, totalTier3 = 0;
  for (const data of Object.values(results)) {
    if (data) {
      totalTier2 += data.tier2?.length || 0;
      totalTier3 += data.tier3?.length || 0;
    }
  }
  
  console.log(`\n총 추출: Tier 2 = ${totalTier2}개, Tier 3 = ${totalTier3}개`);
}

main().catch(console.error);
```

---

### Step 3: AI 추출 실행 (30분)

```bash
# 환경변수 설정 (.env.local에 추가)
GEMINI_API_KEY=your_api_key_here

# 스크립트 실행
node scripts/extract-phase2-100cities.js
```

**예상 결과**:
- Paradise: Tier 2 (15개) + Tier 3 (5개) = 20개
- Nature: Tier 2 (20개) + Tier 3 (5개) = 25개
- Urban: Tier 2 (20개) + Tier 3 (3개) = 23개
- Culture: Tier 2 (20개) + Tier 3 (3개) = 23개
- Adventure: Tier 2 (15개) + Tier 3 (2개) = 17개
- **총합: 약 108개** (목표 100개 초과, 검증 후 조정)

---

### Step 4: 데이터 검증 및 병합 (30분)

```bash
node scripts/merge-phase1-phase2.js
```

**병합 스크립트**: `scripts/merge-phase1-phase2.js`
```javascript
import fs from 'fs';

const phase1 = JSON.parse(fs.readFileSync('plans/phase9-2-phase1-100cities.json', 'utf-8'));
const phase2Raw = JSON.parse(fs.readFileSync('plans/phase9-2-phase2-ai-results.json', 'utf-8'));

// Phase 2 데이터를 배열로 변환
const phase2 = [];
let nextId = 700;

for (const [category, data] of Object.entries(phase2Raw)) {
  if (!data) continue;
  
  // Tier 2
  data.tier2?.forEach(dest => {
    phase2.push({
      id: nextId++,
      slug: slugify(dest.name_en),
      ...dest,
      tier: 2,
      continent: getContinent(dest.country_en),
      categories: [category],
      primaryCategory: category,
      category,
      showOnGlobe: true, // 나중에 밀집도 분석
      denseRegion: null,
      desc: dest.reason || ""
    });
  });
  
  // Tier 3
  data.tier3?.forEach(dest => {
    phase2.push({
      id: nextId++,
      slug: slugify(dest.name_en),
      ...dest,
      tier: 3,
      continent: getContinent(dest.country_en),
      categories: [category],
      primaryCategory: category,
      category,
      showOnGlobe: false,
      denseRegion: null,
      desc: dest.reason || ""
    });
  });
}

// 중복 제거
const phase2Unique = removeDuplicates(phase2, phase1);

console.log(`\nPhase 1: ${phase1.length}개`);
console.log(`Phase 2: ${phase2Unique.length}개`);

// 100개로 조정 (필요시)
const phase2Final = phase2Unique.slice(0, 100);

// 병합
const all200 = [...phase1, ...phase2Final];

console.log(`\n최종: ${all200.length}개`);

// 저장
fs.writeFileSync(
  'plans/phase9-2-final-200cities.json',
  JSON.stringify(all200, null, 2)
);

console.log('✅ 병합 완료: plans/phase9-2-final-200cities.json');
```

---

### Step 5: 밀집도 재분석 (30분)

```bash
node scripts/analyze-final-globe-density.js
```

밀집 지역별로 `showOnGlobe` 플래그 최적화:
- 서유럽: 최대 20개
- 동남아: 최대 25개
- 동아시아: 최대 22개
- 미국: 최대 15개

---

### Step 6: 최종 파일 생성 (20분)

```bash
node scripts/generate-final-travelspots.js
```

→ `src/pages/Home/data/travelSpots.js` 생성 (200개)

---

### Step 7: 테스트 및 배포 (30분)

```bash
# 개발 서버 실행
npm run dev

# 테스트 항목
# 1. 지구본 마커 수 확인 (80-100개)
# 2. 검색: 파리, 푸켓, 피렌체 등
# 3. 카테고리 필터링
# 4. PlaceCard 상세 정보
# 5. 성능 (200개 로딩 속도)
```

---

### Step 8: 커밋

```bash
git add src/pages/Home/data/travelSpots.js
git add scripts/
git add plans/

git commit -m "feat(data): 여행지 데이터 200개 완성 (Phase 9-2 완료)

Phase 2 완료:
- AI(Gemini)로 추가 100개 자동 추출
- Phase 1 (100개) + Phase 2 (100개) = 총 200개

최종 분포:
- Tier 1: 50개 (핵심 여행지)
- Tier 2: 120개 (인기 여행지)
- Tier 3: 30개 (특화 여행지)
- 지구본 표시: 80-100개 (밀집도 최적화)

주요 개선:
- 주요 도시 누락 해결 완료
- 카테고리별 균형 배치
- 대륙별 고른 분포
- 밀집 지역 최적화로 지구본 가독성 향상

다음 단계:
- Phase 9-3: 카테고리 트리 UI 구현"
```

---

## 📊 목표 최종 분포

| 카테고리 | Tier 1 | Tier 2 | Tier 3 | 총합 |
|----------|--------|--------|--------|------|
| Paradise | 8 | 25 | 7 | 40 |
| Nature | 5 | 25 | 10 | 40 |
| Urban | 20 | 25 | 5 | 50 |
| Culture | 15 | 25 | 5 | 45 |
| Adventure | 2 | 20 | 3 | 25 |
| **합계** | **50** | **120** | **30** | **200** |

---

## 🚨 주의사항

### API 사용
- Gemini API 키 필요 (`.env.local`)
- Rate Limit: 분당 60회 (카테고리별 2초 대기)
- 비용: 무료 티어 내 가능 (Pro 모델 사용 시)

### 데이터 품질
- AI 추출 결과 반드시 검증
- 좌표 정확성 확인 (Google Maps)
- 중복 여행지 제거 필수
- 영문 이름 표준화 (Wikipedia 기준)

### 성능
- 200개 렌더링 테스트 필수
- 지구본 마커 수는 80-100개 유지
- 검색 성능 확인

---

## 💡 대안 (AI 사용 불가 시)

### 수동 큐레이션
1. TripAdvisor Top Destinations 참고
2. Lonely Planet Best in Travel
3. UNESCO World Heritage Sites
4. 주요 여행사 패키지 투어 목록

예상 시간: 3-4시간

---

**작성일**: 2026-03-30  
**다음 세션**: Phase 9-2 Phase 2 실행  
**예상 소요**: 3-4시간  
**최종 목표**: 200개 여행지 완성 🎯
