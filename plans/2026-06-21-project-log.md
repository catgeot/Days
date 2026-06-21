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

**다음 세션 제시어**: `항공경로-DB-Phase1-실행`

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | gap-report + audit baseline | **✅** |
| 1 | Supabase airports + airportsIndex | **다음** |
| 2 | routes + auto hub precompute | 대기 |
| 3 | Edge + uiPlace | 대기 |

### Phase 1 실행 체크리스트 (다음 세션)

1. `supabase/migrations` — `airports` 테이블 (OurAirports 스키마)
2. `scripts/import-ourairports.mjs` · `npm run import:airports`
3. `airportsIndex.json` 생성 · `getAirportHubCoords` 확장
4. gap-report 재실행으로 hub 302→DB 커버리지 비교

| 읽을 것 | 금지 |
|---------|------|
| [`flight-route-database-plan.md`](./flight-route-database-plan.md) Phase 1 · gap-report | `travelSpots.js` 전체 |
| `.ai-context` 6절 | slug overrides 전수 hub 추가 |
| `npm run audit:flight-route-gaps` 출력 | `travelSpotAirports.json` 직접 편집 |
