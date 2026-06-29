# 항공경로 — 비-ICN 출발·waypoint·경유 수정 계획

**작성**: 2026-06-29  
**배경**: Phase 4 v2 출발지 변경 QA — BDA·MNL 등 비-ICN에서 arc·경유 오류  
**관련**: [`.ai-context.md`](../.ai-context.md) 6절 · [`flight-route-database-plan.md`](./flight-route-database-plan.md) · 일지 [`2026-06-29-project-log.md`](./2026-06-29-project-log.md)

---

## 문제 요약

| 케이스 | 표시 경로 | 핵심 문제 |
|--------|-----------|-----------|
| 그랜드캐니언 · BDA | BDA~ATL~SGF~LAS + 도쿄 arc | ICN waypoint + Edge 소형 허브 |
| 파리 · BDA | BDA~LGW~MUC~CDG | 국제 지그재그 |
| 파리 · ICN | ICN~HEL~CPH~CDG | ICN↔CDG 직항 있는데 2-hop |
| 파리 · MNL | MNL~HKG~FRA~CDG | 2차 검수 (상대적 합리) |

---

## 근본 원인

1. **`getFlightRouteWaypoints`** — `originIata` 무관 ICN용 `[135,35]` 적용 → BDA arc가 일본 동쪽 경유
2. **`shouldResolveFlightRouteViaEdge`** — `origin !== 'ICN'` → Edge가 override 덮어씀 · BFS 전 이웃 허용(SGF 등)
3. **OpenFlights 2014** — ICN→CDG edge 없음 → paris graph-2hop
4. **Bar `~Nh`** — 구간 비행 시간(환승 대기 아님) · 「경유」는 hub>0일 때 형식상 맞음

---

## 수정 방안

### A. waypoint origin 게이트 (최우선)

- `getFlightRouteWaypoints(location, { originIata })` — ICN일 때만 override waypoint
- 파일: `globeFlightCinema.js`, `rentalAirportMatch.js`

### B. 그래프 허브 필터 + detour

- tier-1 ∪ regional 허브 1차 후보 · 0건 시 fallback
- `flightPathDetourRatio > 1.35` 제거
- origin-region penalty
- 파일: `flight-route-resolver.mjs`, `flightRouteGraph.ts`, `flightRouteGeoRules.js`

### C. ICN→파리 직항 override

```javascript
// travel-spot-airport-overrides.mjs
paris: { flightRouteHubIatas: [], rationale: 'ICN↔CDG 직항 · graph HEL·CPH 오탐' }
```

→ `npm run generate:airports` → `audit:airports`

### D. (선택) Edge vs override — D-1(필터만) 권장

### E. smoke·audit 확장

- BDA grand-canyon/paris · ICN paris
- detour audit: ICN, BDA, MNL

### F. (선택) Bar 구간 시간 tooltip

---

## 구현 순서

A → C → B → E → (F)

---

## 검증

| 케이스 | 기대 |
|--------|------|
| BDA → grand-canyon | 도쿄 arc 없음 · SGF 없음 |
| BDA → paris | detour ≤ 1.35 |
| ICN → paris | 직항 |
| ICN → grand-canyon | Pacific waypoint 회귀 없음 |
| smoke:flight-route-baseline | PASS |
| audit:flight-arcs | 0 |

---

## 리스크

- tier-1-only 후보 0 → **fallback** 필수
- OpenFlights 2014 한계 — overrides 점진 보정
- 릴리스 노트 — 사용자 합의 후 `releaseNotes.js`
