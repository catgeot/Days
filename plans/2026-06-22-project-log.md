# 2026-06-22 프로젝트 일지

**이전**: [`2026-06-21-project-log.md`](./2026-06-21-project-log.md)

## 홈 지구본 — 마지막 방문 핀 유지

- **증상**: 3D 투어 **X**·써머리 닫기 후 `selectedLocation` null → `activePinId` 소실 · 방문 지명 `isGhost`(opacity 0.55) · 핀 누락(홈 복귀 경로)
- **수정**: [`index.jsx`](../src/pages/Home/index.jsx) — `globeActivePinId` · `dismissPlaceSelectionKeepGlobePin` · `goHomeFromPlace`에 `addScoutPin`
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 1 X·핀 정책 갱신
- **QA**: 사용자 확인 ✅
