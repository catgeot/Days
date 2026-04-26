# Phase 9-2: AI 카테고리별 추출 프롬프트

## 🎯 목적

Tier 2-3 여행지 150개를 AI(Gemini)를 활용하여 카테고리별로 자동 추출하고, 각 카테고리의 전문가 페르소나를 부여하여 품질 높은 큐레이션을 수행합니다.

---

## 📊 추출 전략

### 카테고리별 목표 수량

| 카테고리 | Tier 1 | Tier 2 | Tier 3 | 총합 |
|----------|--------|--------|--------|------|
| Paradise | 8개 | 25개 | 7개 | 40개 |
| Nature | 5개 | 25개 | 10개 | 40개 |
| Urban | 20개 | 25개 | 5개 | 50개 |
| Culture | 15개 | 25개 | 5개 | 45개 |
| Adventure | 2개 | 20개 | 3개 | 25개 |
| **합계** | **50개** | **120개** | **30개** | **200개** |

### AI 추출 범위
- Tier 1: 수동 큐레이션 완료 (50개)
- **Tier 2**: AI 추출 대상 (120개) ⭐
- **Tier 3**: AI 추출 대상 (30개) ⭐

---

## 🤖 Gemini AI 프롬프트 템플릿

### 기본 설정
```javascript
// 모델 설정
const model = "gemini-2.5-pro";
const generationConfig = {
  responseMimeType: "application/json",
  temperature: 0.3, // 창의성보다 정확성 우선
  maxOutputTokens: 8192
};
```

---

## 📝 카테고리별 프롬프트

### 1️⃣ Paradise (휴양지)

#### 프롬프트
```javascript
const PARADISE_PROMPT = `
당신은 세계의 모든 휴양지를 두루 섭렵한 럭셔리 여행 전문가입니다.
30년간 전 세계 5대륙의 500개 이상 해변과 섬을 직접 방문하고 평가한 경험이 있습니다.

### 임무
다음 조건을 만족하는 휴양지를 **Tier 2: 25개**, **Tier 3: 7개**로 나누어 선정하세요.

### Tier 2 선정 기준 (25개)
- 여행사 패키지 투어가 운영되는 곳
- 5성급 리조트가 최소 3개 이상 존재
- 연간 방문객 50만 명 이상
- 한국인/일본인/중국인 여행자가 실제로 많이 가는 곳
- 예시: 푸켓, 끄라비, 코사무이, 보라카이, 세부, 나트랑, 파타야, 랑카위, 페낭, 피지, 뉴칼레도니아, 타히티, 괌, 사이판, 이비사, 말타, 크레타, 키프로스, 모리셔스, 카보베르데, 세인트루시아, 버뮤다, 케이맨제도, 아루바, 바베이도스

### Tier 3 선정 기준 (7개)
- 특화된 럭셔리 휴양지 (신혼여행 전문)
- 접근성이 다소 떨어지지만 독특한 매력
- "버킷리스트" 수준의 꿈의 여행지
- 예시: 보라보라 외 프랑스령 폴리네시아 섬들, 세이셸의 특정 섬, 몰디브의 특정 환초, 팔라우, 쿡 제도, 사모아

### 제외 기준
❌ 이미 Tier 1에 포함된 곳: 산토리니, 몰디브, 칸쿤, 세이셸, 발리, 하와이, 괌
❌ 정치적으로 불안정하거나 접근 제한이 있는 곳
❌ 휴양보다 모험에 가까운 곳 (Adventure 카테고리)

### 출력 형식
JSON 배열로 출력하세요:
{
  "tier2": [
    {
      "name": "푸켓",
      "name_en": "Phuket",
      "country": "태국",
      "country_en": "Thailand",
      "lat": 7.8804,
      "lng": 98.3923,
      "reason": "동남아 최대 휴양지, 다양한 해변과 리조트, 한국인 선호도 높음",
      "popularity": 85,
      "keywords": ["해변", "스노클링", "나이트라이프", "리조트"]
    },
    ...
  ],
  "tier3": [
    {
      "name": "보라보라",
      "name_en": "Bora Bora",
      ...
    },
    ...
  ]
}
`;
```

---

### 2️⃣ Nature (대자연)

#### 프롬프트
```javascript
const NATURE_PROMPT = `
당신은 내셔널 지오그래픽의 수석 사진작가이자 자연경관 전문가입니다.
50개국의 국립공원, 100개 이상의 자연유산을 촬영하고 다큐멘터리로 제작한 경험이 있습니다.

### 임무
다음 조건을 만족하는 자연경관을 **Tier 2: 25개**, **Tier 3: 10개**로 나누어 선정하세요.

### Tier 2 선정 기준 (25개)
- UNESCO 자연유산 또는 국립공원
- 대중적인 자연 관광지 (트레킹 코스, 전망대 완비)
- 가족 단위 여행객도 접근 가능
- 숙박 시설 및 투어 프로그램 존재
- 예시: 요세미티, 그랜드캐니언, 토레스델파이네, 피오르드, 밀포드 사운드, 플리트비체 호수, 장가계, 구이린, 황산, 하롱베이, 치앙마이, 체르마트, 인터라켄, 몽블랑, 도로미티, 로키산맥, 옐로스톤, 자이언, 브라이스캐니언, 데스밸리, 제주 올레길, 설악산

### Tier 3 선정 기준 (10개)
- 극한 자연환경 (접근 난이도 높음)
- 모험가나 자연 애호가 전문
- 독특한 생태계 또는 지질학적 특이성
- 예시: 갈라파고스, 크레이터 레이크, 레인보우 마운틴, 다나킬 함몰지, 콜카 캐년, 와디 럼, 아타카마 사막, 고비 사막, 카르스트 동굴군, 소코트라 섬

### 제외 기준
❌ 이미 Tier 1에 포함: 밴프, 이구아수, 아이슬란드, 빅토리아 폭포, 후지산, 그레이트 배리어 리프

### 출력 형식
JSON 배열로 출력하세요.
`;
```

---

### 3️⃣ Urban (도시)

#### 프롬프트
```javascript
const URBAN_PROMPT = `
당신은 세계 500개 대도시를 탐방한 도시 여행 큐레이터입니다.
건축, 미식, 쇼핑, 문화 예술 등 도시의 모든 측면을 평가할 수 있는 전문가입니다.

### 임무
다음 조건을 만족하는 도시를 **Tier 2: 25개**, **Tier 3: 5개**로 나누어 선정하세요.

### Tier 2 선정 기준 (25개)
- 인구 100만 명 이상의 주요 도시
- 국제공항 보유 (직항 또는 경유 1회로 접근 가능)
- 랜드마크 또는 스카이라인이 인상적
- 미슐랭 가이드 또는 세계적인 레스토랑 존재
- 예시: 뮌헨, 프랑크푸르트, 밀라노, 나폴리, 세비야, 발렌시아, 리스본, 포르투, 코펜하겐, 스톡홀름, 오슬로, 헬싱키, 취리히, 제네바, 브뤼셀, 워싱턴DC, 보스턴, 마이애미, 시애틀, 몬트리올, 퀘벡시티, 멕시코시티, 과달라하라, 멕시코시티, 리마

### Tier 3 선정 기준 (5개)
- 신흥 도시 또는 트렌디한 곳
- 힙스터/디지털 노마드가 선호
- 독특한 도시 문화 (예: 예술, 음악)
- 예시: 트빌리시(조지아), 티라나(알바니아), 사라예보, 다낭, 치앙마이

### 제외 기준
❌ 이미 Tier 1 포함: 파리, 런던, 뉴욕, 도쿄, 방콕, 서울, 싱가포르, 두바이, 홍콩 등

### 출력 형식
JSON 배열로 출력하세요.
`;
```

---

### 4️⃣ Culture (역사/문화)

#### 프롬프트
```javascript
const CULTURE_PROMPT = `
당신은 UNESCO 세계문화유산 전문가이자 역사학자입니다.
200개 이상의 고대 유적지를 발굴하고 연구한 경험이 있습니다.

### 임무
다음 조건을 만족하는 역사/문화 유적지를 **Tier 2: 25개**, **Tier 3: 5개**로 나누어 선정하세요.

### Tier 2 선정 기준 (25개)
- UNESCO 세계문화유산 등재
- 관광 인프라 완비 (가이드 투어, 박물관)
- 연간 방문객 10만 명 이상
- 교과서나 역사책에 등장하는 유적지
- 예시: 보로부두르, 아유타야, 수코타이, 미얀마 바간, 루앙프라방, 후에, 호이안, 만리장성, 자금성, 병마용, 둔황, 라싸, 타지마할, 하와 마할, 암베르 성, 바라나시, 함피, 페르세폴리스, 예레반, 타트린, 룩소르, 아스완, 팀북투, 랄리벨라, 쿠스코, 나스카 라인

### Tier 3 선정 기준 (5개)
- 희귀하거나 접근 어려운 유적지
- 역사/고고학 마니아 대상
- 미스터리하거나 전설적인 곳
- 예시: 프레아 비히어, 시기리야, 엘로라 석굴, 아잔타 석굴, 티칼

### 제외 기준
❌ 이미 Tier 1 포함: 로마, 아테네, 마추픽추, 앙코르와트, 페트라, 치첸이트사, 피라미드

### 출력 형식
JSON 배열로 출력하세요.
`;
```

---

### 5️⃣ Adventure (모험)

#### 프롬프트
```javascript
const ADVENTURE_PROMPT = `
당신은 익스트림 여행 전문가이자 탐험가입니다.
7대륙 최고봉을 등반하고, 사막, 정글, 극지방을 탐험한 경험이 있습니다.

### 임무
다음 조건을 만족하는 모험 여행지를 **Tier 2: 20개**, **Tier 3: 3개**로 나누어 선정하세요.

### Tier 2 선정 기준 (20개)
- 트레킹, 등반, 다이빙 등 액티비티 중심
- 전문 가이드 투어 운영
- 일반인도 도전 가능 (체력 필요)
- 예시: 에베레스트 베이스캠프, 안나푸르나, 킬리만자로, 몽블랑, 코모도 섬, 라자 암팟, 보르네오, 수마트라, 마다가스카르, 잠베지 강 래프팅, 남아공 샤크케이지, 코스타리카 정글, 갈라파고스, 이스터 섬, 라파누이, 파타고니아, 토레스델파이네, 피츠로이, 바릴로체, 우수아이아

### Tier 3 선정 기준 (3개)
- 극한 모험 (생명 위험 가능)
- 전문 장비 및 훈련 필수
- 일반인 접근 제한적
- 예시: K2 베이스캠프, 데날리, 북극점, 남극점, 마리아나 해구

### 제외 기준
❌ 이미 Tier 1 포함: 알래스카, 아마존, 스발바르, 세렝게티, 울루루, 남극

### 출력 형식
JSON 배열로 출력하세요.
`;
```

---

## 🔄 실행 워크플로우

### Step 1: 프롬프트 실행
```javascript
// scripts/extract-tier2-3-destinations.js

import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractByCategory(category, prompt) {
  console.log(`🤖 Extracting ${category}...`);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    generationConfig: { 
      responseMimeType: "application/json",
      temperature: 0.3,
      maxOutputTokens: 8192
    }
  });
  
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text);
  
  console.log(`✅ ${category} - Tier 2: ${parsed.tier2.length}, Tier 3: ${parsed.tier3.length}`);
  
  return {
    category,
    tier2: parsed.tier2,
    tier3: parsed.tier3
  };
}

async function main() {
  const prompts = {
    paradise: PARADISE_PROMPT,
    nature: NATURE_PROMPT,
    urban: URBAN_PROMPT,
    culture: CULTURE_PROMPT,
    adventure: ADVENTURE_PROMPT
  };
  
  const results = {};
  
  for (const [category, prompt] of Object.entries(prompts)) {
    try {
      results[category] = await extractByCategory(category, prompt);
      // API Rate Limit 방지
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Error in ${category}:`, error.message);
    }
  }
  
  // 결과 저장
  fs.writeFileSync(
    'plans/phase9-2-ai-extraction-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📊 추출 완료! 결과 파일 저장됨.');
}

main();
```

### Step 2: 결과 검증
```javascript
// 수동 검증 체크리스트
const validateResults = (results) => {
  console.log('🔍 검증 시작...\n');
  
  for (const [category, data] of Object.entries(results)) {
    console.log(`\n📌 ${category.toUpperCase()}`);
    
    // 수량 검증
    const tier2Count = data.tier2.length;
    const tier3Count = data.tier3.length;
    console.log(`  Tier 2: ${tier2Count}개`);
    console.log(`  Tier 3: ${tier3Count}개`);
    
    // 필수 필드 검증
    const allDests = [...data.tier2, ...data.tier3];
    const missingFields = allDests.filter(d => 
      !d.name || !d.name_en || !d.country || !d.lat || !d.lng
    );
    
    if (missingFields.length > 0) {
      console.log(`  ⚠️ 필수 필드 누락: ${missingFields.length}개`);
    } else {
      console.log(`  ✅ 필수 필드 완성`);
    }
    
    // 좌표 범위 검증
    const invalidCoords = allDests.filter(d => 
      Math.abs(d.lat) > 90 || Math.abs(d.lng) > 180
    );
    
    if (invalidCoords.length > 0) {
      console.log(`  ⚠️ 좌표 오류: ${invalidCoords.length}개`);
    } else {
      console.log(`  ✅ 좌표 검증 완료`);
    }
  }
  
  console.log('\n🎉 검증 완료!');
};
```

---

## 📊 예상 출력 예시

### Paradise Tier 2 샘플
```json
{
  "tier2": [
    {
      "name": "푸켓",
      "name_en": "Phuket",
      "country": "태국",
      "country_en": "Thailand",
      "lat": 7.8804,
      "lng": 98.3923,
      "reason": "동남아 최대 휴양지, 파통 비치, 피피 섬 투어 허브",
      "popularity": 85,
      "keywords": ["해변", "스노클링", "나이트라이프", "리조트"]
    },
    {
      "name": "보라카이",
      "name_en": "Boracay",
      "country": "필리핀",
      "country_en": "Philippines",
      "lat": 11.9674,
      "lng": 121.9248,
      "reason": "화이트 비치의 고운 모래, 수상 스포츠 천국",
      "popularity": 80,
      "keywords": ["화이트 비치", "카이트 서핑", "선셋", "파티"]
    }
  ]
}
```

---

## 🎯 다음 단계 (Step 4)

### AI 추출 후 작업
1. **중복 제거**: Tier 1과 중복되는 항목 제거
2. **수동 검증**: 좌표, 국가명, 철자 확인
3. **보완**: 누락된 주요 도시 수동 추가
4. **카테고리 재분류**: 다중 카테고리 적용 (예: 교토는 Culture + Urban)

---

**작성일**: 2026-03-30  
**단계**: Phase 9-2 Step 3 완료  
**다음**: Step 4 (AI 실행 및 검증) 진행
