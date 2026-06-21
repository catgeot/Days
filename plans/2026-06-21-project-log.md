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

**다음 세션 제시어**: `항공경로-DB-Phase2-실행`

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | gap-report + audit baseline | **✅** |
| 1 | Supabase airports + airportsIndex | **✅** |
| 2 | routes + auto hub precompute | **다음** |
| 3 | Edge + uiPlace | 대기 |

| 읽을 것 | 금지 |
|---------|------|
| [`flight-route-database-plan.md`](./flight-route-database-plan.md) Phase 2 | `travelSpots.js` 전체 |
| `.ai-context` 6절 · gap-report | slug overrides 전수 hub 추가 |
| `npm run audit:flight-route-gaps` | `travelSpotAirports.json` 직접 편집 |

---

## Phase 1 — airports migration · index · getAirportHubCoords ✅

- **migration**: `supabase/migrations/20260621120000_airports.sql` — SQL Editor 적용 · `db:apply-migrations` 스크립트
- **Supabase import**: **9055** IATA · scheduled **4170** · transit hub **301** · `name_ko` **301**
- **scripts**: `import-ourairports.mjs` · `generate-airports-index.mjs` · `apply-supabase-migration.mjs` · `lib/ourairports.mjs`
- **npm**: `import:airports` · `generate:airports-index` · `db:apply-migrations` — index **3870** (`source: supabase-airports`, rental 302 제외)
- **런타임**: `airportsIndexLookup.js` → `getAirportHubCoords` rental 우선 · index 폴백
- **gap-report**: phase 1 · hub-override 67 · direct-fallback 143 · dest 271/271 coords
- **fix**: `generate:airports-index` Supabase **1000행 제한** → 페이지네이션

