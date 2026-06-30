# 2026-06-30 프로젝트 일지

**직전**: [`2026-06-29-project-log.md`](./2026-06-29-project-log.md)

---

## 항공 경로 — Heuristic SSOT + GATN lookup seed 플랜 수립

**상태**: **플랜 ✅** · **구현 미착수** · Phase 0(S0) 대기

- OpenFlights 2014 graph 의존 축소 · **Heuristic Router** 1차 SSOT · **GATN pax** 관문 outbound lookup-only (BFS 없음 · fail-open)
- SSOT: [`flight-route-heuristic-ssot-plan.md`](./flight-route-heuristic-ssot-plan.md)
- **다음**: Phase 0 baseline audit npm 전체 → gap/graph-direct 스냅샷

**제시어**

```
항공경로-이어하기 @plans/flight-route-heuristic-ssot-plan.md

Phase 0 baseline부터: audit npm 전체 → gap/graph-direct 스냅샷.
GATN seed = 관문 outbound lookup만(BFS 없음·fail-open·confirm-only).
Heuristic vs graph diff 전에 플랜 Phase 1~3 범위 재확인 후 착수.
로컬 세션 · Cloud Agent 없음.
```
