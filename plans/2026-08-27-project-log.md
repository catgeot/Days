# 2026-08-27 프로젝트 일지

← [`2026-08-26-project-log.md`](./2026-08-26-project-log.md)

## 세계행사 일정 #20 — 국내 FestivalStayStrip · Mooni FAB

- **세션** `세계행사 일정 #20, QA 재확인 · 국내 FestivalStayStrip`
- **브랜치** `cursor/world-events-efa3` · PR #153 · tip `5ca0bfb7`
- **산출** `FestivalStayStrip`(EventStayStrip·TripWindow 프리셋) · `FestivalMooniFab` · 플래너·숙소 링크 제거
- **VERIFY** `smoke:world-events` · `smoke:world-events-detail` · `smoke:korea-festival-stay-url` · `build` PASS
- **Preview** `/qa/world-events` · `/korea` 축제 상세 — 일정 프리셋·숙소·항공+숙소·무니 FAB
- **보류** PR merge — 횡성·발리·국내축제 Preview 재QA 후
- **다음** PR #153 merge · PROD QA

## 세계행사 일정 #21 — Preview 재QA · PR #153 merge

- **세션** `세계행사 일정 #21, Preview 재QA · PR #153 merge`
- **이전 QA** #20 Preview 횡성·발리·국내축제 **통과**(사람)
- **VERIFY** `smoke:world-events` · `smoke:world-events-detail` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `smoke:korea-festival-stay-url` · `build` PASS
- **merge** PR #153 → **main** `6712f777`
- **PROD** 배포 후 bundle `index-vN5gm04K.js` — EventStayStrip · FestivalStayStrip · Mooni FAB 확인 · §6.1 URL 200
- **다음** 사람 PROD §6.1·§6.1.1 QA → Wave2 착수 합의

## 세계행사 일정 #22 — PROD §6.1 QA

- **세션** `세계행사 일정 #22, PROD §6.1 QA`
- **main** `6712f777` · PR #153 merged · PROD bundle `index-vN5gm04K.js`
- **VERIFY** `smoke:world-events` · `smoke:world-events-detail` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `smoke:korea-festival-stay-url` · `smoke:korea-festival-personal` · `build` PASS
- **PROD** URL 18건(허브·15 상세·vienna·korea) HTTP **200**
- **사람 QA** §6.1·§6.1.1 — 횡성한우축제 hub · 발리 packages/list · 국내 FestivalStayStrip · 15 상세 전건
- **다음** 사람 OK → Wave2 착수 합의(`cursor/world-events-wave2` · singapore+dubai)

## 세계행사 일정 #22 — 국내축제 일정 프리셋 수정

- **이슈** 횡성한우축제 PROD QA — 축제 전체 6박이 기본값 · 프리셋 칩 없음
- **원인** `FestivalStayStrip`이 `maxNights` 없이 전체 span 사용 · 7일 이하 행사는 프리셋 1개(칩 숨김)
- **조치** `tripWindowPresetsFromEvent` SSOT 정렬 · 국내 `recommendedNights: 3` · 4일+ 행사 프리셋 2~3종
- **VERIFY** `smoke:korea-festival-stay-url` · `smoke:world-events` · `build` PASS
- **사람 QA** PROD 재확인 — 횡성한우축제 프리셋 칩·기본 3박 이내

## 세계행사 일정 #22 — Tier3 AI PROD fixture 폴백

- **이슈** 에든버러 등 #1~#4 PROD — 「행사 맞춤 여행 가이드」패널 없음
- **원인** fixture 로드가 `isCloudPreviewSurface()` 안에서만 동작 · DB 미배포
- **조치** DB miss 시 번들 fixture 폴백(PROD·Preview) · DB row 있으면 DB 우선
- **VERIFY** `smoke:event-travel-guide` · `build` PASS
- **사람 QA** PROD `/world-events/edinburgh-fringe-2026` — 보라색 AI 패널

