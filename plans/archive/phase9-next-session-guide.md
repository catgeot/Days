# Phase 9: 다음 세션 실행 가이드

## 📋 세션 시작 전 체크리스트

### 준비 완료 사항 ✅
- [x] Phase 9 전체 계획 수립 완료 ([`phase9-ux-optimization-plan.md`](phase9-ux-optimization-plan.md))
- [x] 여행지 수량 스코프 분석 완료 ([`destination-scope-analysis.md`](destination-scope-analysis.md))
- [x] `.ai-context.md` 업데이트 완료
- [x] 우선순위 및 작업 순서 확정

### 사용자 승인 대기 사항 ⏳
- [ ] Phase 9-1 즉시 실행 승인 (툴킷 버튼 + 갤러리 큐레이션 제거)
- [ ] 갤러리 큐레이션 제거 최종 확인
- [ ] 여행지 데이터 200개 초기 구성 승인
- [ ] 카테고리 트리 UI 디자인 승인 (사이드 패널 방식)

---

## 🚀 세션 1: Phase 9-1 즉시 실행 (1-2시간)

### 목표
UI 단순화를 통한 즉각적인 사용자 경험 개선

### 작업 1: 툴킷 로딩 지연 버튼 제거 (30분)

#### 파일
- [`src/components/PlaceCard/tabs/ToolkitTab.jsx`](../src/components/PlaceCard/tabs/ToolkitTab.jsx)

#### 수정 위치
```jsx
// Line 374-382 제거
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

#### 테스트 포인트
1. 툴킷 탭 진입 시 정상 로딩
2. 위키 탭에서 강제 갱신 버튼은 여전히 작동
3. 로딩 100% 도달 시 버튼 미표시

#### 커밋
```bash
git add src/components/PlaceCard/tabs/ToolkitTab.jsx
git commit -m "refactor(toolkit): 로딩 지연 버튼 제거

- Phase 7 로딩 동기화 개선으로 불필요해진 버튼 제거
- 위키 탭의 수동 갱신 버튼으로 대체 가능
- UI 단순화 및 사용자 혼란 방지"
```

---

### 작업 2: 갤러리 큐레이션 시스템 제거 (1시간)

#### 파일
1. [`src/components/PlaceCard/views/PlaceGalleryView.jsx`](../src/components/PlaceCard/views/PlaceGalleryView.jsx)
2. [`src/components/PlaceCard/hooks/usePlaceGallery.js`](../src/components/PlaceCard/hooks/usePlaceGallery.js)

#### 수정 내용

**PlaceGalleryView.jsx**:
```jsx
// Line 99-124 제거 (좋아요/안보기 버튼 UI)
{handleCurateImage && (
  <div className="flex items-center gap-2 mr-2">
    <button onClick={() => handleCurateImage(selectedImg.id, 'liked')}>
      <Heart size={20} />
    </button>
    <button onClick={() => handleCurateImage(selectedImg.id, 'hidden')}>
      <EyeOff size={20} />
    </button>
    <div className="w-px h-6 bg-white/20 mx-1"></div>
  </div>
)}

// Line 200-202 제거 (좋아요 아이콘 표시)
{img.curation === 'liked' && (
  <Heart className="absolute top-4 left-4 text-red-500 fill-red-500" size={20} />
)}

// Line 17에서 handleCurateImage prop 제거
```

**usePlaceGallery.js**:
```javascript
// Line 353-415 제거 (handleCurateImage 함수)
const handleCurateImage = useCallback(async (imageId, curationType) => {
  // ... 전체 로직 제거
}, []);

// Line 111-126 단순화 (정렬 로직 제거)
const processAndSetImages = useCallback((rawImages) => {
  if (!rawImages || rawImages.length === 0) {
    setImages([]);
    return;
  }
  allImagesRef.current = rawImages;
  setImages(rawImages); // 단순하게 그대로 표시
}, []);

// Line 418-426 반환 객체에서 handleCurateImage 제거
return {
  images,
  isImgLoading,
  selectedImg,
  setSelectedImg,
  handleDownload,
  handleRefresh: () => fetchImages(true)
  // handleCurateImage 제거
};
```

#### 테스트 포인트
1. 갤러리 기본 기능 작동 (이미지 로드, 전체화면, 네비게이션)
2. 다운로드 버튼 정상 작동
3. Unsplash/Pexels 출처 표시 유지
4. 새로고침 버튼 작동

#### 커밋
```bash
git add src/components/PlaceCard/views/PlaceGalleryView.jsx src/components/PlaceCard/hooks/usePlaceGallery.js
git commit -m "refactor(gallery): 갤러리 큐레이션 버튼 제거 및 UI 단순화

- 좋아요/안보기 버튼 제거
- 큐레이션 정렬 로직 제거
- 순수 갤러리 뷰어로 단순화
- 다운로드 및 네비게이션 기능 유지
- 사용자 혼란 해소 및 코드 단순화"
```

---

### 세션 1 완료 후
```bash
# 배포
git push origin main

# 테스트 환경 확인
- 툴킷 탭 정상 작동 확인
- 갤러리 정상 작동 확인
```

---

## 🗂️ 세션 2: Phase 9-2 여행지 데이터 최적화 (4-6시간)

### 목표
실제 여행자가 가는 곳을 누락 없이 200개 선정 및 데이터 구조화

### 준비 자료

#### 1. TOP 100 여행지 수집 소스
```
1. Mastercard Global Destination Cities Index
   - https://www.mastercard.com/news/research-reports/
   - 주요 도시 방문객 통계

2. TripAdvisor Travelers' Choice
   - https://www.tripadvisor.com/TravelersChoice
   - 여행자 투표 기반 순위

3. UNESCO World Heritage Sites
   - https://whc.unesco.org/en/list/
   - 문화유산 주요 지점

4. Lonely Planet Best in Travel
   - https://www.lonelyplanet.com/best-in-travel
   - 트렌드 및 신흥 여행지

5. Google Trends (여행 검색 키워드)
   - 실제 검색량 데이터
```

#### 2. 절대 누락 불가 리스트 (Tier 1 - 50개 예시)

**유럽 (15개)**:
```
파리, 런던, 로마, 바르셀로나, 암스테르담
베니스, 프라하, 빈, 아테네, 이스탄불
베를린, 취리히, 더블린, 코펜하겐, 스톡홀름
```

**아시아 (12개)**:
```
도쿄, 오사카, 방콕, 싱가포르, 홍콩
서울, 베이징, 상하이, 타이베이, 발리
푸켓, 다낭
```

**북미 (8개)**:
```
뉴욕, LA, 샌프란시스코, 라스베가스
토론토, 밴쿠버, 멕시코시티, 칸쿤
```

**오세아니아 (3개)**:
```
시드니, 멜버른, 오클랜드
```

**중동/아프리카 (5개)**:
```
두바이, 카이로, 케이프타운, 마라케시, 이스탄불
```

**남미 (3개)**:
```
리우데자네이루, 부에노스아이레스, 쿠스코(마추픽추)
```

### 작업 단계

#### Step 1: Tier 1 50개 수동 선정 (1시간)
```javascript
// 절대 누락 불가 체크리스트
const TIER_1_MUST_HAVE = [
  // 수집한 소스 기반으로 작성
  { name: "파리", name_en: "Paris", country: "프랑스", ... },
  { name: "런던", name_en: "London", country: "영국", ... },
  // ...
];
```

#### Step 2: AI 카테고리별 추출 (2-3시간)

**Gemini 프롬프트 실행**:
```javascript
const CATEGORY_PROMPTS = {
  paradise: `
당신은 세계의 모든 휴양지를 두루 섭렵한 럭셔리 여행 전문가입니다.
다음 여행지 리스트에서 "휴양/힐링"에 최적화된 여행지를 25개 선정하세요.

선정 기준:
- 해변/섬 리조트
- 럭셔리 휴양
- 평온한 자연환경
- 신혼여행 추천

리스트: ${TOP_100_LIST}

JSON 형식으로 응답:
{
  "destinations": [
    { "name": "몰디브", "name_en": "Maldives", "reason": "세계 최고의 오버워터 방갈로" },
    ...
  ]
}
  `,
  
  nature: `
당신은 자연경관 전문가이자 내셔널지오그래픽 사진작가입니다.
"자연의 경이로움"을 체험할 수 있는 여행지를 25개 선정하세요.
  `,
  
  // ... 나머지 카테고리
};

// 실행
for (const category in CATEGORY_PROMPTS) {
  const result = await callGeminiAPI(CATEGORY_PROMPTS[category]);
  console.log(`${category}: ${result.destinations.length}개 추출`);
}
```

#### Step 3: 중복 제거 및 병합 (30분)
```javascript
// 다중 카테고리 처리
const merged = mergeDuplicates(categoryResults);
// 예: 파리는 urban + culture

// Tier 2 120개 확정
// Tier 3 30개 큐레이션 (시각적 흥미)
```

#### Step 4: 지구본 밀집도 분석 (1시간)
```javascript
// 밀집 지역 정의
const DENSE_REGIONS = {
  'western-europe': {
    latRange: [45, 55],
    lngRange: [-5, 15],
    maxMarkers: 15,
    cities: [...] // 파리, 런던, 암스테르담 등
  },
  'southeast-asia': {
    latRange: [-10, 25],
    lngRange: [95, 125],
    maxMarkers: 20,
    cities: [...] // 방콕, 싱가포르, 발리 등
  }
};

// 우선순위 정렬 후 상위만 showOnGlobe = true
const setGlobeVisibility = (destinations, region) => {
  return destinations
    .filter(d => d.denseRegion === region.id)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, region.maxMarkers)
    .map(d => ({ ...d, showOnGlobe: true }));
};
```

#### Step 5: 최종 데이터 생성 (30분)
```javascript
// src/pages/Home/data/travelSpots-optimized.js
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
    tier: 1,                    // 👈 추가
    popularity: 98,             // 👈 추가
    continent: "europe",        // 👈 추가
    categories: ["urban", "culture"], // 다중 카테고리
    primaryCategory: "urban",
    showOnGlobe: true,          // 👈 추가
    denseRegion: "western-europe",
    desc: "...",
    keywords: [...]
  },
  // ... 200개
];
```

#### 커밋
```bash
git add src/pages/Home/data/travelSpots-optimized.js
git commit -m "feat(data): 여행지 데이터 최적화 (200개)

- Tier 1: 50개 (필수 여행지)
- Tier 2: 120개 (인기 여행지)
- Tier 3: 30개 (특화 여행지)
- 메타데이터 추가 (tier, popularity, continent, showOnGlobe)
- 지구본 밀집도 분석 완료
- AI 페르소나 기반 카테고리별 최적화"
```

---

## 🎨 세션 3: Phase 9-3 카테고리 트리 UI (6-8시간)

### 목표
사이드 패널 + Bottom Sheet 방식의 카테고리 네비게이션 구현

### 작업 1: 데이터 구조 설계 (1시간)

#### 파일 생성
```javascript
// src/pages/Home/data/destinationTree.js
export const DESTINATION_TREE = {
  categories: {
    paradise: {
      id: 'paradise',
      label: 'Paradise',
      labelKo: '휴양지',
      icon: 'Palmtree',
      color: 'text-cyan-400',
      
      continents: {
        europe: {
          label: '유럽',
          count: 5,
          destinations: [
            { id: 102, name: '산토리니', name_en: 'Santorini' },
            // ...
          ]
        },
        asia: {
          label: '아시아',
          count: 12,
          destinations: [
            { id: 104, name: '몰디브', name_en: 'Maldives' },
            { id: 117, name: '발리', name_en: 'Bali' },
            // ...
          ]
        },
        // ... 나머지 대륙
      },
      
      popular: [
        { id: 104, name: '몰디브' },
        { id: 101, name: '보라보라' },
        { id: 117, name: '발리' }
      ],
      
      all: [...] // 전체 목록 (카테고리별)
    },
    
    nature: { /* ... */ },
    urban: { /* ... */ },
    culture: { /* ... */ },
    adventure: { /* ... */ }
  }
};
```

### 작업 2: 사이드 패널 컴포넌트 (3-4시간)

#### 파일 생성
```jsx
// src/pages/Home/components/CategoryPanel.jsx
import React, { useState } from 'react';
import { X, Search, ChevronRight, MapPin } from 'lucide-react';

const CategoryPanel = ({ 
  category, 
  isOpen, 
  onClose, 
  onDestinationSelect 
}) => {
  const [activeContinent, setActiveContinent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const categoryData = DESTINATION_TREE.categories[category];
  
  return (
    <div 
      className={`fixed left-0 top-0 h-full w-80 bg-black/95 backdrop-blur-xl border-r border-white/10 z-50 transform transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* 헤더 */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Icon icon={categoryData.icon} />
            {categoryData.labelKo}
          </h2>
          <button onClick={onClose} className="text-white/50 hover:text-white">
            <X size={20} />
          </button>
        </div>
        
        {/* 검색창 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="여행지 검색..."
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>
      
      {/* 인기 여행지 */}
      <div className="p-6 border-b border-white/10">
        <h3 className="text-sm font-bold text-gray-400 mb-3">🔥 인기 여행지</h3>
        <div className="flex flex-wrap gap-2">
          {categoryData.popular.map(dest => (
            <button
              key={dest.id}
              onClick={() => onDestinationSelect(dest)}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
            >
              {dest.name}
            </button>
          ))}
        </div>
      </div>
      
      {/* 대륙별 분류 */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <h3 className="text-sm font-bold text-gray-400 mb-3">🌍 대륙별</h3>
        <div className="space-y-2">
          {Object.entries(categoryData.continents).map(([key, continent]) => (
            <div key={key}>
              <button
                onClick={() => setActiveContinent(activeContinent === key ? null : key)}
                className="w-full flex items-center justify-between px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-white transition-colors"
              >
                <span className="flex items-center gap-2">
                  {continent.label} ({continent.count})
                </span>
                <ChevronRight 
                  size={16} 
                  className={`transform transition-transform ${activeContinent === key ? 'rotate-90' : ''}`}
                />
              </button>
              
              {activeContinent === key && (
                <div className="mt-2 ml-4 space-y-1">
                  {continent.destinations.map(dest => (
                    <button
                      key={dest.id}
                      onClick={() => onDestinationSelect(dest)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <MapPin size={14} />
                      {dest.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CategoryPanel;
```

### 작업 3: 모바일 Bottom Sheet (2시간)

```jsx
// 모바일: 하단 시트로 변환
<div 
  className={`md:hidden fixed inset-x-0 bottom-0 h-[70vh] bg-black/95 backdrop-blur-xl border-t border-white/10 z-50 transform transition-transform duration-300 ${
    isOpen ? 'translate-y-0' : 'translate-y-full'
  }`}
>
  {/* 스와이프 핸들 */}
  <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-4" />
  
  {/* 동일한 콘텐츠 */}
</div>
```

### 작업 4: HomeUI 통합 (1시간)

```jsx
// src/pages/Home/components/HomeUI.jsx에 통합
const [activeCategoryPanel, setActiveCategoryPanel] = useState(null);

// 카테고리 버튼 클릭 핸들러 수정
const handleCategoryClick = (categoryId) => {
  onCategorySelect(categoryId);
  setActiveCategoryPanel(categoryId); // 패널 열기
};

return (
  <>
    {/* 기존 UI */}
    
    {/* 카테고리 패널 */}
    {activeCategoryPanel && (
      <CategoryPanel
        category={activeCategoryPanel}
        isOpen={!!activeCategoryPanel}
        onClose={() => setActiveCategoryPanel(null)}
        onDestinationSelect={(dest) => {
          onTickerClick(dest); // 지구본 Fly To
          setActiveCategoryPanel(null);
        }}
      />
    )}
  </>
);
```

#### 커밋 전략
```bash
# 커밋 1: 데이터 구조
git commit -m "feat(data): 카테고리 트리 데이터 구조 추가"

# 커밋 2: 사이드 패널
git commit -m "feat(ui): 카테고리 사이드 패널 컴포넌트 구현"

# 커밋 3: 모바일 지원
git commit -m "feat(ui): 모바일 Bottom Sheet 추가"

# 커밋 4: 통합
git commit -m "feat(home): 카테고리 패널 HomeUI 통합"
```

---

## 🔗 세션 4: Phase 9-4 통합 및 테스트 (2-3시간)

### 작업 1: 지구본 연동
```jsx
// 패널에서 여행지 클릭 → 지구본 Fly To
const handleDestinationSelect = (destination) => {
  // PlaceCard 대신 지구본에만 표시
  globeRef.current?.flyToAndPin(
    destination.lat,
    destination.lng,
    destination.name,
    destination.primaryCategory
  );
  
  setActiveCategoryPanel(null);
};
```

### 작업 2: 검색 통합
```jsx
// 검색창에서 검색 → 카테고리 자동 필터
const handleSearch = (query) => {
  // 여행지 검색
  const results = searchDestinations(query);
  
  // 해당 카테고리 패널 자동 오픈
  if (results.length > 0) {
    setActiveCategoryPanel(results[0].primaryCategory);
  }
};
```

### 작업 3: 성능 최적화
```jsx
// Virtual Scrolling (필요 시)
import { FixedSizeList } from 'react-window';

// 200개 목록 렌더링 최적화
```

### 최종 커밋
```bash
git commit -m "feat(integration): 지구본-패널 연동 및 검색 통합 완료

- 패널 클릭 시 지구본 Fly To
- 검색 자동 카테고리 필터
- 성능 최적화 (Virtual Scrolling)
- 모바일 UX 검증 완료"
```

---

## 📋 전체 세션 체크리스트

### Phase 9-1: Quick Wins ✅
- [ ] 툴킷 로딩 지연 버튼 제거
- [ ] 갤러리 큐레이션 시스템 제거
- [ ] 배포 및 테스트

### Phase 9-2: 여행지 데이터 ✅
- [ ] TOP 100 수집
- [ ] Tier 1 50개 확정
- [ ] AI 카테고리별 추출
- [ ] 중복 제거 및 병합
- [ ] 지구본 밀집도 분석
- [ ] 최종 데이터 생성

### Phase 9-3: 카테고리 트리 UI ✅
- [ ] 데이터 구조 설계
- [ ] 사이드 패널 컴포넌트
- [ ] 모바일 Bottom Sheet
- [ ] HomeUI 통합

### Phase 9-4: 통합 & 테스트 ✅
- [ ] 지구본 연동
- [ ] 검색 통합
- [ ] 성능 최적화
- [ ] 모바일 UX 검증

---

## 🎯 성공 지표

### 정량적 지표
- [ ] 여행지 수: 200개 (Tier 1: 50, Tier 2: 120, Tier 3: 30)
- [ ] 지구본 표시: 80-100개
- [ ] 카테고리별 균형: 각 40개 내외
- [ ] 대륙별 분포: 균등 배치

### 정성적 지표
- [ ] 주요 여행지 누락 없음 (Tier 1 체크리스트)
- [ ] 사용자가 원하는 여행지를 3번 클릭 안에 찾을 수 있음
- [ ] 지구본 시각적 혼잡도 감소
- [ ] 모바일 터치 반응성 우수

---

## 🚨 주의사항

### 데이터 무결성
```
✅ Tier 1 50개는 절대 누락 금지
✅ 각 여행지는 최소 1개 카테고리 보유
✅ lat/lng 좌표 정확성 검증
✅ slug는 영문 소문자 + 하이픈 (SEO)
```

### 성능
```
✅ 200개 렌더링 지연 없어야 함
✅ 패널 open/close 애니메이션 부드러워야 함
✅ 검색 실시간 필터링 빠름
✅ 모바일 스크롤 끊김 없음
```

### UX
```
✅ 카테고리 색상 일관성 유지
✅ 로딩 상태 명확히 표시
✅ 빈 상태(Empty State) 처리
✅ 에러 처리 (여행지 못 찾음)
```

---

## 📞 다음 세션 시작 시

### AI에게 전달할 컨텍스트
```
"Phase 9 실행을 시작합니다.
- Phase 9-1부터 순차적으로 진행해주세요.
- 각 작업 완료 후 테스트 포인트를 안내해주세요.
- 커밋 메시지는 제안된 것을 사용하겠습니다."
```

### 예상 질문
- Q: "여행지 200개 데이터를 어디서 가져올까요?"
  - A: TOP 100 소스 참고, 나머지는 AI 추천 + 수동 큐레이션
  
- Q: "밀집 지역 기준이 애매한데요?"
  - A: 위도/경도 범위 기반, 시각적으로 겹치면 우선순위 낮춤

- Q: "패널 디자인을 바꾸고 싶어요"
  - A: 기본 구현 후 피드백으로 조정

---

**작성일**: 2026-03-30  
**다음 세션 목표**: Phase 9-1 완료 (Quick Wins)  
**예상 소요 시간**: 13-19시간 (4개 세션)  
**최종 목표**: 여행지 탐색 편의성 300% 향상 🌍✨
