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

- **경유 chain**: `resolveCinemaDestIata`(preferredLink) · `getFlightRouteHubIatas` · `buildGreatCircleChain` · bar **경유/직항**
- **데스크톱 투어**: `endTour`→2D 후 `requestFlightCinema` ✅
- **QA**: kiribati ICN→NAN→TRW **Pass**

## 항공 시네마 — Phase 2b 툴킷 SSOT→arc

- **`extractFlightRouteHubIatasFromEssentialGuide`**: `journey_timeline` STEP 순 chain → hub bake · `sync:airports-from-toolkit`
- **홈 써머리**: `useChatEssentialGuide` lazy-load → 라벨·arc `hubIatas`/`essentialGuide` 전달
- **hub 우선순위**: `flightRouteHubIatas` → **`tripFlightArrivalIata`≠최종** → 툴킷 timeline
- **미크로네시아**: yap/chuuk/kosrae/pohnpei/marshall `flightRouteHubIatas: HNL` — GUM timeline 오탐 회귀
- **QA**: kiribati·yap·pohnpei HNL 경유 arc **Pass** (괌 경유 일정은 배너 대안·arc 미반영 — 제품 보류)

## 항공 시네마 — 다음 세션 (최적화·테스트)

| # | 후보 | 방향 |
|---|------|------|
| 1 | toolkit-sync 경유 arc | overrides 없는 slug 스모크 · `sync`+`generate` drift |
| 2 | 2구간+ arc UX | 카메라·bar 시간·극/날짜변경선 waypoint 튜닝 |
| 3 | Phase 1g | 홈 지구본 스모크(2D·Skip·모바일 `TourMobileBar`) |
| 4 | (선택) GUM 관문 | ICN→GUM→YAP arc — Trip·티켓 패턴 합의 후 |

**금지**: `update-place-toolkit` 프롬프트 · `flight_route_iatas` 필드 · Trip CTA↔시네마 · `GLOBE_VIEW.flyZoom` 변경

**제시어** — [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) §다음 세션
