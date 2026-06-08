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

## 다음 (선택)

- S5 `site-health-runbook.md` · Vercel/Mapbox 알림 등 Phase 0 잔여 · gateo.kr **1g 스모크**
