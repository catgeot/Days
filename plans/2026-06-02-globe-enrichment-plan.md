# 홈 지구본 풍부화 마스터 계획 (2026-06-02)

**맥락**: [`.ai-context.md`](../.ai-context.md) · **일지**: [`2026-06-04-project-log.md`](2026-06-04-project-log.md) · 직전 [`2026-06-03-project-log.md`](2026-06-03-project-log.md)

**갱신**: 2026-06-18 — Phase **2b** arc·Bar·Trip 위젯 ✅ · Phase **3** ✅

**일지**: [`2026-06-09-project-log.md`](2026-06-09-project-log.md) · 직전 [`2026-06-08-project-log.md`](2026-06-08-project-log.md)

---

## 제품 목표 (Phase 1 북극성)

**클릭하는 순간 그 여행지의 감성(지형·스케일)을 맛볼 수 있는 카메라 경로.**

- 사용자: 여행 전 **간접 경험** · **데스크톱(`lg+`)** 투어 중에도 Summary **풀 카드**(설명·3D 투어·MOONi) · **모바일(`<lg`)** 투어 중 Summary 숨김 + 헤더 **`TourMobileBar`** (로고 옆 · Skip/2D/3D 투어 · **X** 탈출).
- **버튼 노출**: `lat`/`lng`만 유효하면 **전 여행지** — 큐레이션·신규·DB-only 지명 포함 (숨은 여행지 → 위키·매거진 파이프라인).
- **품질**: slug별 **대표 뷰포인트**(`globeLandmarks.json`) + category 폴백 — `travelSpots.js` 좌표(공항·도심·행정 중심)를 투어에 그대로 쓰지 않음.
- **시각 우선순위** (QA 2026-06-03): **대자연·해안·알프스** > 도심 (`mountainOrbit` / `coastalOrbit` / `alpineVillageOrbit` 우선 큐레이션).

---

## 목표 (4+2)

| # | 기능 | 상태 |
|---|------|------|
| **0-A** | 마커·지명 통합 (GeoJSON, jitter 제거) | **완료** |
| **0-B** | 지구본 지명 한글화 | **완료** |
| **1** | 3D 투어 (Summary → 여행지 맛보기 선회) | **WIP** (1a~1i) |
| **1i** | 투어 종료 후 **도보·차량 이동 경계선** (Isochrone) | **완료** (로컬 QA 다낭) |
| **2** | 공유 뷰 URL 복원 · 우상단 지도 도구 | **완료** — +/−/나침반 **폐기** · flyTo min **2.35 고정** |
| **2b** | 항공 예약 퍼널 앞 **시네마** (OD arc) | **WIP→거의 완료** — arc·Bar·Trip 위젯 ✅ · **2c** 장기 |
| **3** | 클러스터 경계·명소 POI | **✅** — hull·POI · `GlobeClusterLegend` · 31권역 데이터 |
| **4** | 숙소 탐색 (MRT 시험 → 플래너 연동) | 장기 |

---

## Phase 0 구현 SSOT (완료)

| 파일 | 역할 |
|------|------|
| [`globeMarkerLayers.js`](../src/pages/Home/lib/globeMarkerLayers.js) | GeoJSON source · **지명(symbol) 레이어** · active-ring(선택 핀) · hit-test — **여행지(major)는 점 없이 지명만** |
| [`globeZoomPolicy.js`](../src/pages/Home/lib/globeZoomPolicy.js) | zoom tier · merge/collision 임계값 · `HIGH_ZOOM_FULL_REVEAL`(≥3) |
| [`globeSpotVisibility.js`](../src/pages/Home/lib/globeSpotVisibility.js) | **`denseRegion` 밀집 권역만** 줌·tier 단계 노출 · `denseRegion` 없음(섬·희소)은 **전 tier 노출** |
| [`globeCategoryFocus.js`](../src/pages/Home/lib/globeCategoryFocus.js) | 카테고리 5면 pan SSOT — `GLOBE_FACE_CENTER_BY_CATEGORY` · 줌·고도 유지 · 랜덤 진입 `pickRandomGlobeCategory` |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | Mapbox 행정·도시 지명 (줌≥4·눈 ON) — gateo 지명과 별도 |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | 전 카테고리 여행지 노출 · 레이어 bootstrap · 한글 지명 분기 |

### 홈 지구본 마커·노출 정책 (2026-06-07)

| 항목 | 정책 |
|------|------|
| **여행지 범위** | 카테고리와 무관 **전체 `TRAVEL_SPOTS`** (구: 카테고리 필터·`showOnGlobe` 숨김 해제) |
| **표시 형태** | major = **카테고리 색 지명 텍스트** (dot 제거) · 탐색/저장 핀 = 점+라벨 |
| **밀집 vs 섬** | `travelSpots.denseRegion` **있음** → 줌 tier 1→2→3 · **없음** → tier 구분 없이 노출 |
| **줌 ≥ 3** | tier 1~3 전체 · 충돌 병합 완화 (`HIGH_ZOOM_FULL_REVEAL`) |
| **카테고리 버튼** | 마커 숨김/강조 **없음** — **5면 큐레이션 중심 pan**(서울·아프리카·오슬로·미니애폴리스·남미) · **현재 줌·고도 유지** · 홈 진입·복귀 시 **랜덤 면** · 대양·공해는 사용자 드래그 탐험 · AI·저장 trip `category` 태그 유지 |
| **지명 겹침** | Mapbox `text-allow-overlap: false` + `symbol-sort-key`(tier 1 우선) |

**데이터**: 새 대륙 밀집 권역 추가 시 `denseRegion` 문자열 부여(예: `western-europe`). 섬·단독 목적지는 `null` 유지.

### 카테고리 5면 pan (2026-06-15 ✅)

| 카테고리 | pan 중심 | 비고 |
|----------|----------|------|
| paradise | 서울 | |
| nature | 아프리카 (동아프리카) | |
| urban | 오슬로 | 유럽 |
| culture | 미니애폴리스 | 북미 |
| adventure | 남미 (브라질 중부) | |

- **진입**: 새로고침·`/place`·`/explore`에서 `/` 복귀(포커스 없음) → `pickRandomGlobeCategory` + `categoryFaceEpoch`
- **이동**: `HomeGlobeMapbox` `flyToCategoryFace` — center만 변경 · `map.getZoom()`·pitch·bearing 유지
- **예외**: 공유 URL `?lng&lat&zoom` 복원 시 면 pan 생략 · 투어 중 pan 없음
- **대양**: 버튼 면에 바다가 보이는 구간은 사용자 드래그·줌으로 자연 탐험 (최대 확대 시 불가피)

---

## Phase 1 구현 SSOT (WIP — 1a~1e)

| 파일 | 역할 |
|------|------|
| [`globeMode.js`](../src/pages/Home/lib/globeMode.js) | `globe2d` ↔ `tour_*` 상태 머신 |
| [`globe3dBootstrap.js`](../src/pages/Home/lib/globe3dBootstrap.js) | on-demand DEM · optional buildings · per-slug exaggeration · 타임아웃 |
| [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json) | **투어 카메라 SSOT** — slug별 `center` · `template` · `orbit` · (선택) `keyframes` · `tourReady`(QA 메타, 버튼과 무관) |
| [`globeTourResolve.js`](../src/pages/Home/lib/globeTourResolve.js) | landmark 없을 때 `primaryCategory` → template · 알프스 힌트 |
| [`globeTourTemplates.js`](../src/pages/Home/lib/globeTourTemplates.js) | `cityOrbit` · `alpineVillageOrbit` · `mountainOrbit` · `coastalOrbit` |
| [`globeTourEngine.js`](../src/pages/Home/lib/globeTourEngine.js) | terrain → keyframe 재생 · `canStartGlobeTour` = 좌표 유효 시 true |
| [`globeTourUi.js`](../src/pages/Home/lib/globeTourUi.js) | 투어 중 라벨 정리 · urban 투어 시 Standard 랜드마크만 ON · 종료 시 `reapply`로 홈 정책 복원 |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | **Mapbox 지명·경계·랜드마크 SSOT** — 줌≥4·`isPinVisible` · Standard `setConfigProperty` + 레이어 숨김 |
| [`travelSpots.js`](../src/pages/Home/data/travelSpots.js) | **핀·SEO·공항·페리** 좌표 SSOT — 투어 center와 분리 유지 |
| [`PlaceCardSummary.jsx`](../src/components/PlaceCard/modes/PlaceCardSummary.jsx) | 「3D 투어」— 전 여행지 노출 · 데스크톱 투어 중 **풀 카드** (`isCompact` 미사용) |
| [`TourMobileBar.jsx`](../src/pages/Home/components/TourMobileBar.jsx) | 모바일 투어 시네마 — 헤더(로고 옆) · Skip · 2D(앵커 동일) · 3D 투어(pivot) · X 탈출 · `index.css` 글로우 |
| [`index.jsx`](../src/pages/Home/index.jsx) | `isTourCinema` = 투어+`<lg` → Summary 숨김 · `tourReadyAnchorRef` · `tourPivoted` · pivot 시 `pivotTourExplore` · **`globeActivePinId`** = `selectedLocation?.id ?? scoutedPins[0]?.id` (써머리·X 닫힘 후 마지막 방문 핀·지명 강조) · `dismissPlaceSelectionKeepGlobePin` |
| [`resolveHomeGlobeEngine.js`](../src/pages/Home/components/resolveHomeGlobeEngine.js) | PROD→mapbox · DEV→mapbox(URL 무제한 `.env.local` 토큰) · `?globe=legacy` |

**동작 요약**

- Summary **3D 투어** → `resolveGlobeTourConfig`: **landmark center** → 없으면 category template + `travelSpots` 좌표.
- **자연/휴양**: `mountainOrbit` · `coastalOrbit` 우선 — 칸쿤(호텔존 해변)·사파(계곡)·밴프(루이스 호) 등 `globeLandmarks`에 뷰포인트 등록.
- **도시**: `cityOrbit` — fill-extrusion buildings는 기본 OFF.
- **알프스**: `alpineVillageOrbit` (체르마트 등).
- **수동 경로**: `keyframes: [...]` — Mapbox Studio export.
- Skip · **2D 복귀** · 모바일: Summary 숨김 · 지도 탭 탐색 차단 · MOONi FAB·카테고리 내비 숨김.
- **`TOUR_READY` pivot** (2026-06-09, **2026-06-15**): 투어 앵커와 다른 지명 클릭 → `pivotTourExplore`(landmark center `easeTo` only · pitch/zoom 유지) · **경계 초기화**(재투어 종료까지 미표시) · 바 **3D 투어** 노출. **X** = 써머리·선택 UI만 닫음(`dismissPlaceSelectionKeepGlobePin`) · **`scoutedPins`에 핀 보존** · `globeActivePinId`로 active-ring·지명 강조 유지 · `endTour`+회전 재개. **2D 복귀** = 투어만 종료·써머리 유지. 재투어: `TOUR_READY→TOUR_BOOTSTRAPPING` 허용.
- **투어 중 지명**: `globeMapboxLabelPolicy`와 동일(눈 ON·줌≥4) · **지명·gateo 마커 클릭** 가능 · 빈 지도 탭만 차단 (`HomeGlobeMapbox` `handleGlobeClickInternal`). **지명 클릭 UI**: 역지오코딩 국가·라벨명 · `uiPlace`로 툴킷 alias·좌표 스냅 분리 — [`travel-spots-management.md`](travel-spots-management.md) §8.

### 데이터 역할 (투어 vs 여행지 SSOT)

| 데이터 | 투어에 쓰는가 | 비고 |
|--------|---------------|------|
| `globeLandmarks.json` | **카메라 center·template** | 대표 명소·해변·계곡 등 큐레이션 |
| `travelSpots.js` | 폴백 center·category만 | `lat`/`lng` 변경 시 공항·거리 매칭 영향 — 무작정 이동 금지 |
| `citiesData.js` | 검색·글로브 커버 | 투어 1순위 SSOT 아님 |
| `keywordData.js` | 검색 동의어 | 좌표 없음 |

**얇은 atol·분산 국가** (2026-06-15): `travelSpots` 핀이 **국가 중심 해상**에 있어도 공항·핀 SSOT는 유지 — 투어는 `globeLandmarks` **육지 띠·공항 POI**로 큐레이션 (`kiribati`: overview Betio↔Bonriki 중점 → TRW · `cape-verde`: Sal Island SID→Santa Maria). 위성(deep) 타일 한계로 풍경 감상은 제한될 수 있음. 후보 점검: `node scripts/scan-tour-ocean-mismatch.mjs`.

### tour-ready (내부 QA 메타 — 버튼 gate 아님)

| # | 조건 |
|---|------|
| 1 | 카메라 — `globeLandmarks` center 위성 QA **또는** Studio `keyframes` |
| 2 | 지형 — `exaggeration` Pass |
| 3 | UX — Skip · 2D 복귀 · 모바일 OK |
| 4 | (선택) `"tourReady": true` — 운영·승격 추적용. **버튼은 좌표만으로 노출** |

### Mapbox Standard 3D 랜드마크 (강구 중)

- Mapbox **Standard** 스타일: 370+ 도시 · 1만+ 커스텀 3D 랜드마크·공항·역 ([블로그](https://www.mapbox.com/blog/global-cities-3d-landmarks)).
- gateo 기본 지구본 **deep** = `satellite-streets-v12` — Standard 랜드마크 **미포함**. **bright** = `mapbox://styles/mapbox/standard`.
- **파일럿 (2026-06-03)**: [`globeStandardBasemap.js`](../src/pages/Home/lib/globeStandardBasemap.js) — Standard API 유효 키만 · **urban `cityOrbit` 투어 중** `showLandmarkIcons` + `showLandmarkIconLabels` + `show3dLandmarks` (deep=위성, 해당 없음).
- **홈 Mapbox 지명**: [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) — **줌≥4**·**눈 버튼 ON**일 때 `STANDARD_HOME_CONFIG` / 위성 place·boundary 레이어. **우주 뷰·눈 OFF** = `STANDARD_HOME_SPACE_CONFIG` + landmark 레이어 강제 숨김. **로딩 플래시 방지**: `applyEarlyMapboxGlobeLabelSuppress` (bright `styledata`) + `HomeGlobeMapbox` `tryRevealGlobe` (지명 정책·gateo 레이어 후 페이드인). [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) · `MapboxLanguage`는 **deep/neon만**.
- **테마 전환 콘솔**: `Unable to perform style diff` — satellite↔Standard **정상 경고** (무시). `getStyle`은 `isStyleLoaded` 이후만 (`onStyleData` 가드).
- **후속 보류**: deep에서 urban 투어 시 Standard 스타일 임시 전환 · bright를 “Mapbox 지명만” 모드로 단순화( gateo 라벨 축소) — 제품 결정 시.
- 자연 지명은 DEM+terrain+큐레이션 center; Standard는 **도시 투어 맛보기**용.

### 로컬 QA 이력

| 세션 | 항목 | 결과 |
|------|------|------|
| 1a | 후지산 | terrain 선회 그럴듯 |
| 1a | 파리 에펠탑 | DEM 뭉치 — urban landmark 한계 |
| 1a | 2D 복귀 gateo 라벨 | fix (`globeTourUi`) |
| 1b~c | 파리 buildings | **투명 프레임** — photoreal 불가 → **cityOrbit 전환, buildings OFF** |
| 1b~c | 후지산 | template smooth 튜닝 — **여전히 타일 로딩 끊김** → Studio keyframe 후보 |
| 1b~c | 체르마트(zermatt) | 마을 포커스 나쁘지 않음 → `alpineVillageOrbit` 추가 |
| 1d | 칸쿤·사파·흐바르 | 도심 → 해변·산맥 포커스 **사용자 QA Pass** |
| 2026-06-15 | kiribati | atol overview Pass · 위성 얇은 띠 한계 · `globeLandmarks` SSOT |
| 2026-06-16 | cape-verde | Sal Island(SID) 섬 조망 Pass · 해상 핀 유지 · `globeLandmarks` SSOT |

### Phase 1 잔여

| # | 작업 | 목표 |
|---|------|------|
| **1d** | ✅ `globeTourResolve` + nature slug `globeLandmarks` 1차 | category 폴백 · 대표 center |
| **1e** | ✅ +58 slug · **68/134** nature 등록 | 흐바르·동남아·알프스 · 잔여 ~66 폴백 |
| **1f** | ✅ `mount-fuji` 7-frame `keyframes` | `tourReady` |
| **1g** | 빌드 OK · **gateo 스모크 사용자 QA** | 2D 복귀·Skip·모바일 `TourMobileBar` |
| **1h** | ✅ `globeStandardBasemap` · urban 투어 랜드마크 데모 | |
| **1h-b** | ✅ bright gateo-first (`ef0736b`) → **지명 SSOT** (`globeMapboxLabelPolicy`) | 우주 뷰·눈 버튼·Standard 랜드마크 |
| *(선택)* | idle terrain pre-warm | cold start |

### Phase 1i — 이동 가능 경계선 (2026-06-09 ✅ 로컬)

**트리거**: 3D 투어 `TOUR_READY` **최초 진입** 직후만 로드 · 투어 카메라 center 기준 · pivot·재투어 시작 시 **초기화** · **2D 복귀** 시 제거.

| 파일 | 역할 |
|------|------|
| [`globeReachBoundaries.js`](../src/pages/Home/lib/globeReachBoundaries.js) | Mapbox **Isochrone** fetch · GeoJSON line 레이어 · 오프라인 원형 폴백 · `isReachBoundaryLayer` |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | `loadReachBoundaries` · 범례+**on/off 토글** · `easeCameraForReachReveal`(고 pitch 완화) |
| [`globeMode.js`](../src/pages/Home/lib/globeMode.js) | `TOUR_READY` → `TOUR_BOOTSTRAPPING` 재진입 (pivot 후 재투어) |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | `gateo-reach-*` 레이어 **지명 정책 숨김 제외** (표시 후 사라짐 회귀 방지) |

**시각 정책** (2026-06-09 조정 — TravelTime·Mapbox·Geoapify 등 Isochrone fill 관행 반영)

| 모드 | Isochrone | 표시 |
|------|-----------|------|
| **도보** 20분 | `walking` · `polygons=false` · detail | **초록 점선** — 보행 경로 |
| **차량** 30분 | `driving` · `polygons=true` · `generalize=500m` | **파란 반투명 영역**(fill 16%) + 외곽 실선 — **운전 도달 영역** (도로망 기준, 바다 자연 제외) |

- 도보 `line-dasharray`는 **paint** 속성 (layout 아님).
- 차량: 거리 원·도로 지그재그 외곽선만 단독 사용 **금지** (의미·가독성 한계).
- API 실패 시 geodesic 원형 폴백(도보 1.6km · 차량 24km).
- **범례**: `TOUR_READY` · `createPortal` 좌하단 · **스위치로 지도 경계 on/off** · 모바일 투어 시네마에서도 표시 (`hideTourControls`와 분리).

**로컬 QA**: 다낭·나트랑·사파 — Skip/종료 후 경계 유지 Pass · 차량 fill·범례 확인.

**후속 (선택)**: slug별 분·`generalize`·fill opacity 튜닝 · Directions API 도로 중심선 · Phase 3 클러스터 hull·POI와 병행.

### Phase 2 — 공유 뷰·지도 도구 (2026-06-09 ✅)

**범위**: 구글 지도형 +/−/나침반 **시도 후 폐기** (pinch·휠·드래그로 충분). 우상단 **공유·GPS·우주** 3버튼만 유지.

| 파일 | 역할 |
|------|------|
| [`globeExploreNav.js`](../src/pages/Home/lib/globeExploreNav.js) | `readGlobeShareViewFromUrl` — `?lat=&lng=&zoom=` 로드 시 카메라 1회 복원 |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | 공유 URL 복원 · 우상단 3버튼 · `pivotTourExplore` · 우주=`endTour` 연동 · `executeFocus` flyTo |

**flyTo 최소 줌 (변경 금지)**

- SSOT: `HomeGlobeMapbox` **`GLOBE_VIEW.flyZoom` = 2.35** — `executeFocus`에서 `Math.max(currentZoom, flyZoom)`.
- 다회 QA·시행착오로 확정. Phase 2 WIP 중 `HIGH_ZOOM_FULL_REVEAL`(3.0) 시도는 **되돌림** — AI·에이전트 **임의 튜닝 금지**.
- 자동 회전: 기존 `rotateZoomThreshold`(2.4)만 사용 (줌 ≥3 전용 guard **제거**).

**우상단 툴바 SSOT**

| 버튼 | 역할 | 노출 |
|------|------|------|
| 공유 | 현재 뷰 URL(`lat`/`lng`/`zoom`) 공유·복사 | zen·투어 시네마·(모바일 투어) 제외 |
| GPS | geolocation flyTo | 동일 |
| 우주 | 우주 뷰 복귀 — **`GLOBE_VIEW.default`(zoom 1.25)** · PC·모바일 동일 · `flyTo` **`moveend`까지 autoRotate 잠금**(회전 `jumpTo`가 줌 애니 중단 방지) · **3D 투어 중**이면 `endTour` 선행(terrain 해제·`globe2d`) 후 이동 | 동일 |

**폐기**: `GlobeExploreNavControls.jsx` (+/−/나침반) · `shouldShowGlobeExploreNav` · explore 전용 auto-rotate guard.

### Phase 2b — 항공 시네마 (OD arc · 홈 써머리 전용)

**상태**: corridor A~E ✅ · **`audit:flight-arcs` 0** ✅ · **arc 마커·leg 애니·Bar·Trip CTA** ✅ · **2c** 문서만(구현 보류).

**Phase 2b arc·Bar UX ✅ (2026-06-18 후속 · 사용자 QA Pass)**

| 항목 | 내용 |
|------|------|
| arc 마커 | 출발(청록)·경유(빨강)·도착(노랑) · IATA 흰색 라벨 |
| leg 애니 | hub 구간 순차 draw + 정지 · ~10s (`buildFlightArcDrawSchedule`) |
| Bar 노선 | `ICN ~11h LAX … (총 Nh)` · `estimateFlightLegHours` |
| Bar 메타 | `대권 항로(실제 비행경로와 다를 수 있습니다.)` |
| Trip CTA | **모바일** `TripcomFlightSearchModal`(ad iframe) · **데스크톱** `buildTripcomPlannerNavigationUrl` |
| 제거 | 「바로 보기」·`skipFlightCinema` · `revealFullRoute` UI 노출 없음 |

**시네마 중 홈 (2026-06-18 확정)**

| | 모바일 | 데스크톱 |
|---|--------|----------|
| 연관검색어 | 숨김 (`hidden md:flex`) | 표시 · 클릭 → `closeFlightCinema` + 이동 |
| 카테고리 | 시네마 중 숨김 | 표시 · 클릭 → `closeFlightCinema` + pan |
| 장소카드 | 시네마 중 숨김 | 시네마 중 숨김 |

**항로 hub SSOT ✅ (2026-06-18)**

| 항목 | SSOT·파일 |
|------|-----------|
| hub bake | `sync:airports-from-toolkit` — `flightRouteHubIatas` **중단** |
| hub 추출 가드 | `extractFlightRouteHubIatasFromEssentialGuide` — `isTransitHubTimelineTitle` |
| 런타임 | `getFlightRouteHubIatas` — overrides · `trip≠final`만 (live timeline **제거**) |
| 승객 경로·avoid-zone | `travel-spot-airport-overrides.mjs` — `flightRouteHubIatas` + `flightRouteWaypoints` (예: LAX+`[180,12]`, ATL, GRU, cancun/chichen) |

**FlightCinemaBar 「여행 플랜」**: 항공코드 행 · `buildPlacePlannerPath(slug)` — 플래너 탭 홈 · Trip CTA와 분리.

**Phase 2b arc 최적화 ✅ (2026-06-18)**

| 항목 | 내용 |
|------|------|
| Atlantic corridor | 미·캐나다 본토(lat>35, lng<-65) DXB 제외 · 아소르스·카보베르데 포함 |
| 지중해 gateway | `[15,42]` — 헬싱키 ukraine 회귀 해소 |
| waypoint batch | 29 slug — ATL/LAX/GRU/LPB + `[[180,12]]` |
| ICN↔LAX 직항 | `los-angeles`·`sequoia` — hub 없음·waypoint만 · Bar「직항」 |
| audit | `npm run audit:flight-arcs` **0 issues** |
| 배너·Trip | `preferredLinkIata` **미변경** — arc 전용 필드만 |

**다음 (선택)**: corridor/passenger Bar 라벨 · GUM·Trip CTA **보류** · **2c** 문서만.

**제품 목표 (현재 스코프)**: 홈 써머리「항공 경로」— ICN→도착 IATA arc · `FlightCinemaBar` · 플래너 Trip과 **분리**.

**제품 원칙 — 「현실감 있는 관문 경로」** (2026-06-17)

- 사용자는 **여러 여행지 arc를 비교** — 서·북유럽은 **동일 관문 패턴**(DXB) · 시베리아 직통·전쟁 지역 관통은 **신뢰 저하**.
- NOTAM/FIR 정밀 항로 **아님** — 「약 N시간 · 대권 항로」·경유 시 Bar **「ICN → DXB → CDG · 경유」** (실제 항로와 동일 문구 금지).
- **anchor 우선순위**: (1) overrides hub (2) `trip≠final` (3) 권역 corridor (4) avoid guard (5) 기하만 — live timeline hub **제거됨**(2026-06-18).

**대권 항로 (arc 엔진 — A ✅)**

- long arc: **목적지 lng < -30** · polar(≥58°) 또는 short-arc 민감공역 교차 시 — **남극권(minLat<-58) long arc 거부**(bermuda 등) · **남반구 대우회(minLat<-40) 시 short 유지**(ICN→LAX/MEX)
- 유럽·북대서양: short arc + **corridor/guard** (`[125,33]`→DXB→`[15,42]`→dest · Atlantic 본토 DXB 제외)
- **전역 polar 제거 금지** — 남미(uyuni 등) 회귀. slug waypoint(LPB `[180,12]` 등) 유지.

**arc corridor · 민감 공역 (A~E ✅ 2026-06-17)**

| 단계 | 파일·작업 | 내용 |
|------|-----------|------|
| **A** | [`globeFlightCinema.js`](../src/pages/Home/lib/globeFlightCinema.js) | long arc **아메리카 한정** · Antarctic 거부 |
| **B** | [`flightRouteCorridors.js`](../src/pages/Home/lib/flightRouteCorridors.js) | ICN→유럽·북대서양 `[125,33]`+DXB · 지중해 `[15,42]` · Atlantic 본토 제외 |
| **C** | [`flightRouteAvoidZones.js`](../src/pages/Home/lib/flightRouteAvoidZones.js) | bbox guard · **RU 목적지 skip** |
| **D** | [`scripts/audit-flight-arcs.mjs`](../scripts/audit-flight-arcs.mjs) | `npm run audit:flight-arcs` |
| **E** | `resolveFlightRoutePlan` · 5클릭 QA | overrides>corridor>guard |

**권역 기본 정책**: 서·북유럽 `[125,33]`→DXB→`[15,42]`→dest · 북대서양 섬·Caribbean(본토 제외) DXB · 남유럽 직항 · KEF/FAE MUC/CPH · 인도양 DXB · 미크로네시아 HNL · 남미 polar+waypoint · **RU 목적지 우회 없음**.

**5클릭 QA ✅**: paris·london·amsterdam · seychelles · iceland/faroe · moscow · uyuni · **bermuda**(DXB·남극 회피).

**다음 (선택)**: corridor/passenger Bar 라벨 · **2c** 여정 시뮬레이션(구현 보류) · (보류) GUM·Trip CTA.

### Phase 2d — 항공 경로 DB (2026-06-21 · **Phase 3 다음**)

**계획 SSOT**: [`flight-route-database-plan.md`](./flight-route-database-plan.md)

| 항목 | 내용 |
|------|------|
| **배경** | slug hub 67/271 · `uiPlace` 경로 불가 · hub 302개 한계 |
| **방향** | OurAirports+OpenFlights → Supabase · airportsIndex + Edge · arc 엔진 유지 |
| **Phase 0~2** | ✅ gap-report · airports · air_routes · graph precompute **193** |
| **Phase 3** | Edge `resolve-flight-route` · uiPlace — 제시어 **`항공경로-DB-Phase3-실행`** |
| **2b와 관계** | arc·corridor **유지** — hub/waypoint **자동 추론**으로 slug 수동 작업 대체 |

**2b slug-by-slug hub 추가는 Phase 2d Phase 3 완료 전까지 보류.**

**로컬 QA**

- ✅ kiribati·micronesia(HNL) · 인도양 DXB · 페로 CPH · 아이슬란드 MUC (2026-06-17)
- ✅ corridor A~E · 5클릭 QA · bermuda (2026-06-17)
- ✅ **tikal** ICN→LAX→GUA→FRS · gcmap 거리 일치 · 태평양 waypoint (2026-06-18)
- ✅ Bar UX — 글로우 · Trip CTA(모바일 위젯·데스크톱 링크) · 구간 비행시간 · arc leg 애니 (2026-06-18)

### Phase 2c — 상세 여정 시뮬레이션 (장기 · 미구현)

**북극성**: 플래너 `journey_timeline`을 **지도 위 선형 시간** 체험 — 항공 arc → 도로/렌터카 → 페리 등 단계별 포커스·모형·안내 카드.

**예시 (서울→길리메노)**: ICN 출발 포커스 → 항공 arc·기체 → DPS 도착 → 패당바이 렌터카/도로 → 페리 → 길리메노 · 상태바·지구본 **카드** · 닫기/다른 여행지 선택 시 **초기화**.

**추가**: 도착지 **숙소 카드** · 완성도 충분 후 단계적 구현(2b Bar·arc QA 선행).

**가능성**: 2b arc·Bar·플래너 SSOT 위에 **세그먼트 타입**(flight/ground/ferry)·`journey_timeline` STEP 매핑으로 **찬찬히 누적 구현 가능** — 2c는 별도 Phase로 문서만 유지.

**데이터 SSOT (자유 텍스트 OD 금지)**

| 항목 | SSOT |
|------|------|
| 출발 (써머리) | ICN — `TRIPCOM_DEFAULT_DEPARTURE_AIRPORT` |
| 도착(arc) | `resolveCinemaDestIata` → `preferredLinkIata` |
| 좌표 | `rentalAirportHubs.js` |
| 경유 hub | overrides `flightRouteHubIatas` · **`tripFlightArrivalIata`≠최종** · (목표) timeline auto-bake **중단** — 수동 overrides만 |
| 지리 waypoint | overrides `flightRouteWaypoints` [[lng,lat],…] (극/날짜변경선 등) |
| 비행 시간 | geodesic km ÷ 850km/h · Bar 구간 `~Nh` + `(총 Nh)` · 대권 항로 면책 문구 |
| 표시 경로 | `buildFlightRouteLine` — 3D slerp · 극우회 · unwrap · 측면 곡선(표시용) |

**구현 SSOT (2026-06-16)**

| 파일 | 역할 |
|------|------|
| [`globeFlightCinema.js`](../src/pages/Home/lib/globeFlightCinema.js) | `resolveFlightRoutePlan` · long arc · Antarctic 거부 |
| [`flightRouteCorridors.js`](../src/pages/Home/lib/flightRouteCorridors.js) | 유럽·북대서양 corridor · `resolveRegionalCorridorAnchors` |
| [`flightRouteAvoidZones.js`](../src/pages/Home/lib/flightRouteAvoidZones.js) | bbox guard · `coordsCrossAvoidZones` |
| [`scripts/audit-flight-arcs.mjs`](../scripts/audit-flight-arcs.mjs) | `npm run audit:flight-arcs` |
| [`globeFlightCinemaEngine.js`](../src/pages/Home/lib/globeFlightCinemaEngine.js) | arc·공항 마커·leg draw 스케줄 · close |
| [`FlightCinemaBar.jsx`](../src/pages/Home/components/FlightCinemaBar.jsx) | 구간 시간 · 항공권 확인(Trip) · **여행 플랜** · 닫기 |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | `isFlightCinemaLayer` |
| [`FlightCinemaContext.jsx`](../src/pages/Home/lib/FlightCinemaContext.jsx) | Provider · `requestFlightCinema` |
| [`HomePlaceCardSummary.jsx`](../src/pages/Home/components/HomePlaceCardSummary.jsx) | **유일** 진입 · `hasFlightRoute`/`isFlightRouteReady`(`globeRef.isFlightCinemaReady`+`flightPreview` · 250ms 폴링) |
| [`PlaceCardSummary.jsx`](../src/components/PlaceCard/modes/PlaceCardSummary.jsx) | 「준비 중…」비활성 · 활성 시에만 클릭 |
| [`Home/index.jsx`](../src/pages/Home/index.jsx) | `flightCinemaActive` |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | `startFlightCinema` · `isFlightCinemaReady`←`isFlightCinemaGlobeReady`+`ensure` · 스타일 전환·투어·시네마 중 false · tour 동시 불가 |

**상태·충돌**

- 모바일: 투어 중 써머리 숨김 · `TourMobileBar` (`beginGlobeTour`/`tourLaunchPending`) ✅
- 데스크톱: 투어 중「항공 경로」→ **endTour+2D+시네마** ✅ (2026-06-17)
- 3D tour 중 flight cinema **동시 재생 금지** · cinema active 중 새 장소/투어 → cinema 종료 ✅
- `GLOBE_VIEW.flyZoom`(2.35) **변경 금지**.
- 시네마 중 지구본 `opacity-100` (`isFlightCinemaActive`).
- 써머리「항공 경로」: **활성 = 시네마 레이어 준비** (`isFlightCinemaGlobeReady`/`ensureFlightCinemaGlobeReady`) — `mapReady`만으로 활성 **금지** · 스타일 전환 후 stale ready 방지(폴링 지속) (2026-06-18·**2026-06-22** fix).

**로컬 QA**

- ✅ uyuni LPB 태평양 arc · sapa HAN · danang · bali
- ✅ kiribati·micronesia(HNL) · 인도양 DXB · 페로 CPH · 아이슬란드 MUC · corridor·bermuda (2026-06-17)
- ✅ hub SSOT·overrides waypoint · san-diego·philadelphia·fernando·cancun/chichen · FlightCinemaBar 「여행 플랜」 (2026-06-18)
- ✅ avoid-zone·Atlantic bbox·29 slug waypoint · **`audit:flight-arcs` 0** · LA 직항 (2026-06-18)

### Phase 3 — 권역 hull + 주변 POI (2026-06-16 ✅ UX · 데이터 확장)

**트리거**: `focusSlug`가 [`travelSpotClusters.json`](../src/pages/Home/data/travelSpotClusters.json) 멤버 · 줌 ≥ 3 또는 `TOUR_READY` · 1i Isochrone과 **별개**.

| 파일 | 역할 |
|------|------|
| [`globeClusterBoundaries.js`](../src/pages/Home/lib/globeClusterBoundaries.js) | convex hull fill·점선 · sibling POI dot/label · 클릭 → `onMarkerClick` |
| [`GlobeClusterLegend.jsx`](../src/pages/Home/components/GlobeClusterLegend.jsx) | 좌하단 **탭→목록→이동** — `getRelatedTravelSpots` · `onMarkerClick` |
| [`travelSpotClusters.json`](../src/pages/Home/data/travelSpotClusters.json) | **31 권역 · 116 slug** (2026-06-16) — slug당 1클러스터 |
| [`travelSpotClusters.js`](../src/utils/travelSpotClusters.js) | `getClusterMembersWithCoords` · `getRelatedTravelSpots` |
| [`RelatedTravelSpots.jsx`](../src/components/PlaceCard/RelatedTravelSpots.jsx) | PlannerTab 동일 SSOT · 가로 스크롤바·드래그 |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | `gateo-cluster-*` 지명 정책 숨김 제외 |

**시각**: amber hull · sibling POI · 좌하단 **펼침형 권역 카드**(1i 범례와 스택).

**데이터 확장 기준**: 같은 광역·다른 관문 IATA · `travelSpotAirports.json` · overrides `searchHintIatas` — 일지 [`2026-06-16-project-log.md`](2026-06-16-project-log.md).

**로컬 QA**: `patagonia`·`palawan`·`bali`·투어 `TOUR_READY` — hull·범례 목록·플래너 `RelatedTravelSpots` · 드래그 스크롤.

---

## 다음 세션 제시어

**항공 시네마 — Bar 디자인·항로 최적화 (Phase 2b 후속)**

```
@.ai-context.md @plans/2026-06-18-project-log.md @plans/2026-06-02-globe-enrichment-plan.md

항공-시네마-Bar·항로

Phase 2b 후속 — FlightCinemaBar 디자인 · 항로 arc 최적화(audit·overrides).
모바일 시네마=Bar+arc만 · 데스크톱 연관·카테고리 클릭=closeFlightCinema. toolkit·flyZoom 변경 금지.
```

**Mapbox 참고**: [add-terrain](https://docs.mapbox.com/mapbox-gl-js/example/add-terrain) · [free-camera](https://docs.mapbox.com/mapbox-gl-js/example/free-camera) · Studio 카메라 경로

**Keyframe 스키마** (Studio → JSON):

```json
{ "center": [lng, lat], "zoom": 12.8, "pitch": 58, "bearing": -40, "duration": 6000, "ease": true, "orbit": true }
```

첫 프레임 `duration: 0` — 즉시 스냅. `keyframes` 있으면 `template`/`orbit` 무시.

---

## Phase 1~4 진행 원칙

1. **한 커밋 = 한 검증 가능 단위** — Gate QA 통과 후 다음 커밋.
2. **3D 투어는 flyTo-only 금지** — terrain·pitch ON은 버튼 시에만 · `easeTo` bearing 선회.
3. **홈 2D flyTo 줌** — `GLOBE_VIEW.flyZoom`(2.35) **임의 변경 금지** (§Phase 2).
4. **버튼은 전 여행지 노출** — 품질은 `globeLandmarks`·category template·`keyframes`로 끌어올림 (도심-only fallback 지양).
5. **일괄 WIP merge 금지**.

### Phase 2~4

- **2**: **✅** — 공유 URL 복원 · 우상단 3버튼 · flyTo 2.35 고정 · +/−/나침반 폐기
- **2b**: **WIP→arc audit 0** — hub SSOT·Bar·Atlantic bbox·waypoint batch ✅ · **2c** 문서만 · (선택) Bar corridor 라벨
- **3**: **✅** — hull·POI · `GlobeClusterLegend` · `travelSpotClusters.json` 31권역
- **4**: MRT `fetch-mrt-products` · `HotelExploreSheet` (API 합의 후)

---

## 폐기·참고만

- urban **landmark POI + 3D buildings** — Mapbox fill-extrusion 한계로 **cityOrbit**으로 대체
- [`plans/archive/globe/globe-optimization-plan.md`](archive/globe/globe-optimization-plan.md) — legacy three-globe
- 2026-06-02 WIP 일괄 (`globeTourEngine` flyTo-only) — reset 후 본 계획으로 재작성
