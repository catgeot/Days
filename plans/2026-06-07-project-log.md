# 2026-06-07 프로젝트 일지 — 3D 투어 지명·선택 복원

**직전**: [`2026-06-06-project-log.md`](2026-06-06-project-log.md) · **계획**: [`2026-06-02-globe-enrichment-plan.md`](2026-06-02-globe-enrichment-plan.md)

---

## 3D 투어 — Mapbox 지명·행정선·클릭

- **배경**: 2026-06-04 몰입감 강화로 투어 중 지명·구분선 숨김 → 실사용 시 위치 정보가 도움이 됨.
- **조치**: `globeMapboxLabelPolicy`가 투어 중에도 `isPinVisible`·줌 정책 그대로 적용. `globeTourUi`는 cityOrbit 3D 랜드마크만, symbol/gateo 일괄 숨김 제거.
- **클릭**: 2026-06-03 시네마 UI의 전역 클릭 차단을 완화 — **지명·gateo 마커**는 투어 중 선택 가능, **빈 지도 탭**만 차단.
- **QA**: 로컬 3D 투어에서 지명·구분선 표시 및 지명 탭 → 장소 카드 확인.
