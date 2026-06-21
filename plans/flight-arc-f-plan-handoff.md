# 항공 arc F안 — 다음 세션 핸드오ff

**결정**: 2026-06-21 · ICN→파리·암스테르담 FlightAware/Google Flights 비교 QA 후

## F안 (확정)

arc **표시용 민감공역(L1) 제거** (Google Flights·gcmap 정합) + 시각 dramatization은 **bulge 튜닝**(1순위) · **display-midpoint**(2순위). **DXB식 avoid hook waypoint 재도입 금지.**

| 층 | 조치 |
|----|------|
| **제거 L1** | `applyGraphVisualAvoidGuard` · corridor-avoid-guard · amsterdam 등 avoid `flightRouteWaypoints` · audit `avoid-zone-cross` |
| **유지 L2** | hub 경유 arc (Bar IATA) |
| **유지 L3** | `[180,12]` polar/dateline · LPB 등 **지리** waypoint |
| **강화** | `bulgeGreatCircleLine` `km×0.055→~0.07` · (부족 시) 직항 auto display-midpoint 1점 |

## 구현 체크리스트

1. [`globeFlightCinema.js`](../src/pages/Home/lib/globeFlightCinema.js) — L1 guard 호출 제거 · bulge 계수
2. [`travel-spot-airport-overrides.mjs`](../scripts/data/travel-spot-airport-overrides.mjs) — amsterdam `[125,33],[15,42]` 등 avoid waypoint 삭제 → `npm run generate:airports`
3. [`audit-flight-arcs.mjs`](../scripts/audit-flight-arcs.mjs) — zone-cross 비목표
4. QA: ICN→CDG/AMS · paris/london/amsterdam · ICN→LAX long-arc 회귀 · `npm run audit:flight-arcs`

## 제시어

**`항공경로-arc-F안-실행`**

| 읽을 것 | 금지 |
|---------|------|
| 본 파일 · [`2026-06-21-project-log.md`](./2026-06-21-project-log.md) F안 절 | `travelSpots.js` 전체 |
| `globeFlightCinema.js` · `flightRouteCorridors.js` | slug overrides 전수 hub 추가 |
| `travelSpotAirports.json` 직접 편집 |

**다음(Phase 4)**: `항공경로-DB-Phase4-실행` — F안 QA 후 출발지 UI
