# 2026-06-18 프로젝트 일지

**이전**: [`2026-06-17-project-log.md`](./2026-06-17-project-log.md)

## 항공 시네마 — Phase 2b Bar UX·홈 상호작용 ✅ (사용자 QA Pass)

- **FlightCinemaBar**: `flight-cinema-bar-halo` 글로우 · 「항공권 확인」Trip CTA(`globe-flight-cinema` 추적) · ~~「바로 보기」~~ **제거(2026-06-18 후속)**
- **시네마 중 홈**: **모바일** — 연관검색어 숨김 · 카테고리 숨김 · **데스크톱** — 연관·카테고리 클릭 → `closeFlightCinema` 후 탐색
- **장소카드**: 모바일 `max-lg:hidden` 카테고리

## 항로 arc·상태바 — hub SSOT ✅ (사용자 QA Pass)

- **`extractFlightRouteHubIatasFromEssentialGuide`**: `isTransitHubTimelineTitle` 가드
- **`sync:airports-from-toolkit`**: `flightRouteHubIatas` auto-bake 중단
- **`getFlightRouteHubIatas`**: live timeline fallback 제거 · overrides/`trip≠final` SSOT
- **overrides + waypoint** (툴킷·avoid-zone 정합 · QA Pass):

| slug | arc |
|------|-----|
| philadelphia | ICN→ATL→PHL |
| san-diego | ICN→LAX→SAN |
| fernando-de-noronha | ICN→GRU→FEN |
| cancun · chichen-itza | ICN→LAX→CUN |
| luang-prabang · krabi | ICN→BKK→… |

- **`audit:airports`** none:0 · **`audit:flight-arcs`** 5-click QA Pass

## FlightCinemaBar — 「여행 플랜」 ✅ (사용자 QA Pass)

- 항공코드 행 우측 · `/place/{slug}/planner` (플래너 탭 홈 · 항공 앵커 없음)
- 클릭 시 시네마 종료 · Trip CTA와 역할 분리(전체 여정 윤곽)

## 항공 시네마 — arc·Bar UX 고도화 ✅ (사용자 QA Pass)

- **arc 마커**: 출발(청록)·경유(빨강)·도착(노랑) + IATA 흰색 라벨(공항 옆)
- **구간 arc 애니메이션**: hub leg별 순차 draw + 정지(~700ms) · 총 ~10s (`buildFlightArcDrawSchedule`)
- **FlightCinemaBar**: `ICN ~11h LAX … (총 Nh)` 한 줄 · 메타 `대권 항로(실제 비행경로와 다를 수 있습니다.)` · **「바로 보기」 제거**
- **Trip CTA**: 모바일 `TripcomFlightSearchProvider` 검색 위젯 · 데스크톱 `buildTripcomPlannerNavigationUrl` · `globe-flight-cinema` 추적

## 다음 세션 (에이전트 핸드오프)

| # | 우선 | 방향 |
|---|------|------|
| 1 | (선택) | **2c** 문서만 · corridor/passenger Bar 라벨 · GUM·Trip CTA **보류** |

**금지**: `update-place-toolkit` · `GLOBE_VIEW.flyZoom` · 배너/`TITLE_ARRIVAL_AIRPORT_PHRASES` (사용자 승인 없이)

### Phase 2b 후속 — avoid-zone·Atlantic corridor ✅

- **`isNorthAtlanticCorridorDest`**: 미·캐나다 본토(lat>35, lng<-65) DXB 제외 · 아소르스·카보베르데(lng≥-30) 포함
- **`ICN_EUROPE_MEDITERRANEAN_GATEWAY`**: `[20,42]`→`[15,42]` — 헬싱키 ukraine 회귀 해소
- **overrides** `bahamas`: ATL+태평양 waypoint
- **`audit:flight-arcs`**: 37→29→**0** · 5-click QA Pass · chicago/toronto DXB 제거 · helsinki·bermuda·azores OK

### Phase 2b 후속 — 북미·남미 hub/waypoint batch ✅

- **29 slug** overrides — ATL/LAX/GRU/LPB + `[[180,12]]` 태평양 waypoint (philadelphia·san-diego·bahamas 패턴)
- **미 동부** ATL · **서부·캐나다 서부** LAX · **남미** GRU/LPB
- **`los-angeles`·`sequoia-national-park`**: ICN↔LAX **직항** — hub 제거·waypoint만(툴킷 직항·Bar「직항」·`flightHours≈11`)
- **`preferredLinkIata`·배너·Trip 매칭 변경 없음** — `flightRoute*`는 시네마 arc 전용
- **`audit:flight-arcs` none:0** · **`generate:airports`** override 152

## 써머리「항공 경로」버튼 준비·신뢰도 fix ✅ (사용자 QA Pass)

- **증상**: 활성 버튼 클릭 시 자전만 멈추고 시네마 미시작(다회 클릭) · `idle` 폴링·레이어 반복으로 자전 끊김·「준비 중」깜박임
- **UX**: `hasFlightRoute` ≠ `isFlightRouteReady` — `mapReady` 전「준비 중…」비활성 · 이후「항공 경로」활성·첫 클릭 재생
- **구현**: `isFlightCinemaGlobeReady`/`ensureFlightCinemaGlobeReady` · `HomePlaceCardSummary`+`globeRef` · `startFlightCinema` 성공 후에만 자전 정지
- **금지**: Mapbox `idle`/`styledata` 폴링 준비 판정 · 렌더/updater 안 부모 `setState`

## 커밋 (Phase 2b arc 최적화)

- `flightRouteCorridors.js` — Atlantic bbox·지중해 gateway `[15,42]`
- `travel-spot-airport-overrides.mjs` — avoid-zone·29 slug waypoint batch·LA 직항
- `travelSpotAirports.json` — `generate:airports`

### 다음 세션 제시어

```
@.ai-context.md @plans/2026-06-18-project-log.md @plans/2026-06-02-globe-enrichment-plan.md

항공-시네마-2c

Phase 2b arc·Bar·Trip CTA ✅ — 2c 문서·(선택) corridor/passenger 라벨.
toolkit·flyZoom·배너 로직 변경 금지.
```
