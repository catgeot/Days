# 2026-06-17 프로젝트 일지

**이전**: [`2026-06-16-project-log.md`](./2026-06-16-project-log.md)

## 3D 투어 — 뉴칼레도니아(new-caledonia) Grande Terre 조망

- **문제**: `globeLandmarks` 미등록 → `travelSpots` 핀(-20.90°, 165.62°) 해상·lagoon 폴백 · `cityOrbit`으로 바다 포커스
- **조치**: `globeLandmarks.json` `new-caledonia` — Grande Terre 중앙(165.85°, -21.35°) 5-frame 섬 조망 → 누메아(166.22°, -22.05°) 접근 keyframes
- **QA**: 사용자 Pass

## 3D 투어 — 코스타리카(costa-rica) 국토·Arenal 조망

- **문제**: `globeLandmarks` Manuel Antonio center(-84.395°, 9.392°)가 해안에서 ~25km 서쪽(태평양) · `coastalOrbit` 시작=바다
- **조치**: 5-frame keyframes — 중앙 고원(9.75°, -84.0°) 국토 overview → Arenal 화산(10.46°, -84.70°) 접근
- **QA**: 사용자 확인 대기

## 항공 시네마 — Phase 2b 경유 arc·데스크톱 투어→시네마

- **경유 chain**: `resolveCinemaDestIata`(preferredLink) · `getFlightRouteHubIatas`(explicit 또는 trip≠final) · `buildGreatCircleChain` · bar **경유/직항**
- **데스크톱 투어**: `endTour`→2D 후 `requestFlightCinema` ✅
- **데이터(1차)**: overrides `flightRouteHubIatas` · 미크로네시아 `tripFlightArrivalIata` 자동 추론 · kiribati **NAN** (HNL 오류 수정)
- **QA**: kiribati ICN→NAN→TRW **Pass** — 플래너 여정과 arc 일치 · 시뮬레이션 신뢰 → 예약 퍼널 신뢰도 기대(제품)

## 항공 시네마 — 다음 세션 (툴킷 SSOT 연동)

- **방향**: DB `essential_guide.journey_timeline`·기존 항공 SSOT 활용 — **`update-place-toolkit` 프롬프트 변경 없음** (현재 툴킷 정확도 유지·대부분 slug DB 저장됨)
- **후보 SSOT**: `extractArrivalIataCodesFromEssentialGuide` 확장 → **STEP 순 flight chain** · `sync:airports-from-toolkit` → `flightRouteHubIatas` bake · 홈 써머리 `essentialGuide` lazy-load
- **금지**: Edge 프롬프트 `flight_route_iatas` 신규 필드 · 플래너 Trip CTA↔시네마 직접 연결 · `GLOBE_VIEW.flyZoom` 변경
- **보류**: 시네마 종료 후 Trip 검색 연결 — arc+툴킷 SSOT Pass 후

**제시어** — [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) §다음 세션
