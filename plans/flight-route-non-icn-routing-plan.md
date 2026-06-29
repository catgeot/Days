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
- [`audit-flight-route-detours.mjs`](../scripts/audit-flight-route-detours.mjs) L62 — `resolveFlightRoutePlan` 인자 순서 버그 수정 (S2)

### F. (선택) Bar 구간 시간 tooltip

---

## 구현 순서

A → C → B → E → (F)

**권장 세션 분할** (2026-06-29 합의): ICN wins(A+C)와 graph 튜닝(B+Edge) 분리.

| 세션 | 범위 | 해결 이슈 | 미완(다음 세션) |
|------|------|-----------|-----------------|
| **1** | **A + C + E(일부)** | ICN→파리 직항 · BDA arc 도쿄 우회 | SGF · BDA→파리 지그재그 |
| **2** | **B + E(완료) + Edge deploy** | BDA→그랜드캐니언 SGF · BDA→파리 detour | F(tooltip) 선택 |

### 세션 1 — A + C + E(일부)

1. **A** — `getFlightRouteWaypoints(location, { originIata })` ICN 게이트 · [`globeFlightCinema.js`](../src/pages/Home/lib/globeFlightCinema.js) L385
2. **C** — `paris` override → `npm run generate:airports` → `npm run audit:airports` (`none: 0`)
3. **E(일부)** — smoke `icn-paris-direct` · `icn-grand-canyon-waypoint` 추가 · 기존 8/8 유지 · `audit:flight-arcs`

**세션 1 완료 기준**

| 케이스 | 기대 |
|--------|------|
| ICN → paris | Bar `ICN → CDG` · hubs 없음 |
| ICN → grand-canyon | `[135,35]`·LAX hub **회귀 없음** |
| BDA → grand-canyon | arc **도쿄 동쪽 없음** (waypoint만) · SGF는 **세션 2까지 허용** |
| smoke | 8/8 + ICN 신규 케이스 PASS |

### 세션 2 — B + E(완료) + Edge

1. **B** — `isMajorTransitHub` · major 이웃 우선+fallback · detour 1.35 · origin-region penalty · [`flight-route-resolver.mjs`](../scripts/lib/flight-route-resolver.mjs) + [`flightRouteGraph.ts`](../supabase/functions/_shared/flightRouteGraph.ts) + GeoRules JS/TS 동기
2. **E(완료)** — smoke BDA 케이스 · `audit:flight-route-detours` ICN/BDA/MNL · L62 `resolveFlightRoutePlan` 인자 버그 수정
3. **Edge deploy** — `resolve-flight-route` (BDA cinema QA 필수)
4. **수동 QA** — BDA 그랜드캐니언·파리 · ICN paris/grand-canyon 회귀

**세션 2 완료 기준**: 아래 검증 표 전체 + smoke 전체 PASS.

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
