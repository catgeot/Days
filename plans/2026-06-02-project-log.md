# 2026-06-02 프로젝트 일지 — 홈 지구본 Phase 0

**직전**: [`2026-06-01-project-log.md`](2026-06-01-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

- **Phase 0 완료**: HTML `<Marker>` → Mapbox GeoJSON 레이어(`globeMarkerLayers.js`) — 자전 jitter 제거 · 클릭·Summary 카드 QA Pass.
- **한글 지명**: `bright`(Standard) → `MapboxLanguage` + `setConfigProperty language:ko` · `deep`/`neon`(satellite) → place-label `name_ko` coalesce.
- **버그 수정**: 선택 시 마커 사라짐(필터 분리)·레이어 매 styleData 재생성 오류·satellite에서 `config is not valid` 콘솔 노이즈.
- **빌드**: `verify-globe-engine` gateo-spots 레이어 검증 추가 · **OK**.
- **다음**: Phase 1 — on-demand 3D terrain 투어(계획서 §Phase 1, PlaceMiniMap 패턴).
