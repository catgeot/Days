# 2026-06-04 프로젝트 일지 — 3D 투어 Summary 데스크톱 풀 카드 복원

**직전**: [`2026-06-03-project-log.md`](2026-06-03-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## 제품 결정

- **모바일(`<lg`)** 3D 투어: Summary 숨김 + 헤더 **`TourMobileBar`** 컴팩트 UI 유지.
- **데스크톱(`lg+`)** 3D 투어: Summary **풀 카드** 복원 — 설명·「3D 투어」·MOONi 버튼 노출 (`isCompact` prop 제거).

## 구현

- [`index.jsx`](../src/pages/Home/index.jsx): `PlaceCardSummary`에서 `isCompact={isTourActive && !isMobileViewport}` 제거.
- [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md): 제품 목표·SSOT 표 갱신.

## QA

- 로컬 Pass: 데스크톱 투어 중 풀 Summary · 모바일 투어 중 `TourMobileBar`만 표시.

---

## Mapbox 지명 줌 임계값 복원 (2026-06-04)

- **문제**: `PLACE_LABEL_MIN_ZOOM` 2.0 시험(커밋 `305475b`) — 마커와 동시에 Mapbox 지명 노출 → 일반 지명 클릭 시 장소카드 콘텐츠 빈약.
- **복원**: [`globeZoomPolicy.js`](../src/pages/Home/lib/globeZoomPolicy.js) `PLACE_LABEL_MIN_ZOOM = 4.0` — tier 마커 → `HIGH_ZOOM_FULL_REVEAL`(3.0) 전체 여행지 → **4.0+** Mapbox 지명·행정선 (`isPinVisible`·`globeMapboxLabelPolicy` SSOT 유지).

## 3D 투어 — 섬·해변 검은 화면 (2026-06-04)

- **원인**: `globeLandmarks` center가 라군·해상·섬 중앙(산) — 위성 스타일에서 바다=검정.
- **조치**: 몰디브·세이셸·잔지바르·세부 center 육지/해안 POI로 이동 · 사모아·그레이트 배리어 리프·레위니옹 landmark 신규 · `coastalOrbit` `shoreOffset` (세이셸).
- **QA 대기**: 사용자 스모크 — 위 7 slug 3D 투어.

## 3D 투어 — 섬 항공 조망 `islandReveal` (2026-06-04)

- **템플릿**: [`globeTourTemplates.js`](../src/pages/Home/lib/globeTourTemplates.js) `islandReveal` — top-down → pitch 하강 → 짧은 orbit (`islandScale`: small/medium/large/archipelago).
- **landmark**: 몰디브·세이셸·사모아·잔지바르·레위니옹·세부·라로통가·보라카이·보라보라 등 섬 centroid + `islandReveal`.
- **폴백**: `globeTourResolve` paradise + 섬 slug/키워드 → `islandReveal` (그레이트 배리어 리프 등 육지 관문은 `coastalOrbit` 유지).

## 3D 투어 — 섬 진입 (`islandReveal` v4)

- **스폰지/멀미**: off-island ring center → 섬이 화면 가장자리로 밀림. **조망~근접은 center=섬 고정**, zoom/pitch만 변화 · 마지막만 `approachBlend` 14~20% 공항 쪽 nudge.
- **라로통가·코코스**: `coastalOrbit` 유지.
- **몰디브**: `archipelago`·전역 centroid 제거 → **북말레 훌루말레** 단일 초점 · zoom 상향(MLE).

## 3D 투어 — 몰입감 강화 (2026-06-04)

- **문제**: 투어 모드로 진행 시 지도의 구분선(국경, 행정구역)과 많은 지명이 함께 표시되어 몰입감을 저해함.
- **조치**: [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx)의 `applyPlaceLabelVisibility`에서 `isPinVisible` 정책에 `!isTourMode(globeMode)` 조건을 추가하여, 투어 모드 진입 시 모든 Mapbox 지명과 행정선이 숨겨지도록 강제함. 투어가 끝나면 자동으로 복원됨.

