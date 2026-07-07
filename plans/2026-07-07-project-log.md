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

## PlaceCard 줌·가로 UX (2026-07-07)

**상태**: **✅ 실기기 QA 통과 — 배포·릴리스 노트 합의 대기**

### 본 세션 (줌 이어하기·마무리)

- **revert ✅** — `3c5d0f5` (836be2f·0aa82f0).
- **탭별 SSOT ✅** — `placeScrollPanYClass` · `plannerScrollSurfaceClass` · `useLightboxPinchTransform`.
- **플래너 줌 reset ✅** — 탭 이탈·카드 닫기 `resetIosZoomAfterInput`.
- **가로 immersive ✅** — `mobileLandscapeChromeHidden` — 헤더·푸터·FAB·연관바·탭네비 **숨김**(축소 아님) · 세로 복귀 시 노출 · 라이트박스 가로 자동 chrome 숨김.
- **QA ✅** — 사용자 실기기 확인 (줌 정책·가로 본문 집중).

### 정책 (확정)

| 영역 | 확대 | chrome |
|------|------|--------|
| 갤러리 그리드 | 없음 | 세로만 |
| 사진 라이트박스 | transform in/out | 가로 immersive |
| 위키·리뷰 | 없음 | 가로 chrome 숨김 |
| 플래너 | 네이티브 줌+스크롤 | 가로 chrome 숨김 |

**금지** — `usePinchZoomPan` · `snapVisualViewportPinchZoom`.

---

## 모바일 — PlaceCard 닫기 viewport sync (2026-07-07)

- **배경** — 출발지 검색 후 홈 복귀 시 지구본 상단 쏠림(실기기 1회성·캐시 의심) · MOONi·탐색과 동일 방어 로직 보강
- **수정** — `index.jsx` `dismissPlaceSelectionKeepGlobePin` · `goHomeFromPlace` — 모바일만 `syncHomeViewportAfterInput()`
- **영향** — MOONi 닫기와 동일(blur·scroll 0·120ms resize) · 데스크톱 무 변경 · 투어 Bar X도 동일 함수 경유(무해)

---

## PlaceCard 모바일 헤더 터치·갤러리 UX (2026-07-07)

**상태**: **✅ QA 확정 · 커밋 `f3d9260` · 푸시**

### 모바일 헤더 터치 회귀

- **증상** — 플래너·갤러리·위키·리뷰 등 스크롤 후 상단 뒤로/지구본 버튼 간헐적 무반응 (2026-05-25과 동일)
- **원인** — `overflow-y-auto` + `padding-top`(헤더 inset)이 iOS에서 헤더 영역 터치를 스크롤 surface가 가로챔
- **조치** — [`mobilePlaceHeaderInset.js`](../src/components/PlaceCard/common/mobilePlaceHeaderInset.js) `mobilePlaceHeaderSpacerClass` SSOT · 스크롤 밖 spacer(플래너·갤러리·위키·리뷰·영상) · `PlaceChatPanel` 모바일 헤더 `fixed`+`isolate`
- **QA** — 실기기 장스크롤 → 맨 위 → 뒤로/홈 연타

### 갤러리 새로고침 쿨타임 per-place

- **증상** — 「더 많은 사진 불러오기」 30초 쿨타임이 다른 여행지에도 공유됨
- **조치** — `usePlaceGallery` `lastRefreshAtByPlaceRef`(Map·slug/id) · `PlaceGalleryView` 장소 전환 시 쿨다운 UI 재동기화
- **QA** — A에서 갱신 → B 즉시 활성 · A 복귀 시 A만 잔여 쿨타임

### 갤러리 데스크톱 사진 카운터

- **요청** — 모바일 개별 사진과 동일하게 PC에서 `n / total`
- **조치** — `PlaceGalleryView` 데스크톱 lightbox **하단 중앙** 배지 (2장 이상)
- **QA** — PC 갤러리 확대 · 좌우 이동 시 카운터 갱신

---

## PlaceCard MOONi·갤러리 scroll-top (2026-07-07)

**상태**: **✅ QA·디자인 확정 · 커밋·푸시**

- **갤러리 맨 위 버튼 ✅** — `PlaceGalleryView` · `usePlaceMediaScrollToTop` · 연관바 위 `bottom-24`
- **MOONi 헤더 고정 ✅** — 모바일 드래그 FAB(`PlaceMooniFab`·`placeMooniFabPosition`) 제거 · 헤더 원형 버튼(플래너 옆) SSOT
- **헤더 MOONi 시인성 ✅** — `place-header-mooni-btn` · `mooni-header-glow` · 캐릭터 drop-shadow · reduced-motion 고정 글로우
- **QA** — 갤러리 scroll-top · MOONi 헤더 · 글로우 디자인 사용자 확정

---

**상태 (이전)**: **⏳ revert 적용·커밋 대기 — 다음 세션 정책 구현**

### 본 세션

- **되돌리기 ✅** — `git revert --no-commit 836be2f 0aa82f0` (working tree = e74f8e3 줌 기준). `usePinchZoomPan`·`snapVisualViewportPinchZoom`·라이트박스 viewport 줌 제거.
- **시행착오** — 공통 훅·meta 스냅·탭별 패치 → 줌 잔류·탭 이탈·플래너 좌우 막힘. **패치 중단·정책 분리** (사용자 합의).
- **836be2f 가로 chrome** — revert에 포함·**함께 제거** · immersive와 **별도 커밋** 재적용 권장.

### 다음 세션 확정 정책

| 영역 | 확대 | 비고 |
|------|------|------|
| 갤러리 **그리드** | 없음 | `touch-action: pan-y` |
| 갤러리 **개별 사진** | 두 손가락 in/out만 | **img transform 격리** 권장 · 강제 1.0 스냅·더블탭 리셋 **없음** |
| **위키** | 없음 | 텍스트 가독성 충분 |
| **플래너** | in/out만 | **유일한 텍스트 줌** · 한 손가락 상하좌우 스크롤 · `usePinchZoomPan`·meta 스냅 **금지** |
| **가로 모드** | — | 헤더·푸터 숨김·본문 집중 · `isMobileUIHidden` 패턴 |

**금지** — `usePinchZoomPan` · `snapVisualViewportPinchZoom` · document viewport 줌 공통 적용.

### 구현 순서

1. revert **커밋**(한글)
2. `placeScrollSurface` 탭별 클래스 SSOT
3. 플래너만 CSS 네이티브 줌 + 탭 이탈 reset
4. 라이트박스 img transform (별도)
5. 가로 immersive + chrome 재적용 (별도)

### 에이전트 의견

- 플래너 네이티브 줌도 fixed 헤더에서 **줌 잔류** 가능 → 탭·카드 닫기 시 `resetIosZoomAfterInput` 유사 reset.
- 사진은 **transform 격리**가 스와이프·탭 이탈과 충돌 최소.
- 가로 immersive는 줌과 **독립 PR**.

---

## PlaceCard 줌·가로 UX — 에이전트 핸드오프 (완료)

### 상태 (2026-07-07)

- **구현·QA ✅** — revert `3c5d0f5` + 탭별 줌 + `useLightboxPinchTransform` + `mobileLandscapeChromeHidden`
- **잔여** — 배포 후 회귀 · 릴리스 노트 합의 → `releaseNotes.js`

### 읽을 것 (3)

1. [`.ai-context.md`](../.ai-context.md) — 3절 · 5~6절
2. **본 일지** — 「PlaceCard 줌·가로 UX」정책 표
3. grep — `placeScrollSurface` · `mobileLandscapeChromeHidden` · `useLightboxPinchTransform` · `PlaceGalleryView`

### 금지 (3)

1. `usePinchZoomPan` · `snapVisualViewportPinchZoom` 재도입
2. PowerShell JSX · `GLOBE_VIEW.flyZoom` 변경
3. 릴리스 노트 합의 전 `releaseNotes.js` 임의 반영

---

## 항공 시네마 Bar — Trip 출발지 연동 (2026-07-07)

**상태**: **✅ QA 통과**

- **배경** — 장소카드·Bar 출발지(`flightOriginPreference`)는 arc·경로에 반영되나 Trip `dAirportCode`는 ICN 고정
- **Bar Trip** — `resolveFlightDepartureIataForTrip` · `WhiteLabelWidget` `departureIata`+`globe-flight-cinema` 추적
- **플래너** — Trip·여정 **ICN 고정** 유지 · Bar「여행 플랜」→ `buildPlacePlannerPathFromFlightCinema`(`?from=flight-cinema`) · [`FlightCinemaPlannerNotice`](src/components/PlaceCard/tabs/planner/components/FlightCinemaPlannerNotice.jsx) 상단 안내
- **QA ✅** — Bar 출발 변경 → 「항공권 검색」 `dAirportCode` · 플래너 진입 안내 배너 (사용자 확인)

---

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

---

## 로고 패널 버킷리스트 썸네일

**상태**: **✅ QA 통과 (2026-07-07)**

- **증상**: 장소카드 갤러리에 사진이 있어도 버킷리스트 카드에 기본 이미지만 표시
- **원인**: `LogoPanel`이 `place_stats.image_url`·별도 캐시 키(v1.5)만 조회 — 갤러리 SSOT(`gallery_urls`·`usePlaceGallery` 캐시)와 불일치
- **수정**: `BucketListCard` → `hydrateLocationFromSavedTrip` + `usePlaceGallery` 재사용 ([`LogoPanel.jsx`](../src/pages/Home/components/LogoPanel.jsx))

## 갤러리 사진 출처 표기 (Unsplash / Pexels)

**상태**: **✅ QA 통과 (2026-07-07)**

- **증상**: Pexels 병합 사진도 `on Unsplash`로 표시 · Pexels 링크(`links.html`) 미연결
- **수정**: [`galleryImageAttribution.js`](../src/components/PlaceCard/common/galleryImageAttribution.js) — id `pexels-*`·`source`로 구분 · `PlaceGalleryView`·`GalleryInfoView`·`PlaceWikiDetailsView` 반영 · Pexels 매핑에 `source: 'pexels'` 추가

## DEV 콘솔 노이즈 정리

- **증상**: `/place/` 탐색 시 `globe reveal fallback` 반복 · Rank view 중복 차단 로그 · `usePlannerData` 리스너 등록/제거 반복
- **수정**: `HomeGlobeMapbox` fallback — `pauseRender`·이미 reveal 시 타이머/경고 생략 · `useHomeHandlers` `addScoutPin`과 중복 `recordInteraction` 제거 · `usePlannerData` 리스너 DEV 로그 삭제

## PlaceMiniMap Mapbox container 오류

**상태**: **✅ 로컬 QA 통과 (2026-07-07)**

- **증상**: 위키 탭 `PlaceMiniMap` — `Invalid type: 'container' must be a String or HTMLElement`
- **원인**: `PlaceMediaPanel` 탭 전환 시 `hidden` 패널에 Mapbox가 마운트 · react-map-gl 비동기 init 타이밍
- **수정**: `PlaceMiniMap.jsx` — `isActive`·`requestAnimationFrame` 지연 마운트 · 좌표 `Number()` · `PlaceWikiDetailsView`에서 `isActive` 전달

## 홈 버킷리스트 — 갤러리 API·SessionStorage 과다 호출

**상태**: **✅ 로컬 수정·커밋 (2026-07-07)** — batch `place_stats`·`place_id` 매칭 강화는 **다음 세션**

- **증상**: 홈(로고 패널 닫힘)에서도 `Tengatangi` 등 Unsplash/Pexels 갤러리 호출 · `SessionStorage full` 반복
- **원인**: `LogoPanel` `BucketListCard`가 패널 마운트 시 전 여행지에 `usePlaceGallery` 전체 로드(60장·Pexels 병합)
- **수정**: 패널 `isOpen`일 때만 카드 마운트 · `usePlaceGallery({ thumbnailOnly: true })` — DB `image_url`·1장 캐시·Pexels 생략
- **미완**: uiPlace 버킷(`Tengatangi` 등) `place_id` 불일치 시 DB 재사용 실패 → Unsplash 폴백 · **LogoPanel batch `place_stats` 조회** 검토

---

## 버킷리스트·DEV 콘솔 세션 — 에이전트 핸드오프

### 완료 (본 세션)

| 항목 | 파일 |
|------|------|
| 지구본 fallback DEV 노이즈 | `HomeGlobeMapbox.jsx` — `pauseRender`·이미 reveal 시 2s 타이머 생략 |
| Rank view 중복 | `useHomeHandlers.js` — `addScoutPin`과 중복 `recordInteraction` 제거 |
| Planner DEV 로그 | `usePlannerData.js` — Toolkit 리스너 등록/제거 로그 삭제 |
| 버킷리스트 갤러리 과다 | `LogoPanel.jsx` · `usePlaceGallery.js` — `isOpen` 시만 마운트 · `thumbnailOnly` |
| PlaceMiniMap container | `PlaceMiniMap.jsx` · `PlaceWikiDetailsView.jsx` — WIKI `isActive`·rAF 지연 마운트 |

### Supabase 재사용 (현행 SSOT)

`usePlaceGallery` 조회 순서: **sessionStorage → `place_stats`(image_url·gallery_urls[0]) → Unsplash**. DB 히트 시 API 없음. Unsplash 로그 = `place_id` 미스매치 또는 DB 이미지 필드 비어 있음.

### 다음 세션 — 실행 계획

| 목표 | 내용 |
|------|------|
| **A** | `LogoPanel` — 버킷 `place_id` 후보 일괄 수집 → `place_stats` **1회 batch** `.in('place_id', …)` → 카드에 `image_url` 주입 (Unsplash·N회 Supabase 제거) |
| **B** | uiPlace·`saved_trips.destination` ↔ DB `place_id` 매칭 감사 — `buildPlaceDbIdCandidates`·`hydrateLocationFromSavedTrip` 보강 |
| **C** | 로컬 QA — 홈 대기 갤러리 0 · 패널 재오픈 캐시 히트 · DB 있는 장소 Unsplash 0 |

### 읽을 것 (3)

1. `.ai-context` 1·3절 (갤러리·place_id SSOT)
2. 본 일지 「버킷리스트·DEV 콘솔 세션 — 에이전트 핸드오프」
3. grep: `LogoPanel` · `usePlaceGallery`(thumbnailOnly, buildPlaceDbIdCandidates) · `placeRouteHydrate`

### 금지 (3)

1. `travelSpots.js` / `travelSpotAirports.json` 전체 Read·직접 수정
2. 버킷리스트 외 PlaceCard 갤러리 UX 임의 변경
3. `releaseNotes.js` 사용자 합의 전 반영

### 제시어 (다음 세션)

```
버킷리스트-이어하기 @plans/2026-07-07-project-log.md

LogoPanel 버킷리스트 — place_stats batch 조회·place_id 매칭 강화 (Supabase 썸네일 재사용).
읽기: .ai-context 1·3절 + 본 일지 「버킷리스트·DEV 콘솔 세션 — 에이전트 핸드오프」.
grep: LogoPanel · usePlaceGallery(thumbnailOnly) · buildPlaceDbIdCandidates · hydrateLocationFromSavedTrip.
금지: travelSpots/Airports JSON · 갤러리 UX 범위 밖 · releaseNotes 합의 전.
이전: isOpen 시만 카드 마운트 · thumbnailOnly · fallback·Rank DEV 노이즈 정리.
```

---

## PlaceCard 갤러리 PC 라이트박스 — 에이전트 핸드오프 (2026-07-07)

**상태**: **✅ 1차 QA 통과 · 커밋 완료**

### 본 세션 완료

| 항목 | 내용 |
|------|------|
| 첫 확대 즉시 닫힘 | `usePlaceGallery` — `fetchImages` cleanup에서 `setSelectedImg(null)` 제거 · `stablePlaceKey`로 장소 전환 시만 초기화 · 그리드 클릭 ghost click 방지 |
| PC 하단 prev/next | `PlaceGalleryView` — 좌우 중앙 → 하단 바 `[이전] · 카운터/다운로드 · [다음]` |
| PC 출처 | 좌측 `GalleryInfoView` PHOTO_LOG (작가·Unsplash 분리 링크) · 라이트박스는 **전체화면** 시에만 상단 fallback · **모바일 기존 유지** |
| SSOT | `galleryImageAttribution.js` — `photographerHref` / `providerHref` |

### 다음 세션 (미완)

| 목표 | 내용 |
|------|------|
| **A** | Unsplash **권장 형식** 전면 준수 — `Photo by [작가] on [Unsplash]` 각각 링크+UTM · `PlaceGalleryView`(전체화면·모바일)·`PlaceWikiDetailsView` 등 잔여 단일 `<a>` 정리 |
| **B** | PC 라이트박스 **하단 prev/next** — 현재 `bottom-4`/`bottom-8` → 화면 하단(safe-area)에 최대한 밀착 |
| **C** | PC **상단 전체화면·닫기** — 시인성 개선(대비·크기·ring) · 상단 여백 축소로 더 위로 |

### 읽을 것 (3)

1. `.ai-context` 3절 갤러리·출처 SSOT
2. **본 일지** — 「PlaceCard 갤러리 PC 라이트박스 — 에이전트 핸드오프」
3. grep — `PlaceGalleryView` · `GalleryInfoView` · `galleryImageAttribution` · `renderAttributionLink`

### 금지 (3)

1. 모바일 확대 포털 레이아웃 임의 변경 (PC `renderPhotoViewer` non-portal 분기만)
2. `usePinchZoomPan` · viewport 줌 재도입
3. `releaseNotes.js` 사용자 합의 전 반영

### 제시어 (다음 세션)

```
갤러리-PC-이어하기 @plans/2026-07-07-project-log.md

PlaceCard PC 갤러리 라이트박스 — Unsplash 권장 2링크 전면 적용 · 하단 prev/next 하단 밀착 · 상단 확대/닫기 시인성·위치.
읽기: .ai-context 3절 + 본 일지 「PlaceCard 갤러리 PC 라이트박스 — 에이전트 핸드오프」.
grep: PlaceGalleryView · GalleryInfoView · galleryImageAttribution · renderAttributionLink.
금지: 모바일 포털 UX 변경 · usePinchZoomPan · releaseNotes 합의 전.
이전: 첫 확대 버그 수정 · PC 하단 nav · 출처 좌측 패널(전체화면만 라이트박스 fallback).
```
