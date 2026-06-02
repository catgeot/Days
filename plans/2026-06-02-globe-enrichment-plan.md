# 홈 지구본 풍부화 마스터 계획 (2026-06-02)

**맥락**: [`.ai-context.md`](../.ai-context.md) · **일지**: [`2026-06-02-project-log.md`](2026-06-02-project-log.md)

---

## 제품 목표 (Phase 1 북극성)

**「3D 투어 버튼이 있다」가 아니라, 클릭하는 순간 그 여행지를 부드럽게 맛볼 수 있는 상태.**

- 사용자: 여행 전 **간접 경험**(분위기·지형·스케일 미리보기)
- 엔지니어링: slug별 **tour-ready** 큐레이션 — QA 통과 전에는 버튼 미노출
- 품질 기준: cold start·재방문 모두 **끊김 없는 카메라 경로** + acceptable terrain 로딩

---

## 목표 (4+2)

| # | 기능 | 상태 |
|---|------|------|
| **0-A** | 마커·지명 통합 (GeoJSON, jitter 제거) | **완료** |
| **0-B** | 지구본 지명 한글화 | **완료** |
| **1** | 3D 투어 (Summary → 여행지 맛보기 선회) | **WIP** (1a~1c 커밋) |
| **2** | 탐색 내비 (구글 지도형) | 대기 |
| **3** | 클러스터 경계·명소 POI | 대기 |
| **4** | 숙소 탐색 (MRT 시험 → 플래너 연동) | 장기 |

---

## Phase 0 구현 SSOT (완료)

| 파일 | 역할 |
|------|------|
| [`globeMarkerLayers.js`](../src/pages/Home/lib/globeMarkerLayers.js) | GeoJSON source · dot/label/active-ring 레이어 · hit-test(클릭 거리 보정) |
| [`globeZoomPolicy.js`](../src/pages/Home/lib/globeZoomPolicy.js) | zoom tier · merge/collision 임계값 |
| [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) | 레이어 bootstrap · 한글 지명 분기 |

---

## Phase 1 구현 SSOT (WIP — 1a~1c)

| 파일 | 역할 |
|------|------|
| [`globeMode.js`](../src/pages/Home/lib/globeMode.js) | `globe2d` ↔ `tour_*` 상태 머신 |
| [`globe3dBootstrap.js`](../src/pages/Home/lib/globe3dBootstrap.js) | on-demand DEM · optional buildings · per-slug exaggeration · 타임아웃 |
| [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json) | slug별 center · template · orbit · (향후) `tourReady` · `keyframes` |
| [`globeTourTemplates.js`](../src/pages/Home/lib/globeTourTemplates.js) | `cityOrbit` · `alpineVillageOrbit` · `mountainOrbit` · `coastalOrbit` · `smoothOrbit` |
| [`globeTourEngine.js`](../src/pages/Home/lib/globeTourEngine.js) | terrain ready → keyframe 재생 · `keyframes` 있으면 템플릿 skip |
| [`globeTourUi.js`](../src/pages/Home/lib/globeTourUi.js) | 투어 중 Mapbox·gateo 라벨 숨김 · 복귀 시 복원 |
| [`PlaceCardSummary.jsx`](../src/components/PlaceCard/modes/PlaceCardSummary.jsx) | 「3D 투어」버튼 (현재: 좌표만 있으면 노출 → **tour-ready gate로 변경 예정**) |

**동작 요약**

- Summary **3D 투어** → DEM on-demand → **bearing 선회**(드론샷). flyTo-only 금지.
- **도시**: 랜드마크 POI 대신 **도시 중심 `cityOrbit`** (3D buildings 한계 회피).
- **알프스 마을**: `alpineVillageOrbit` — 마을+능선 동시 프레임.
- **수동 경로**: `globeLandmarks.json` → `keyframes: [...]` — Mapbox Studio export 변환 후 재생.
- 투어 중 place·gateo 라벨 숨김 · Skip · **2D로 복귀**.

### tour-ready 승격 기준 (다음 세션)

| # | 조건 |
|---|------|
| 1 | 카메라 — 검증된 template **또는** Studio `keyframes` |
| 2 | 지형 — `exaggeration`·center QA Pass |
| 3 | UX — Skip · 2D 복귀 · 모바일 회귀 OK |
| 4 | `"tourReady": true` — 위 3항 통과 후만 JSON·버튼 노출 |

### 로컬 QA 이력

| 세션 | 항목 | 결과 |
|------|------|------|
| 1a | 후지산 | terrain 선회 그럴듯 |
| 1a | 파리 에펠탑 | DEM 뭉치 — urban landmark 한계 |
| 1a | 2D 복귀 gateo 라벨 | fix (`globeTourUi`) |
| 1b~c | 파리 buildings | **투명 프레임** — photoreal 불가 → **cityOrbit 전환, buildings OFF** |
| 1b~c | 후지산 | template smooth 튜닝 — **여전히 타일 로딩 끊김** → Studio keyframe 후보 |
| 1b~c | 체르마트(zermatt) | 마을 포커스 나쁘지 않음 → `alpineVillageOrbit` 추가 |

### Phase 1 잔여 (다음 세션)

| # | 작업 | 목표 |
|---|------|------|
| **1d** | **`tourReady` gate** — `canStartGlobeTour` → 큐레이션 slug만 버튼 노출 | 기능 ≠ 보여줄 수 있음 분리 |
| **1e** | 1차 카탈로그 QA·승격 — paris · mount-fuji · zermatt 등 9 slug | cold·warm 재생 Pass 목록 |
| **1f** | **후지산 Studio keyframe** → `keyframes` 배열 저장·변환 가이드 | 맛보기 품질 확보 |
| **1g** | 2D 복귀·모바일·Skip 회귀 · gateo.kr 스mo크 | Phase 1 완료 선언 |
| *(선택)* | idle terrain pre-warm (tour-ready slug) | cold start 개선 |

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
3. **tour-ready 미달 slug는 버튼 숨김** — generic fallback으로 “기능 있음” 체크 금지.
4. **일괄 WIP merge 금지**.

### Phase 2~4

- **2**: explore + `NavigationControl`
- **3**: [`travelSpotClusters.json`](../src/pages/Home/data/travelSpotClusters.json) hull 경계선
- **4**: MRT `fetch-mrt-products` · `HotelExploreSheet` (API 합의 후)

---

## 폐기·참고만

- urban **landmark POI + 3D buildings** — Mapbox fill-extrusion 한계로 **cityOrbit**으로 대체
- [`plans/archive/globe/globe-optimization-plan.md`](archive/globe/globe-optimization-plan.md) — legacy three-globe
- 2026-06-02 WIP 일괄 (`globeTourEngine` flyTo-only) — reset 후 본 계획으로 재작성
