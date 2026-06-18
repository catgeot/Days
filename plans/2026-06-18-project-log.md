# 2026-06-18 프로젝트 일지

**이전**: [`2026-06-17-project-log.md`](./2026-06-17-project-log.md)

## 항공 시네마 — Phase 2b Bar UX·홈 상호작용 ✅ (사용자 QA Pass)

- **FlightCinemaBar**: `flight-cinema-bar-halo` 글로우 · 「바로 보기」=`revealFullRoute` · 「항공권 확인」Trip CTA(`globe-flight-cinema` 추적)
- **시네마 중 홈**: **모바일** — 연관검색어 숨김 · 카테고리 숨김 · **데스크톱** — 연관·카테고리 클릭 → `closeFlightCinema` 후 탐색
- **장소카드**: 모바일 `max-lg:hidden` 카테고리

## 항로 arc·상태바 — hub SSOT ✅ (사용자 QA Pass)

- **`extractFlightRouteHubIatasFromEssentialGuide`**: `isTransitHubTimelineTitle` 가드
- **`sync:airports-from-toolkit`**: `flightRouteHubIatas` auto-bake 중단
- **`getFlightRouteHubIatas`**: live timeline fallback 제거 · overrides/`trip≠final` SSOT
- **overrides + waypoint** (툴킷·avoid-zone 정합 · QA Pass):

| slug | arc |
|------|-----|
| philadelphia | ICN→ATL→PHL |
| san-diego | ICN→LAX→SAN |
| fernando-de-noronha | ICN→GRU→FEN |
| cancun · chichen-itza | ICN→LAX→CUN |
| luang-prabang · krabi | ICN→BKK→… |

- **`audit:airports`** none:0 · **`audit:flight-arcs`** 5-click QA Pass

## FlightCinemaBar — 「여행 플랜」 ✅ (사용자 QA Pass)

- 항공코드 행 우측 · `/place/{slug}/planner` (플래너 탭 홈 · 항공 앵커 없음)
- 클릭 시 시네마 종료 · Trip CTA와 역할 분리(전체 여정 윤곽)

## 다음 세션 (에이전트 핸드오프)

| # | 우선 | 방향 |
|---|------|------|
| 1 | **audit·avoid-zone** | 잔여 ~41건 spot-check · Atlantic corridor(DXB) 오적용(미국 본토·멕시코 등) |
| 2 | (선택) | FlightCinemaBar corridor vs passenger hub 라벨 · GUM·Trip CTA **보류** |
| 3 | (선택) | **2c** 문서만 |

**금지**: `update-place-toolkit` · `GLOBE_VIEW.flyZoom` · 배너/`TITLE_ARRIVAL_AIRPORT_PHRASES` (사용자 승인 없이)

### 다음 세션 제시어

```
@.ai-context.md @plans/2026-06-18-project-log.md @plans/2026-06-02-globe-enrichment-plan.md

항공-시네마-항로-최적화

Phase 2b 후속 — audit:flight-arcs avoid-zone·Atlantic corridor spot-check.
잔여 DXB 오적용(chicago·toronto 등) · helsinki·대서양 bbox.
FlightCinemaBar·hub SSOT·여행 플랜 ✅ — corridor/passenger 라벨은 선택.
toolkit·flyZoom·배너 로직 변경 금지.
```
