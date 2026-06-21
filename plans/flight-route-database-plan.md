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
| Mapbox 지명(`uiPlace`) | slug/placeIds 없으면 [`canPreviewFlightRoute`](../src/pages/Home/lib/globeFlightCinema.js) false |
| audit | `audit:airports none:0` · `audit:flight-arcs` QA slug Pass |

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
| **3** | Edge `resolve-flight-route` · uiPlace 연동 | **다음** |
| **4** | 출발지·경유지 UI (2·3차 목표) | 후속 |
| **5** | 가이드·npm·overrides 정리 | 마무리 |

---

## 다음 세션 — 에이전트 핸드오프

**제시어**: `항공경로-DB-Phase3-실행` (또는 `@plans/2026-06-21-project-log.md` **Phase 3** + 본 계획)

| 읽을 것 | 금지 |
|---------|------|
| [`2026-06-21-project-log.md`](./2026-06-21-project-log.md) · gap-report (`npm run audit:flight-route-gaps`) | `travelSpots.js` 전체 |
| `.ai-context.md` 6절(항공 DB) · 본 계획 **Phase 3** | slug overrides 전수 수동 추가 |
| [`audit-flight-route-gaps.mjs`](../scripts/audit-flight-route-gaps.mjs) · [`flight-route-resolver.mjs`](../scripts/lib/flight-route-resolver.mjs) | `travelSpotAirports.json` 직접 편집 |

**Phase 0 ✅** (2026-06-21): gap-report · 271 slug routeKind · uiPlace curated 7.

**Phase 1 ✅** (2026-06-21): `airports` migration · Supabase **9055** import · `airportsIndex.json` **3870** · `getAirportHubCoords` index 폴백 · `db:apply-migrations` · gap-report phase 1.

**Phase 2 ✅** (2026-06-21): `air_routes` migration · Supabase **37594** import · resolver · `travelSpotFlightRoutes.json` graph **193** · `audit:flight-routes` · pooler IPv4 migration.

**Phase 3 작업**: Edge `resolve-flight-route` · uiPlace · `resolveFlightRoutePlan`에 graph precompute 통합(override>graph>corridor) · graph-vs-corridor **47** slug 검토.

**gap 스냅샷**: hub-override 67 · direct-fallback 143 · corridor-only 59 · explicit-direct 1 · no-preview 1

---

## 연동 (기존 파일)

| 기존 | 연동 |
|------|------|
| `resolveFlightRoutePlan` | override > precompute > corridor > graph |
| `generate-travel-spot-airports.mjs` | overrides 우선 + `generate:flight-routes` merge |
| 배너·Trip | arc 전용 — **변경 없음** |

**npm**: `import:airports` · `import:routes` · `generate:airports-index` · `generate:flight-routes` · `audit:flight-routes` · `db:apply-migrations`
