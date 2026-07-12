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

## 항공경로 Heuristic S2 — Phase 2 diff audit

**상태**: ✅ (2026-07-12) · 런타임 미연결 유지 (S4)

- [`scripts/audit-flight-route-heuristic-diff.mjs`](../scripts/audit-flight-route-heuristic-diff.mjs) · `npm run audit:flight-route-heuristic-diff`
- ICN **271**: agree **81** · heuristic_wins **138** · graph_wins **52** · both_bad **0**
- **agree+heuristic_wins = 80.8%** ✅ (≥80%) · both_bad ≤15 ✅
- cinemaSafe 사용 **90**/90 · dest-corpus **conflict 55** 수동 승격 큐(자동 bake 없음)
- 산출: [`scripts/outputs/heuristic-graph-diff.md`](../scripts/outputs/heuristic-graph-diff.md)
- graph_wins 집중: **africa 16** · americas/europe 일부 — S3 macro/seed 보강 후보
- smoke·baseline 회귀 유지 (12/12 · 14/14)

## 항공경로 Heuristic S3 — Phase 3 GATN thin seed

**상태**: ✅ (2026-07-12) · lookup only · **런타임 미연결** (S4)

- [`scripts/lib/gat-network.mjs`](../scripts/lib/gat-network.mjs) — GATN CSV 파서 · 관문 outbound만
- [`scripts/generate-flight-route-seed.mjs`](../scripts/generate-flight-route-seed.mjs) · `npm run generate:flight-route-seed`
- [`scripts/data/flight-route-gateway-seed.json`](../scripts/data/flight-route-gateway-seed.json) — **37** origins · **5660** edges
- [`flightRouteGatewaySeed.js`](../src/pages/Home/lib/flightRouteGatewaySeed.js) — `seedHasDirectEdge` / `seedConfirmsPath` (BFS 없음)
- `npm run smoke:flight-route-gateway-seed` **8/8** · heuristic **12/12** · baseline **14/14**
- africa graph_wins·conflict 55·timeline bake·`resolveFlightRoutePlan` 연결 **미실시** (의도)

## 항공경로 Heuristic S4 — Phase 4 runtime/precompute

**상태**: ✅ (2026-07-12)

- 우선순위: **override > heuristic(+seed) > graph > corridor** — `resolveFlightRoutePlan` · Edge cinema 경로도 heuristic 우선
- seed: confirm-only / fail-open (`preferSeedConfirmedCandidates`) · BFS 없음 · Deno Edge 배포 불필요
- `generate:flight-routes` heuristic-first → `generate:airports` · precompute **185** (seed 148 · heuristic 37) · override skip 87
- cinemaSafe 프로필 빈 hub가 `allowDirect:false` 직항을 주입하던 버그 수정 (BDA→CDG→JFK)
- smoke baseline **15/15** · heuristic **12/12** · seed **8/8** · `audit:flight-arcs` 0 · `none:0`

## 항공경로 Heuristic S5 — Phase 5 override 축소

**상태**: ✅ (2026-07-12)

- `heuristic_wins`·동의 가능 slug에서 `flightRouteHubIatas` **60건 제거** (waypoints 유지) → macro/heuristic 위임
- **L3 유지**: 남태평양 연쇄 · Trip 분리 IATA · explicitDirect(`[]`) · moscow IST · 원격 특수(abu-simbel·fernando·ascension·st-helena)
- JSON spots **hub-override 25** · explicit-direct 3 · `generate:flight-routes` override skip **28**
- africa conflict **55** 미자동 bake · timeline cinema bake 금지 유지
- smoke baseline **15/15** (hampi → heuristic ICN→BLR) · arcs **0** · none **0**

---

## 항공경로 Heuristic S6 — Phase 6 QA·릴리스

**상태**: ✅ QA·문서·Credits (2026-07-12) · **릴리스 노트 합의 대기**

- smoke baseline **15/15** · heuristic **14/14** · seed **8/8** · arcs **0** · none **0**
- heuristic↔graph: agree **247** · wins **14** · graph_wins **10** · both_bad **0** · pass **96.3%** · conflict 55 유지
- 브라우저 Bar QA Pass: paris(ICN→CDG) · nairobi(ADD) · bora(NRT·PPT) · moscow(IST) · uyuni · seychelles(DXB) · saipan(직항) · hampi(BLR) · BDA→paris(JFK) · BDA→easter(LAX·SCL)
- Credits: `FLIGHT_ROUTE_ATTRIBUTION` (OpenFlights·OurAirports·GATN extract)
- database-plan handoff · heuristic 플랜 Phase 6 갱신

### 핫픽스 — SEA 직항(SIN/HKT) 경유 오탐

- **원인**: GATN seed가 ICN→SIN/HKT 직항과 via-HKG 경유를 모두 confirm → 동일 `-180` 보너스에 경유가 점수 우세
- **수정**: seed 직항+`allowDirect`면 직항만 유지 · hub당 `+220` 페널티 · smoke SIN/HKT · `generate:flight-routes`
- 결과: singapore/phuket/KUL/BKK → **ICN 직항**

### QA — S5 hub 축소 회귀 · L3 선택 복구

**상태**: ✅ 코드·smoke (2026-07-12) · **홈 클릭 QA 대기**

- **확인 9곳 L3**: palawan/el-nido `MNL` · kamchatka `VVO` · el-calafate/ushuaia `LAX,EZE` · andaman `DEL` · santorini/crete `ATH` · bodrum `IST` · alice `SYD`
- **위험군 2차**: 파타고니아·안데스·몰디브/세이셸 DXB · 인도 국내(DEL) · 보로부두르 CGK 등 — hub-override skip **73**
- `npm run audit:flight-route-risk` — risk **50→28** · hub_mismatch **0** · 잔여 28은 프로필 오탐·대안공항 위주(후지·상하이·코펜하겐 HEL·함피 DEL 등) → **자동 bake 금지**
- smoke baseline **15/15** · heuristic **14/14** · airports `none:0`

### QA — 직항 우선 · Americas/Hawaii/Samoa

**상태**: ✅ 코드·smoke (2026-07-12) · **홈 클릭 QA 대기**

| slug | 이전 | 이후 |
|------|------|------|
| `hawaii` | (HNL americas 오분류 시 LAX 경유) | **ICN→HNL** (`ICN\|oceania`) |
| `washington-dc` | ICN→ATL→IAD | **ICN→IAD** (seed 직항) |
| `bermuda` | ICN→YVR→JFK→BDA | **ICN→ATL→BDA** |
| `miami` | ICN→YVR→ATL→MIA | **ICN→ATL→MIA** |
| `buenos-aires` | ICN→LAX→ATL→EZE | **ICN→ATL→EZE** |
| `samoa` | AKL+NAN 연쇄 과다 | **ICN→NRT→NAN→APW** |

- **원인**: (1) HNL `lng~-158`이 Americas bbox에 걸림 (2) `ICN|americas` `allowDirect:false` + ATL/JFK longHaul 부재 → seed 직항·동부 1hop 탈락 (3) samoa `flightRouteHubIatas: [AKL,NAN]`을 연쇄로 해석
- **수정**: geoRules Hawaii/Polynesia→oceania 선행 · americas `allowDirect:true` + ATL·JFK longHaul · samoa/washington override·cinemaSafe profile · grand-canyon smoke 직항+waypoint
- smoke heuristic **18/18** · baseline **15/15** · airports `none:0`

### 다음 세션 — 에이전트 핸드오프

| 읽을 것 (3) | 금지 (3) |
|-------------|----------|
| 본 일지 「QA — 직항 우선」 | 잔여 28 전부 L3 bake · timeline cinema bake |
| [`scripts/outputs/flight-route-risk.md`](../scripts/outputs/flight-route-risk.md) | `travelSpots.js` / spots JSON 직접 |
| [`.ai-context.md`](../.ai-context.md) 6절 | africa conflict 55 bake |

**다음 QA 큐 (홈 클릭)**

| slug/검색 | 기대 path |
|-----------|-----------|
| 하와이 `hawaii` | ICN→HNL |
| 워싱턴 `washington-dc` | ICN→IAD |
| 버뮤다 `bermuda` | ICN→ATL→BDA |
| 마이애미 `miami` | ICN→ATL→MIA |
| 부에노스아이레스 `buenos-aires` | ICN→ATL→EZE |
| 사모아 `samoa` | ICN→NRT→NAN→APW |
| (부수) 라스베이거스·그랜드캐년 | ICN→LAS 직항 + 태평양 waypoint |

**제시어**

```
항공경로-이어하기 @plans/2026-07-12-project-log.md

직항 우선 Americas/Hawaii/Samoa 반영됨. 홈 클릭 QA:
하와이 HNL · 워싱턴 IAD · 버뮤다/마이애미/부에노스 ATL 1hop · 사모아 NRT→NAN.
이상 없으면 릴리스 노트 합의.
```
