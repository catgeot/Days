# 2026-06-18 프로젝트 일지

**이전**: [`2026-06-17-project-log.md`](./2026-06-17-project-log.md)

## 항공 시네마 — tikal arc spot-check ✅

- **데이터**: `FRS` hub 등록 · `tikal` — `preferredLinkIata:FRS` · `tripFlightArrivalIata:GUA` · `flightRouteHubIatas:[LAX,GUA]` · 태평양 waypoint `[[135,30],[-170,28]]`
- **엔진**: `isSouthernDetourLongArc`(long arc minLat<-40 → short 유지) — ICN→LAX/MEX 남반구 대우회 회귀 방지
- **검증**: [gcmap](http://www.gcmap.com/dist?P=ICN-LAX-GUA-FRS) 거리 13,447km·16h 일치 · 홈 arc 방향 Pass(태평양→LA→중미)
- **다음**: Phase 2b 잔여 slug spot-check · Bar UX
