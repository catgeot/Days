# 2026-09-22 프로젝트 일지

직전: [`2026-09-21-project-log.md`](./2026-09-21-project-log.md)

## 지구본 마커·flyTo — 에이전트 핸드오프

### 세션 표기

- **#1** `지구본 마커·flyTo #1, reveal 원인·P0 패치` — 분석 + PR [#297](https://github.com/catgeot/Days/pull/297) → **main 병합** (`9060e6df`)
- **#2 (다음)** `지구본 마커·flyTo #2, reveal·fly SSOT 계측` — 인덱스 제시어 복붙

### 사람 QA (배포 후 · 2026-09-22)

| 항목 | 결과 |
|------|------|
| 첫 화면 **여행지 마커(칩)** | 여전히 **보임 / 안 보임** 간헐 |
| **모바일 flyTo** | 될 때도 있고 안 될 때도 있어 **재현 규칙 불명** |
| **PC** flyTo·티커·연관검색 | **아직 미확인** |
| 이전 재현 (유지) | 마커 없을 때 **다른 테마** 카테고리 클릭 시 마커 살아남 · **같은 테마** 재탭(권역 패널 닫기)은 구원 경로 아님 |

### #1에서 한 일 (요약)

**가설**: gateo overlay `tryRevealGlobeOverlays` 레이스 · `executeFocus`가 마커 hide 후 미복구 · orphan `globeCameraBusy` · 카테고리 면 fly → `idle`만 reveal 재시도.

**main 반영** (`9060e6df`):

- `tryRevealGlobeOverlays`: 미 reveal 시 orphan busy 정리 · `cameraAnimating` 중 rAF 재시도
- `executeFocus` near-target: 마커 visible + flush
- `markGlobeCameraBusy` 5s 타임아웃: 마커 visible
- `flyToCategoryFace` `moveend` → reveal
- `requestGateoMarkerReveal()` + 카테고리 선택/닫기 시 호출

**자동 검증**: `smoke:globe-label-first-reveal` · `build` PASS.

**결론**: P0만으로 **PROD 간헐 미해소** — 다음 세션은 **추가 retry 금지**, **가시성·reveal SSOT + fly 진입 통일 + 계측** 우선.

### 코드 SSOT (다음 세션 Read 순서)

1. [`globeLabelFirstReveal.js`](../src/pages/Home/lib/globeLabelFirstReveal.js) — 자전 hold · overlay retry 정책
2. [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) — `tryRevealGlobeOverlays` · `executeFocus` · `flyToAndPin` · `flyToCategoryFace` · `onIdle` → `tryRevealGlobe`
3. [`globeMarkerLayers.js`](../src/pages/Home/lib/globeMarkerLayers.js) — `setGateoMarkerLayerVisibility` · `scheduleUpdateGateoMarkerSource` · busy WeakMap
4. [`index.jsx`](../src/pages/Home/index.jsx) — `handleCategorySelect`(같은 카테고리+`faceRegionsOpen` → 닫기만) · `shouldPauseGlobe` · `markCameraBusy`+`deferGlobeFocus`(Explore)
5. [`useHomeHandlers.js`](../src/pages/Home/hooks/useHomeHandlers.js) — `handleLocationSelect` · `handleSmartSearch` · 동일 좌표 early return 시 fly 없음
6. PC만: [`TravelTicker.jsx`](../src/pages/Home/components/TravelTicker.jsx) — **접힌 티커 = 펼치기만**, fly는 **펼친 후** 도시 행

### 재현·계측 표 (다음 세션에서 PASS/FAIL 기록)

| ID | 시나리오 | 마커 | flyTo |
|----|---------|------|-------|
| A | 시크릿 홈 콜드 로드 ×5 | | |
| B | A에서 눈 아이콘(핀) off→on | | |
| C | 마커 없을 때 **현재 보라색 카테고리** 1~2탭 | | |
| D | 마커 없을 때 **다른 카테고리** 1탭 | | |
| E | 검색→장소 선택 | | 모바일 |
| F | 티커 **펼친** 후 도시 행 (PC) | | |
| G | 연관검색어 (PC, 장소 선택 후) | | |
| H | MOONi/채팅 닫은 직후 검색·티커 | | |

**DEV 힌트** (계측 추가 시): `globeOverlaysRevealedRef` · `gateo-*` layer `visibility` · `isGlobeCameraBusy` · `map.isMoving()` · `pauseRender` · `globeMode` 투어 여부 — 한 줄 로그로 상관관계만 잡기.

### #2 작업 제안 (우선순위)

1. **`ensureGateoMarkersVisible(reason)`** 한 함수로 reveal+visible+flush — `executeFocus`·busy timeout·onIdle·카테고리 fly 종료·첫 상호작용이 **전부** 호출 (분기별 copy 제거).
2. **fly 진입 SSOT**: `handleLocationSelect` / Explore 복귀 / 티커·연관검색 전 `wakeAfterOverlay()` + (필요 시) stale busy clear.
3. **모바일 fly 불안정**: `pendingFocusRef`·`pauseRender`·투어 `TOUR_*` intercept·동일 장소 early return — 클릭 시 **써머리는 열리는지 / 지구본만 안 움직이는지** 분리 기록.
4. **PC**: F·G 시나리오 + 티커 접힌 상태 UX (의도 vs 버그).
5. **금지**: `GLOBE_LABEL_*` pump·retry만 증가 · `travelSpots.js` 전체 스캔.

### Git · Preview

| | |
|--|--|
| **고정 브랜치** | `cursor/globe-marker-reveal-aced` |
| **main tip** | `9060e6df` (PR #297) |
| **다음 push** | `main`에서 브랜치 checkout → 작업 → feature push → draft PR 갱신 |
| **Preview** | `https://days-git-cursor-globe-marker-reveal-aced-catgeots-projects.vercel.app/` (push 후) · PROD `https://www.gateo.kr/` |

### docs-on-main

- 본 일지 · [`feature-handoff-index.md`](./feature-handoff-index.md) 지구본 행 · [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) §핸드오프
