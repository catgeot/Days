# 2026-06-21 프로젝트 일지

**이전**: [`2026-06-19-project-log.md`](./2026-06-19-project-log.md)

## 항공 경로 — DB-first 전환 계획 수립

- **진단**: 271 slug 중 hub 오버라이드 67 · 204 corridor/직항 폴백 · `uiPlace` 경로 불가 · hub 302개 한계
- **결정**: OurAirports+OpenFlights → Supabase SSOT · 하이브리드(airportsIndex + Edge `resolve-flight-route`) · arc 엔진·배너 유지
- **문서**: [`flight-route-database-plan.md`](./flight-route-database-plan.md) · [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2d 링크 · `.ai-context` 6절 갱신

---

## Phase 0 — 계획 확정 (실행 대기)

- **범위**: `audit-flight-route-gaps.mjs` 신규 · 271 slug `routeKind` 분류 · uiPlace **curated 5~8** (placeIds-only 전수 **제외**)
- **baseline 스냅샷**(2026-06-21): hub-override 67 · corridor-only 59 · direct-fallback 143 · explicit-direct 1(amsterdam) · no-preview 1(seoul) · `audit:airports` none:0 hub:302 · `audit:flight-arcs` issue:4 QA moscow FAIL

---

## 항공 경로 DB — 에이전트 핸드오ff

**다음 세션 제시어**: `항공경로-DB-Phase0-실행`

| Phase | 내용 | 상태 |
|-------|------|------|
| 0 | gap-report + audit baseline | **계획 확정 · 실행 대기** |
| 1 | Supabase airports + airportsIndex | 대기 |
| 2 | routes + auto hub precompute | 대기 |
| 3 | Edge + uiPlace | 대기 |

### Phase 0 실행 체크리스트 (다음 세션)

1. [`scripts/audit-flight-route-gaps.mjs`](../scripts/audit-flight-route-gaps.mjs) 신규 — [`audit-flight-arcs.mjs`](../scripts/audit-flight-arcs.mjs) 패턴 · 시작 시 `audit:airports`·`audit:flight-arcs` 선행
2. `package.json` → `"audit:flight-route-gaps"`
3. 출력 → `scripts/outputs/flight-route-gap-report.json` (gitignore)
4. slug `routeKind`: `hub-override` | `explicit-direct` | `trip-hub-inferred` | `corridor-only` | `direct-fallback` | `no-preview` | `no-dest-iata`
5. uiPlace 샘플: Tahaa · Fa'anui · Remote Pacific · `label-*` · `search-*` (5~8건)
6. 완료 후 gap 요약 대화 제시 · 본 일지 2~3줄 · `.ai-context` 5절 Phase 1 대기

| 읽을 것 | 금지 |
|---------|------|
| 본 일지 **Phase 0 실행 체크리스트** | `travelSpots.js` 전체 |
| [`flight-route-database-plan.md`](./flight-route-database-plan.md) Phase 0 | slug overrides 전수 hub 추가 |
| `.ai-context` 6절 | `travelSpotAirports.json` 직접 편집 |
| [`audit-flight-arcs.mjs`](../scripts/audit-flight-arcs.mjs) | Supabase migration · Phase 0 skip 후 Phase 1 |
