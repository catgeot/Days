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
- **잔여** — ~~써머리 출발지 접기 UX~~ ✅ · MOONi·탐색 입력 후 홈 배치 **실기기 QA 대기**

---

## 출발지 드롭다운 — 완료 (2026-07-07)

**상태**: **✅ QA 통과** (모바일 compact·listbox · 써머리 접기 · 출발 칩 터치 영역)

| 영역 | 내용 |
|------|------|
| SSOT | `mobileViewport.js` · `useMobileInputViewport.js` |
| listbox | `FlightOriginSelector` flipUp · 모바일 인라인 `bottom-full` |
| Summary 접기 | `bar-header` 패리티 · `summary-panel` 「접기」 |
| 칩 크기 | `summary-header` `min-h-[32px]` · 사용자 확인 ✅ |

**릴리스 노트** — `releaseNotes.js` `2026-07-07` 반영 (합의)

---

## 플래너 모바일 핀치 줌 — 좌·우·상·하 패닝 (2026-07-07)

**상태**: **✅ 모바일 QA 통과 (2026-07-07)**

- **증상** — 핀치 확대 후 가로 이동 불가 · 한 손가락 패닝 막힘(세로 스크롤과 충돌)
- **원인** — `pinch-zoom-scroll` `touch-action: pan-y pinch-zoom` · PlaceCard `fixed` 레이아웃
- **수정** — [`usePinchZoomPan.js`](../src/components/PlaceCard/common/usePinchZoomPan.js) · 줌 시 `overflow:hidden` + `translate` 통합 패닝 · 2손가락 네이티브 유지 · 플래너·위키·갤러리·리뷰 공통
- **릴리스 노트** — 합의 후 `releaseNotes.js` 반영 (미반영)

---

## PlaceCard 가로·갤러리 UX (2026-07-07)

**상태**: **⏳ 부분 QA · 다음 세션 세부 조정** (커밋 후 핸드오프)

### 본 세션 반영

- **SSOT** — `mobilePlaceHeaderInset.js`(가로 pt·footer pb) · `placeLightboxZoomClass` · `mobileViewport.js` `snapVisualViewportPinchZoom`
- **(1~2) 가로 chrome** — `PlaceChatPanel`·`PlannerTab`·`PlaceWikiDetailsView` landscape 축소
- **(3) 갤러리 라이트박스** — 핀치 확대/축소 ✅ · `usePinchZoomPan` · `touch-none` 제거
- **(4) 연관 키워드** — 가로 접기·토글 · portrait 이중 렌더 회귀 수정 ✅
- **줌 스냅** — scale ~1.03 잔류 → `snapVisualViewportPinchZoom`(meta viewport) · 1.0 복귀 ✅

### QA·잔여 (사용자 확인 2026-07-07)

| # | 결과 | 메모 |
|---|------|------|
| 갤러리 핀치 in/out | ✅ | 축소·확대 동작 |
| 1.0 복귀 후 스크롤 | ❌ | **헤더와 본문 분리** — 스크롤 시 본문만 스크롤되지 않고 통째로 아래로 밀리며 고정 헤더와 분리 |
| 가로 읽기 UX | ⏳ | 축소만 적용 · **헤더·푸터 가림(immersive)** 방안은 미구현·검토 예정 |

### 다음 세션 과제

| 우선 | 내용 | grep·파일 |
|------|------|-----------|
| **P0** | 핀치 줌 1.0 복귀 **후 스크롤** 시 헤더·본문 분리 수정 | `usePinchZoomPan` · `snapVisualViewportPinchZoom` · `PlaceChatPanel` · `mobilePlaceHeaderInset` · `visualViewport` |
| **P1** | **visualViewport meta 스냅 대신** CSS transform 기반 핀치 in/out 단일 로직 검토(꼬임 없으면 전환) | `usePinchZoomPan` · `PlaceGalleryView` lightbox · `placeLightboxZoomClass` |
| **P2** | **가로 immersive** — 헤더·푸터(연관 키워드·2차 nav) 탭/스크롤로 가림·본문 집중 | `PlaceChatPanel` · `PlaceMobileSecondaryNav` · `landscape:` · `PlaceGalleryView` lightbox `isUIHidden` 패턴 |

**가로 immersive 후보** — 스크롤·탭 시 chrome 숨김 · 라이트박스 `isMobileUIHidden`과 동일 UX · 플래너/위키/갤러리 그리드 공통.

---

## PlaceCard 가로·갤러리 세션 — 에이전트 핸드오프

### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 3절 모바일 뷰포트·PlaceCard · 5~6절 스냅샷
2. **본 일지** — 「PlaceCard 가로·갤러리 UX」+ QA·잔여 표
3. grep — `snapVisualViewportPinchZoom` · `usePinchZoomPan` · `PlaceGalleryView`(lightbox, lightboxViewportRef) · `PlaceChatPanel`(mobilePlaceHeaderScrollPadding) · `mobilePlaceHeaderInset` · `visualViewport`

### 금지 (3)

1. `GLOBE_VIEW.flyZoom`·`HIGH_ZOOM_FULL_REVEAL` 임의 변경
2. PowerShell `-replace`/`Set-Content`로 한글 JSX 수정
3. 사용자 QA·릴리스 노트 합의 전 「완료」·`releaseNotes.js` 임의 반영

### 다음 세션 작업

| 우선 | 내용 |
|------|------|
| P0 | 1.0 복귀 후 스크롤 — 헤더·본문 분리(통째 이동) 수정 · `snapVisualViewportPinchZoom` 부작용·offsetTop 점검 |
| P1 | meta viewport 스냅 없이 transform 핀치 in/out 단일화 가능성 검토 |
| P2 | 가로 모드 헤더·푸터 immersive 가림(본문 집중) 설계·적용 |

### 제시어 (다음 세션)

```
PlaceCard-줌-이어하기 @plans/2026-07-07-project-log.md

갤러리 핀치 in/out ✅. P0: 1.0 복귀 후 스크롤 시 PlaceChatPanel 헤더와 본문 분리(통째 밀림) 수정.
P1: snapVisualViewportPinchZoom(meta) 대신 transform 핀치 단일 로직 검토. P2: 가로 immersive(헤더·푸터 가림).
읽기: .ai-context 3·5·6절 + 본 일지 「PlaceCard 가로·갤러리 UX」+ 핸드오프.
grep: snapVisualViewportPinchZoom · usePinchZoomPan · PlaceGalleryView · PlaceChatPanel · mobilePlaceHeaderInset.
금지: flyZoom · PowerShell JSX · releaseNotes 합의 전.
```

---

## PlaceCard 가로·갤러리 UX — 아카이브 (초기 핸드오프 2026-07-07)

**초기 과제 (1~4)** — landscape chrome·라이트박스 확대 · 대부분 반영 · 상세는 위 「본 세션 반영」

| 우선 | 탭 | 증상 | grep·파일 후보 |
|------|-----|------|----------------|
| 1 | **플래너** | 가로 모드 상단 헤더가 본문 가독 영역 과다 점유 | `PlannerTab` · `PlaceChatPanel` · `mobilePlaceHeaderInset` · `landscape:` |
| 2 | **위키** | 가로 모드 상단·하단 고정(헤더·푸터)으로 읽기 불편 | `PlaceWikiDetailsView` · 하단 flex 푸터 · `PlaceChatPanel` |
| 3 | **갤러리** | 그리드→개별 사진 탐색 중 **핀치 확대 불가** | `PlaceGalleryView` lightbox · `touch-none` · `shouldUseMobilePortal` · `usePinchZoomPan` |
| 4 | **갤러리** | 가로 모드 고정 헤더·연관 키워드 하단 푸터가 화면 대부분 차지 | `PlaceGalleryView` `landscape:` · `RelatedTravelSpots` · `PlaceMobileSecondaryNav` |

**공통 맥락** — 초기 과제(1~4) 대부분 반영 · **잔여 P0~P2는 위 핸드오프 참고**.

---

## 출발지 드롭다운 세션 — 에이전트 핸드오프 (아카이브)

### 상태 (2026-07-07)

- **모바일 QA ✅** — PlaceCardSummary·FlightCinemaBar 출발지 검색 · compact · 키보드 위 인라인 listbox
- **써머리 접기·칩 ✅** — `summary-header`/`summary-panel` · 터치 영역 확대 · 사용자 확인

### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 3절 모바일 입력·뷰포트 SSOT · 5절 스냅샷
2. **본 일지** — 「출발지 드롭다운 세션 — 에이전트 핸드오프」
3. grep — `FlightOriginSelector` · `isOriginCompact` · `useVisualViewportBottomAnchor` · `PlaceCardSummary` · `FlightCinemaBar` · `bar-header` · `summary-header`

### 금지 (3)

1. `GLOBE_VIEW.flyZoom`·`HIGH_ZOOM_FULL_REVEAL` 임의 변경
2. PowerShell `-replace`/`Set-Content`로 한글 JSX 수정
3. 사용자 QA·릴리스 노트 합의 전 「완료」·`releaseNotes.js` 임의 반영

### 완료 (본 세션)

| 영역 | 내용 |
|------|------|
| SSOT | `mobileViewport.js` `readVisualViewportBottomInset` · `useMobileInputViewport.js` `useCoarsePointer` · `useVisualViewportBottomAnchor` |
| listbox | `FlightOriginSelector.jsx` flipUp anchor · 모바일 `bar`/`summary-panel` 인라인 `bottom-full` · `onSearchActiveChange` |
| PlaceCard | `PlaceCardSummary.jsx` `isOriginCompact` · 키보드 bottom · chrome 숨김 |
| CinemaBar | `FlightCinemaBar.jsx` + `FlightCinemaContext.jsx` 동일 compact · portal bottom |
| Summary 접기 | `PlaceCardSummary` `!originExpanded` 칩 · `summary-panel` 「접기」 · `summary-header` expand-only |
| 칩 크기 | `summary-header` `min-h-[32px]` · `11px` · 사용자 확인 ✅ |

### 다음 세션 작업

| 우선 | 내용 |
|------|------|
| 1 | MOONi·탐색 입력 후 홈 지구본 배치 **실기기 QA** |
| 2 | 출발지 edge 회귀 — 회전 · blur 후 viewport |
| 3 | 릴리스 노트 합의 → `releaseNotes.js` 반영 |

### 제시어 (다음 세션)

```
출발지-이어하기 @plans/2026-07-07-project-log.md

모바일 출발지 QA ✅. 다음: 써머리(PlaceCardSummary) 출발지도 상태바(bar-header)처럼 접기·펼치기 UX.
읽기: .ai-context 3·5절 + 본 일지 「출발지 드롭다운 세션 — 에이전트 핸드오프」.
grep: PlaceCardSummary · summary-header · originExpanded · FlightCinemaBar · bar-header · isOriginCompact.
완료: compact·인라인 listbox·visualViewport bottom. 잔여: summary 접기 UX · 추가 QA.
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
