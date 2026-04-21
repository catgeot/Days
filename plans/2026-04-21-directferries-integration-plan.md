# Direct Ferries 어필리에이트 통합 계획

**작성일**: 2026-04-21  
**상태**: Phase 1 (시험 단계 - 두브로브니크 노선)

---

## 📋 프로젝트 개요

### 배경
- Direct Ferries 어필리에이트 승인 완료
- 파트너 코드: `F8350KR`
- 첫 테스트 노선: **두브로브니크 ↔ 스플리트** (크로아티아)

### 목표
1. **Phase 1**: 두브로브니크 페리 카드에 Direct Ferries 위젯 삽입 및 시각 확인
2. **Phase 2**: 여행지별 동적 노선 매핑 시스템 구축
3. **Phase 3**: 확장 (그리스 섬 투어, 이탈리아-크로아티아, 일본 페리 등)

---

## 🎯 Phase 1: 두브로브니크 테스트 통합

### 1.1 현재 시스템 분석

**기존 페리 카드 위치**:
```
PlaceCard → PlannerTab → 섹션 2: 현지 도착 및 이동
  └─ ToolkitCard (type="ferry_booking")
      ├─ AI 생성 텍스트 (두브로브니크 페리 정보)
      └─ 하단 버튼: 클룩 페리 검색 링크
```

**기존 제휴 위젯 예시**:
- `type === 'flight'` → [`WhiteLabelWidget`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx:88) (Travelpayouts 항공권)
- `type === 'accommodation'` → [`HotelWidget`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx:92) (Travelpayouts 숙소)

### 1.2 Direct Ferries 위젯 사양

**제공받은 iframe 코드**:
```html
<iframe id="dealFinder" 
  marginwidth="0" 
  frameborder="0" 
  scrolling="no" 
  height="285" 
  marginheight="0" 
  style="width:100%;" 
  src="https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0">
</iframe>
```

**URL 파라미터 분석**:
- `stdc=F8350KR`: 파트너 코드 (고정)
- `cult=ko-KR`: 언어/지역 (한국어)
- `btn=47a347`: 버튼 배경색
- `btnh=168b16`: 버튼 호버 색상
- `btnt=FFFFFF`: 버튼 텍스트 색상
- `tclr=000001`: 제목 색상
- `lclr=000001`: 라벨 색상
- `lbld=400`: 라벨 두께
- `pclr=64b6e6`: 가격 색상
- `sclr=64b6e6`: 세일 색상
- `targ=0`: 타겟 (0=현재 창, 1=새 창)

**위젯 특징**:
- 고정 높이: `285px`
- 반응형 너비: `100%`
- 노선별 동적 검색 가능 (사용자가 선택)

---

## 🏗️ Phase 1 구현 계획

### 단계 1: DirectFerriesWidget 컴포넌트 생성

**파일**: `src/components/PlaceCard/tabs/planner/components/DirectFerriesWidget.jsx`

```jsx
import React from 'react';

const DirectFerriesWidget = ({ locationName }) => {
  const iframeUrl = `https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0`;

  return (
    <div className="mt-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
        <span className="text-xs text-gray-500 font-medium">Direct Ferries 실시간 검색</span>
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-blue-200 to-transparent"></div>
      </div>
      
      <div className="w-full overflow-hidden rounded-xl border border-blue-100 bg-white shadow-sm">
        <iframe
          id="directFerriesWidget"
          title={`${locationName || '현지'} 페리 검색`}
          src={iframeUrl}
          width="100%"
          height="285"
          frameBorder="0"
          scrolling="no"
          className="w-full"
          style={{ minHeight: '285px' }}
        />
      </div>
      
      <p className="text-[10px] text-gray-400 mt-2 text-center">
        Direct Ferries 제휴 링크 · 예약 시 사이트 운영에 도움이 됩니다
      </p>
    </div>
  );
};

export default DirectFerriesWidget;
```

### 단계 2: ToolkitCard에 위젯 통합

**파일**: [`src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx:1)

**수정 위치**: 88-94라인 (flight/accommodation 위젯 아래)

```jsx
{/* Travelpayouts 화이트 라벨 위젯 (항공권 검색 전용) */}
{type === 'flight' && (
    <WhiteLabelWidget locationName={location?.name} type="flight" />
)}
{/* 숙소 전용 검색 위젯 */}
{type === 'accommodation' && (
    <HotelWidget location={location} />
)}
{/* 🆕 Direct Ferries 페리 검색 위젯 */}
{type === 'ferry_booking' && (
    <DirectFerriesWidget locationName={location?.name} />
)}
```

### 단계 3: 클룩 링크와 공존 전략

**현재 상황**:
- [`utils.js:184`](../src/components/PlaceCard/tabs/planner/utils.js:184)에서 클룩 페리 검색 버튼 생성 중

**옵션 1: 클룩 링크 유지** (추천)
```
[AI 텍스트]
[클룩 페리 검색] ← 기존 버튼 유지
[Direct Ferries 위젯] ← 새로 추가
```
- 장점: 사용자 선택권 제공
- 단점: 카드 길이 증가

**옵션 2: Direct Ferries 전용**
```
[AI 텍스트]
[Direct Ferries 위젯만 노출]
```
- 장점: 깔끔한 UI
- 단점: 클룩 수익 손실

**결정**: 옵션 1 (클룩 유지 + Direct Ferries 추가)

---

## 🔄 Phase 2: 동적 노선 매핑 시스템

### 2.1 데이터 구조 설계

**목표**: 여행지마다 최적의 페리 노선을 자동으로 보여주기

**파일**: [`src/components/PlaceCard/tabs/planner/constants.js`](../src/components/PlaceCard/tabs/planner/constants.js:1)

```javascript
// 🆕 Direct Ferries 여행지별 노선 매핑
export const DIRECT_FERRIES_ROUTES = {
  // 크로아티아
  'dubrovnik': { from: 'Dubrovnik', to: 'Split', region: 'croatia' },
  'split': { from: 'Split', to: 'Dubrovnik', region: 'croatia' },
  'hvar': { from: 'Split', to: 'Hvar', region: 'croatia' },
  
  // 그리스 섬 투어
  'santorini': { from: 'Athens', to: 'Santorini', region: 'greece' },
  'mykonos': { from: 'Athens', to: 'Mykonos', region: 'greece' },
  'crete': { from: 'Athens', to: 'Heraklion', region: 'greece' },
  
  // 이탈리아-크로아티아
  'venice': { from: 'Venice', to: 'Pula', region: 'adriatic' },
  'bari': { from: 'Bari', to: 'Dubrovnik', region: 'adriatic' },
  
  // 스페인-모로코
  'tangier': { from: 'Algeciras', to: 'Tangier', region: 'strait_gibraltar' },
  
  // 일본 (향후 확장)
  // 'miyajima': { from: 'Hiroshima', to: 'Miyajima', region: 'japan' },
  // 'okinawa': { from: 'Kagoshima', to: 'Okinawa', region: 'japan' },
};
```

### 2.2 동적 URL 생성 로직

**현재 문제점**: 
- Direct Ferries iframe URL에 출발지/도착지 파라미터가 없음
- 사용자가 위젯 내에서 직접 검색해야 함

**확인 필요**:
1. Direct Ferries API에 노선 사전 선택 파라미터가 있는지 확인
2. 예: `&from=Dubrovnik&to=Split` 같은 파라미터 지원 여부

**대안 (파라미터 없는 경우)**:
- 위젯 위에 추천 노선 텍스트 표시
```jsx
<p className="text-sm text-blue-700 mb-2">
  💡 추천 노선: 두브로브니크 → 스플리트 (2시간)
</p>
```

---

## 🧪 Phase 1 테스트 체크리스트

### 구현 전 확인사항
- [x] 두브로브니크가 [`travelSpots.js`](../src/pages/Home/data/travelSpots.js:5633)에 등록됨 (id: 326)
- [x] 플래너 탭에서 `ferry_booking` 카드 렌더링 확인
- [ ] Direct Ferries 위젯 iframe이 정상 로드되는지 확인
- [ ] 모바일/데스크톱 반응형 테스트

### 시각 확인 항목
1. **위젯 크기**
   - [ ] 데스크톱: 카드 너비에 맞게 285px 높이 유지
   - [ ] 모바일: 너비 100%, 높이 285px 유지
   
2. **색상 조화**
   - [ ] 버튼 색상(`btn=47a347`)이 사이트 디자인과 어울리는지
   - [ ] 필요시 파라미터 조정 (`btn`, `pclr` 등)

3. **사용성**
   - [ ] iframe 내부 검색 기능 작동
   - [ ] 클릭 시 새 창 열림 확인 (`targ=0`)
   - [ ] 모바일에서 스크롤 없이 접근 가능

### 데이터 확인
- [ ] AI가 두브로브니크 페리 정보를 정상 생성하는지
- [ ] `guideData.categories.ferry_booking` 데이터 존재 확인

---

## 📊 Phase 3: 확장 계획

### 우선순위 1: 유럽 페리 노선
- 크로아티아: 두브로브니크, 스플리트, 흐바르, 코르출라
- 그리스: 아테네-산토리니, 아테네-미코노스, 크레타
- 이탈리아: 베네치아-크로아티아, 나폴리-카프리, 바리-그리스

### 우선순위 2: 아시아 페리 노선
- 일본: 히로시마-미야지마, 가고시마-오키나와
- 태국: 푸켓-피피섬, 크라비-끄라단
- 필리핀: 마닐라-보라카이, 세부-보홀

### 우선순위 3: 기타 지역
- 스페인-모로코: 알헤시라스-탕헤르
- 영국-프랑스: 도버-칼레
- 북유럽: 스톡홀름-핀란드

---

## 🔧 기술적 고려사항

### iframe vs 외부 링크 버튼
**현재 선택**: iframe 직접 삽입 (시험 단계)

**장점**:
- 사용자가 PlaceCard를 떠나지 않고 검색 가능
- 실시간 가격/일정 확인
- 전환율(Conversion) 향상 가능성

**단점**:
- 카드 길이 증가 (285px)
- 모바일에서 스크롤 필요
- iframe 로딩 시간

**향후 개선안**:
- 접기/펼치기 토글 버튼
- "페리 검색 위젯 보기" 버튼 → 클릭 시 iframe 로드 (지연 로딩)

### 성능 최적화
```jsx
// 지연 로딩 예시
const [showWidget, setShowWidget] = useState(false);

return (
  <>
    {!showWidget && (
      <button onClick={() => setShowWidget(true)}>
        페리 실시간 검색 위젯 열기
      </button>
    )}
    {showWidget && <iframe src={...} />}
  </>
);
```

---

## 📝 구현 파일 목록

### 신규 파일
1. `src/components/PlaceCard/tabs/planner/components/DirectFerriesWidget.jsx` (위젯 컴포넌트)

### 수정 파일
1. [`src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx:1)
   - DirectFerriesWidget import
   - `type === 'ferry_booking'` 조건부 렌더링 추가

2. [`src/components/PlaceCard/tabs/planner/constants.js`](../src/components/PlaceCard/tabs/planner/constants.js:1) (Phase 2)
   - `DIRECT_FERRIES_ROUTES` 매핑 데이터 추가

3. [`src/components/PlaceCard/tabs/planner/utils.js`](../src/components/PlaceCard/tabs/planner/utils.js:184) (선택 사항)
   - `ferry_booking` 케이스 수정 (클룩 링크 유지 또는 제거)

---

## 🎨 UI/UX 설계

### 카드 레이아웃 (최종)
```
┌─────────────────────────────────────┐
│ 🚢 페리 (쾌속선) 예약    [Sponsored]│
├─────────────────────────────────────┤
│ [AI 생성 텍스트]                     │
│ 두브로브니크에서 스플리트까지...     │
│                                      │
├─────────────────────────────────────┤
│ [클룩 페리 예약]                     │ ← 기존 버튼
├─────────────────────────────────────┤
│ ━━ Direct Ferries 실시간 검색 ━━    │
│ ┌───────────────────────────────┐   │
│ │ [Direct Ferries iframe 위젯]  │   │
│ │ (285px 높이)                  │   │
│ └───────────────────────────────┘   │
│ Direct Ferries 제휴 링크             │
└─────────────────────────────────────┘
```

### 모바일 최적화
- 위젯 너비: 100%
- 높이: 285px 고정
- 스크롤 가능하도록 카드 내부에 배치

---

## ✅ 다음 단계

### 즉시 실행 (Phase 1)
1. `DirectFerriesWidget.jsx` 컴포넌트 생성
2. `ToolkitCard.jsx`에 통합
3. 두브로브니크 PlaceCard에서 시각 확인
4. iframe 로딩 및 기능 테스트

### Phase 2 준비
1. Direct Ferries 파트너 센터에서 URL 파라미터 문서 확인
2. 노선별 사전 선택 가능 여부 조사
3. 여행지-노선 매핑 데이터 확장

---

**작성자**: Roo (Architect Mode)  
**검토 필요**: Direct Ferries URL 파라미터 문서, 노선 사전 선택 기능 확인
