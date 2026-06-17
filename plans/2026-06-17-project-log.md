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

## 항공 시네마 — 아이슬란드(iceland) long-arc 회피

- **원인**: ICN→KEF 직항 동일 — 북극권 short-arc → **long-arc**(지구 한 바퀴)
- **조치**: 플래너 STEP 2 유럽 허브 — `flightRouteHubIatas: MUC` + waypoint `[50,40]` · `reykjavik` 동일
- **기대**: `ICN → MUC → KEF` (헬싱키 HEL→KEF는 arc 기하학상 long-arc라 MUC 대표)

## 항공 시네마 — 페로 제도(faroe-islands) long-arc 회피

- **원인**: ICN→FAE 직항 대권 북극 우회 → long-arc(지구 한 바퀴)
- **조치**: 플래너 여정 정합 — `flightRouteHubIatas: CPH` + `flightRouteWaypoints` (ICN↔CPH short-arc)
- **기대**: `ICN → CPH → FAE` · STEP 1~3(인천→코펜하겐 환승→바가르)과 일치

## 항공 시네마 — Phase 2b QA·long-arc 보정 (세션 마감)

- **인도양**: seychelles·mauritius·maldives `flightRouteHubIatas: DXB`
- **long-arc**: faroe-islands `CPH`+waypoint · iceland·reykjavik `MUC`+waypoint (플래너 유럽 환승 정합)
- **사용자 QA Pass**: 페로 제도 · 아이슬란드
- **대권 항로**: 엔진 유지 + slug hub·waypoint가 현재 최선 — 전역 제거 시 남미 등 회귀
- **데이터 후보**: Supabase `essential_guide`·`journey_timeline` 기반 arc bake — overrides 보완·검토(다음)

## 항공 시네마 — Phase 2b corridor·민감공역 A~E ✅

- **A** `chooseGreatCircleOmega`: long arc **아메리카(lng<-30)** polar·민감공역 short-arc 교차 시만
- **B** `flightRouteCorridors.js`: ICN→서·북유럽 `[125,33]`→**DXB**→`[20,42]` 지중해 관문
- **C** `flightRouteAvoidZones.js`: 북한·UA·RU50+ bbox · RU 목적지 guard skip · hub **overrides>corridor>guard**
- **D** `npm run audit:flight-arcs` — 5클릭 QA **전 Pass** (paris/london/amsterdam·seychelles·iceland/faroe·moscow·uyuni)
- **잔여**: helsinki·대서양/북극 9 slug bbox — QA 범위 외 · Bar UX·시네마 중 키워드 **다음**

## 항공 시네마 — 버뮤다(bermuda) 남극 long-arc 회귀 fix

- **원인**: BDA(lng<-30) short arc 민감공역 교차 → **Antarctic long arc**(지구 남쪽 한 바퀴)
- **조치**: long arc **남극권(minLat<-58) 거부** · 북대서양·Caribbean(lat 15–45) **`[125,33]`→DXB** corridor
- **기대**: `ICN → DXB → BDA` · lat 25–48° · bbox clear

## 항공 시네마 — 다음 세션 (에이전트 핸드오프)

| # | 우선 | 방향 |
|---|------|------|
| **1** | **arc spot-check** | 홈「항공 경로」클릭 QA · `npm run audit:flight-arcs` 잔여 slug · helsinki·북미·대서양 bbox |
| **2** | **arc 보정** | 이슈 slug overrides/corridor · RU 목적지 우회 금지 유지 |
| 3 | FlightCinemaBar UX | 밝은 글로우 · 「항공권 확인」 CTA · `revealFullRoute` (arc QA Pass 후) |
| 4 | 시네마 중 홈 | 연관 키워드·카테고리 버튼 |
| 5 | (보류) | GUM arc·Trip CTA |

**금지**: `update-place-toolkit` 프롬프트 · `GLOBE_VIEW.flyZoom` · GUM arc·Trip CTA **보류 해제 전**

### 다음 세션 제시어

```
@.ai-context.md @plans/2026-06-17-project-log.md @plans/2026-06-02-globe-enrichment-plan.md

항공-시네마-arc-QA

Phase 2b arc spot-check — 홈「항공 경로」클릭 QA · audit:flight-arcs 잔여 · overrides/corridor 보정.
hub overrides>corridor>guard · RU 목적지 우회 금지 · GLOBE_VIEW.flyZoom·toolkit 프롬프트 변경 금지.
```
