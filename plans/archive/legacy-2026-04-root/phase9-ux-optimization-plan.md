# Phase 9: UX 최적화 및 여행지 검색 시스템 개선 계획

## 📋 현재 상황 분석

### 요청된 수정사항 (2026-03-30)

#### 1. 스마트 툴킷 "로딩 지연 버튼" 제거
- **위치**: [`ToolkitTab.jsx:374-382`](src/components/PlaceCard/tabs/ToolkitTab.jsx:374)
- **현재 상태**: 로딩 100% 도달 시 "로딩이 지연되나요? 강제 다시 시도" 버튼 표시
- **요청**: 해당 버튼 제거
- **검토**: Phase 7-3에서 툴킷 탭의 강제 갱신 버튼은 제거했으나, 로딩 타임아웃 시 표시되는 버튼은 남아있음

#### 2. 갤러리 큐레이션 시스템 개선
- **위치**: [`PlaceGalleryView.jsx:99-122`](src/components/PlaceCard/views/PlaceGalleryView.jsx:99), [`usePlaceGallery.js:353-415`](src/components/PlaceCard/hooks/usePlaceGallery.js:353)
- **현재 로직**:
  ```javascript
  // 좋아요 버튼 (Heart)
  - 클릭 시: curation = 'liked'
  - 효과: 갤러리 맨 앞으로 정렬, DB 저장
  - 문제: "삭제 불가, 취소 불가"라고 했지만 실제 코드는 토글 가능 (line 360)
  
  // 안보기 버튼 (EyeOff)
  - 클릭 시: curation = 'hidden'
  - 효과: 갤러리에서 필터링 제거 (line 119), DB 저장
  - 문제: "DB 제거 취소 불가"라고 했지만 실제 로직은 취소 가능
  ```
- **요청된 변경**:
  - Option A: 엄지척↑/엄지척↓로 사진 배열 변경 로직
  - Option B: 무리하면 하트/안보기 버튼 제거

#### 3. 홈 화면 지구본 + 카테고리 트리 시스템
- **현재 문제**:
  - 지구본에 80개 여행지 마커 배치
  - 사전 지식 없이 접근하면 어디를 클릭해야 할지 모름
  - 지구본에서 밀집된 지역은 마커가 겹쳐 클릭 어려움
  
- **요청된 해결책**:
  - 여행사 홈페이지 같은 카테고리 트리 생성
  - 5가지 테마 카테고리 활용
  - 대륙별/나라별 카테고리 추가

#### 4. 여행지 데이터 최적화
- **현재 상태**:
  - [`travelSpots.js`](src/pages/Home/data/travelSpots.js): 80개 여행지
  - 지구본 분포 균일성에 맞춰 선정 (루코드/제미나이)
  - 문제: 실제 여행자가 많이 가는 곳(파리, 바르셀로나 등) 제외됨
  
- **제안된 최적화 프로세스**:
  ```
  1. 세계 여행지 순위 TOP 100 수집
  2. 각 카테고리별 AI 페르소나 부여
     - 휴양: "당신은 세계 모든 휴양지를 섭렵한 여행자"
     - 대자연: "당신은 자연경관 전문가"
     - 도시: "당신은 대도시 여행 큐레이터"
     - 역사/문화: "당신은 문화유산 전문가"
     - 모험: "당신은 익스트림 여행 전문가"
  3. AI로 카테고리별 추천 여행지 추출
  4. 지구본 분포 밀집도 고려하여 재분류
  5. 최종 80-100개 여행지 선정
  ```

---

## 🎯 각 항목별 심층 분석 및 권장사항

### 1️⃣ 스마트 툴킷 "로딩 지연 버튼" 제거

#### 현재 코드 분석
```jsx
// src/components/PlaceCard/tabs/ToolkitTab.jsx:374-382
{loadingStep >= currentMessages.length - 1 && (
  <button
    onClick={handleRemoteUpdate}
    className="mt-4 flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-500"
  >
    <RefreshCw size={14} />
    <span>로딩이 지연되나요? 강제 다시 시도</span>
  </button>
)}
```

#### 제거 권장 이유
✅ **찬성 (제거해야 함)**:
1. **로딩 동기화 완벽 해결** (Phase 7-1): 폴링 간격 단축, 자동 데이터 요청으로 로딩 실패 거의 없음
2. **일반 사용자 혼란 방지**: 위키 탭에 이미 수동 갱신 버튼 존재
3. **UI 단순화**: Phase 7-3의 목표와 일치

❌ **반대 (유지해야 함)**:
1. **안전장치**: 네트워크 오류, 백엔드 타임아웃 시 최후의 수단
2. **디버깅 도구**: 개발 중 유용

#### 권장사항
**→ 제거 (Clean UI 우선)**
- Phase 7의 로딩 동기화 개선으로 99% 케이스 해결
- 네트워크 오류는 위키 탭의 강제 갱신 버튼으로 대체 가능
- 필요시 DEV 환경에서만 조건부 표시

---

### 2️⃣ 갤러리 큐레이션 시스템 개선

#### 현재 동작 분석 (실제 코드 기준)

```javascript
// usePlaceGallery.js:353-365
const handleCurateImage = useCallback(async (imageId, curationType) => {
  const updatedRawImages = allImagesRef.current.map(img => {
    if (img.id === imageId) {
      // 👉 토글 로직: 같은 상태면 취소, 다르면 적용
      return { ...img, curation: img.curation === curationType ? null : curationType };
    }
    return img;
  });
  // ... DB 저장
}, []);
```

**실제 동작**:
- ❤️ 좋아요: 클릭 → `liked` 설정, 다시 클릭 → `null` (취소 가능)
- 👁️ 안보기: 클릭 → `hidden` 설정, 다시 클릭 → `null` (취소 가능)

**사용자 오해**:
- "삭제 불가, 취소 불가"라고 했지만 실제로는 토글 가능
- UI에 토글 상태 피드백 부족해서 혼란 발생

#### Option A: 엄지척 ↑/↓ 정렬 시스템

**개념**:
```
👍 엄지척 위 (Thumbs Up): 사진을 갤러리 상단으로
👎 엄지척 아래 (Thumbs Down): 사진을 갤러리 하단으로
기본 (No Rating): 중간 위치 유지
```

**장점**:
- ✅ 직관적: 좋음/나쁨을 배열 위치로 시각화
- ✅ 유연성: 3단계 정렬 (상단/중간/하단)
- ✅ 취소 가능: 엄지척↑ 다시 클릭 → 중간으로 복귀

**단점**:
- ❌ "안보기" 기능 상실: 싫은 사진도 화면에 남음
- ❌ 구현 복잡도 증가: 3단계 정렬 로직 필요
- ❌ 갤러리 목적과 불일치: 사진 갤러리는 보통 "보기/숨기기" 위주

**구현 예시**:
```javascript
// 정렬 로직
const sortedImages = rawImages.sort((a, b) => {
  const priority = { 'thumbsUp': 2, 'neutral': 1, 'thumbsDown': 0 };
  return priority[b.rating] - priority[a.rating];
});

// UI
<button onClick={() => handleRate(img.id, 'thumbsUp')}>
  <ThumbsUp className={img.rating === 'thumbsUp' ? 'text-green-500' : ''} />
</button>
<button onClick={() => handleRate(img.id, 'thumbsDown')}>
  <ThumbsDown className={img.rating === 'thumbsDown' ? 'text-red-500' : ''} />
</button>
```

#### Option B: 하트/안보기 버튼 제거

**근거**:
1. **현재 기능 중복**: 좋아요/안보기 모두 정렬/필터링만 수행
2. **사용자 혼란**: 토글 가능한데 피드백 부족
3. **단순화**: 갤러리는 "보는 것"이 목적, 큐레이션은 부가 기능

**대안**:
- 갤러리를 순수하게 "보기 전용"으로 유지
- 북마크 기능은 PlaceCard 상단의 BookmarkButton으로 대체
- 사진 다운로드 기능만 유지

#### 권장사항

**→ Option B (버튼 제거) 권장**

**이유**:
1. **불필요한 복잡성**: 사진 갤러리의 본질은 "보기"
2. **중복 기능**: 북마크는 이미 PlaceCard에 존재
3. **사용자 혼란 해소**: 토글 동작이 명확하지 않아 혼란 유발
4. **코드 단순화**: 큐레이션 로직 전체 제거 가능

**최소 유지 기능**:
- ✅ 사진 클릭 → 전체화면 보기
- ✅ 좌우 화살표 네비게이션
- ✅ 다운로드 버튼
- ✅ Unsplash/Pexels 출처 표시
- ❌ 좋아요/안보기 버튼 제거

**보류 옵션 (나중에 필요하면)**:
- 사용자 리뷰 시스템과 통합 (별점 + 사진)
- 여행 앨범 기능 추가 시 재도입

---

### 3️⃣ 홈 화면 카테고리 트리 네비게이션 시스템

#### 현재 UI 분석

**기존 카테고리 버튼** ([`HomeUI.jsx:64-70`](src/pages/Home/components/HomeUI.jsx:64)):
```jsx
const CATEGORIES = [
  { id: 'paradise', icon: Palmtree, label: 'Paradise', color: 'text-cyan-400' },
  { id: 'nature', icon: Mountain, label: 'Nature', color: 'text-green-400' },
  { id: 'urban', icon: Building2, label: 'Urban', color: 'text-purple-400' },
  { id: 'culture', icon: Landmark, label: 'Culture', color: 'text-yellow-400' },
  { id: 'adventure', icon: Compass, label: 'Adventure', color: 'text-red-400' },
];
```

**현재 동작**:
- 카테고리 버튼 클릭 → `onCategorySelect(cat.id)` 호출
- 지구본에서 해당 카테고리 마커만 필터링 (추정)
- 문제: 여전히 지구본 위의 점들만 보임, 리스트 형태 없음

#### 제안: 2단계 네비게이션 시스템

**레벨 1: 테마 카테고리** (기존 유지)
```
🌴 Paradise (휴양지)
⛰️ Nature (대자연)
🏙️ Urban (도시)
🏛️ Culture (역사/문화)
🧭 Adventure (모험)
```

**레벨 2-A: 대륙별 분류** (새로 추가)
```
🌍 유럽
🌏 아시아
🌎 북미
🌎 남미
🌍 아프리카
🌏 오세아니아
```

**레벨 2-B: 국가별 분류** (선택적)
```
예: Paradise → 🌏 아시아 → 🇹🇭 태국 → 푸켓, 끄라비, 코사무이
```

#### UI/UX 디자인 옵션

**Option 1: 모달 + 트리뷰**
```
[Paradise 버튼 클릭]
  ↓
┌─────────────────────────────────────┐
│ 🌴 Paradise 여행지 찾기              │
├─────────────────────────────────────┤
│                                     │
│ 🌍 대륙별                            │
│   • 유럽 (5)                         │
│   • 아시아 (12)                      │
│   • 오세아니아 (8)                   │
│                                     │
│ 🌏 인기 여행지                       │
│   [몰디브]  [보라보라]  [발리]       │
│   [산토리니] [칸쿤]   [세이셸]       │
│                                     │
│ 📍 전체 목록 (A-Z)                   │
│   Azores • Bali • Bermuda           │
│   Bora Bora • Cancun • ...          │
└─────────────────────────────────────┘
```

**Option 2: 사이드 패널 (추천)**
```
화면 구성:
┌─────────┬───────────────────────────┐
│         │                           │
│ [카테고리]│      🌍 Globe View       │
│  버튼    │                           │
│  ↓      │                           │
│         │                           │
│ 패널 열림 │                           │
├─────────┤                           │
│🌴Paradise│                           │
│         │                           │
│🌍 유럽(5)│                           │
│  산토리니│                           │
│  아조레스│                           │
│         │                           │
│🌏 아시아 │                           │
│  몰디브  │                           │
│  발리    │                           │
│  팔라완  │                           │
└─────────┴───────────────────────────┘
```

**Option 3: 드롭다운 메뉴 (간단)**
```
[Paradise ▼]
  ├─ 🌍 대륙별
  │   ├─ 유럽 (5)
  │   ├─ 아시아 (12)
  │   └─ 오세아니아 (8)
  │
  ├─ 🔥 인기 여행지
  │   ├─ 몰디브
  │   ├─ 보라보라
  │   └─ 발리
  │
  └─ 📜 전체 목록
```

#### 권장사항

**→ Option 2 (사이드 패널) 권장**

**이유**:
1. **지구본 유지**: 시각적 매력 유지하면서 리스트 제공
2. **모바일 대응**: 하단에서 올라오는 Bottom Sheet로 변환 쉬움
3. **단계별 탐색**: 대륙 → 국가 → 여행지 드릴다운
4. **빠른 접근**: 인기 여행지 바로가기

**구현 고려사항**:
- 패널 애니메이션: `transform translateX` 사용
- 모바일: Bottom Sheet (`transform translateY`)
- 검색 통합: 패널 상단에 미니 검색창
- 카운트 표시: "아시아 (12개 여행지)"

---

### 4️⃣ 여행지 데이터 최적화 전략

#### 현재 문제점

**분석** ([`travelSpots.js`](src/pages/Home/data/travelSpots.js)):
```javascript
// 현재 80개 여행지 분포
Paradise: 16개 (보라보라, 산토리니, 몰디브...)
Nature: 20개 (밴프, 이구아수, 아이슬란드...)
Urban: 18개 (뉴욕, 런던, 도쿄...)
Culture: 19개 (치첸이트사, 마추픽추, 로마...)
Adventure: 20개 (알래스카, 남극, 스발바르...)
```

**누락된 주요 여행지** (추정):
- 파리 (에펠탑) ❌
- 바르셀로나 (사그라다 파밀리아) ❌
- 두바이 ✅ (있음)
- 방콕 ❌
- 싱가포르 ✅ (있음)
- 프라하 ✅ (있음)

#### 최적화 프로세스

**Step 1: 세계 여행지 순위 수집**

출처 (복합 활용):
1. **Mastercard Global Destination Cities Index** (도시)
2. **UNESCO World Heritage Sites** (문화유산)
3. **TripAdvisor Travelers' Choice** (종합)
4. **Lonely Planet Best in Travel** (트렌드)
5. **Google Trends** (검색량)

**예시 TOP 20**:
```
1. 파리 (프랑스)
2. 런던 (영국) ✅
3. 방콕 (태국)
4. 두바이 (UAE) ✅
5. 싱가포르 ✅
6. 뉴욕 (미국) ✅
7. 도쿄 (일본) ✅
8. 이스탄불 (튀르키예) ✅
9. 바르셀로나 (스페인)
10. 로마 (이탈리아) ✅
11. 마추픽추 (페루) ✅
12. 산토리니 (그리스) ✅
13. 발리 (인도네시아) ✅
14. 몰디브 ✅
15. 아이슬란드 ✅
16. 칸쿤 (멕시코) ✅
17. 프라하 (체코) ✅
18. 암스테르담 (네덜란드)
19. 베니스 (이탈리아)
20. 피렌체 (이탈리아)
```

**Step 2: AI 페르소나 기반 카테고리별 추출**

**프롬프트 템플릿**:
```javascript
const CATEGORY_PROMPTS = {
  paradise: `
당신은 세계의 모든 휴양지를 두루 섭렵한 럭셔리 여행 전문가입니다.
다음 여행지 리스트에서 "휴양/힐링"에 최적화된 여행지를 20개 선정하세요.

선정 기준:
- 해변/섬 리조트
- 럭셔리 휴양
- 평온한 자연환경
- 신혼여행 추천

리스트: ${TOP_100_DESTINATIONS}

JSON 형식으로 응답:
{
  "destinations": [
    { "name": "몰디브", "reason": "세계 최고의 오버워터 방갈로" },
    ...
  ]
}
  `,
  
  nature: `
당신은 자연경관 전문가이자 내셔널지오그래픽 사진작가입니다.
"자연의 경이로움"을 체험할 수 있는 여행지를 20개 선정하세요.

선정 기준:
- 국립공원, 자연유산
- 빙하, 폭포, 산맥
- 야생동물 서식지
- 트레킹 명소
  `,
  
  urban: `
당신은 대도시 여행 큐레이터입니다.
"도시 문화와 활력"을 느낄 수 있는 여행지를 20개 선정하세요.

선정 기준:
- 마천루와 스카이라인
- 쇼핑/미식
- 박물관/갤러리
- 야경/도시 트렌드
  `,
  
  culture: `
당신은 문화유산 전문가이자 역사학자입니다.
"인류의 역사와 문명"을 탐험할 수 있는 여행지를 20개 선정하세요.

선정 기준:
- UNESCO 세계유산
- 고대 유적지
- 종교/건축 명소
- 전통문화 보존지
  `,
  
  adventure: `
당신은 익스트림 여행 전문가입니다.
"모험과 도전"을 추구하는 여행지를 20개 선정하세요.

선정 기준:
- 오지 탐험
- 극한 환경 (극지방, 사막, 고산)
- 액티비티 중심
- 비주류 여행지
  `
};
```

**Step 3: AI 응답 병합 및 중복 제거**

```javascript
// 예상 결과
Paradise: 20개 선정
Nature: 20개 선정
Urban: 20개 선정
Culture: 20개 선정
Adventure: 20개 선정
───────────────────
총: 100개 (중복 포함)

// 중복 제거 후
유니크 여행지: ~60-70개
```

**중복 처리 로직**:
```javascript
// 예: 파리는 Urban + Culture 양쪽 해당
{
  name: "파리",
  categories: ["urban", "culture"], // 다중 카테고리
  primaryCategory: "urban" // 주 카테고리 (지구본 마커 색상)
}
```

**Step 4: 지구본 분포 밀집도 고려 재분류**

**밀집 지역 식별**:
```javascript
// 유럽 밀집 (위도 45-55°, 경도 -5-15°)
const EUROPEAN_CLUSTER = [
  "파리", "런던", "암스테르담", "브뤼셀", "베를린",
  "프라하", "빈", "취리히", "밀라노", "베니스"
]; // 10개

// 해결책 1: 대표 도시만 지구본 표시
DISPLAY_ON_GLOBE = ["파리", "런던", "베를린"];

// 해결책 2: 나머지는 카테고리 트리에서만 접근
TREE_ONLY = ["암스테르담", "브뤼셀", "빈", ...];
```

**Step 5: 최종 데이터 구조**

```javascript
// 새로운 travelSpots.js 구조
export const TRAVEL_SPOTS = [
  {
    id: 301,
    slug: "paris",
    name: "파리",
    name_en: "Paris",
    country: "프랑스",
    country_en: "France",
    lat: 48.8566,
    lng: 2.3522,
    categories: ["urban", "culture"], // 👈 다중 카테고리
    primaryCategory: "urban",
    continent: "europe", // 👈 대륙 추가
    showOnGlobe: true, // 👈 지구본 표시 여부
    popularity: 98, // 👈 인기도 (순위 기반)
    desc: "에펠탑과 루브르가 있는 예술과 낭만의 도시...",
    keywords: ["에펠탑", "루브르", "센강", "샹젤리제"]
  },
  {
    id: 302,
    slug: "amsterdam",
    name: "암스테르담",
    // ...
    showOnGlobe: false, // 파리와 가까워서 지구본에는 미표시
    popularity: 75
  }
];

// 총 개수: 80-100개 (유니크)
// 지구본 표시: 60-70개 (밀집도 고려)
// 트리 전용: 20-30개
```

#### 구현 프로세스

**자동화 스크립트**:
```javascript
// scripts/optimize-destinations.js

import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function extractDestinationsByCategory(category, top100List) {
  const prompt = CATEGORY_PROMPTS[category].replace('${TOP_100_DESTINATIONS}', top100List);
  
  const model = genAI.getGenerativeModel({ 
    model: "gemini-2.5-pro",
    generationConfig: { responseMimeType: "application/json" }
  });
  
  const result = await model.generateContent(prompt);
  return JSON.parse(result.response.text());
}

async function optimizeDestinations() {
  const top100 = await fetchTop100Destinations(); // 수동 수집 or 크롤링
  
  const categoryResults = {};
  for (const category of ['paradise', 'nature', 'urban', 'culture', 'adventure']) {
    console.log(`Extracting ${category}...`);
    categoryResults[category] = await extractDestinationsByCategory(category, top100);
  }
  
  // 중복 제거 및 병합
  const merged = mergeAndDeduplicate(categoryResults);
  
  // 지구본 밀집도 분석
  const withGlobeVisibility = analyzeGlobeDistribution(merged);
  
  // 최종 JSON 생성
  fs.writeFileSync('travelSpots-optimized.js', generateCode(withGlobeVisibility));
}
```

---

## 🚀 최종 실행 계획

### 우선순위 및 작업 순서

#### Phase 9-1: 즉시 실행 (Quick Wins)
**예상 시간: 1-2시간**

1. ✅ **툴킷 로딩 지연 버튼 제거** (30분)
   - 파일: [`ToolkitTab.jsx`](src/components/PlaceCard/tabs/ToolkitTab.jsx)
   - 작업: Line 374-382 삭제
   - 테스트: 로딩 시나리오 확인

2. ✅ **갤러리 큐레이션 버튼 제거** (1시간)
   - 파일: 
     - [`PlaceGalleryView.jsx`](src/components/PlaceCard/views/PlaceGalleryView.jsx)
     - [`usePlaceGallery.js`](src/components/PlaceCard/hooks/usePlaceGallery.js)
   - 작업:
     - 좋아요/안보기 버튼 UI 제거 (Line 99-124)
     - `handleCurateImage` 로직 제거 (Line 353-415)
     - `processAndSetImages` 정렬 로직 단순화 (Line 111-126)
     - DB 컬럼 `curation` 관련 로직 정리
   - 유지: 다운로드, 네비게이션, 출처 표시

**커밋**:
```bash
git commit -m "refactor(gallery): 갤러리 큐레이션 버튼 제거 및 UI 단순화

- 좋아요/안보기 버튼 제거
- 큐레이션 정렬 로직 제거
- 순수 갤러리 뷰어로 단순화
- 다운로드 및 네비게이션 기능 유지"
```

---

#### Phase 9-2: 여행지 데이터 최적화 (Research & Data)
**예상 시간: 4-6시간**

**9-2-A: TOP 100 여행지 수집** (2시간)
- 출처별 데이터 수집
- 중복 제거 및 순위 통합
- JSON 파일로 정리

**9-2-B: AI 카테고리별 추출** (2-3시간)
- Gemini API 프롬프트 작성
- 5개 카테고리별 AI 실행
- 결과 검증 및 수동 조정

**9-2-C: 지구본 분포 분석** (1시간)
- 밀집 지역 클러스터링 (위도/경도 기반)
- `showOnGlobe` 플래그 설정
- 대륙/국가 메타데이터 추가

**결과물**:
```
travelSpots-optimized.js (80-100개 여행지)
destinations-analysis.json (분석 데이터)
```

---

#### Phase 9-3: 카테고리 트리 UI 구현 (Frontend)
**예상 시간: 6-8시간**

**9-3-A: 데이터 구조 설계** (1시간)
```javascript
// src/pages/Home/data/destinationTree.js
export const DESTINATION_TREE = {
  categories: {
    paradise: {
      label: "Paradise",
      icon: "Palmtree",
      continents: {
        europe: { label: "유럽", destinations: [...] },
        asia: { label: "아시아", destinations: [...] },
        // ...
      },
      popular: ["몰디브", "보라보라", "발리"], // 인기 TOP 3
      all: [...] // 전체 목록
    },
    // ... 나머지 카테고리
  }
};
```

**9-3-B: 사이드 패널 컴포넌트** (3-4시간)
```jsx
// src/pages/Home/components/CategoryPanel.jsx
const CategoryPanel = ({ 
  category, 
  isOpen, 
  onClose, 
  onDestinationSelect 
}) => {
  // 대륙별 탭
  // 인기 여행지 섹션
  // 검색 기능
  // 스크롤 최적화
};
```

**9-3-C: 모바일 Bottom Sheet** (2시간)
```jsx
// 모바일: 하단에서 올라오는 시트
// 스와이프 제스처 지원
// 반응형 레이아웃
```

**9-3-D: 애니메이션 & 스타일링** (1-2시간)
- Slide-in/out 애니메이션
- 카테고리 색상 테마 통일
- 다크 모드 지원

---

#### Phase 9-4: 통합 및 테스트 (Integration)
**예상 시간: 2-3시간**

1. **지구본 + 패널 연동**
   - 카테고리 선택 → 패널 오픈
   - 패널에서 여행지 클릭 → 지구본 Fly To
   - 지구본 마커 클릭 → 패널에서 하이라이트

2. **검색 통합**
   - 검색창 → 카테고리 자동 필터
   - 패널 내 검색 → 실시간 필터링

3. **성능 최적화**
   - 80-100개 여행지 렌더링 최적화
   - Virtual Scrolling (필요 시)
   - 이미지 Lazy Loading

4. **모바일 UX 검증**
   - 터치 제스처
   - 패널 크기 조정
   - 오버레이 딤 처리

---

## 📋 Phase 9 전체 TODO 체크리스트

### Phase 9-1: 즉시 실행 (1-2h)
- [ ] 툴킷 로딩 지연 버튼 제거
  - [ ] `ToolkitTab.jsx` 수정
  - [ ] 테스트 (로딩 시나리오)
  - [ ] 커밋
- [ ] 갤러리 큐레이션 버튼 제거
  - [ ] `PlaceGalleryView.jsx` UI 제거
  - [ ] `usePlaceGallery.js` 로직 제거
  - [ ] 정렬 로직 단순화
  - [ ] 테스트 (갤러리 뷰)
  - [ ] 커밋

### Phase 9-2: 여행지 데이터 최적화 (4-6h)
- [ ] TOP 100 여행지 수집
  - [ ] Mastercard Index 조사
  - [ ] TripAdvisor 데이터 수집
  - [ ] UNESCO 유산 리스트
  - [ ] 통합 및 순위 정리
- [ ] AI 카테고리별 추출
  - [ ] Gemini 프롬프트 작성 (5개)
  - [ ] API 실행 및 결과 수집
  - [ ] 수동 검증 및 조정
- [ ] 지구본 분포 분석
  - [ ] 밀집 지역 클러스터링
  - [ ] `showOnGlobe` 플래그 설정
  - [ ] 대륙/국가 메타데이터 추가
  - [ ] `travelSpots-optimized.js` 생성
  - [ ] 커밋

### Phase 9-3: 카테고리 트리 UI (6-8h)
- [ ] 데이터 구조 설계
  - [ ] `destinationTree.js` 생성
  - [ ] 대륙별/국가별 분류
  - [ ] 인기 여행지 선정
- [ ] 사이드 패널 컴포넌트
  - [ ] `CategoryPanel.jsx` 생성
  - [ ] 대륙별 탭 UI
  - [ ] 여행지 리스트 렌더링
  - [ ] 검색 기능 추가
- [ ] 모바일 Bottom Sheet
  - [ ] 반응형 레이아웃
  - [ ] 스와이프 제스처
  - [ ] 애니메이션
- [ ] 스타일링
  - [ ] 카테고리 색상 테마
  - [ ] 애니메이션 효과
  - [ ] 다크 모드
  - [ ] 커밋

### Phase 9-4: 통합 및 테스트 (2-3h)
- [ ] 지구본 연동
  - [ ] 패널 → 지구본 Fly To
  - [ ] 지구본 → 패널 하이라이트
- [ ] 검색 통합
  - [ ] 검색창 → 카테고리 자동 필터
  - [ ] 패널 내 검색
- [ ] 성능 최적화
  - [ ] 렌더링 최적화
  - [ ] Lazy Loading
- [ ] 모바일 UX 검증
  - [ ] 터치 제스처
  - [ ] 레이아웃 검증
  - [ ] 최종 커밋

---

## 🎨 UI 목업 (사이드 패널)

### 데스크톱 레이아웃
```
┌──────────────┬─────────────────────────────┐
│              │                             │
│   로고       │        검색창                │
│              │                             │
├──────────────┴─────────────────────────────┤
│                                            │
│                🌍 Globe                     │
│                                            │
│  [카테고리]                                 │
│   버튼                                      │
│    ↓                                       │
│  열림                                       │
│ ┌────────┐                                 │
│ │🌴Paradise│                                │
│ │         │                                │
│ │🌍 대륙별 │                                │
│ │  유럽(5) │                                │
│ │  아시아  │                                │
│ │         │                                │
│ │🔥 인기   │                                │
│ │  몰디브  │ ← 클릭 시 지구본 Fly To        │
│ │  보라보라│                                │
│ │  발리    │                                │
│ │         │                                │
│ │📜 전체   │                                │
│ │  ...     │                                │
│ └────────┘                                 │
│                                            │
│            [AI 채팅 버튼]                   │
└────────────────────────────────────────────┘
```

### 모바일 레이아웃
```
┌────────────────────┐
│   검색  [버튼들]    │
├────────────────────┤
│                    │
│   🌍 Globe View    │
│                    │
│                    │
│  [Paradise] ← 카테고리│
│  [Nature]          │
│  [Urban]           │
└────────────────────┘
        ↓ 클릭
┌────────────────────┐
│   🌍 Globe View    │ ← 상단 1/3만 보임
├────────────────────┤
│ 🌴 Paradise 여행지  │ ← Bottom Sheet
│ ─────────────────  │
│ 🔥 인기             │
│  [몰디브] [보라보라] │
│                    │
│ 🌍 대륙별           │
│  • 유럽 (5) >      │
│  • 아시아 (12) >   │
│                    │
│ [스와이프로 닫기]    │
└────────────────────┘
```

---

## ⏱️ 전체 예상 일정

| Phase | 작업 내용 | 시간 | 누적 |
|-------|----------|------|------|
| 9-1 | 즉시 실행 (버튼 제거) | 1-2h | 1-2h |
| 9-2 | 여행지 데이터 최적화 | 4-6h | 5-8h |
| 9-3 | 카테고리 트리 UI | 6-8h | 11-16h |
| 9-4 | 통합 및 테스트 | 2-3h | 13-19h |
| **합계** | | **13-19h** | |

**권장 작업 분할**:
- **세션 1** (2-3h): Phase 9-1 완료 → 즉시 배포
- **세션 2** (4-6h): Phase 9-2 완료 → 데이터 확정
- **세션 3** (6-8h): Phase 9-3 완료 → UI 구현
- **세션 4** (2-3h): Phase 9-4 완료 → 최종 통합

---

## 🔄 Phase 8 (복잡한 여행지 시스템)과의 관계

### 의존성 없음
- Phase 9는 Phase 8과 독립적으로 진행 가능
- Phase 8 (길리 메노 등 복잡한 여행지 툴킷)
- Phase 9 (홈 UX 및 여행지 탐색 개선)

### 시너지 효과
1. **Phase 9 먼저 완료** (추천)
   - 여행지 데이터 최적화로 더 많은 여행지 노출
   - 카테고리 트리로 복잡한 여행지도 쉽게 발견
   - Phase 8 구현 시 더 풍부한 테스트 데이터

2. **Phase 8 먼저 완료**
   - 복잡한 여행지 감지 시 트리에서 별도 아이콘 표시
   - "⚠️ 복잡한 준비 필요" 뱃지 추가

---

## 💡 추가 제안사항

### 1. 여행지 상세 프리뷰
```jsx
// 패널에서 여행지 호버 시
<DestinationPreview>
  <img src={thumbnail} />
  <h3>몰디브</h3>
  <p>인도양의 진주...</p>
  <div>
    <span>🌴 Paradise</span>
    <span>⭐ 인기도 98</span>
  </div>
</DestinationPreview>
```

### 2. 여행지 비교 기능
```
[몰디브] vs [보라보라] vs [세이셸]
→ 비용, 시즌, 복잡도 비교 테이블
```

### 3. 개인화 추천
```
"당신이 좋아할 만한 여행지"
← 북마크/검색 히스토리 기반 AI 추천
```

---

## 📝 다음 세션 준비사항

### 사용자(개발자)
1. [ ] Phase 9-1 즉시 실행 승인 여부
2. [ ] 갤러리 큐레이션 제거 최종 확인
3. [ ] 선호하는 UI 옵션 선택 (사이드 패널 / 모달 / 드롭다운)

### AI(Architect)
1. [ ] TOP 100 여행지 초안 리스트 작성
2. [ ] Gemini 프롬프트 초안 준비
3. [ ] `CategoryPanel.jsx` 컴포넌트 구조 설계

---

**작성일**: 2026-03-30  
**현재 Phase**: Phase 8 대기 중 → Phase 9 우선 진행 제안  
**최종 목표**: "여행지를 쉽게 탐색하고, 복잡한 준비도 한 곳에서" 🌍✨
