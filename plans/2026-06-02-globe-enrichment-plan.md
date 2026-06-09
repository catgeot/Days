# 홈 지구본 풍부화 마스터 계획 (2026-06-02)

**맥락**: [`.ai-context.md`](../.ai-context.md) · **일지**: [`2026-06-04-project-log.md`](2026-06-04-project-log.md) · 직전 [`2026-06-03-project-log.md`](2026-06-03-project-log.md)

**갱신**: 2026-06-09 — Phase **2~3** 초안 커밋 · Phase 2 **UX·배치 WIP** (다음 세션)

**일지**: [`2026-06-09-project-log.md`](2026-06-09-project-log.md) · 직전 [`2026-06-08-project-log.md`](2026-06-08-project-log.md)

---

## 제품 목표 (Phase 1 북극성)

**클릭하는 순간 그 여행지의 감성(지형·스케일)을 맛볼 수 있는 카메라 경로.**

- 사용자: 여행 전 **간접 경험** · **데스크톱(`lg+`)** 투어 중에도 Summary **풀 카드**(설명·3D 투어·MOONi) · **모바일(`<lg`)** 투어 중 Summary 숨김 + 헤더 **`TourMobileBar`** (로고 옆 · 글로우 · Skip/2D).
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
| **2** | 탐색 내비 (구글 지도형) | **WIP** — `GlobeExploreNavControls` · UX·배치 미완 |
| **3** | 클러스터 경계·명소 POI | **WIP** — hull·POI 빌드 OK · QA·튜닝 대기 |
| **4** | 숙소 탐색 (MRT 시험 → 플래너 연동) | 장기 |

---

## Phase 0 구현 SSOT (완료)

| 파일 | 역할 |
|------|------|
| [`globeMarkerLayers.js`](../src/pages/Home/lib/globeMarkerLayers.js) | GeoJSON source · **지명(symbol) 레이어** · active-ring(선택 핀) · hit-test — **여행지(major)는 점 없이 지명만** |
| [`globeZoomPolicy.js`](../src/pages/Home/lib/globeZoomPolicy.js) | zoom tier · merge/collision 임계값 · `HIGH_ZOOM_FULL_REVEAL`(≥3) |
| [`globeSpotVisibility.js`](../src/pages/Home/lib/globeSpotVisibility.js) | **`denseRegion` 밀집 권역만** 줌·tier 단계 노출 · `denseRegion` 없음(섬·희소)은 **전 tier 노출** |
| [`globeCategoryFocus.js`](../src/pages/Home/lib/globeCategoryFocus.js) | 카테고리 버튼 → 해당 테마 **카메라 pan** (줌 인 상태 유지 · 마커 필터/흐림 없음) |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | Mapbox 행정·도시 지명 (줌≥4·눈 ON) — gateo 지명과 별도 |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | 전 카테고리 여행지 노출 · 레이어 bootstrap · 한글 지명 분기 |

### 홈 지구본 마커·노출 정책 (2026-06-07)

| 항목 | 정책 |
|------|------|
| **여행지 범위** | 카테고리와 무관 **전체 `TRAVEL_SPOTS`** (구: 카테고리 필터·`showOnGlobe` 숨김 해제) |
| **표시 형태** | major = **카테고리 색 지명 텍스트** (dot 제거) · 탐색/저장 핀 = 점+라벨 |
| **밀집 vs 섬** | `travelSpots.denseRegion` **있음** → 줌 tier 1→2→3 · **없음** → tier 구분 없이 노출 |
| **줌 ≥ 3** | tier 1~3 전체 · 충돌 병합 완화 (`HIGH_ZOOM_FULL_REVEAL`) |
| **카테고리 버튼** | 마커 숨김/강조 **없음** — tier1 인기 가중 중심으로 **부드러운 flyTo** · AI·저장 trip `category` 태그 유지 |
| **지명 겹침** | Mapbox `text-allow-overlap: false` + `symbol-sort-key`(tier 1 우선) |

**데이터**: 새 대륙 밀집 권역 추가 시 `denseRegion` 문자열 부여(예: `western-europe`). 섬·단독 목적지는 `null` 유지.

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
| [`index.jsx`](../src/pages/Home/index.jsx) | `isTourCinema` = 투어+`<lg` → Summary 숨김 · 데스크톱 투어 시 `isCompact` prop 없음 |
| [`TourMobileBar.jsx`](../src/pages/Home/components/TourMobileBar.jsx) | 모바일 투어 시네마 — 헤더(로고 옆) · 국가/지명 + Skip/2D · `index.css` 글로우 |
| [`resolveHomeGlobeEngine.js`](../src/pages/Home/components/resolveHomeGlobeEngine.js) | PROD→mapbox · DEV→mapbox(URL 무제한 `.env.local` 토큰) · `?globe=legacy` |

**동작 요약**

- Summary **3D 투어** → `resolveGlobeTourConfig`: **landmark center** → 없으면 category template + `travelSpots` 좌표.
- **자연/휴양**: `mountainOrbit` · `coastalOrbit` 우선 — 칸쿤(호텔존 해변)·사파(계곡)·밴프(루이스 호) 등 `globeLandmarks`에 뷰포인트 등록.
- **도시**: `cityOrbit` — fill-extrusion buildings는 기본 OFF.
- **알프스**: `alpineVillageOrbit` (체르마트 등).
- **수동 경로**: `keyframes: [...]` — Mapbox Studio export.
- Skip · **2D 복귀** · 모바일: Summary 숨김 · 지도 탭 탐색 차단 · MOONi FAB·카테고리 내비 숨김.
- **투어 중 지명**: `globeMapboxLabelPolicy`와 동일(눈 ON·줌≥4) · **지명·gateo 마커 클릭** 가능 · 빈 지도 탭만 차단 (`HomeGlobeMapbox` `handleGlobeClickInternal`). **지명 클릭 UI**: 역지오코딩 국가·라벨명 · `uiPlace`로 툴킷 alias·좌표 스냅 분리 — [`travel-spots-management.md`](travel-spots-management.md) §8.

### 데이터 역할 (투어 vs 여행지 SSOT)

| 데이터 | 투어에 쓰는가 | 비고 |
|--------|---------------|------|
| `globeLandmarks.json` | **카메라 center·template** | 대표 명소·해변·계곡 등 큐레이션 |
| `travelSpots.js` | 폴백 center·category만 | `lat`/`lng` 변경 시 공항·거리 매칭 영향 — 무작정 이동 금지 |
| `citiesData.js` | 검색·글로브 커버 | 투어 1순위 SSOT 아님 |
| `keywordData.js` | 검색 동의어 | 좌표 없음 |

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

**트리거**: 3D 투어 `TOUR_READY` 직후 · 투어 카메라 center 기준 · **2D 복귀** 시 제거.

| 파일 | 역할 |
|------|------|
| [`globeReachBoundaries.js`](../src/pages/Home/lib/globeReachBoundaries.js) | Mapbox **Isochrone** fetch · GeoJSON line 레이어 · 오프라인 원형 폴백 · `isReachBoundaryLayer` |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | `loadReachBoundaries` · 범례 UI · `easeCameraForReachReveal`(고 pitch 완화) |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | `gateo-reach-*` 레이어 **지명 정책 숨김 제외** (표시 후 사라짐 회귀 방지) |

**시각 정책** (2026-06-09 조정 — TravelTime·Mapbox·Geoapify 등 Isochrone fill 관행 반영)

| 모드 | Isochrone | 표시 |
|------|-----------|------|
| **도보** 20분 | `walking` · `polygons=false` · detail | **초록 점선** — 보행 경로 |
| **차량** 30분 | `driving` · `polygons=true` · `generalize=500m` | **파란 반투명 영역**(fill 16%) + 외곽 실선 — **운전 도달 영역** (도로망 기준, 바다 자연 제외) |

- 도보 `line-dasharray`는 **paint** 속성 (layout 아님).
- 차량: 거리 원·도로 지그재그 외곽선만 단독 사용 **금지** (의미·가독성 한계).
- API 실패 시 geodesic 원형 폴백(도보 1.6km · 차량 24km).
- **범례**: `TOUR_READY` · `createPortal` 좌하단 · 모바일 투어 시네마에서도 표시 (`hideTourControls`와 분리).

**로컬 QA**: 다낭·나트랑·사파 — Skip/종료 후 경계 유지 Pass · 차량 fill·범례 확인.

**후속 (선택)**: slug별 분·`generalize`·fill opacity 튜닝 · Directions API 도로 중심선 · Phase 3 클러스터 hull·POI와 병행.

### Phase 2 — 탐색 지도 내비 (2026-06-09 WIP)

**트리거**: 줌 ≥ `HIGH_ZOOM_FULL_REVEAL`(3.0) · 2D · 투어·zen·모바일 시네마(`hideTourControls`) 제외 · 여행지 flyTo도 zoom 3.0.

| 파일 | 역할 |
|------|------|
| [`globeExploreNav.js`](../src/pages/Home/lib/globeExploreNav.js) | `shouldShowGlobeExploreNav` · explore 줌 auto-rotate 정지 · `readGlobeShareViewFromUrl` |
| [`GlobeExploreNavControls.jsx`](../src/pages/Home/components/GlobeExploreNavControls.jsx) | **+ / − / 나침반** · `z-[70]` (Mapbox 내장 `NavigationControl`은 z-0 가림 → 폐기) |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | `hasPlaceSummary` · 공유 URL 복원 |

**로컬 QA (2026-06-09 · 미해결 — 다음 세션)**

| 환경 | 관찰 |
|------|------|
| **모바일** | **+만** 보임 (−·나침반 클리핑·겹침 추정) |
| **데스크톱** | +·−·나침반 보이나 **Summary 열리면 가려짐** (카드 `z-60`·우하단 점유 vs `hasPlaceSummary` 위치 보정 부족) |

**다음 세션 방향 (코드 수정 전 합의)**

1. **배치 SSOT** — Summary·MOONi FAB·카테고리 내비·좌하단 범례(1i·3)와 겹치지 않는 고정 슬롯 (후보: 상단 공유/GPS/우주 버튼 열 **통합** · 또는 Summary **좌측 상단** 등).
2. **버튼 정리** — 기존 `HomeGlobeMapbox` 우상단 3종(공유·현재위치·우주)과 **중복·역할 분리** — zoom/나침반만 남기거나 한 줄 toolbar로 merge.
3. **모바일** — safe-area·카테고리 `bottom-8` 바와 수직 스택 높이 재계산.

### Phase 3 — 권역 hull + 주변 POI (2026-06-09 WIP)

**트리거**: `focusSlug`가 [`travelSpotClusters.json`](../src/pages/Home/data/travelSpotClusters.json) 멤버 · 줌 ≥ 3 또는 `TOUR_READY` · 1i Isochrone과 **별개**.

| 파일 | 역할 |
|------|------|
| [`globeClusterBoundaries.js`](../src/pages/Home/lib/globeClusterBoundaries.js) | convex hull fill·점선 · sibling POI dot/label · 클릭 → `onMarkerClick` |
| [`travelSpotClusters.js`](../src/utils/travelSpotClusters.js) | `getClusterMembersWithCoords` |
| [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js) | `gateo-cluster-*` 지명 정책 숨김 제외 |

**시각**: amber hull(10% fill + dash line) · 관문 sibling 노란 핀·라벨 · 좌하단 권역 범례(1i 범례와 스택).

**로컬 QA 권장**: `/` → `patagonia`·`iceland`·`borneo` 클러스터 slug 선택 → 줌 인 hull·POI · POI 탭 전환 · 파타고니아+투어 후 hull+reach 동시 노출.

---

## 다음 세션 제시어

```
@.ai-context.md @plans/2026-06-09-project-log.md @plans/2026-06-02-globe-enrichment-plan.md

홈 지구본 Phase 2 UX — 탐색 내비 배치·버튼 통합 (Phase 3 hull QA는 2 정리 후).
- 현재: GlobeExploreNavControls (+/−/나침반) z-70 · 줌≥3 · flyTo 3.0.
- QA: 모바일 +만 보임 · PC Summary 열리면 컨트롤 가려짐 — §Phase 2 표 참고.
- 과제: Summary·MOONi·범례와 겹치지 않는 슬롯 · 우상단 공유/GPS/우주와 merge·역할 분리 합의 후 구현.
- Phase 3: patagonia/iceland hull·POI smoke · Phase 1g gateo 스모크는 병행 가능.
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
3. **버튼은 전 여행지 노출** — 품질은 `globeLandmarks`·category template·`keyframes`로 끌어올림 (도심-only fallback 지양).
4. **일괄 WIP merge 금지**.

### Phase 2~4

- **2**: **WIP** — [`GlobeExploreNavControls.jsx`](../src/pages/Home/components/GlobeExploreNavControls.jsx) · 배치·기존 3버튼 통합 **다음 세션**
- **3**: **WIP** — [`globeClusterBoundaries.js`](../src/pages/Home/lib/globeClusterBoundaries.js) · hull·sibling POI · QA 대기
- **4**: MRT `fetch-mrt-products` · `HotelExploreSheet` (API 합의 후)

---

## 폐기·참고만

- urban **landmark POI + 3D buildings** — Mapbox fill-extrusion 한계로 **cityOrbit**으로 대체
- [`plans/archive/globe/globe-optimization-plan.md`](archive/globe/globe-optimization-plan.md) — legacy three-globe
- 2026-06-02 WIP 일괄 (`globeTourEngine` flyTo-only) — reset 후 본 계획으로 재작성
