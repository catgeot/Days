# 2026-08-26 프로젝트 일지

← [`2026-08-25-project-log.md`](./2026-08-25-project-log.md)

## 세계행사 일정 #2 — P0-a 스키마·generate·audit

- **세션** `세계행사 일정 #2, P0-a — 스키마·generate·audit`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `world-event-overrides.mjs` 스켈레톤 · `generate-world-events.mjs` · `audit-world-events.mjs` · `worldEvents.json` · npm scripts
- **VERIFY** `audit:world-events` PASS · `build` PASS
- **다음** 세션 #3 P0-b `tripWindow` · TourAPI 어댑터 초안 · `smoke:trip-window-from-festival`

## 세계행사 일정 #3 — P0-b tripWindow

- **세션** `세계행사 일정 #3, P0-b — tripWindow`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `src/shared/tripWindow.js` · `worldEventFromTourApiFestival.js` · `smoke:trip-window-from-festival`
- **VERIFY** `smoke:trip-window-from-festival` PASS · `audit:world-events` PASS · `build` PASS
- **다음** 세션 #4 P1-a `FestivalDetailSheet` MRT 숙소 URL `checkIn`/`checkOut`

## 세계행사 일정 #4 — P1-a 축제→숙소

- **세션** `세계행사 일정 #4, P1-a — 축제→숙소`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `FestivalDetailSheet` tripWindow→MRT 숙소 URL · `getMrtAccommodationSearchUrl` checkIn/checkOut · `smoke:korea-festival-stay-url`
- **VERIFY** `smoke:korea-festival-stay-url` · `smoke:korea-festival-nearby` · `smoke:trip-window-from-festival` · `audit:world-events` · `build` PASS
- **다음** 세션 #5 P1-b 플래너·항공 딥링크
