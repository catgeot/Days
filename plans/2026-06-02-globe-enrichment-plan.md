# 홈 지구본 풍부화 마스터 계획 (2026-06-02)

**맥락**: [`.ai-context.md`](../.ai-context.md) · **일지**: [`2026-06-02-project-log.md`](2026-06-02-project-log.md)

---

## 목표 (4+2)

| # | 기능 | 상태 |
|---|------|------|
| **0-A** | 마커·지명 통합 (GeoJSON, jitter 제거) | **완료** |
| **0-B** | 지구본 지명 한글화 | **완료** |
| **1** | 3D 투어 (Summary 버튼 → 랜드마크 드론 선회) | **WIP** (1a 커밋) |
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

## Phase 1 구현 SSOT (WIP — 1a)

| 파일 | 역할 |
|------|------|
| [`globeMode.js`](../src/pages/Home/lib/globeMode.js) | `globe2d` ↔ `tour_*` 상태 머신 |
| [`globe3dBootstrap.js`](../src/pages/Home/lib/globe3dBootstrap.js) | on-demand DEM · 타임아웃(회전 중 idle 미발생 대비) |
| [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json) | POC 8 slug · 랜드마크 center · orbit 옵션 |
| [`globeTourTemplates.js`](../src/pages/Home/lib/globeTourTemplates.js) | `landmarkOrbit` / `mountainOrbit` / `coastalOrbit` |
| [`globeTourEngine.js`](../src/pages/Home/lib/globeTourEngine.js) | terrain ready → easeTo bearing 선회 |
| [`globeTourUi.js`](../src/pages/Home/lib/globeTourUi.js) | 투어 중 Mapbox·gateo 라벨 숨김 · 복귀 시 복원 |
| [`PlaceCardSummary.jsx`](../src/components/PlaceCard/modes/PlaceCardSummary.jsx) | 「3D 투어」버튼 |

**동작 요약**

- Summary **3D 투어** → DEM on-demand → 랜드마크 **center 고정 + bearing 선회**(드론샷). flyTo-only 금지.
- 투어 중 place·gateo 라벨 숨김 · Skip · **2D로 복귀**.

**로컬 QA (2026-06-02)**

| 항목 | 결과 |
|------|------|
| 파리 → 에펠탑 | terrain만으로는 **산맥처럼 솟음** — urban landmark 한계 |
| 후지산 | **그럴듯** (DEM 적합) |
| 2D 복귀 후 gateo 마커 라벨 | **버그** — dot만 보임 → `globeTourUi` 복원 fix (1a 커밋) |
| 파리 클릭 → 런던 카드 | **fix** — hit-test 거리·좌표 SSOT 보정 |

### Phase 1 잔여 (다음 세션 1b~1d)

| # | 작업 | 목표 |
|---|------|------|
| **1b** | 3D **Buildings** on-demand (`fill-extrusion`, PlaceMiniMap 패턴) | 파리 등 urban 실루엣 |
| **1c** | `globeLandmarks.json` per-slug orbit·exaggeration 튜닝 | urban DEM exaggeration ↓ |
| **1d** | 2D 복귀·모바일·Skip 회귀 QA · gateo.kr 스모크 | Phase 1 완료 선언 |

**Mapbox 참고**: [add-terrain](https://docs.mapbox.com/mapbox-gl-js/example/add-terrain) · [free-camera](https://docs.mapbox.com/mapbox-gl-js/example/free-camera) · Studio 카메라 경로

---

## Phase 1~4 진행 원칙

1. **한 커밋 = 한 검증 가능 단위** — Gate QA 통과 후 다음 커밋.
2. **3D 투어는 flyTo-only 금지** — terrain·pitch ON은 버튼 시에만 · `easeTo` bearing 선회.
3. **일괄 WIP merge 금지**.

### Phase 2~4

- **2**: explore + `NavigationControl`
- **3**: [`travelSpotClusters.json`](../src/pages/Home/data/travelSpotClusters.json) hull 경계선
- **4**: MRT `fetch-mrt-products` · `HotelExploreSheet` (API 합의 후)

---

## 폐기·참고만

- [`plans/archive/globe/globe-optimization-plan.md`](archive/globe/globe-optimization-plan.md) — legacy three-globe
- 2026-06-02 WIP 일괄 (`globeTourEngine` flyTo-only) — reset 후 본 계획으로 재작성
