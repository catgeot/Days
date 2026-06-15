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

## 홈 지구본 — 카테고리 5면 pan (QA Pass)

- **목표**: 카테고리 버튼으로 대륙권 빠른 이동 · 새로고침·`/place`·`/explore` 복귀 시 랜덤 면 · 대양은 사용자 자유 탐험
- **SSOT**: [`globeCategoryFocus.js`](../src/pages/Home/lib/globeCategoryFocus.js) `GLOBE_FACE_CENTER_BY_CATEGORY` — 서울·아프리카·오슬로·미니애폴리스·남미
- **동작**: 줌·고도 유지 pan flyTo(`GLOBE_FACE_FLY_MS`) · `categoryFaceEpoch` · 공유 URL(`?lng&lat&zoom`) 우선
- **가이드**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 0 카테고리 면 갱신

## 홈 지구본 — 우주 복귀 버튼 (모바일·PC QA Pass)

- **문제**: 모바일에서 우주 복귀 시 `flyTo`가 `rotateZoomThreshold`(2.4) 이하에서 autoRotate `jumpTo`에 의해 중단 — 목표 zoom 1.25 미도달
- **조치**: `handleReturnToSpace` — `moveend`까지 autoRotate·interaction 잠금 · PC·모바일 공통 `GLOBE_VIEW.default`(zoom 1.25)
- **QA**: pinch 확대 후 우주 버튼 — 모바일·PC 초기 지구본 고도 복귀 Pass
- **가이드**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2 우주 버튼 SSOT 갱신

## 3D 투어 — 키리바시(Kiribati) 바다 조망·검은 화면 (QA Pass)

- **문제**: `travelSpots` 핀(`-1.33°N`)이 Gilbert·타라와 육지(`~1.35°N`) 남쪽 해상이라 category `islandCinematic` 폴백 시 1~4프레임 **바다 중심·섬 가장자리** · 위성 타일도 얇은 atol이라 풍경 감상은 제한적
- **조치**: `globeLandmarks.json` `kiribati` — Betio↔TRW **육지 띠 중점** overview(`173.04, 1.374`) · 3~4프레임 동쪽 이동 · 5프레임 TRW 착륙 · `apply-island-cinematic-keyframes.mjs` 등록 · `globeTourResolve` `hubForTravelSlug` → `travelSpotAirports.spots` (투어 `approachPoint`만, **공항 배너 SSOT 무관**)
- **스캔**: `scripts/scan-tour-ocean-mismatch.mjs` — paradise 섬·핀↔hub 거리 후보 점검
- **QA**: 사용자 확인 — atol 조망 Pass · 위성 한계는 문서화
- **가이드**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) 얇은 atol·국가 핀 주의 갱신
