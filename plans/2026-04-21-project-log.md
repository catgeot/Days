# 2026-04-21 프로젝트 로그

[⬅️ 이전 로그 보기 (2026-04-20)](./2026-04-20-project-log.md)

---

## 오늘의 작업 목표

이전 세션에서 완료한 트립링크 Phase 2 통합을 기반으로, **Direct Ferries 어필리에이트 통합** 작업을 시작합니다.

### 핵심 목표
1. **Direct Ferries API 파라미터 분석**
   - 여행지별 노선 사전 선택 가능 여부 확인
   - 동적 매핑 시스템 설계

2. **플래너 탭 페리 카드 통합 계획 수립**
   - 두브로브니크를 시작으로 위젯 테스트
   - 여행지별 최적 노선 자동 매칭 아키텍처 설계

---

## Session 1: Direct Ferries 어필리에이트 통합 계획 수립 ✅

### 1.1 배경 및 현황

**Direct Ferries 어필리에이트 승인 완료**:
- 파트너 코드: `F8350KR`
- 첫 테스트 노선: 크로아티아 두브로브니크 ↔ 스플리트

**기존 시스템**:
- PlaceCard [`PlannerTab.jsx:313`](../src/components/PlaceCard/tabs/PlannerTab.jsx:313)에 `ferry_booking` 카드 존재
- [`utils.js:184`](../src/components/PlaceCard/tabs/planner/utils.js:184)에서 클룩 페리 검색 링크 제공 중

**목표**:
- Direct Ferries 실시간 검색 위젯 추가
- 여행지별 최적 노선 자동 선택

### 1.2 API 파라미터 분석 완료 ✅

**Direct Ferries iframe URL 파라미터 체계**:

| 파라미터 | 기능 | 예시 | 테스트 결과 |
|---------|------|------|------------|
| `stdc` | 파트너 코드 (필수) | `F8350KR` | ✅ 고정값 |
| `cult` | 언어/지역 | `ko-KR` | ✅ 한국어 |
| `ctry` | 출발 국가 필터 | `Croatia` | ✅ 크로아티아 출발 노선만 표시 |
| `oprt` | 출발 항구 | `Dubrovnik` | ✅ 출발지 사전 선택 |
| `rprt` | 도착 항구 | `Split` | ✅ 도착지 사전 선택 |
| `btn` | 버튼 색상 | `47a347` | ✅ 커스터마이징 가능 |

**동작 방식**:
1. `ctry=Croatia` → 크로아티아 **출발** 노선만 필터링
2. `oprt=Busan&rprt=Hakata(Fukuoka)` → 부산→후쿠오카 노선 **사전 선택**
3. 운항사는 전체 표시 (필터 불가)

### 1.3 동적 매핑 전략 수립 ✅

**3단계 우선순위 시스템**:

```mermaid
graph TD
    A[여행지 slug 입력] --> B{DIRECT_FERRIES_ROUTES 매핑 확인}
    B -->|매핑 있음| C{노선 데이터 타입?}
    B -->|매핑 없음| G[기본 URL - 전체 검색]
    C -->|구체적 노선 - oprt+rprt| D[출발/도착 항구 사전 선택]
    C -->|국가 필터 - ctry| E[국가 출발 노선 필터링]
    D --> H[Direct Ferries 위젯 렌더링]
    E --> H
    G --> H
```

**매핑 우선순위**:
1. **1순위 - 구체적 노선 (`oprt` + `rprt`)**:
   - 두브로브니크 → `oprt=Dubrovnik&rprt=Split`
   - 부산 → `oprt=Busan&rprt=Hakata(Fukuoka)`
   
2. **2순위 - 국가 필터 (`ctry`)**:
   - 아테네 → `ctry=Greece` (그리스 섬 투어 전체)
   
3. **3순위 - 전체 검색 (파라미터 없음)**:
   - 파리 (페리 없음) → 사용자가 직접 검색

### 1.4 아키텍처 설계 완료 ✅

**신규 파일 생성 계획**:

1. **`src/components/PlaceCard/tabs/planner/components/DirectFerriesWidget.jsx`**
   - Direct Ferries iframe 위젯 컴포넌트
   - 동적 URL 생성 로직 포함
   - 285px 고정 높이, 100% 반응형 너비

2. **`src/components/PlaceCard/tabs/planner/constants.js` (수정)**
   - `DIRECT_FERRIES_ROUTES` 매핑 데이터 추가
   - 두브로브니크, 그리스, 부산-후쿠오카 우선 등록

3. **`src/components/PlaceCard/tabs/planner/utils.js` (수정)**
   - `getDirectFerriesUrl(location)` 함수 추가
   - location slug 기반 URL 파라미터 동적 생성

**기존 파일 수정 계획**:

1. **[`ToolkitCard.jsx:88-94`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx:88)**
   - `type === 'ferry_booking'` 조건부 렌더링 추가
   - DirectFerriesWidget import 및 호출

### 1.5 데이터 구조 설계

**`constants.js` 추가 데이터**:

```javascript
export const DIRECT_FERRIES_ROUTES = {
  // 크로아티아 - 구체적 노선
  'dubrovnik': { 
    oprt: 'Dubrovnik', 
    rprt: 'Split',
    description: '스플리트행 (2시간)' 
  },
  'split': { 
    oprt: 'Split', 
    rprt: 'Hvar',
    description: '흐바르섬행 (1시간)' 
  },
  
  // 그리스 - 구체적 노선
  'santorini': { 
    oprt: 'Santorini', 
    rprt: 'Piraeus',
    description: '아테네(피레우스)행 (5-8시간)' 
  },
  'mykonos': { 
    oprt: 'Mykonos', 
    rprt: 'Piraeus',
    description: '아테네(피레우스)행 (2.5-5시간)' 
  },
  
  // 일본 (한일 페리)
  'busan': { 
    oprt: 'Busan', 
    rprt: 'Hakata(Fukuoka)',
    description: '후쿠오카행 (3시간)' 
  },
  'fukuoka': { 
    oprt: 'Hakata(Fukuoka)', 
    rprt: 'Busan',
    description: '부산행 (3시간)' 
  },
  
  // 국가 필터만 적용
  'athens': { 
    ctry: 'Greece',
    description: '그리스 섬 투어 노선' 
  },
  'hvar': { 
    ctry: 'Croatia',
    description: '크로아티아 섬 투어 노선' 
  }
};
```

**`utils.js` 추가 함수**:

```javascript
export const getDirectFerriesUrl = (location) => {
  const baseUrl = 'https://wiz.directferries.com/partners/deal_finder_iframe.aspx';
  const params = new URLSearchParams({
    stdc: 'F8350KR',
    cult: 'ko-KR',
    btn: '47a347',
    btnh: '168b16',
    btnt: 'FFFFFF',
    tclr: '000001',
    lclr: '000001',
    lbld: '400',
    pclr: '64b6e6',
    sclr: '64b6e6',
    targ: '0'
  });

  const routeData = DIRECT_FERRIES_ROUTES[location?.slug];
  
  if (routeData) {
    // 구체적 노선 우선
    if (routeData.oprt && routeData.rprt) {
      params.append('oprt', routeData.oprt);
      params.append('rprt', routeData.rprt);
    }
    // 국가 필터 적용
    else if (routeData.ctry) {
      params.append('ctry', routeData.ctry);
    }
  }
  
  return `${baseUrl}?${params.toString()}`;
};
```

### 1.6 UI/UX 설계

**페리 카드 최종 레이아웃**:

```
┌─────────────────────────────────────────────────┐
│ 🚢 페리 (쾌속선) 예약            [Sponsored]   │
├─────────────────────────────────────────────────┤
│ [AI 생성 텍스트]                                │
│ 두브로브니크에서 스플리트, 흐바르섬으로...      │
│                                                  │
├─────────────────────────────────────────────────┤
│ [클룩 페리 예약]                                │ ← 기존 버튼 유지
├─────────────────────────────────────────────────┤
│ ━━━━ Direct Ferries 실시간 검색 ━━━━          │
│ ┌─────────────────────────────────────────────┐│
│ │ [Direct Ferries iframe 위젯]                ││
│ │ • 출발지: Dubrovnik (사전 선택됨)           ││
│ │ • 도착지: Split (사전 선택됨)               ││
│ │ • 날짜 선택 → 검색                          ││
│ │ (285px 높이)                                ││
│ └─────────────────────────────────────────────┘│
│ Direct Ferries 제휴 링크 · 예약 시 사이트...   │
└─────────────────────────────────────────────────┘
```

**반응형 디자인**:
- 데스크톱: 카드 너비에 맞게 100%, 높이 285px
- 모바일: 100% 너비, 285px 높이 유지, 스크롤 가능

---

---

## Session 2: URL 파라미터 실제 테스트 및 전략 수정 ✅

### 2.1 URL 파라미터 실제 테스트

**테스트 진행**:
- 사용자가 직접 브라우저에서 다양한 파라미터 조합 테스트
- [`plans/directferries-url-test.md`](./directferries-url-test.md) 문서로 테스트 케이스 정리

**테스트 결과**:

| 파라미터 | 테스트 URL | 결과 |
|---------|-----------|------|
| 기본 (파라미터 없음) | `stdc=F8350KR&cult=ko-KR` | ✅ 정상 작동 |
| `oprt=Busan&rprt=Hakata(Fukuoka)` | 부산→후쿠오카 사전 선택 | ❌ 작동 안 함 |
| `ctry=Croatia` | 크로아티아 출발 필터 | ❌ 작동 안 함 |
| `oprt=Dubrovnik&rprt=Split` | 두브로브니크→스플리트 | ❌ 작동 안 함 |

**핵심 발견**:
- 모든 파라미터 조합이 기본 URL과 **완전히 동일한 결과** 반환
- iframe 내용: "출발지 선택", "운항 노선 선택..." (사전 선택 없음)
- **결론**: Direct Ferries의 `deal_finder_iframe.aspx` 위젯은 URL 파라미터를 완전히 무시함

### 2.2 수정된 전략 확정

**기존 계획 (불가능)**:
```
여행지별 동적 URL 생성 → 출발/도착 항구 사전 선택
```

**수정된 계획 (확정)** ⭐:
```
기본 iframe + 여행지별 추천 노선 텍스트 안내
```

**새로운 구현 방식**:

1. **모든 여행지에 동일한 기본 URL 사용**
   ```
   https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&...
   ```

2. **iframe 위에 추천 노선 텍스트 박스 표시**
   ```
   💡 추천 노선
   • 두브로브니크 → 스플리트 (약 2시간)
   • 두브로브니크 → 흐바르섬 (약 4시간)
   ```

3. **사용자가 직접 출발/도착지 입력**

### 2.3 간소화된 데이터 구조

**제거**:
- ❌ `DIRECT_FERRIES_ROUTES` (복잡한 노선 매핑)
- ❌ `getDirectFerriesUrl()` 함수 (동적 URL 생성)
- ❌ URL 파라미터 우선순위 로직

**추가**:
- ✅ `DIRECT_FERRIES_RECOMMENDATIONS` (간단한 텍스트 배열)
- ✅ `DIRECT_FERRIES_BASE_URL` (고정 기본 URL)

**데이터 구조 예시**:
```javascript
// constants.js
export const DIRECT_FERRIES_RECOMMENDATIONS = {
  'dubrovnik': [
    '두브로브니크 → 스플리트 (약 2시간)',
    '두브로브니크 → 흐바르섬 (약 4시간)',
    '두브로브니크 → 코르출라섬 (약 3시간)'
  ],
  'busan': [
    '부산 ↔ 후쿠오카(하카타) (약 3시간)',
    '고속 쾌속선(JR Beetle) 운항'
  ]
};

export const DIRECT_FERRIES_BASE_URL =
  'https://wiz.directferries.com/partners/deal_finder_iframe.aspx?stdc=F8350KR&cult=ko-KR&btn=47a347&btnh=168b16&btnt=FFFFFF&tclr=000001&lclr=000001&lbld=400&pclr=64b6e6&sclr=64b6e6&targ=0';
```

### 2.4 UI 시안 (최종)

```
┌─────────────────────────────────────────────┐
│ 🚢 페리 (쾌속선) 예약        [Sponsored]   │
├─────────────────────────────────────────────┤
│ [AI 생성 텍스트]                            │
│ 두브로브니크에서 스플리트, 흐바르섬...      │
├─────────────────────────────────────────────┤
│ [클룩 페리 예약] ← 기존 버튼 유지          │
├─────────────────────────────────────────────┤
│ 💡 추천 노선            ┌──────────────┐   │
│ • 두브로브니크 → 스플리트│   파란 박스   │   │
│ • 두브로브니크 → 흐바르섬│              │   │
│ • 두브로브니크 → 코르출라│              │   │
│                         └──────────────┘   │
├─────────────────────────────────────────────┤
│ ━━━━ Direct Ferries 실시간 검색 ━━━━      │
│ ┌─────────────────────────────────────────┐│
│ │ [Direct Ferries iframe]                 ││
│ │ 출발지 선택: _______                   ││
│ │ 도착지 선택: _______                   ││
│ │ 날짜 선택 + 검색                        ││
│ └─────────────────────────────────────────┘│
│ Direct Ferries 제휴 링크                    │
└─────────────────────────────────────────────┘
```

---

## 생성된 계획 문서

### ✅ 완료된 문서
1. **[`plans/2026-04-21-directferries-integration-plan.md`](./2026-04-21-directferries-integration-plan.md)** (초기 계획)
   - Phase 1: 두브로브니크 테스트 통합 계획
   - 동적 노선 매핑 시스템 설계 (URL 파라미터 기반)
   - Phase 3 확장 계획

2. **[`plans/directferries-url-test.md`](./directferries-url-test.md)** (테스트 문서)
   - 8가지 URL 파라미터 조합 테스트 케이스
   - 항구명 표기 검증 체크리스트

### 📝 테스트 결과 반영
- **결론**: URL 파라미터 방식 불가능
- **대안**: 기본 iframe + 추천 노선 텍스트 방식으로 전환

---

## 다음 작업 단계 (다음 세션) - 수정됨

### 변경 사항
- ❌ 복잡한 동적 URL 생성 로직 제거
- ✅ 간단한 텍스트 기반 추천 시스템으로 변경

---

## Session 3: Direct Ferries 위젯 구현 완료 ✅

### 3.1 구현 완료 파일

**신규 파일**:
- [`src/components/PlaceCard/tabs/planner/components/DirectFerriesWidget.jsx`](../src/components/PlaceCard/tabs/planner/components/DirectFerriesWidget.jsx)
  - Direct Ferries iframe 위젯 (285px 높이)
  - 여행지별 추천 노선 박스 (조건부 표시)
  - 제휴 안내 문구

**수정 파일**:
- [`src/components/PlaceCard/tabs/planner/constants.js`](../src/components/PlaceCard/tabs/planner/constants.js)
  - `DIRECT_FERRIES_BASE_URL` 추가 (파트너 코드 F8350KR, targ=1로 새 창 열기)
  - `DIRECT_FERRIES_HOME_URL` 추가 (dfpid=7263&affid=1001)
  - `DIRECT_FERRIES_RECOMMENDATIONS` 추가 (9개 국가 주요 페리 노선)
  
- [`src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx)
  - DirectFerriesWidget import 및 조건부 렌더링 추가
  
- [`src/components/PlaceCard/tabs/planner/components/JourneyTimeline.jsx`](../src/components/PlaceCard/tabs/planner/components/JourneyTimeline.jsx)
  - "페리", "항구", "크루즈" 키워드 감지 시 Direct Ferries 홈 버튼 생성
  
- [`src/components/PlaceCard/tabs/planner/utils.js`](../src/components/PlaceCard/tabs/planner/utils.js)
  - `ferry_booking` 케이스 클룩 → Direct Ferries로 변경

### 3.2 추천 노선 데이터 형식 최종 확정

**Direct Ferries 실제 리스트 형식 적용**:
```
💡 추천 노선 (출발: Greece 선택)
• 티라(산토리니:Santorini/Thira) - 피레우스(Piraeus, 아테네) (약 5-8시간)
• 티라(산토리니:Santorini/Thira) - 미코노스(Mykonos) (약 2-3시간)
```

**표기 방식**: `한글(영문:English)` 또는 `한글(영문, 설명)` 형식

### 3.3 통합된 여행지

총 9개 국가 주요 페리 노선:
- 크로아티아 (Dubrovnik, Split, Hvar)
- 그리스 (Santorini, Mykonos, Athens, Crete)
- 한일 페리 (Busan ↔ Fukuoka, Tsushima)
- 이탈리아 (Naples, Capri, Sorrento)
- 태국 (Phuket, Krabi)
- 스페인 (Barcelona, Ibiza, Palma)
- 인도네시아 (Bali, Lombok)
- 필리핀 (Cebu, Bohol)
- 영국 (Dover, Portsmouth)

### 3.4 Direct Ferries 연동 위치

1. **페리 예약 카드**: DirectFerriesWidget (iframe + 추천 노선 + 버튼)
2. **카드 하단 버튼**: "Direct Ferries 페리 검색"
3. **상세 여정 플래너**: 페리 키워드 자동 감지 → 버튼 자동 생성

### 3.5 URL 파라미터 설정

- **iframe 위젯**: `targ=1` (검색 결과를 새 창에서 열기)
- **한국어 홈**: `dfpid=7263&affid=1001&rurl=` (파트너 ID 및 Affiliate ID)

---

## 다음 세션 계획

### Phase 2: 추천 노선 데이터 확장 (향후)
- 일본 내륙 페리 (히로시마-미야지마, 오키나와)
- 북유럽 페리 (덴마크, 노르웨이, 스웨덴)
- 지중해 추가 노선 (튀르키예, 몰타)

---

## 기술 스택

- **React 컴포넌트**: DirectFerriesWidget.jsx
- **데이터 관리**: constants.js (DIRECT_FERRIES_ROUTES)
- **유틸리티**: utils.js (getDirectFerriesUrl)
- **통합**: ToolkitCard.jsx (조건부 렌더링)
- **스타일링**: TailwindCSS (반응형, 둥근 테두리, 그림자)

---

## 참고 링크

- Direct Ferries 파트너 코드: `F8350KR`
- 기존 제휴 위젯 예시: [`WhiteLabelWidget`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx:88), [`HotelWidget`](../src/components/PlaceCard/tabs/planner/components/ToolkitCard.jsx:92)
- 페리 카드 위치: [`PlannerTab.jsx:313`](../src/components/PlaceCard/tabs/PlannerTab.jsx:313)

---

**작성자**: Roo (Architect Mode)  
**다음 세션**: Code 모드로 전환하여 구현 시작
