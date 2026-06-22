# 2026-06-22 프로젝트 일지

**이전**: [`2026-06-21-project-log.md`](./2026-06-21-project-log.md)

## 홈 지구본 — 마지막 방문 핀 유지

- **증상**: 3D 투어 **X**·써머리 닫기 후 `selectedLocation` null → `activePinId` 소실 · 방문 지명 `isGhost`(opacity 0.55) · 핀 누락(홈 복귀 경로)
- **수정**: [`index.jsx`](../src/pages/Home/index.jsx) — `globeActivePinId` · `dismissPlaceSelectionKeepGlobePin` · `goHomeFromPlace`에 `addScoutPin`
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 1 X·핀 정책 갱신
- **QA**: 사용자 확인 ✅

## 써머리「항공 경로」버튼 — 준비 판정 정확도 fix

- **증상**: `mapReady`만 true면 버튼 활성 · 클릭 무반응(시네마 레이어 미등록·스타일 전환 후 stale ready)
- **수정**: `HomeGlobeMapbox` `isFlightCinemaReady` → `isFlightCinemaGlobeReady`+`ensure` · 스타일 전환·투어·시네마 중 false · `HomePlaceCardSummary` 준비 폴링 지속(ready→not-ready 복귀)
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2c 준비 판정 갱신
- **QA**: 사용자 확인 ✅

## 홈 지구본 — 첫 진입 면 로테이션 fix

- **증상**: 새로고침·첫 `/` 진입 시 항상 default(0°,20°) → 아조레스 제도 노출 · `categoryFaceEpoch` flyTo 미실행
- **원인**: `onLoad`가 `prevHighlightCategoryRef`를 선동기화 + `initialViewState`가 `GLOBE_VIEW.default` 고정
- **수정**: [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) — 랜덤 카테고리 중심 `initialGlobeViewState` · share 복원 후에만 prev ref 동기화
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) 카테고리 5면 진입·주의 갱신
