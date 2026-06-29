# 항공 경로 DB 구축 및 기존 시네마 연동 계획

**작성**: 2026-06-21  
**배경**: slug별 수동 hub/waypoint(67/271)로는 경유·직항 오표기·허브 오류·Mapbox `uiPlace` 경로 불가가 반복됨. arc 엔진은 유지하고 **공항·경로 데이터 SSOT**를 Supabase에 두어 자동 추론·Edge API로 확장.  
**관련**: [`.ai-context.md`](../.ai-context.md) 6절 · [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2b·2d · [`travel-spots-management.md`](./travel-spots-management.md) §3.1

---

## 현재 상황 (2026-06-21)

| 항목 | 상태 |
|------|------|
| arc 엔진·corridor·avoid-zone | ✅ [`globeFlightCinema.js`](../src/pages/Home/lib/globeFlightCinema.js) 등 |
| slug hub 오버라이드 | **67/271** — 나머지 204는 corridor 또는 hub 없음=직항 arc |
| Supabase `air_routes` | ✅ **37594** pairs (`import:routes`) · ICN outbound **370** |
| slug graph precompute | ✅ `travelSpotFlightRoutes.json` **193** resolved · `graphFlightRouteHubIatas` merge **193** |
| 공항 좌표 런타임 | [`rentalAirportHubs.js`](../src/utils/rentalAirportHubs.js) 302 **1순위** → [`airportsIndex.json`](../src/pages/Home/data/airportsIndex.json) **3870** 폴백 |
| Mapbox 지명(`uiPlace`) | slug/placeIds 없어도 nearest·**Edge 연결 ✅**(C-3) · 50km 이내 sync · 50km 밖 `resolve-flight-route` v2 · Tahaa/Fa'anui·Manihiki QA · 버튼「조회 중…」|
| audit | `audit:airports none:0` · `audit:flight-arcs` **0 issues** · QA 8 slug Pass |

**기존 WIP와의 관계**: arc·Bar·Trip·배너 파이프라인 **유지**. DB는 hub/waypoint/IATA **추론 두뇌** 추가. overrides는 2차 항공·예외(L3)만 점진 축소.

---

## 목표

1. **OurAirports** → Supabase `airports` (전 세계 scheduled IATA 좌표)
2. **OpenFlights routes** → `air_routes` (ICN-centric 1~2 hop hub 추론, 2014 스냅샷·휴리스틱)
3. **하이브리드 런타임**: 경량 `airportsIndex.json` + Edge `resolve-flight-route` + slug precompute → `travelSpotAirports.json`
4. **장기**: 지구본 출발지(3차)·경유지 선택(2차)

---

## 데이터 3층

| 층 | 내용 | 방식 |
|----|------|------|
| A | 목적지 공항 | OurAirports 자동 |
| B | 환승 허브 tier-1 | `rentalAirportHubs` 큐레이션 seed ~50–80 |
| C | 허브↔공항 연결 | OpenFlights 그래프 BFS — **수동 전수 배열 금지** |

**Waypoint 3레이어**: L1 지리 corridor(DB) · L2 IATA hub chain · L3 slug 예외(기존 overrides)

---

## Supabase 스키마 (신규 migration)

- `airports` — OurAirports + `name_ko`·`is_transit_hub`·`hub_tier`
- `air_routes` — OpenFlights
- `route_corridors` — [`flightRouteCorridors.js`](../src/pages/Home/lib/flightRouteCorridors.js) 이관
- `spot_route_overrides` — 고가치 slug 예외

PoC: 대시보드 CSV import 가능(~12MB). 운영: `supabase/migrations` + `scripts/import-ourairports.mjs`.

---

## 구현 Phase

| Phase | 내용 | 세션 |
|-------|------|------|
| **0** | `flight-route-gap-report` · audit baseline · uiPlace 샘플 | ✅ |
| **1** | migration · OurAirports import · `airportsIndex.json` · `getAirportHubCoords` 확장 | ✅ |
| **2** | routes import · `flight-route-resolver` · `generate:flight-routes` · semantic audit | ✅ |
| **3** | Edge `resolve-flight-route` · uiPlace · graph runtime | ✅ |
| **4** | 출발지·경유지 UI | **v1 ✅** · **v2 ✅** · **v2.1 ✅** — [`2026-06-23-project-log.md`](./2026-06-23-project-log.md) |
| **5** | 가이드·npm·overrides 정리 | 마무리 |

---

## 다음 세션 — 에이전트 핸드오ff

**항공(비-ICN)**: **S1+S2 ✅** — [`flight-route-non-icn-routing-plan.md`](./flight-route-non-icn-routing-plan.md) · **다음 우선**: [`flight-origin-metro-gateway-plan.md`](./flight-origin-metro-gateway-plan.md) (GPS ICN/PVG 승격) · F(tooltip) · 릴리스 노트

~~Phase 4 v2.2 출발지 UI~~ **✅** · ~~비-ICN S1~~ **✅** · ~~비-ICN S2 B+E+Edge~~ **✅**

| 읽을 것 | 금지 |
|---------|------|
| [`2026-06-29-project-log.md`](./2026-06-29-project-log.md) · `flight-route-non-icn-routing-plan.md` | `travelSpots.js` 전체 |
| `globeFlightCinema.js` · `rentalAirportMatch.js` · resolver·GeoRules | `travelSpotAirports.json` 직접 편집 |

**런타임**: 시네마 Bar = Edge hub (비-ICN) · arc = `resolveFlightRoutePlan` + `options.hubIatas` · `explicitDirect` ICN 전용.

**gap 스냅샷 (S2 후)**: hub-override **76** · graph-precompute **112** · `smoke:flight-route-baseline` **13/13** · `audit:flight-arcs` **0**

**graph-direct 오탐 패턴**: OpenFlights 2014 직항 레그 잔재(예: ~~나이로비 ICN→NBO~~ → `ADD` hub) · 플래너「경유 필수」와 Bar「직항」 불일치 시 overrides `flightRouteHubIatas`.

---

## 연동 (기존 파일)

| 기존 | 연동 |
|------|------|
| `resolveFlightRoutePlan` | override > graph precompute > corridor |
| `generate-travel-spot-airports.mjs` | overrides 우선 + `generate:flight-routes` merge |
| 배너·Trip | arc 전용 — **변경 없음** |

**npm**: `import:airports` · `import:routes` · `generate:airports-index` · `generate:flight-routes` · `audit:flight-routes` · `db:apply-migrations`
