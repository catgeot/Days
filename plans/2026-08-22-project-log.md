# 2026-08-22 프로젝트 일지

직전: [`2026-08-21-project-log.md`](./2026-08-21-project-log.md)

## 항공경로 PROD arc 레이스 (#146)

- **증상** Preview OK · main 병합 후 PROD에서 arc 실패·중단 재발
- **원인** 조회 대기 중 `syncGateoMarkerLayers`가 시네마 레이어 숨김 · start 직후 idle 레이스
- **수정** launch pending·engine.isActive 동안 레이어 재숨김 금지 · active ref 선설정 · safeMapUpdate loaded 폴백
- **추가** flyTo 중 setData 스킵 → map render 훅·완료 타이머 · 공항 circle 점 레이어 상시 숨김(IATA HTML만)
- **VERIFY** `npm run build` PASS

## 항공경로 첫 클릭·아크 중단 재발

- **증상** PROD 써머리 「항공 경로」1회 클릭 조용 실패·arc 그려지다 멈춤
- **수정** `949875c1` — alternatives Edge 조회를 시네마 시작 후로 지연 · start 재시도·ready 대기 시점 이동 · Edge prefetch 실패 시 launch 재조회 · 애니 종료 revealFullRoute · ready latch
- **VERIFY** `npm run build` · `smoke-flight-route-baseline` PASS
- **PR** `cursor/flight-route-click-fix-b5aa`

## 영문화 #44, 최적화 잔여 — 써머리 항공경로 버그

- **증상** 써머리 「항공 경로」첫 클릭 조회 중 후 실패·재클릭 시에만 arc · 항로 기점 공항코드(ICN) 누락
- **원인** `isFlightCinemaReady` latch stale · Edge hub 이중 조회 · `routeIatas`/맵 endpoint 라벨 기점 IATA 미보장
- **수정** `f44f660f` — hub prefetch 전달·`skipEdgeHubResolve` · `normalizeFlightRouteIataChain` · 라벨 레이어 ready·start 재시도
- **VERIFY** `npm run build` · `audit:i18n` PASS
- **사람 QA** `/?lang=en` 또는 KO — 카르스텐츠 피라미드·라자암팟 등 해외 핀 → 써머리 → **항공 경로** 1회 클릭 → arc+Bar에 **ICN** 기점·지도 ICN 라벨

## 영문화 #44b — Mapbox IATA 라벨 continuePlacement 크래시

- **증상** 항공 시네마 arc는 뜨나 지도 IATA 라벨 없음 · 콘솔 `continuePlacement … reading 'get'`
- **원인** `syncGateoMarkerLayers`가 시네마 중 매번 `moveLayer` · symbol+flyTo+arc rAF 동시 갱신
- **수정** `text-font` 명시 · `promoteZIndex` 시에만 `moveLayer` · endpoint `setData` 2×rAF 지연 · 시네마 활성 시 레이어 재동기화 스킵
- **VERIFY** `npm run build` PASS

## 영문화 #44b — IATA HTML Marker 복원

- **원인** i18n `setLanguage` 후 Mapbox **symbol** 레이어 `continuePlacement` 크래시 — 영문화 이전에도 symbol이었으나 언어 전환·배치 경합으로 악화
- **수정** IATA 텍스트 → **react-map-gl Marker** (`FlightCinemaAirportMarkers`) · symbol 레이어 제거
- **VERIFY** `npm run build` PASS
- **사람 QA** 로컬 `/?lang=en` — arc + 지구본 **ICN** 라벨 + Bar 경로 **✅**

## 영문화 #44c — 다음 세션

- **목표** PROD `?lang=en` 회귀 — [`i18n-en-plan.md`](./i18n-en-plan.md) **§13 A** (홈·축제·명소·PlaceCard) + 항공 시네마 PROD 재확인
- **금지** GT 일괄 백필
- **tip** `e531e660` (push 후 SHA 갱신)

## 로컬 → PROD 동기화 (항공경로 루프 중단)

- **조치** `git reset --hard origin/main` — 로컬만 있던 항공경로 수정 5커밋·미커밋 변경·`scripts/qa-flight-route-button.mjs` 제거
- **기준 SHA** `ff2343c1` (= gateo.kr PROD)
- **다음** 증상 재현 시 PROD와 동일 베이스에서 단계별 디버깅 (로컬 선행 패치 금지)

## 확대 후 지구본 크래시 수정

- **증상** 고줌·여행지 클릭 시 `GlobeClusterLegend is not defined` · `ForwardRef` React 크래시·검은 화면
- **원인** cluster 범례 import 누락 · gateo/cluster symbol `text-font` 없음 · 시네마 중 marker setData·동기 close+select
- **수정** `GlobeClusterLegend` import · symbol `text-font` · 시네마 중 gateo 라벨 숨김·setData 스킵 · `queueMicrotask`로 핀 선택 지연
- **VERIFY** `npm run build` PASS
