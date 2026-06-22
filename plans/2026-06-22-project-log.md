# 2026-06-22 프로젝트 일지

**이전**: [`2026-06-21-project-log.md`](./2026-06-21-project-log.md)

## 홈 지구본 — 마지막 방문 핀 유지

- **증상**: 3D 투어 **X**·써머리 닫기 후 `selectedLocation` null → `activePinId` 소실 · 방문 지명 `isGhost`(opacity 0.55) · 핀 누락(홈 복귀 경로)
- **수정**: [`index.jsx`](../src/pages/Home/index.jsx) — `globeActivePinId` · `dismissPlaceSelectionKeepGlobePin` · `goHomeFromPlace`에 `addScoutPin`
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 1 X·핀 정책 갱신
- **QA**: 사용자 확인 ✅

## 써머리「항공 경로」버튼 — 준비 판정 정확도 fix

- **증상**: `mapReady`만 true면 버튼 활성 · 클릭 무반응(시네마 레이어 미등록·스타일 전환 후 stale ready)
- **수정**: `HomeGlobeMapbox` `isFlightCinemaReady` → `isFlightCinemaGlobeReady` · 스타일 전환·투어·시네마 중 false · `HomePlaceCardSummary` 준비 폴링 지속(ready→not-ready 복귀) · *(후속: 폴링 ensure 제거 — 본 일지 FlightCinemaBar 절)*
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) Phase 2c 준비 판정 갱신
- **QA**: 사용자 확인 ✅

## 항공 허브 geo 규칙 v2 — 트랙 A·B ✅ (트랙 C·Phase4 대기)

- **트랙 A**: `hampi` DEL · `cape-town` ADD · `victoria-falls` ADD→JNB `flightRouteHubIatas` override → `generate:flight-routes` · `generate:airports` · `audit:airports` none **0** · `audit:flight-arcs` **0**
- **트랙 B**: `flightRouteGeoRules.js` v2 scorer(총시간·cross-track·권역) · graph-direct guard · `audit:flight-route-detours` · Edge `flightRouteGraph.ts` 동기 · precompute graph-direct 78→43(override **84**건 skip 불변)
- **시네마 QA**: 함피 DEL · 케이프타운 ADD · 빅토리아폴스 ADD→JNB · `routeSource=override`
- **대기**: ~~uiPlace→Edge 연결(`rentalAirportMatch` 승인 후)~~ → **다음 세션 C-3 승인됨** · Phase4 출발지 picker·timezone·경유 hub top-N

## 트랙 C-3 — uiPlace→Edge · FlightCinemaContext hub 주입 ✅

- **`getFlightRouteAirportRow`**: uiPlace 50km 밖 → `null`(배너 `getTravelSpotAirportRow` 불변)
- **`shouldResolveFlightRouteViaEdge`**: 50km 상속·override 스킵 · `originIata≠ICN` Edge
- **`getGraphFlightRouteHubIatas`**: Edge 트리거 시 `null` → `resolveFlightRouteHubsForCinema`(Edge→JSON 폴백)
- **`FlightCinemaContext`**: 시네마 시작 전 async hub 주입 · Bar·arc 동기화
- **배포**: `resolve-flight-route` v2 `phdjnbfitvmrguqzverm` · `audit:flight-arcs` **0**

## 트랙 C-3 — Edge UX · 로컬 QA ✅

- **증상**: uiPlace Edge(Manihiki 등) — 버튼 활성인데 클릭 무반응 · 연타 후 작동 · 콘솔 로그 없음(의도)
- **원인**: `requestFlightCinema`가 Edge await(1~5s cold start) 중 피드백 없음 · Edge를 globe ready **이전**에 await
- **수정**: globe ready → Edge → 시네마 · `flightCinemaRequestPending` · 버튼 **「조회 중…」** · 중복 클릭 가드
- **Manihiki QA**: 동기 미리보기 dest **MHX** · Edge graph **ICN→NRT→PPT→RAR**(쿡 제도 관문 · OpenFlights) · Network `resolve-flight-route`로 확인(콘솔 X)
- **로컬 QA 샘플**: SSOT `보라보라`/`함피` · uiPlace sync `Tahaa`/`Fa'anui` · Edge `Manihiki` · no-preview `DMZ`/`서울`
- **문서**: [`travel-spots-management.md`](./travel-spots-management.md) §8 uiPlace·Edge QA 갱신

### 항공권·배너 세션 — 에이전트 핸드오프 (Phase 4)

**C-3 완료** — `getTravelSpotAirportRow`·배너 불변 · uiPlace 50km 밖 Edge · `resolveFlightRouteHubsForCinema` · Edge v2 배포 ✅

| 읽을 것 | 금지 | 제시어 |
|---------|------|--------|
| `.ai-context` 6절 · 본 절 Phase 4 · [`flight-route-database-plan.md`](./flight-route-database-plan.md) Phase 4 | `travelSpots.js` 전체 · JSON spots 직접 · C-3 재실행 | 아래 **제시어** 복붙 |

**제시어 (복붙)**:

```
항공권-이어하기 @plans/2026-06-22-project-log.md

Phase 4 실행 — 출발지·경유 UI (C-3·Edge 안정 후):
· 출발지 picker (ICN 외 originIata — shouldResolveFlightRouteViaEdge 이미 선행)
· timezone 제안
· 경유 hub top-N UI
· 배너·getTravelSpotAirportRow 불변 · audit:flight-arcs 0
```

### (아카이브) C-3 핸드오ff — 완료

**승인 범위** (사용자 합의): `getTravelSpotAirportRow`·배너 **불변** · `getGraphFlightRouteHubIatas` / `getFlightRouteAirportRow` — **uiPlace 50km 밖 + Edge fallback만** · [`resolveFlightRouteViaEdge.js`](../src/utils/resolveFlightRouteEdge.js) → `FlightCinemaContext` hub 주입 · Edge 실패 시 JSON lookup 폴백 · **배포** `resolve-flight-route` v2

## 홈 지구본 — 첫 진입 면 로테이션 fix

- **증상**: 새로고침·첫 `/` 진입 시 항상 default(0°,20°) → 아조레스 제도 노출 · `categoryFaceEpoch` flyTo 미실행
- **원인**: `onLoad`가 `prevHighlightCategoryRef`를 선동기화 + `initialViewState`가 `GLOBE_VIEW.default` 고정
- **수정**: [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx) — 랜덤 카테고리 중심 `initialGlobeViewState` · share 복원 후에만 prev ref 동기화
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) 카테고리 5면 진입·주의 갱신

## 트립링크 패키지 임시 비노출

- **배경**: 트립링크 제휴 페이지 종료 응답 — 탐색·위키·플래너 잘못된 링크 제거
- **수정**: [`tripLinkPackages.js`](../src/pages/Home/data/tripLinkPackages.js) `TRIPLINK_PACKAGES_ENABLED = false` · matcher·탐색 큐레이션·모달 가드
- **재연동**: 여행사 선정 후 플래그 `true` + 패키지 데이터 교체

## Manihiki(Tukao) 플래너 — 지리 검증 geoMismatch fix

- **증상**: uiPlace `tukao` — Edge 툴킷 생성 후에도 `essentialGuideMatchesLocation` 실패 · `빈/불일치 툴킷 무시` · 플래너 빈 화면
- **원인**: DB `primary_arrival_airports_iata` RAR 단독 — 마니히키(-10.4°)↔RAR(-21.2°) **>900km** · curated override 없음
- **수정**: `overrides.mjs` `tukao`·`Manihiki` MHX+RAR high · `rentalAirportHubs` MHX · synonyms · `generate:airports` · `audit:airports` none **0**
- **DB 보정(선택)**: `npm run toolkit:patch-guide-iata -- --dry-run` → `--apply`

## Manihiki 항공 경로 — ICN→MHX 직항 오표 fix

- **증상**: 써머리·시네마 Bar `ICN→MHX` 직항(~11h) · 플래너 여정(ICN→AKL/SYD→RAR→MHX)과 불일치
- **원인**: uiPlace 50km 밖 `getFlightRouteAirportRow` null → `placeIds` `flightRouteHubIatas`(NRT·PPT·RAR) 미적용 · Edge/graph-direct 폴백
- **수정**: `rentalAirportMatch` — placeIds curated `flightRouteHubIatas` 있으면 arc SSOT·Edge 스킵 · 기대 `ICN→NRT→PPT→RAR→MHX` 경유
- **문서**: [`travel-spots-management.md`](./travel-spots-management.md) §8 uiPlace·Manihiki QA 갱신

## FlightCinemaBar 직항 시간 · 써머리 준비 판정

- **Bar**: 직항도 경유와 동일 인라인(`ICN ~13h JFK (총 13h)`) · `FlightCinemaBar` `showLegTimes` isConnecting 조건 제거
- **준비 버튼**: `isFlightCinemaReady` 폴링 시 `ensureFlightCinemaGlobeReady` 부수 호출 제거 → 레이어 실존(`isFlightCinemaGlobeReady`)만 true · 미준비 시 「준비 중…」 비활성 유지
- **문서**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) · [`.ai-context.md`](../.ai-context.md) 3절 준비 판정 갱신
