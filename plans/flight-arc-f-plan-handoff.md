# 항공 arc F안 — 구현 완료 (2026-06-21)

**결정**: 2026-06-21 · ICN→파리·암스테르담 FlightAware/Google Flights 비교 QA 후 · **F안 ✅**

## F안 (확정)

arc **표시용 민감공역(L1) 제거** (Google Flights·gcmap 정합) + 시각 dramatization은 **bulge 튜닝**(1순위) · **display-midpoint**(2순위). **DXB식 avoid hook waypoint 재도입 금지.**

| 층 | 조치 |
|----|------|
| **제거 L1** | `applyGraphVisualAvoidGuard` · corridor-avoid-guard · amsterdam 등 avoid `flightRouteWaypoints` · audit `avoid-zone-cross` |
| **유지 L2** | hub 경유 arc (Bar IATA) |
| **유지 L3** | `[180,12]` polar/dateline · LPB 등 **지리** waypoint |
| **강화** | `bulgeGreatCircleLine` `km×0.055→~0.07` · (부족 시) 직항 auto display-midpoint 1점 |

## 구현 체크리스트 ✅

1. [`globeFlightCinema.js`](../src/pages/Home/lib/globeFlightCinema.js) — L1 guard 호출 제거 · bulge 계수 **0.07**
2. [`travel-spot-airport-overrides.mjs`](../scripts/data/travel-spot-airport-overrides.mjs) — amsterdam avoid waypoint 삭제 · `generate:airports`
3. [`audit-flight-arcs.mjs`](../scripts/audit-flight-arcs.mjs) — zone-cross 비목표
4. QA: `audit:flight-arcs` **0 issues** · 8 slug PASS · ICN→CDG/AMS 직항 arc

## 다음

- **항로·arc 로컬 QA** — paris/amsterdam/los-angeles arc 곡률 · bulge 시각 확인
- **Phase 4 UI 보류** — 출발지·경유지 UI는 arc 안정화 후 [`flight-route-database-plan.md`](./flight-route-database-plan.md)
