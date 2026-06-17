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

## 항공 시네마 — 다음 세션 (에이전트 핸드오프)

| # | 우선 | 방향 |
|---|------|------|
| 1 | **전 여행지 arc 수동 QA** | 사용자 주도 — 이상 slug만 overrides·waypoint · 목표 「이상 없음」 |
| 2 | **FlightCinemaBar UX** | 데스크톱 **밝은 글로우** 배경 · 「바로 보기」→**「항공권 확인」**(플래너 탭 또는 Trip 모달) · `revealFullRoute` 스킵 제거 |
| 3 | **시네마 중 홈 상호작용** | 연관 키워드 클릭 → **지명 클릭과 동일** 시네마 종료 · **카테고리 버튼** — 항로 중 pan/face 전환 정상화 |
| 4 | (검토) DB 항로 | `sync:airports-from-toolkit`·timeline hub 확대 vs 수동 overrides — long-arc waypoint는 여전히 필요할 수 있음 |
| 5 | (장기) **Phase 2c** | 상세 여정 시뮬레이션 — 항공→렌터카/도로→페리·선형 시간·지도 카드·숙소 카드 (예: 서울→길리메노) |

**금지**: `update-place-toolkit` 프롬프트 · `flight_route_iatas` 필드 · `GLOBE_VIEW.flyZoom` 변경 · GUM arc·Trip CTA **보류 해제 전 임의 연결**

### 다음 세션 제시어

```
@.ai-context.md @plans/2026-06-17-project-log.md @plans/2026-06-02-globe-enrichment-plan.md

항공-시네마-UX·전여행지QA

Phase 2b — FlightCinemaBar 글로우·항공권 확인 CTA · 시네마 중 연관키워드·카테고리 버튼 · 전 여행지 arc 수동 QA 후보 반영.
long-arc 보정(DXB·CPH·MUC) Pass. Phase 2c 여정 시뮬레이션은 문서만·구현 보류.
update-place-toolkit 프롬프트·GLOBE_VIEW.flyZoom 변경 금지.
```

**읽을 것 (3)**: `.ai-context` 5~6절 · 본 일지 **「다음 세션」** · [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) **§Phase 2b·2c**.

**금지 (3)**: Edge 프롬프트 · `GLOBE_VIEW.flyZoom` · GUM arc·Trip CTA 임의 연결.
