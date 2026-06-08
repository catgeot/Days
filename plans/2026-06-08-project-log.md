# 2026-06-08 project log

이전: [`2026-06-06-project-log.md`](2026-06-06-project-log.md)

## S3 — AI 에러 UX

- `geminiProxyError.js` — 401·429·503·기타 분류 (smoke-health 패턴 정렬)
- `apiClient.fetchProxyGemini` → `GeminiProxyError` throw
- ChatModal·usePlaceChat·PlaceChatView error 표시 연동 (릴리스 노트 생략)

## S4 — Playwright E2E

- `@playwright/test` · `playwright.config.js` · `e2e/home·place·mooni` 3 spec
- `npm run test:e2e` gateo.kr Pass · GHA **E2E Health** cron `0 9 * * *` + dispatch

## 운영자 (같은 날)

- GHA **E2E Health** 수동 Pass (~1m) · push `c550ac0` 이후
- **UptimeRobot 생략** — Smoke 6h + E2E 1일로 충분
- Gemini 선불 **잔액 하한 자동 충전** 설정
- [`site-health-operator-next-steps.md`](site-health-operator-next-steps.md) 갱신

## 홈 지구본 — Mapbox 지명 로딩 플래시

- **증상**: gateo 마커 전 Mapbox 지명이 잠깐 보였다 사라짐 (bright Standard·랜드마크 정책 이후 회귀)
- **조치**: `applyEarlyMapboxGlobeLabelSuppress` (bright `styledata` 선적용) · `tryRevealGlobe` (지명 숨김+gateo 레이어 준비 후 페이드인) · `isStyleTransitioning` 초기 `true`
- **파일**: `globeMapboxLabelPolicy.js` · `HomeGlobeMapbox.jsx`

## 홈 지구본 — Mapbox 지명 클릭·UI 해석 (gateo QA ✅)

- **증상**: 지명 클릭 시 `Explore` 고정 · 툴킷 alias(우붓→발리)·좌표 스냅으로 부모 SSOT로 합쳐짐
- **조치**: 지명·지오코딩 핀 `uiPlace` — 역지오코딩 **국가명** · Mapbox **라벨명** 유지 · 좌표 스냅은 바다/무지명·URL 복원만 · gateo 마커 slug 우선 · fuzzy 접두 충돌 방어(`porto`/`portovecchio`)
- **파일**: `useHomeHandlers.js` · `HomeGlobeMapbox.jsx` · `travelSpotResolve.js` · [`travel-spots-management.md`](travel-spots-management.md) §8

## 탐색 검색 — 바티칸·우붓 개별 연결 (gateo QA ✅)

- **증상**: 검색 「바티칸」→ 로마 · 「우붓」→ 발리 (`TRAVEL_SPOT_PLACE_ID_ALIASES` 상위 병합)
- **조치**: `vatican`·`ubud` slug 승격(391·392) · 별칭·툴킷 동의어·reconcile 분리 · FCO/DPS 공항 overrides · `findDirectSpotMatch`로 SSOT 직접 일치 우선
- **파일**: `travelSpots.js` · `travelSpotResolve.js` · `travel-spot-place-id-aliases.mjs` · `travel-spot-airport-overrides.mjs` · `generate:airports` (271/271)
- **참고**: 한라산 — 별도 slug 없음 · Mapbox 타일에 산 지명 미포함(제주 키워드·마커로 충분)

## 다음 (선택)

- S5 `site-health-runbook.md` · Vercel/Mapbox 알림 등 Phase 0 잔여 · gateo.kr **1g 스모크**
