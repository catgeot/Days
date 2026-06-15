# 2026-06-15 프로젝트 일지

**이전**: [`2026-06-11-project-log.md`](./2026-06-11-project-log.md)

## Mapbox 지명·검색·즐겨찾기 — country·진입 경로 통일

- **문제**: 검색 vs 지구본 마커 country 불일치(`Global`/`Explore`/`프랑스`); Mapbox uiPlace 즐겨찾기 `/place/tahaa` Safe Path; 역지오 `country=France|United States` → 갤러리 오탐
- **조치**: `travelRegionCountry.js`(ISO·state·country_code) · `mergeCanonicalTravelSpot` uiPlace+이름 병합 · `placeRouteHydrate.js`(slug·즐겨찾기 복원) · `finalizeUiPlacePin` · SSOT country 영토명(guam·hawaii·honolulu·midway·pitcairn)
- **가이드**: [`travel-spots-management.md`](./travel-spots-management.md) §8·§8.1 갱신
- **QA**: gateo 마커·Mapbox 지명·탐색 검색·버킷리스트 — 동일 slug·country·갤러리 backup 확인
