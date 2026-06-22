# 2026-06-22 프로젝트 일지

**이전**: [`2026-06-21-project-log.md`](./2026-06-21-project-log.md)

## 홈 지구본 — 마지막 방문 핀 유지

- **증상**: 3D 투어 **X**·써머리 닫기 후 `selectedLocation` null → `activePinId` 소실 · 방문 지명 `isGhost`(opacity 0.55) · 핀 누락(홈 복귀 경로)
- **수정**: [`index.jsx`](../src/pages/Home/index.jsx) — `globeActivePinId` · `dismissPlaceSelectionKeepGlobePin` · `goHomeFromPlace`에 `addScoutPin`
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 1 X·핀 정책 갱신
- **QA**: 사용자 확인 ✅

## 써머리「항공 경로」버튼 — 준비 판정 정확도 fix

- **증상**: `mapReady`만 true면 버튼 활성 · 클릭 무반응(시네마 레이어 미등록·스타일 전환 후 stale ready)
- **수정**: `HomeGlobeMapbox` `isFlightCinemaReady` → `isFlightCinemaGlobeReady`+`ensure` · 스타일 전환·투어·시네마 중 false · `HomePlaceCardSummary` 준비 폴링 지속(ready→not-ready 복귀)
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2c 준비 판정 갱신
- **QA**: 사용자 확인 ✅

## 항공 허브 geo 규칙 v2 — 트랙 A·B ✅ (트랙 C·Phase4 대기)

- **트랙 A**: `hampi` DEL · `cape-town` ADD · `victoria-falls` ADD→JNB `flightRouteHubIatas` override → `generate:flight-routes` · `generate:airports` · `audit:airports` none **0** · `audit:flight-arcs` **0**
- **트랙 B**: `flightRouteGeoRules.js` v2 scorer(총시간·cross-track·권역) · graph-direct guard · `audit:flight-route-detours` · Edge `flightRouteGraph.ts` 동기 · precompute graph-direct 78→43(override **84**건 skip 불변)
- **시네마 QA**: 함피 DEL · 케이프타운 ADD · 빅토리아폴스 ADD→JNB · `routeSource=override`
- **대기**: ~~uiPlace→Edge 연결(`rentalAirportMatch` 승인 후)~~ → **다음 세션 C-3 승인됨** · Phase4 출발지 picker·timezone·경유 hub top-N

### 항공권·배너 세션 — 에이전트 핸드오프 (C-3)

**승인 범위** (사용자 합의): `getTravelSpotAirportRow`·배너 **불변** · `getGraphFlightRouteHubIatas` / `getFlightRouteAirportRow` — **uiPlace 50km 밖 + Edge fallback만** · [`resolveFlightRouteViaEdge.js`](../src/utils/resolveFlightRouteEdge.js) → `FlightCinemaContext` hub 주입 · Edge 실패 시 JSON lookup 폴백 · **배포** `resolve-flight-route` v2

| 트리거 | Edge |
|--------|------|
| `uiPlace` + formal slug 상속 row **없음** (50km 밖) | 호출 |
| override `flightRouteHubIatas` · 50km 상속 | 스킵 |
| `originIata !== ICN` | 호출 (Phase4 선행) |

### 다음 세션

| 읽을 것 | 금지 | 제시어 |
|---------|------|--------|
| `.ai-context` 6절 · 본 절 C-3 · [`항공_허브_규칙_검토_55c0864d.plan.md`](../../.cursor/plans/항공_허브_규칙_검토_55c0864d.plan.md) B-3 | `travelSpots.js` 전체 · JSON spots 직접 · 배너·`getTravelSpotAirportRow` 변경 | 아래 **제시어** 복붙 |

**제시어 (복붙)**:

```
항공권-이어하기 @plans/2026-06-22-project-log.md

트랙 C-3 실행 — rentalAirportMatch uiPlace→Edge (승인 범위 내):
· getGraphFlightRouteHubIatas / getFlightRouteAirportRow — uiPlace 50km 밖 Edge fallback만
· resolveFlightRouteViaEdge → FlightCinemaContext hub 주입 · Edge 실패 JSON 폴백
· resolve-flight-route Edge v2 배포
· 배너·getTravelSpotAirportRow 불변 · audit:flight-arcs 0
```

## 홈 지구본 — 첫 진입 면 로테이션 fix

- **증상**: 새로고침·첫 `/` 진입 시 항상 default(0°,20°) → 아조레스 제도 노출 · `categoryFaceEpoch` flyTo 미실행
- **원인**: `onLoad`가 `prevHighlightCategoryRef`를 선동기화 + `initialViewState`가 `GLOBE_VIEW.default` 고정
- **수정**: [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) — 랜덤 카테고리 중심 `initialGlobeViewState` · share 복원 후에만 prev ref 동기화
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) 카테고리 5면 진입·주의 갱신
