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

## 이번 세션 특이사항

**사용자 요청사항**:
- 이전 세션의 모달 형식을 전체 화면으로 변경하는 것 검토 → 현재는 대화면 모달(최대 90vh)로 충분하다고 판단. 필요 시 추후 조정 가능
- 여행지 키워드 동적 매핑을 우선 작업: 사용자가 트립링크에서 각 지역별 iframe 링크를 수집 예정
- 상세 계획은 로그 파일과 컨텍스트 파일에 기록

**다음 단계**:
- 사용자가 트립링크 데이터를 수집하면 매핑 데이터 구조에 입력
- 코드 모드로 전환하여 실제 구현 진행

---

## 참고 링크

- [트립링크 통합 마스터 플랜](./triplink-integration-master-plan.md)
- [Phase 2 상세 계획](./triplink-phase2-placecard-integration.md)
- [Phase 1 완료 로그](./2026-04-19-project-log.md#2026-04-20-작업-내역-session-1)
