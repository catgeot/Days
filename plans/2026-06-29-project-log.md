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

---

## 항공 출발지 — Metro Gateway S2 완료 (GPS QA + 릴리스 노트)

**상태**: **S1+S2 ✅** · smoke **5/5** · baseline **14/14** · GPS+수동 QA **5/5** · 릴리스 노트 **B안 반영 ✅**

- **GPS QA** — 서울→파리 ICN·`ICN→CDG` · 상하이 PVG · 보홀 TAG(승격 없음)·graph `TAG→MNL→…` · GMP/김포 수동 검색 회귀
- **smoke** — `smoke:flight-origin-gateway` 5/5 · `smoke:flight-route-baseline` 14/14 재확인
- **브라우저 MCP** — localhost HTTPS 자체 서명으로 자동 탭 QA 불가 · 아래 수동 체크리스트 + Node 동일 경로 검증
- **릴리스 노트** — B안(Metro Gateway+비-ICN+MNL→파리) · `releaseNotes.js` `2026-06-29`

### 수동 브라우저 체크리스트 (배포 전)

1. DevTools → Sensors → Geolocation **37.56, 126.99** → 파리 카드 → 「내 위치」→ 출발 **ICN** · Bar **ICN~CDG**
2. Geolocation **31.24, 121.50** → 출발 **PVG**
3. Geolocation **9.66, 123.85** → 출발 **TAG** (MNL로 바뀌지 않음)
4. 출발지 검색 **김포** → **GMP** 수동 선택 유지

---

## 항공 출발지 — Metro Gateway 승격 (계획·handoff)

**상태**: **S1 ✅** · smoke **5/5** · `smoke:flight-route-baseline` **14/14** · ~~**S2** 브라우저 QA 대기~~ → **S2 ✅** (위 절)

- **원인**: GPS → 최근접 rental 허브(GMP·SHA) · `preferredLinkIata`(ICN/PVG) 미반영
- **범위**: ICN/GMP · PVG/SHA geolocation 승격 · 보홀 TAG→MNL 경유 **유지**
- **SSOT**: [`flight-origin-metro-gateway-plan.md`](./flight-origin-metro-gateway-plan.md)

### 세션 1 완료 (2026-06-29)

- `flightOriginMetroGateways.js` — `FLIGHT_ORIGIN_METRO_GATEWAYS` · `promoteFlightOriginGateway`
- `flightCinemaOriginSearch.js` — `resolveFlightOriginFromCoords` · geolocation 후처리
- `smoke:flight-origin-gateway` 5/5 · baseline **14/14** 회귀

### MNL→파리 경유 오탐 수정

- **증상**: `MNL~1hHKG~11hFRA~1hCDG` — OpenFlights graph 2hop이 1hop `MNL→HKG→CDG`보다 점수 우선
- **수정**: `scoreOriginRegionHubPenalty` — **동남아→유럽** 2번째 EU 허브 +600 (BDA와 동일 패턴)
- smoke `mnl-paris-via-hkg` 추가 · **Edge deploy ✅** (`flightRouteGeoRules.ts`)

### ~~다음 세션 — S2~~ **완료 ✅** (위 「S2 완료」 절)

**후속(선택)**: Bar 구간 시간 tooltip (F) · 수동 브라우저 체크리스트 4건(배포 전)
