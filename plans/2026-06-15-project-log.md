# 2026-06-15 프로젝트 일지

**이전**: [`2026-06-11-project-log.md`](./2026-06-11-project-log.md)

## Mapbox 지명·검색·즐겨찾기 — country·진입 경로 통일

- **문제**: 검색 vs 지구본 마커 country 불일치(`Global`/`Explore`/`프랑스`); Mapbox uiPlace 즐겨찾기 `/place/tahaa` Safe Path; 역지오 `country=France|United States` → 갤러리 오탐
- **조치**: `travelRegionCountry.js`(ISO·state·country_code) · `mergeCanonicalTravelSpot` uiPlace+이름 병합 · `placeRouteHydrate.js`(slug·즐겨찾기 복원) · `finalizeUiPlacePin` · SSOT country 영토명(guam·hawaii·honolulu·midway·pitcairn)
- **가이드**: [`travel-spots-management.md`](./travel-spots-management.md) §8·§8.1 갱신
- **QA**: gateo 마커·Mapbox 지명·탐색 검색·버킷리스트 — 동일 slug·country·갤러리 backup 확인

## 3D 투어 — 이동 가능 경계 pivot·토글 (Phase 1i)

- **문제**: `TOUR_READY` pivot·재투어 시 경계가 투어 **시작 전** 지도에 노출(몰입감 저하) · `TOUR_READY→TOUR_BOOTSTRAPPING` 전환 누락
- **조치**: pivot 시 `clearReachBoundaryState` · `globeMode` 재진입 허용 · 투어 중 경계 숨김 · `TOUR_READY` 최초 진입 시만 로드
- **토글**: 범례 카드 스위치 — 지도 경계 on/off · 카드·토글 레이아웃 고정 · 안내 문구 글자수 맞춤
- **QA**: 첫 투어 종료 후 경계 · pivot 후 숨김 · 재투어 종료 후 표시 · 토글 on/off — Pass
- **가이드**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 1i·pivot 갱신
