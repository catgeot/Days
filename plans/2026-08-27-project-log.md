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

