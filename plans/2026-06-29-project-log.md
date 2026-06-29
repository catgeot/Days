# 2026-06-29 프로젝트 일지

**직전**: [`2026-06-23-project-log.md`](./2026-06-23-project-log.md)

---

## 항공 경로 — 비-ICN 출발·waypoint·경유 QA 계획 수립

**상태**: **계획·2세션 handoff ✅** · 구현 **세션 1부터** · smoke 8/8 (변경 없음)

### 배경

Phase 4 v2 출발지 변경 후 QA — BDA(버뮤다) 등 **비-ICN 출발**에서:

1. **arc 도쿄 근처 우회** — `grand-canyon` 등 ICN용 `flightRouteWaypoints [[135,35]]`가 출발지 무관 적용
2. **소형 국내 허브 경유** — BDA→ATL→**SGF**→LAS (Edge graph, 허브 무필터)
3. **불필요 국제 지그재그** — BDA→LGW→MUC→CDG
4. **ICN→파리 직항 누락** — graph HEL·CPH 2hop (OpenFlights 2014에 ICN→CDG edge 없음)
5. **Bar `~Nh`** — 구간 **비행 시간**(환승 대기 아님) · UI는 「경유」 표기

### 산출물

- 실행 계획: [`flight-route-non-icn-routing-plan.md`](./flight-route-non-icn-routing-plan.md)
- [`flight-route-database-plan.md`](./flight-route-database-plan.md) 핸드오프 갱신

---

## 항공 경로 — 세션 1 완료 (A+C+E 일부)

**상태**: **S1 ✅** · smoke **10/10** · `audit:airports` none:0 · `audit:flight-arcs` 0 · **S2** B+E+Edge 대기

- **A** — `getFlightRouteWaypoints(location, { originIata })` ICN 게이트 · `globeFlightCinema.js` 호출부
- **C** — `paris` `flightRouteHubIatas: []` override → generate · ICN→CDG 직항
- **E** — smoke `icn-paris-direct` · `icn-grand-canyon-waypoint` 추가 · BDA waypoint 빈 배열 확인

---

## 항공 경로 — 세션 2 완료 (B + E + Edge deploy)

**상태**: **S2 ✅** · smoke **13/13** · Edge deploy ✅ · BDA→LAS ATL(SGF 없음) · BDA→CDG JFK(detour 1.14) · ICN 회귀 smoke PASS · **브라우저 QA** 다음 세션

- **B** — `isMajorTransitHub` · major 이웃 우선+fallback · detour 1.35 · `scoreOriginRegionHubPenalty` · resolver + `flightRouteGraph.ts` 동기
- **E** — smoke BDA·arc 케이스 · detour audit ICN/BDA/MNL · L62 `resolveFlightRoutePlan` 인자 수정
- **deploy** — `resolve-flight-route` Edge · BDA QA 원격 PASS
- **arc fix** — `explicitDirect`(paris 등) ICN 전용 · Edge `hubIatas` arc 앵커 유지 (BDA→JFK→CDG)

---

## 항공 경로 — 2세션 handoff (2026-06-29)

**계획 SSOT**: [`flight-route-non-icn-routing-plan.md`](./flight-route-non-icn-routing-plan.md) · **S1 ✅** · **S2 ✅**

| 읽을 것 (3) | 금지 (3) |
|-------------|----------|
| 본 일지 handoff + `flight-route-non-icn-routing-plan.md` §세션 분할 | `travelSpots.js` 전체 |
| **S1**: `globeFlightCinema.js` · `rentalAirportMatch.js` · `overrides.mjs` | `travelSpotAirports.json` 직접 편집 |
| **S2**: `flight-route-resolver.mjs` · `flightRouteGraph.ts` · `flightRouteGeoRules.js` | overrides 없이 JSON `graphFlightRouteHubIatas`만 수정 |

---

### ~~세션 1~~ — A + C + E(일부) · **완료 ✅** (위 「세션 1 완료」 참고)

### ~~세션 2~~ — B + E(완료) + Edge · **완료 ✅** (위 「세션 2 완료」 참고)

**선택 후속**: Bar 구간 시간 tooltip (F) · 릴리스 노트 합의 · **브라우저** BDA 그랜드캐니언·파리 arc/Bar QA
