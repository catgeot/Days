# 2026-06-07 프로젝트 일지 — 지구본 마커·노출 정책

**직전**: [`2026-06-06-project-log.md`](2026-06-06-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## 3D 투어 — Mapbox 지명·행정선·클릭

- **배경**: 2026-06-04 몰입감 강화로 투어 중 지명·구분선 숨김 → 실사용 시 위치 정보가 도움이 됨.
- **조치**: `globeMapboxLabelPolicy`가 투어 중에도 `isPinVisible`·줌 정책 그대로 적용. `globeTourUi`는 cityOrbit 3D 랜드마크만, symbol/gateo 일괄 숨김 제거.
- **클릭**: 2026-06-03 시네마 UI의 전역 클릭 차단을 완화 — **지명·gateo 마커**는 투어 중 선택 가능, **빈 지도 탭**만 차단.
- **QA**: 로컬 3D 투어에서 지명·구분선 표시 및 지명 탭 → 장소 카드 확인.

---

## 홈 지구본 — 전 여행지·지명-only·희소 tier

- **배경**: Mapbox 전환 후 마커 겹침 완화 → 카테고리별 필터·`showOnGlobe` 숨김이 접근성을 제한. 이후 카테고리 강조(흐림) 시도는 구 정책과 동일하게 느껴져 **카메라 pan만** 유지.
- **조치**: 전 `TRAVEL_SPOTS` 노출 · major **점 제거·카테고리 색 지명** · `globeSpotVisibility`(`denseRegion` 있을 때만 tier) · `globeCategoryFocus`(카테고리 flyTo, 줌 유지).
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md) Phase 0 SSOT · `.ai-context` 5절.
- **QA**: 사용자 확인 — 밀집/섬 구분·색상 지명·클릭성 OK.
