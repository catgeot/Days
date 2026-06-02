# 2026-06-02 프로젝트 일지 — 홈 지구본 Phase 0 → Phase 1 WIP

**직전**: [`2026-06-01-project-log.md`](2026-06-01-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## Phase 0 (완료)

- HTML `<Marker>` → Mapbox GeoJSON(`globeMarkerLayers.js`) — jitter 제거 · 클릭·Summary QA Pass.
- 한글 지명: Standard vs satellite 분기.
- `verify-globe-engine` gateo-spots 검증 **OK**.

## Phase 1 (1a — 커밋 0692e71)

- **구현**: `globeMode` · `globe3dBootstrap`(DEM+타임아웃) · `globeLandmarks.json`(8 slug) · `landmarkOrbit` · `globeTourEngine` · Summary 「3D 투어」· 투어 UI 라벨 숨김.
- **hit-test**: 파리 클릭 → 런던 카드 — 클릭 거리·`resolveTravelSpotFromCoords` 보정.
- **로딩 hang**: 지구본 회전으로 `idle` 미발생 — `tourActiveRef` + bootstrap 타임아웃 fix.
- **QA — 2D 복귀**: gateo **마커 라벨** 미복원 — `globeTourUi.restoreGlobeMapUi` fix.

## Phase 1 (1b~1c — 이번 세션, 커밋 예정)

### 구현

- `globe3dBootstrap`: optional 3D buildings (fill-extrusion) · per-slug `exaggeration` · dual wait (terrain/buildings).
- `globeTourTemplates`: `cityOrbit` · `alpineVillageOrbit` · `smoothOrbit` 옵션.
- `globeLandmarks.json`: urban 5곳 → **cityOrbit**(도시 중심) · **zermatt** 추가 · 후지산 smooth 튜닝 · buildings **미사용**.

### QA 피드백 → 방향 전환

| 피드백 | 결정 |
|--------|------|
| 파리 buildings = 투명 프레임 | urban은 **도시 선회**, buildings OFF |
| 후지산 매끄럽지 않음 | template 완화 + **Studio keyframe** 후보 (`keyframes` SSOT) |
| 체르마트 마을+산 | `alpineVillageOrbit` · peakOffset |
| 여러 여행지 세부 조정 | slug별 JSON — **`tourReady` gate**로 품질 관리 |

### 제품 목표 정렬 (세션 말)

> 「기능 있음」≠「언제든 부드럽게 맛볼 수 있음」  
> Phase 1 완료 = **tour-ready 카탈로그** + 버튼 gate + slug별 QA Pass.

## 다음 세션 (1d~)

1. **`tourReady` gate** — `PlaceCardSummary` / `canStartGlobeTour` 큐레이션만 노출
2. **9 slug QA** — 승격/강등 (`tourReady: true/false`)
3. **후지산** — Mapbox Studio → `keyframes` 변환·저장
4. **Phase 1g** — 2D 복귀·Skip·모바일·gateo.kr 스mo크 → Phase 1 완료

**제시어**: 계획 문서 「Phase 1 잔여」·「tour-ready 승격 기준」 참조.
