# 2026-06-21 프로젝트 일지

**이전**: [`2026-06-19-project-log.md`](./2026-06-19-project-log.md)

## 항공 경로 — DB-first 전환 계획 수립

- **진단**: 271 slug 중 hub 오버라이드 67 · 204 corridor/직항 폴백 · `uiPlace` 경로 불가 · hub 302개 한계
- **결정**: OurAirports+OpenFlights → Supabase SSOT · 하이브리드(airportsIndex + Edge `resolve-flight-route`) · arc 엔진·배너 유지
- **문서**: [`flight-route-database-plan.md`](./flight-route-database-plan.md) · [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2d 링크 · `.ai-context` 6절 갱신

---

## 항공 경로 DB — 에이전트 핸드오ff

**다음 세션 제시어**: `항공경로-DB-Phase0`

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | gap-report + audit baseline | **다음 시작점** |
| 1 | Supabase airports + airportsIndex | 대기 |
| 2 | routes + auto hub precompute | 대기 |
| 3 | Edge + uiPlace | 대기 |

**읽기**: [`flight-route-database-plan.md`](./flight-route-database-plan.md) · `.ai-context` 6절  
**금지**: slug overrides 전수 수동 · `travelSpotAirports.json` 직접 편집 · Phase 0 skip 후 Phase 1
