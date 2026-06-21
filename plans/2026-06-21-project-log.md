# 2026-06-21 프로젝트 일지

**이전**: [`2026-06-19-project-log.md`](./2026-06-19-project-log.md)

## 항공 경로 — DB-first 전환 계획 수립

- **진단**: 271 slug 중 hub 오버라이드 67 · 204 corridor/직항 폴백 · `uiPlace` 경로 불가 · hub 302개 한계
- **결정**: OurAirports+OpenFlights → Supabase SSOT · 하이브리드(airportsIndex + Edge `resolve-flight-route`) · arc 엔진·배너 유지
- **문서**: [`flight-route-database-plan.md`](./flight-route-database-plan.md) · [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2d 링크 · `.ai-context` 6절 갱신

---

## Phase 0 — gap-report ✅

- **`audit-flight-route-gaps.mjs`** · `npm run audit:flight-route-gaps` → `scripts/outputs/flight-route-gap-report.json`
- **271 slug routeKind**: hub-override 67 · corridor-only 59 · direct-fallback 143 · explicit-direct 1(amsterdam) · no-preview 1(seoul) · trip-hub-inferred 0
- **uiPlace curated 7**: Tahaa·Fa'anui preview ✅ · remote/search/loc 4건 preview 불가
- **baseline embed**: airports none:0 hub:302 · flight-arcs issue:4 · moscow QA FAIL

---

## 항공 경로 DB — 에이전트 핸드오ff

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | gap-report + audit baseline | **✅** |
| 1 | Supabase airports + airportsIndex | **✅** |
| 2 | routes + auto hub precompute | **✅** |
| 3 | Edge + uiPlace + graph runtime | **✅** |
| 4 | 출발지·경유지 UI | **다음** |

**사용자 QA (2026-06-21)**: Mapbox **지명(uiPlace) → 항공 경로 arc 연결 ✅** · 경유·직항 **상세 정확도 검수는 미완** (OpenFlights 2014·graph avoid-zone·uiPlace 2건 no-preview)

| 읽을 것 | 금지 |
|---------|------|
| [`flight-route-database-plan.md`](./flight-route-database-plan.md) **Phase 4·핸드오ff** | `travelSpots.js` 전체 |
| `.ai-context` 6절 · `audit:flight-arcs` · gap-report uiPlace | slug overrides 전수 hub 추가 |
| `globeFlightCinema.js` · `resolveFlightRouteEdge.js` | `travelSpotAirports.json` 직접 편집 |

**다음 세션 제시어** (우선순위):

| 제시어 | 범위 |
|--------|------|
| `항공경로-uiPlace-경유직항-QA` | uiPlace·SSOT slug 경유/직항 arc·Bar 정확도 · DMZ·loc-pin · Tahaa/Fa'anui 샘플 |
| `항공경로-graph-avoid-zone-검토` | graph tier `audit:flight-arcs` avoid-zone (~120) · southern guard 정책 |
| `항공경로-DB-Phase4-실행` | 출발지·경유지 UI (2·3차) |

---

## Phase 1 — airports migration · index · getAirportHubCoords ✅

- **migration**: `supabase/migrations/20260621120000_airports.sql` — SQL Editor 적용 · `db:apply-migrations` 스크립트
- **Supabase import**: **9055** IATA · scheduled **4170** · transit hub **301** · `name_ko` **301**
- **scripts**: `import-ourairports.mjs` · `generate-airports-index.mjs` · `apply-supabase-migration.mjs` · `lib/ourairports.mjs`
- **npm**: `import:airports` · `generate:airports-index` · `db:apply-migrations` — index **3870** (`source: supabase-airports`, rental 302 제외)
- **런타임**: `airportsIndexLookup.js` → `getAirportHubCoords` rental 우선 · index 폴백
- **gap-report**: phase 1 · hub-override 67 · direct-fallback 143 · dest 271/271 coords
- **fix**: `generate:airports-index` Supabase **1000행 제한** → 페이지네이션

---

## Phase 2 — air_routes · OpenFlights resolver · precompute ✅

- **migration**: `supabase/migrations/20260621130000_air_routes.sql` · `db:apply-migrations` pooler IPv4 폴백 (`aws-1-ap-northeast-2`)
- **scripts**: `lib/openflights.mjs` · `lib/flight-route-resolver.mjs` · `import-openflights-routes.mjs` · `generate-flight-routes.mjs` · `audit-flight-routes.mjs`
- **npm**: `import:routes` · `generate:flight-routes` · `audit:flight-routes` — OpenFlights **67662** legs · **37594** unique pairs · ICN outbound **370**
- **precompute**: `travelSpotFlightRoutes.json` — graph resolved **193** (direct 80 · 1hop 99 · 2hop 13) · unresolved **10** (BER·UBN·SAI 등 2014 스냅샷 한계) · manual skip **68**
- **merge**: `generate:airports` → `graphFlightRouteHubIatas` **193** slug (overrides·trip-hub 우선 · arc 런타임 **미변경**)
- **audit**: `audit:flight-routes` — semantic ok **224** · graph-vs-corridor **47** (Phase 3에서 corridor·graph 통합 검토)
- **Supabase ✅**: `air_routes` migration · `import:routes` **37594** pairs — direct `db.*` IPv6 ENOTFOUND → pooler `aws-1-ap-northeast-2` (`apply-supabase-migration` 자동 폴백)

---

## Phase 3 — Edge resolve-flight-route · graph runtime · uiPlace ✅

- **런타임**: `resolveFlightRoutePlan` override>graph(`graphFlightRouteHubIatas`·`flightRouteGraphLookup`)>corridor · graph tier avoid-guard 스킵
- **uiPlace**: `resolveUiPlaceCinemaDestIata` — galleryRegionSpot · rental 반경 · `findNearestAirportInIndex`(650km)
- **Edge ✅**: `resolve-flight-route` 배포 `phdjnbfitvmrguqzverm` · ICN→BDA smoke ATL 1hop
- **audit**: `audit:flight-routes` semantic **271/271** · graph-vs-corridor **47→0**
- **QA**: Mapbox 지명 arc **연결 확인** · 경유·직항 상세·avoid-zone **`audit:flight-arcs` 미정리** → 다음 세션

---

## uiPlace·경유/직항 QA (2026-06-21)

- **버그 수정**: `getFlightRouteAirportRow` — uiPlace formal slug의 `flightRouteHubIatas`·waypoint 상속 (배너 행과 분리)
- **Tahaa 추가 수정**: Tahaa↔bora-bora **33km** > tier2 **22km** → `galleryRegionSpot` 미부착 · `UI_PLACE_GALLERY_REGION_MAX_KM=50` + 좌표 fallback — **Edge 불필요**(시네마는 클라 sync만)
- **Tahaa·Fa'anui·label-pin**: ICN→NRT→PPT→BOB · Bar「경유」 — `bora-bora` SSOT와 일치 ✅
- **DMZ·loc-pin**: 최근접 ICN = 출발 ICN → `canPreview` false · **의도**(origin-equals-dest) — 항공 버튼 비활성 정상
- **SSOT 샘플**: amsterdam·luxor·los-angeles Bar 정합 ✅ · paris·moscow·hawaii graph-tier **직항 arc + avoid-zone** — `항공경로-graph-avoid-zone-검토`로 이관
- **audit**: `audit:flight-route-gaps` uiPlace 7건 · route-mismatch **0** · no-preview **2**(DMZ·loc-pin)
- **사용자 QA ✅**: 로컬 Tahaa ICN→NRT→PPT→BOB · Bar「경유」 확인

---

## 핸드오프 갱신 (uiPlace QA 완료)

| 제시어 | 범위 |
|--------|------|
| `항공경로-DB-Phase4-실행` | 출발지·경유지 UI |

---

## graph tier avoid-zone visual guard ✅

- **런타임**: graph tier zone 교차 시 `hubIatas` 유지 · arc만 `[125,33]→DXB flyover→[15,42]`(근거리 동북아·1hop PEK는 출발 waypoint만) 보강
- **moscow L3**: overrides `IST` hub + `[125,33]` waypoint
- **audit**: `audit:flight-arcs` **0 issues** · QA 8 slug **PASS** · `audit:flight-routes` semantic **271/271**

