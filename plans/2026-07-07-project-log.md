# 2026-07-07 프로젝트 일지

**직전**: [`2026-07-01-project-log.md`](./2026-07-01-project-log.md)

---

## 홈 3D 투어 — 연관 키워드·권역 리스트 지구본 이동

**상태**: **✅ 로컬·모바일 QA 통과 (2026-07-07)**

### 증상

1. **데스크톱 3D 모드** — 연관 키워드 클릭 시 장소 카드는 열리나 지구본 위치 미이동
2. **모바일 첫 3D 투어 후** — 투어가 `TOUR_PLAYING`에 머물며 Skip 버튼 유지 → 권역 리스트(`GlobeClusterLegend`) 클릭 무반응. 수동 Skip 후 `TOUR_READY` 진입 시 정상

### 원인

| 구분 | 내용 |
|------|------|
| 투어 완료 미전환 | `playKeyframes`가 `moveend` 무한 대기(모바일·첫 투어) → `TOUR_PLAYING` 고착 |
| 연관 키워드 | `TOUR_READY`에서 `flyToAndPin`이 focus를 의도적으로 생략 · pivot은 `index` effect에만 의존 |
| 권역 리스트 | `showClusterOverlay`가 `TOUR_PLAYING` 중 숨김 + 카메라 이동 불가 |

### 수정

- [`globeTourEngine.js`](../src/pages/Home/lib/globeTourEngine.js) — `waitForMoveEnd` 프레임별 타임아웃(`duration+800ms`, 최소 1.2s)
- [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) — `flyToAndPin`: `TOUR_READY`→`pivotTourExplore` · `TOUR_PLAYING/BOOTSTRAPPING`→skip 후 pending pivot
- [`useHomeHandlers.js`](../src/pages/Home/hooks/useHomeHandlers.js) · [`index.jsx`](../src/pages/Home/index.jsx) — `moveToLocation`에 `{ location }` 전달 · `tourReadyAnchor` 보강 · `TOUR_READY` 시 `tourLaunchPending` 해제

### QA 체크리스트

- [x] 데스크톱: 3D 투어 완료(`TOUR_READY`) 후 연관 키워드 → 지구본 pivot
- [x] 모바일: 첫 3D 투어 자연 종료 → Skip 사라짐 · 권역 리스트 노출·클릭 이동
- [x] 투어 재생 중 연관 키워드 → skip+새 지명 pivot
- [x] 회귀: 2D 복귀 · 카테고리 면 · 항공 시네마 · MOONi FAB
- [x] 후속: 출발지 검색 접힘 · 투어 중 카테고리 `endTour`+면 이동 · 모바일 Skip 고착 해소

### QA 후속 (로컬 시험 피드백)

- **출발지 검색** — `TOUR_READY` pivot·권역 리스트 후에도 검색 패널 상시 노출 → `initialOriginExpanded={false}` · `location.slug` 변경 시 접힘 리셋
- **카테고리 클릭** — 투어 중 카테고리 선택 시 `endTour` 후 면 이동 (`handleCategorySelect`)
- **지구본 50% 이탈** — `flyToCategoryFace`가 3D 투어 pitch를 유지하던 문제 → `GLOBE_VIEW.default` pitch/bearing 고정

### QA 후속 2 (모바일 Skip 고착)

- **증상** — 투어 시각 종료 후에도 `TourMobileBar` Skip 유지 · 관문 리스트 pivot 후 `3D 투어` 버튼 미노출
- **원인** — Mapbox 엔진 `TOUR_READY` vs `index` `globeMode` `TOUR_PLAYING` 불일치 · 모바일 `moveend` 미발화로 `playKeyframes` 완료 지연
- **수정** — `globeTourEngine` duration cap·idle 폴백 · 엔진 콜백 ref · 모바일 400ms mode sync

---

## 모바일 — MOONi·탐색 입력 후 홈 지구본 UI 배치

**상태**: **⏳ 실기기 QA 대기** (리뷰·출발지·훅 SSOT 반영)

- **증상** — 텍스트 입력 후 지구본/홈 복귀 시 지구본·공유/위치/우주 버튼 상단 쏠림 · 출발지는 input 확대·Enter 무반응 · 리뷰 작성 동일
- **원인** — iOS `visualViewport`/자동 줌(16px 미만) · Mapbox `readViewportSize` 불일치 · overlay 닫을 때 sync 없음
- **수정** — [`mobileViewport.js`](../src/shared/lib/mobileViewport.js) `syncHomeViewportAfterInput` · [`useMobileInputViewport.js`](../src/shared/hooks/useMobileInputViewport.js) SSOT · ChatModal · index(MOONi·explore) · FlightOriginSelector · ReviewEditorModal
- **미적용 후보** (다음 세션 grep): ~~`PlaceChatView` · DailyReport · `TicketModal` · Auth~~ → **본 세션 일괄 적용** · 실기기 QA 대기

---

## 모바일 입력 — 후보 일괄 적용 (2026-07-07)

- **적용** — `PlaceChatView` · `TicketModal` · Auth · DailyReport(`Write`/`QuickMemo`/`UserProfile`/`RecentList`) · `SearchDiscoveryModal` form
- **패턴** — `MOBILE_INPUT_*_CLASS` · `useDeferredViewportSyncOnBlur` · `<form onSubmit>`+`enterKeyHint` · `useMobileOverlayViewport`
- **QA** — 로그북 블로그 리스트 검색 Enter ✅ (사용자 확인)
- **Enter 수정** — `PlaceChatView`·`SearchDiscoveryModal`·`RecentList` form · `FlightOriginSelector` `inputMode="text"`+Enter fallback
- **잔여** — 출발지 `FlightOriginSelector` listbox **표시 ✅** · **잔여: 장소카드·listbox 상단 쏠림·목록 잘림·홈 검은 배경 시인성** → 다음 세션

---

## 출발지 드롭다운 세션 — 에이전트 핸드오프

### 상태 (2026-07-07)

- **1차 QA ✅** — 모바일에서 listbox **표시 시작** (이전: 미표시)
- **2차 QA ⏳** — 장소카드·드롭다운 **상단 쏠림** → 목록 전체 미노출 · listbox가 **홈 검은 바탕에 묻혀 시인성 저하**

### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 3절 모바일 입력·뷰포트 SSOT
2. **본 일지** — 「출발지 드롭다운 세션 — 에이전트 핸드오프」
3. grep — `FlightOriginSelector` · `useInlineListbox` · `listboxPortal` · `listPortalClass` · `PlaceCardSummary` · `updateDropdownPosition` · `readVisualViewportLayout`

### 금지 (3)

1. `GLOBE_VIEW.flyZoom`·`HIGH_ZOOM_FULL_REVEAL` 임의 변경
2. PowerShell `-replace`/`Set-Content`로 한글 JSX 수정
3. 사용자 QA·릴리스 노트 합의 전 「완료」·`releaseNotes.js` 임의 반영

### 완료 (본 세션·커밋)

- [`mobileViewport.js`](../src/shared/lib/mobileViewport.js) — `readVisualViewportLayout` · `anchorRectInVisualViewport`
- [`FlightOriginSelector.jsx`](../src/pages/Home/components/FlightOriginSelector.jsx) — visual/layout dual-path · `useLayoutEffect`+rAF · `LISTBOX_Z_INDEX` 225 · 모바일 `bar` → form 내 `absolute bottom-full` 인라인 listbox · `summary-panel`은 portal 유지

### 다음 세션 작업

| 우선 | 내용 |
|------|------|
| 1 | **장소카드 상단 쏠림** — 키보드·`visualViewport` 시 `PlaceCardSummary`/`summary-panel` anchor·카드 `bottom` 배치 점검 |
| 2 | **listbox 잘림** — `flipUp`·`maxHeight`·portal `top` 클램프 · 인라인 `bottom-full` vs portal variant 분기 |
| 3 | **시인성** — `listPortalClass` 배경·테두리·그림자 강화 (홈 지구본 검은 배경 대비) · z-index·backdrop |
| 4 | variant QA — `isBar`(인라인) · `summary-panel`(portal) · FlightCinemaBar vs PlaceCardSummary |

### 제시어 (다음 세션)

```
출발지-이어하기 @plans/2026-07-07-project-log.md

모바일 출발지 listbox — 표시됨. 잔여: 장소카드·드롭다운 상단 쏠림(목록 잘림)·홈 검은 배경 시인성.
읽기: .ai-context 3절 + 본 일지 「출발지 드롭다운 세션 — 에이전트 핸드오프」.
grep: FlightOriginSelector · useInlineListbox · listPortalClass · PlaceCardSummary · updateDropdownPosition.
1차 완료: visualViewport SSOT · bar 인라인 listbox · portal z-index 225. 2차: 위치·maxHeight·listbox 스타일만.
금지: flyZoom 변경 · PowerShell JSX · releaseNotes 합의 전.
```

---

## 모바일 입력 뷰포트 세션 — 에이전트 핸드오프 (완료)

### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 1절 유지 규약 · 3절 금지 · 5절 3D 투어
2. **본 일지** — 「3D 투어 세션 — 에이전트 핸드오프」+ QA 체크리스트
3. grep만 — `HomeGlobeMapbox`(flyToAndPin, pivotTourExplore, pendingTourPivot) · `globeTourEngine`(waitForMoveEnd) · `index`(tourReadyAnchor, tourLaunchPending)

### 금지 (3)

1. `GLOBE_VIEW.flyZoom`·`HIGH_ZOOM_FULL_REVEAL` 임의 변경
2. `travelSpots.js` / JSON spots 직접 수정
3. 사용자 QA·릴리스 노트 합의 전 「완료」 단정 · `releaseNotes.js` 임의 반영

### 다음 세션 — 후속 후보

| 항목 | 메모 |
|------|------|
| **잔여 리스크** | pivot 이중 호출(`flyToAndPin`+`index` effect) · 타임아웃 값 튜닝 |
| **후속 후보** | `TourMobileBar`·Skip/2D UX · 투어 중 장소카드·연관 칩 일관성 · `globeLandmarks` 품질 · 릴리스 노트 합의 |

### 제시어 (다음 세션)

```
3D투어-이어하기 @plans/2026-07-07-project-log.md

홈 3D 투어 QA — 연관 키워드 pivot·모바일 첫 투어 TOUR_READY 전환·권역 리스트 클릭.
읽기: .ai-context 1·3·5절 + 본 일지 「3D 투어 세션 — 에이전트 핸드오프」+ QA 체크리스트.
grep: HomeGlobeMapbox(flyToAndPin,pivotTourExplore) · globeTourEngine(waitForMoveEnd) · index(tourReadyAnchor).
금지: flyZoom/HIGH_ZOOM 변경 · travelSpots JSON · releaseNotes 합의 전.
이전 수정: moveend 타임아웃 · TOUR_READY pivot · TOUR_PLAYING skip+pending pivot.
```
