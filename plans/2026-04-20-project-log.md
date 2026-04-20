# 2026-04-20 프로젝트 로그

[⬅️ 이전 로그 보기 (2026-04-19)](./2026-04-19-project-log.md)

## 오늘의 작업 목표

이전 세션에서 완료한 트립링크 동적 배너 모달 시스템을 기반으로, **Phase 2 작업**을 진행합니다.

### Phase 2 핵심 목표
1. **여행지별 키워드 동적 매핑 시스템 구축**
   - 각 장소 카드에 적합한 패키지를 자동으로 매칭하는 로직 개발
   - 트립링크에서 수집한 지역별 iframe 링크를 관리하는 데이터 구조 설계

2. **PlaceCard 통합 (맥락형 패키지 버튼 추가)**
   - 위키탭: 하단 "제미나이 최신 정보 요청" 버튼 옆에 패키지 버튼 추가
   - 플래너탭: 상단 "앱으로 여정 보내기" 버튼 제거 후 패키지 버튼 배치

---

## Session 1: 계획 수립 및 아키텍처 설계

### 1.1 현황 분석

**완료된 Phase 1 작업 (2026-04-19 ~ 2026-04-20)**:
- ✅ `TripLinkSectionCard.jsx`: Unsplash 기반 네이티브 썸네일 카드
- ✅ `TripLinkModal.jsx`: 대화면 모달 팝업 (1024x768)
- ✅ `tripLinkPackages.js`: 테마별 패키지 데이터 (family, longhaul, resort)
- ✅ 홈 탐색창 에디터스 픽에 인피드 광고 형태로 패키지 노출 완료

**Phase 2 선행 조건**:
- 여행지별로 적합한 패키지를 매칭하는 로직 없이는 PlaceCard에서 작동하지 않는 버튼이 될 수 있음
- 트립링크에서 각 지역별 동적 배너 iframe 링크를 사용자가 수집 예정
- 키워드 동적 매핑을 먼저 구현한 후 UI 작업 진행

### 1.2 아키텍처 설계 완료

**신규 파일 생성 계획**:
1. `src/pages/Home/data/tripLinkDestinationMap.js`
   - `DESTINATION_PACKAGE_MAP`: 여행지명 → 패키지 ID 매핑 테이블
   - `PACKAGE_DETAILS`: 패키지 ID → 상세 정보 (adKey, 제목, 설명 등)

2. `src/utils/tripLinkMatcher.js`
   - `getPackagesForDestination()`: 장소 객체를 받아 적합한 패키지 배열 반환
   - 한글/영문 검색 지원
   - 매칭 실패 시 국가/대륙 기반 폴백 로직

3. `src/components/PlaceCard/modals/TripLinkModal.jsx`
   - 기존 SearchDiscoveryModal의 모달을 PlaceCard에서도 재사용할 수 있도록 복사

**기존 파일 수정 계획**:
1. `PlaceCardExpanded.jsx`: 모달 상태 관리 추가
2. `PlaceWikiDetailsView.jsx`: 하단 버튼 영역에 패키지 버튼 추가
3. `PlannerTab.jsx`: 앱 전송 버튼 제거 후 패키지 버튼 추가

### 1.3 매핑 전략 수립

**매핑 방식**:
```
여행지명(한글/영문) → 패키지 ID → 패키지 상세 정보
```

**예시**:
- "다낭" / "Da Nang" → `family-vietnam-danang` → adKey: "hbxakj", 제목: "베트남 다낭/나트랑"
- "파리" / "Paris" → `longhaul-europe-west` → adKey: "wx9egs", 제목: "서유럽 핵심 일주"

**폴백 전략**:
- 정확한 매핑이 없으면 국가/대륙 기반으로 일반 패키지 추천
- 유럽 → 서유럽 패키지
- 동남아 → 휴양 패키지
- 일본 → 일본 가족 패키지

### 1.4 UI/UX 설계

**위키탭 버튼 추가**:
- 현재: 하단 고정된 제미나이 버튼 (1개)
- 변경: 제미나이 버튼 + 패키지 버튼 (2개 나란히 배치)
- 모바일: 버튼 크기 조정 또는 세로로 쌓기
- PC: 가로로 나란히 배치

**플래너탭 버튼 교체**:
- 제거: "앱으로 전체 일정 보내기" 버튼 (PC 상단, 모바일 하단)
- 추가: "패키지로 간편하게 준비하기" 버튼 (동일 위치)
- 조건부 렌더링: 매칭된 패키지가 있을 때만 표시

**버튼 디자인**:
- 제미나이 버튼: 파란색 유지
- 패키지 버튼: 보라색/그라데이션 (`from-purple-600 to-blue-600`)
- 아이콘: `Package` 또는 `Briefcase`
- "AD" 뱃지 표시 (공정위 규정 준수)

### 1.5 상세 계획 문서 작성

**생성된 문서**:
- ✅ `plans/triplink-phase2-placecard-integration.md`
  - 여행지 키워드 동적 매핑 전략
  - PlaceCard 통합 구현 계획
  - 데이터 구조 및 유틸리티 함수 설계
  - 구현 단계별 체크리스트
  - 향후 확장 계획 (API 연동, 어드민 패널 등)

---

## 다음 작업 단계

### Phase 2-1: 여행지 키워드 동적 매핑 (현재 세션 진행 예정)
1. `tripLinkDestinationMap.js` 파일 생성
2. 기본 매핑 데이터 입력 (사용자가 수집한 트립링크 데이터 기반)
3. `tripLinkMatcher.js` 유틸리티 함수 개발
4. 매핑 로직 테스트

### Phase 2-2: PlaceCard 모달 통합 (다음 작업)
1. `TripLinkModal` 복사 및 PlaceCard에 통합
2. `PlaceCardExpanded`에 모달 상태 관리 추가
3. 위키탭과 플래너탭에 콜백 연결

### Phase 2-3: 위키탭 버튼 추가
1. 하단 버튼 영역 레이아웃 변경
2. 패키지 필터링 로직 적용
3. 반응형 스타일링

### Phase 2-4: 플래너탭 버튼 추가
1. 앱 전송 버튼 제거
2. 패키지 버튼으로 교체
3. 조건부 렌더링 구현

### Phase 2-5: 테스트 및 검증
1. 여러 여행지에서 패키지 매칭 확인
2. 모바일/PC 반응형 테스트
3. 사용자 피드백 수집

---

## Session 2: 모바일 버그 분석 및 Phase 2 실행 계획 수립

### 2.1 모바일 모달 버그 원인 파악 ✅

**증상**: 모바일에서 트립링크 모달 첫 진입 시 사진이 줄로 보임, 재진입하면 정상

**원인**:
- `TripLinkSectionCard.jsx`의 IntersectionObserver 500ms 딜레이
- `usePlaceGallery` 비동기 이미지 로딩과 타이밍 불일치
- 첫 로드: 딜레이 후 이미지가 아직 도착 안함 → 그라디언트만 표시
- 재진입: 캐시에서 즉시 로드 → 정상 표시

**해결**: IntersectionObserver 딜레이 제거 (500ms → 0ms)

### 2.2 Phase 2 구현 계획 수립 ✅

**핵심 작업**:
1. 모바일 버그 수정 (우선)
2. 여행지→패키지 매핑 데이터 구조 (`tripLinkDestinationMap.js`)
3. 매칭 유틸리티 함수 (`tripLinkMatcher.js`)
4. PlaceCard 모달 통합
5. 위키탭 버튼 추가 (제미나이 옆)
6. 플래너탭 버튼 추가 (앱 전송 버튼 제거)

**상세 문서**:
- [`triplink-phase2-mobile-bug-analysis.md`](./triplink-phase2-mobile-bug-analysis.md)
- [`triplink-phase2-implementation-plan.md`](./triplink-phase2-implementation-plan.md)

### 2.3 다음 작업

**즉시 진행**:
- 코드 모드로 전환하여 모바일 버그 수정
- 매핑 데이터 구조 파일 생성
- 단계별 구현 진행

---

## Session 3: 모바일 버그 수정 및 UX 개선 ✅

### 3.1 완료 작업

1. **모바일 트립링크 모달 이미지 로딩 버그 수정** ✅
   - [`TripLinkSectionCard.jsx`](../src/pages/Home/components/SearchDiscovery/TripLinkSectionCard.jsx:19) IntersectionObserver 500ms 딜레이 제거
   - 카드가 뷰포트 진입 시 즉시 이미지 로딩 시작
   - 모바일 테스트 완료 및 검증

2. **PC 큐레이션 카드 마우스 드래그 스크롤 기능 추가** ✅
   - [`CurationSection.jsx`](../src/pages/Home/components/SearchDiscovery/CurationSection.jsx:7) 마우스 드래그 핸들러 구현
   - 클릭 & 드래그로 카드 영역 좌우 이동 가능
   - 커서 변경 (`grab` / `grabbing`)

3. **모바일 모달 레이아웃 개선** ✅
   - [`TripLinkModal.jsx`](../src/pages/Home/components/SearchDiscovery/TripLinkModal.jsx:15) 모바일 전체 화면 적용
   - iframe 원본 크기(1024x768) 유지 및 스크롤 가능
   - PC는 기존 디자인 유지

### 3.2 다음 세션 작업

**Phase 2 구현**:
1. 여행지→패키지 매핑 데이터 구조 생성 (`tripLinkDestinationMap.js`)
2. 매칭 유틸리티 함수 개발 (`tripLinkMatcher.js`)
3. PlaceCard 위키탭/플래너탭 패키지 버튼 통합

---

## Session 4: 트립링크 Phase 2 매핑 시스템 구현 및 모달 안정화 ✅

### 4.1 완료 작업

1. **트립링크 모바일 최초 진입 버그 완벽 해결 (`TripLinkModal.jsx`)**
   - iframe의 `isIframeLoading` 렌더링 무한 루프 버그 수정
   - 상단 헤더 배너 가림 해결을 위해 `flex-shrink-0` 적용 및 래퍼 크기 `flex-auto` 조정
   - 모바일 최초 진입 시 `animate-scale-up` 애니메이션 중 iframe 반응형 로직 충돌로 인해 배너가 찌그러지는 현상을 파악하여 **`setTimeout`을 이용한 400ms 렌더링 지연 로직** 도입. 완전히 렌더링된 후 `src`가 주입되어 배너 크기가 정상 동작하도록 안정화 완료.

2. **Phase 2 여행지-패키지 맵핑 데이터 구축**
   - `src/pages/Home/data/tripLinkDestinationMap.js` 생성: 장소 키워드 배열에 따른 패키지 ID 맵핑 및 대륙/국가 폴백(Fallback) 구조 세팅 완료.
   - `src/utils/tripLinkMatcher.js` 생성: 장소 객체(`location`) 기반으로 최적의 패키지를 매칭하여 반환하는 유틸리티 함수 작성.

3. **PlaceCard 통합 (맥락형 패키지 버튼 연동)**
   - `TripLinkModal.jsx`를 PlaceCard 하위 공통 컴포넌트 폴더(`src/components/PlaceCard/modals/`)로 완전히 분리 이동.
   - `PlaceCardExpanded`에서 `matchedPackage`를 계산하고 전역 상태로 모달을 관리하도록 아키텍처 개편.
   - **위키 탭 하단(`PlaceWikiNavView`)**: 제미나이 AI 요청 버튼과 패키지 상품 보기 버튼을 5:5 배분하여 추가.
   - **플래너 탭 상단(`PlannerTab`)**: 매칭된 패키지가 있을 경우 "앱으로 여정 보내기" 버튼을 "패키지로 간편하게 준비하기" 버튼으로 다이내믹 교체 노출.

### 4.2 다음 세션 작업
- `tripLinkDestinationMap.js` 내 상세 지역 및 키워드 데이터 보강 (트립링크 실제 데이터 기반 매칭률 점검)
- 위키/플래너 외 추가적인 터치 포인트 분석 및 제휴 파트너 확장 검토
