# 2026-08-22 프로젝트 일지

직전: [`2026-08-21-project-log.md`](./2026-08-21-project-log.md)

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
