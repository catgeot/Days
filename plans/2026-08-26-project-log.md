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

## 세계행사 일정 #5 — P1-b 플래너·항공

- **세션** `세계행사 일정 #5, P1-b — 플래너·항공`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `buildPlacePlannerPathFromEvent` · `FestivalDetailSheet` 플래너 CTA · `PlannerTab` eventTripWindow → 항공·숙소 위젯 날짜 · `smoke:korea-festival-planner-link`
- **VERIFY** `smoke:korea-festival-planner-link` · `smoke:korea-festival-stay-url` · `smoke:korea-festival-nearby` · `smoke:trip-window-from-festival` · `audit:world-events` · `build` PASS
- **다음** 세션 #6 P2-a 해외 12건 overrides

## 세계행사 일정 #6 — P2-a SSOT Wave1

- **세션** `세계행사 일정 #6, P2-a — SSOT Wave1`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `world-event-overrides.mjs` Wave1 15건(유럽·아시아·아메리카·오세아니아·니치) · `generate:world-events` → `worldEvents.json`
- **VERIFY** `generate:world-events` · `audit:world-events` · `build` PASS
- **다음** 세션 #7 P2-b PlaceCard 「이 도시의 행사」

## 세계행사 일정 #7 — P2-b PlaceCard 행사

- **세션** `세계행사 일정 #7, P2-b — PlaceCard 행사`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `PlaceWorldEventsSection` 접이식 · `worldEvents.js` slug 조회 · PlaceChatPanel·Gallery(모바일)·홈 써머리 연동 · TripWindow 플래너·숙소 CTA
- **VERIFY** `build` PASS
- **다음** 세션 #8 P2-c `/world-events` 허브

## 세계행사 일정 #8 — P2-c /world-events 허브

- **세션** `세계행사 일정 #8, P2-c — /world-events 허브`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `/world-events` 라우트 · 지역 칩 5 · 행사 카드 그리드 · `/qa/world-events` · `worldEvents.js` 허브 조회
- **VERIFY** `build` PASS
- **다음** 세션 #9 통합 smoke·핸드오프

## 세계행사 일정 #9 — 통합 smoke·핸드오프

- **세션** `세계행사 일정 #9, 통합 smoke·핸드오프`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `smoke:world-events` · `smoke:world-events-hub` 통합 스크립트 · `world-events-management.md` §6·§6.1 QA 체크리스트
- **VERIFY** `smoke:world-events` · `build` PASS
- **다음** 사람 Preview QA → PR #150 병합 · 선택 #10 P1.5 또는 P3

## 세계행사 일정 #9 — 홈 진입 링크

- **세션** `세계행사 일정 #9, 홈 진입 링크`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** 홈 `HomeUI` 바로가기 「세계의 행사」(`/world-events`) — 「한국의 축제」 바로 아래
- **VERIFY** `smoke:world-events-hub` · `build` PASS
