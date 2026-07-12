# 2026-07-12 프로젝트 일지

**직전**: [`2026-07-11-project-log.md`](./2026-07-11-project-log.md)

---

## 홈 모바일 — 관문 권역 범례·로고 패널 레이어

**상태**: ✅ QA 확인 (2026-07-12)

- 모바일: 3D 투어 2D 복귀 후에도 고줌이면 `GlobeClusterLegend`가 남던 문제 → `TOUR_READY`에서만 범례 UI (`showClusterLegend`)
- 로고 패널 z-index를 써머리·항공 경로 바(`z-120`) 위로 (`z-130`/`z-140`) · `FooterModal` `z-150`
- 파일: `HomeGlobeMapbox.jsx` · `LogoPanel.jsx` · `FooterModal.jsx`

---

## 카바라티 Trip 도착공항 누락 · 시네마/Trip SSOT 정렬

**상태**: ✅ QA 확인 (2026-07-12)

- **원인**: 시네마는 `airportsIndex`만으로 AGX 표시 가능 · Trip은 `rentalAirportHubs` 필수 → `aAirportCode` 누락
- **케이스**: 허브 AGX·COK · placeId `카바라티`/`kavaratti`/`아가티` — Trip `COK` · 최종·픽업 `AGX`
- **재발 방지**: `resolvePlannerFlightArrivalIata` airportsIndex last-resort · `audit:airports` `cinemaTripGap` · 가이드 §6
- `generate:airports` · `audit:airports` — `none: 0`, `cinemaTripGap: 0`

---

## 항공경로 도착지 코퍼스 · destArrivalProfile

**상태**: ✅ 전수조사·SSOT 생성 (구현 세션)

- `npm run audit:flight-route-dest-corpus` — 272 slug · toolkit 303행 · arrival **100%**(270/270) · timeline↔override 일치 **35.7%**(10/28) → auto-bake 금지 유지
- verdict: agree 16 · conflict 55 · override_only 59 · graph_only 139 · none 3 · gateway 고유 **44**
- Phase 0: gap hub-override **84** · graph-precompute **138** · `audit:flight-routes` semanticOk 270 · smoke **14/14**
- `generate:dest-arrival-profiles` → [`destArrivalProfiles.json`](../src/pages/Home/data/destArrivalProfiles.json) (cinemaSafe 90 · toolkit-audit 43은 수동 승격만)
- 조립 SSOT: [`flightRouteAssemble.js`](../src/pages/Home/lib/flightRouteAssemble.js) longHaul→gateway→final

### 개선 효과 (이번 산출물로 나아지는 점)

| 영역 | 이전 | 이후 |
|------|------|------|
| 도착·관문 데이터 | slug 수동·OpenFlights 개괄 | **destArrivalProfile** 272 slug 코퍼스 · gateway 고유 44 |
| 경로 조립 | hub 한 배열에 장거리+관문 혼재 | **longHaul → gateway → final** 고정 (`flightRouteAssemble`) |
| 플래너 timeline | 예전에 자동 bake 시도→회귀 | **audit만** · cinemaSafe/toolkit-audit 분리 |
| Heuristic 착수 | Phase 0 대기 | baseline 숫자·코퍼스 확보 → **S1 Router/macro** 가능 |

---

## 항공경로 Heuristic S1 — Router + macro

**상태**: ✅ 프로토타입·unit smoke (2026-07-12) · **런타임 미연결** (S4)

- [`flightRouteMacroTemplates.js`](../src/pages/Home/lib/flightRouteMacroTemplates.js) — ICN×권역 · BDA/MNL non-ICN macro
- [`flightRouteHeuristic.js`](../src/pages/Home/lib/flightRouteHeuristic.js) — macro 후보 + `scoreFlightPathV2`/detour → `assembleFlightRouteHubs`
- cinemaSafe profile만 후보 가중 · toolkit-audit(santorini 등) 미적용
- `resolveDestRegion` 좌표 fallback 보강 (EU/Americas/SEA/Oceania)
- `npm run smoke:flight-route-heuristic` **12/12** · baseline **14/14** 회귀 유지

### 다음 세션 — 에이전트 핸드오프

| 읽을 것 (3) | 금지 (3) |
|-------------|----------|
| 본 일지 「Heuristic S1」·[`.ai-context.md`](../.ai-context.md) 6절 | `travelSpots.js` / `travelSpotAirports.json` spots 직접 편집 |
| [`flight-route-heuristic-ssot-plan.md`](./flight-route-heuristic-ssot-plan.md) Phase 2 | timeline hub cinema 자동 bake · S1을 `resolveFlightRoutePlan`에 임의 연결 |
| `flightRouteHeuristic.js` · `flightRouteMacroTemplates.js` | overrides 없이 JSON `graphFlightRouteHubIatas`만 수정 |

**제시어**

```
항공경로-이어하기 @plans/2026-07-12-project-log.md @plans/flight-route-heuristic-ssot-plan.md

S1 ✅. 다음 = S2 Phase 2 heuristic↔graph diff audit.
audit:flight-route-heuristic-diff · agree+heuristic_wins ≥80% 목표.
cinemaSafe만 후보 · timeline auto-bake 금지 · conflict 55는 수동 승격 큐.
로컬 · resolveFlightRoutePlan 연결은 S4 · overrides.mjs → generate:airports 준수.
```
