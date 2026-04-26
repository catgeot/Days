# 트립링크 패키지 배너 연동 (Phase 1) 구체화 계획

## 1. 개요
현재 PlaceCard의 플래너(PlannerTab) 영역은 자유여행객을 위한 툴킷 중심으로 구성되어 있습니다.
Phase 1에서는 **자유여행을 망설이거나 준비가 부담스러운 특정 타겟 지역**을 검색한 사용자에게, 최상단 또는 눈에 띄는 위치에 **트립링크 맞춤형 패키지 배너**를 노출하여 전환을 유도합니다.

## 2. 타겟팅 및 분기 로직
검색된 `location.name` 및 `location.country` 데이터를 기반으로 지역을 그룹화하고, 그룹에 맞는 트립링크 패키지 딥링크를 매핑합니다.

### 그룹 분류 (예시)
1. **유럽 / 중동 / 아프리카 (고단가 / 필수 패키지 타겟)**
   - 키워드: 유럽, 프랑스, 이탈리아, 영국, 스페인, 터키, 이집트, 아프리카 등
   - 배너 카피: "교통과 치안이 걱정된다면? 핵심만 짚어주는 유럽/지중해 패키지"
   - 링크: 트립링크 유럽/중동 패키지 카테고리
2. **중남미 / 북미 (장거리 타겟)**
   - 키워드: 미국, 캐나다, 멕시코, 페루 등
   - 배너 카피: "긴 비행 시간, 편안한 일정. 미주/중남미 안심 패키지 특가"
   - 링크: 트립링크 북미/중남미 카테고리
3. **아시아 휴양지 / 일본 (효도 / 가족 / 골프 타겟)**
   - 키워드: 다낭, 삿포로, 방콕, 클락, 나트랑, 괌, 사이판 등
   - 배너 카피: "부모님 모시고 가기 좋은 가족/휴양 패키지 & 골프 특가"
   - 링크: 트립링크 동남아/일본 패키지 카테고리
4. **디폴트 (기타 지역)**
   - 배너 카피: "항공+숙소 한 번에 해결! 글로벌 패키지 특가 보러가기"
   - 링크: 트립링크 패키지 메인 또는 인기 기획전

> 💡 *실제 배너 이미지 에셋이 당장 없다면, React TailwindCSS로 텍스트와 아이콘이 포함된 깔끔한 카드형 배너(CTA 컴포넌트)를 렌더링하고 클릭 시 제휴 링크로 이동하게끔 구현합니다.*

## 3. UI 적용 위치 (PlannerTab.jsx)
기존 `ToolkitCard` 렌더링 영역 상단 혹은 "준비하기" 탭 가장 첫 번째 요소로 **단일 배너(CTA 카드)**를 추가합니다.

```jsx
// PlannerTab.jsx 추가 예시 위치
<div className="p-4 md:p-6 space-y-8 pb-32">
    {/* 🆕 트립링크 맥락형 패키지 배너 노출 영역 */}
    <TripLinkPackageBanner location={location} />
    
    <div className="space-y-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">...</h3>
        <div className="grid grid-cols-1 gap-5">
             <ToolkitCard icon={FileText} title="비자 및 서류" ... />
```

## 4. 구현 단계 (Action Items)
1. `src/components/PlaceCard/tabs/planner/constants.js` (또는 새 파일)에 트립링크 제휴 링크와 지역 매핑 데이터를 정의합니다.
2. `src/components/PlaceCard/tabs/planner/components/TripLinkPackageBanner.jsx` 컴포넌트를 생성하여 UI와 타겟팅 로직을 구현합니다.
3. `src/components/PlaceCard/tabs/PlannerTab.jsx` 최상단에 해당 배너를 삽입합니다.

---

이러한 내용으로 `TripLinkPackageBanner` 컴포넌트를 구현하고 적용하는 방향으로 진행할까요? 
(추가할 구체적인 트립링크 제휴 링크나 텍스트가 있다면 반영하겠습니다.)
