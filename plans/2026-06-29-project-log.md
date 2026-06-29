# 2026-06-29 프로젝트 일지

**직전**: [`2026-06-23-project-log.md`](./2026-06-23-project-log.md)

---

## 항공 경로 — 비-ICN 출발·waypoint·경유 QA 계획 수립

**상태**: **계획만 ✅** · 구현 **다음 세션** · smoke 8/8 (변경 없음)

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

## 항공 경로 세션 — 에이전트 핸드오ff

**다음**: [`flight-route-non-icn-routing-plan.md`](./flight-route-non-icn-routing-plan.md) **A→C→B→E** 순 실행

| 읽을 것 (3) | 금지 (3) |
|-------------|----------|
| 본 일지 핸드오프 + `flight-route-non-icn-routing-plan.md` | `travelSpots.js` 전체 |
| `globeFlightCinema.js` · `rentalAirportMatch.js` (waypoint·Edge) | `travelSpotAirports.json` 직접 편집 |
| `flight-route-resolver.mjs` · `flightRouteGraph.ts` · `flightRouteGeoRules.js` | overrides 없이 JSON `graphFlightRouteHubIatas`만 수정 |

### 구현 순서 (요약)

1. **A** — `getFlightRouteWaypoints` origin ICN 게이트 (`globeFlightCinema.js`, `rentalAirportMatch.js`)
2. **C** — `paris` `flightRouteHubIatas: []` → `generate:airports` → `audit:airports`
3. **B** — tier-1/regional 허브 필터 · detour 1.35 · origin-region penalty (resolver + Edge)
4. **E** — smoke BDA/MNL·ICN paris · `audit:flight-route-detours` 다출발지
5. **F** (선택) — Bar 구간 시간 tooltip

### 검증 (로컬)

```powershell
npm run generate:airports
npm run audit:airports          # none: 0
npm run smoke:flight-route-baseline
npm run audit:flight-arcs       # 0 issues
npm run audit:flight-route-detours
```

| 케이스 | 기대 |
|--------|------|
| BDA → grand-canyon | arc 도쿄 없음 · SGF hub 없음 |
| BDA → paris | detour ≤ 1.35 · US/EU gateway |
| ICN → paris | 직항 · Bar `ICN → CDG` |
| ICN → grand-canyon | `[135,35]`→LAX 회귀 없음 |

### 다음 세션 제시어

```
항공경로-이어하기 @plans/2026-06-29-project-log.md @plans/flight-route-non-icn-routing-plan.md
계획 A→C→B→E 순 실행. BDA 그랜드캐니언·파리·ICN 파리 QA 포함.
```
