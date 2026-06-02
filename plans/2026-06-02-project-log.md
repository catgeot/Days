# 2026-06-02 프로젝트 일지 — 홈 지구본 Phase 0 → Phase 1 WIP

**직전**: [`2026-06-01-project-log.md`](2026-06-01-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## Phase 0 (완료)

- HTML `<Marker>` → Mapbox GeoJSON(`globeMarkerLayers.js`) — jitter 제거 · 클릭·Summary QA Pass.
- 한글 지명: Standard vs satellite 분기.
- `verify-globe-engine` gateo-spots 검증 **OK**.

## Phase 1 WIP (1a — 로컬 QA)

- **구현**: `globeMode` · `globe3dBootstrap`(DEM+타임아웃) · `globeLandmarks.json`(8 slug) · `landmarkOrbit` · `globeTourEngine` · Summary 「3D 투어」· 투어 UI 라벨 숨김.
- **hit-test**: 파리 클릭 → 런던 카드 — 클릭 거리·`resolveTravelSpotFromCoords` 보정.
- **로딩 hang**: 지구본 회전으로 `idle` 미발생 — `tourActiveRef` + bootstrap 타임아웃 fix.
- **QA — 파리**: 에펠탑이 **DEM terrain 뭉치**처럼 보임 (urban · buildings 미적용).
- **QA — 후지산**: terrain 선회 **그럴듯**.
- **QA — 2D 복귀**: gateo **마커 라벨** 미복원(dot만) — `globeTourUi.restoreGlobeMapUi` fix.

## 다음 (1b~)

- 3D Buildings on-demand · urban exaggeration·orbit 튜닝 · Phase 1d QA → Phase 2 explore.
