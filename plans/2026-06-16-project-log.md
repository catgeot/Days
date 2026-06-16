# 2026-06-16 프로젝트 일지

**이전**: [`2026-06-15-project-log.md`](./2026-06-15-project-log.md)

## 써머리 장소카드 — 긴 지명·MOONi CTA

- **문제**: 여행지명이 길면 즐겨찾기·닫기 버튼이 밀려 사라짐
- **조치**: `PlaceCardSummary` 헤더 flex — 제목 `min-w-0 flex-1 truncate` · 버튼 `shrink-0` · `title` 툴팁
- **CTA**: 「MOONi에게 물어보기」→ **「MOONi」** (써머리 카드만)
- **QA**: 사용자 Pass

## 3D 투어 — 카보베르데(cape-verde) Sal 섬 조망

- **문제**: `travelSpots` 핀이 군도 해상 중심(16.54°N, 23.04°W) → 투어 카메라가 바다를 바라봄
- **조치**: `globeLandmarks.json` `cape-verde` — Sal Island(SID) 중앙·Santa Maria keyframes · `ISLAND_TOUR_SLUGS` 등록 · `scan-tour-ocean-mismatch` 동기화
- **가이드**: [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) QA·얇은 atol 예시 갱신
- **QA**: 사용자 Pass

## 꼬꼬무 연관 여행지 — 홈·갤러리 탐색 SSOT

- **홈**: 좌측 연관 검색어 `KEYWORD_DB` → `getRelatedPlaces`(4 연관 + 1 교두보) · 갤러리와 동일 UI(Compass/Sparkles)
- **갱신 규칙**: 연관 4곳 클릭 → flyTo·카드만 · **교두보(푸시아)만** 새 5개 세트 · 지구본·URL 직접 진입은 전체 갱신
- **갤러리**: `PlaceChatPanel` state SSOT · 탭 전환 시 목록 고정(선행 커밋 `db2ee02`) + 교두보만 갱신 동일 적용
- **QA**: 사용자 Pass

## 지구본·플래너 권역 클러스터 — 탐색 UX

- **Phase 3 범례**: 정적 범례 → `GlobeClusterLegend` — 탭 시 주변 관문 여행지 목록 · 항목 클릭 flyTo·장소카드 전환 · 3D 투어 pivot 연동
- **데이터**: `travelSpotClusters.json` **3→31 권역** · **116 slug**(271 중 43%) — 필리핀·발리·베트남·이탈리아·미크로네시아 등 공항 SSOT 기준 확장 · 파타고니아+페닌슬라 발데스
- **플래너**: `RelatedTravelSpots` — 가로 스크롤바 가시성(slate) · 마우스 드래그 스크롤 · 드래그 중 링크 클릭 방지
- **QA**: 사용자 Pass (지구본·플래너)

## 항공 시네마 — Phase 2b ✅ (써머리「항공 경로」·2026-06-16)

- **범위**: 홈 써머리 ICN→도착 IATA arc · `FlightCinemaBar` · **닫기**로만 종료 · arc·바 유지 · 재클릭 재생
- **버그 수정**: `globeMapboxLabelPolicy` line 레이어 숨김(점만) · engine reset·`isFlightCinemaLayer` 제외 · 연속 재생·닫기 후 재시작
- **경로**: `buildFlightRouteLine` — 대권 + 측면 곡선(표시용) · 시간 SSOT haversine 유지
- **UX**: Skip→**바로 보기**(애니만 건너뜀) · **닫기**=정리
- **QA**: 사용자 Pass
- **후속**: Trip CTA·항공권 카드 연결

## 항공 시네마 — arc·Trip CTA (2026-06-16)

- **arc**: 3D slerp · 극우회(|lat|>58° long arc) · `unwrapRouteLongitudes`(날짜변경선) · `computeRouteCameraView` bbox 프레이밍
- **우유니(LPB)**: overrides `tripFlightArrivalIata: LPB` · `flightRouteWaypoints: [[180,12]]` · `generate:airports`
- **Trip 연동**: ~~`useFlightCinemaBeforeTripOpen`~~ **제거** — 시네마는 홈 써머리「항공 경로」전용 · 플래너·MOONi Trip CTA 직접 연결 없음(항공권 검색은 arc 최적화 후 재검토)

## 항공 시네마 — 세션 마감·다음 (2026-06-16)

- **커밋**: arc slerp·극/날짜변경선·LPB waypoint · Trip 연동 제거 · `requestFlightCinema` IATA 좌표 해석 fix
- **미해결 QA**
  1. 첫「항공 경로」후 **재실행 실패**
  2. **상태바 미닫기** + 다른 장소카드 → **3D 투어 실패** — 새 카드 진입 시 기존 시네마/투어 **자동 종료** 기대
- **후속 아이디어**: 항로 **데이터화** · 환승 관문 IATA waypoint(overrides `flightRouteWaypoints` 확장)

## 항공 시네마 — 재실행·투어 충돌 (2026-06-16)

- **재실행**: `FlightCinemaContext` useEffect 지연 시작 제거 → `requestFlightCinema` 동기 `startFlightCinema` · `finishCinema` idempotent · engine `setupFlightCinemaLayers({ visible: true })`
- **투어 충돌**: `startTour` cinema 선종료 · 마커·클러스터 POI 클릭 시 `closeFlightCinema` · `forceReset` 경로 `onComplete('interrupt')` · `closeFlightCinema` TDZ·선언 순서 fix
- **모바일 투어 UI**: `beginGlobeTour` · `tourLaunchPending` → 써머리 즉시 숨김 · `TourMobileBar` · `handleGlobeModeChange`/`getGlobeMode` 동기화
- **QA**: 이전 세션 대비 **한층 부드러움** (사용자) · 모바일 투어↔카드 **개선** ✅

## 항공 시네마 — 세션 마감·다음 (2026-06-16)

- **커밋**: 시네마 재실행·cinema↔투어 정리 · 모바일 `beginGlobeTour`/`tourLaunchPending`
- **미해결 QA**
  1. **데스크톱 3D 투어 중** 써머리「항공 경로」버튼 노출·**클릭 무반응** — `requestFlightCinema`가 `isTourActive` early return · **기대**: `endTour`→2D 복귀 후 arc 시네마
  2. **미크로네시아 등** ICN→하와이 허브만 arc — **경유 IATA chain** 데이터·표시(다음 세션 목표)
- **다음 세션**: overrides `flightRouteWaypoints`·IATA 관문 chain · `buildGreatCircleChain` · bar 라벨(직항/경유) · (선택) 투어 중 항공 경로→2D+시네마

**제시어** — [`2026-06-02-globe-enrichment-plan.md`](./2026-06-02-globe-enrichment-plan.md) §다음 세션
