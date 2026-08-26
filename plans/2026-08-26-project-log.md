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

## 세계행사 일정 #10 — TripWindow 프리셋

- **세션** `세계행사 일정 #10, TripWindow 프리셋`
- **브랜치** `cursor/world-events-efa3` · PR #150
- **산출** `tripWindowPresetsFromEvent` · `buildPlaceDetailPathFromEvent` · 허브 「여행지 카드」→ 상세 URL · `smoke:trip-window-edinburgh`
- **VERIFY** `smoke:world-events` · `smoke:trip-window-edinburgh` · `build` PASS

## 세계행사 일정 #10 — 사람 Preview QA

- **세션** `세계행사 일정 #10, 사람 Preview QA`
- **브랜치** `cursor/world-events-efa3` · PR #150 · CI SUCCESS
- **VERIFY** `smoke:world-events` · `smoke:trip-window-edinburgh` · `build` PASS (재실행)
- **사람 QA** `/qa/world-events` → 유럽 칩 → 에든버러 프린지 「여행지 카드」 `fromEvent=edinburgh-fringe-2026` · §6.1 `/korea`·`/place/vienna`

## 세계행사 일정 #11 — PR #150 main 병합

- **세션** `세계행사 일정 #11, PR #150 병합`
- **브랜치** `cursor/world-events-efa3` → **main** · PR #150 merge
- **P2 MVP** Wave1 15건 · PlaceCard · `/world-events` · TripWindow 프리셋 · 홈 진입 — **완료**
- **VERIFY** `smoke:world-events` · `smoke:trip-window-edinburgh` · `build` PASS
- **main** `d4fbca71`

## 세계행사 — v2 pivot · docs `main` 동기화 (다음 #12 준비)

- **배경** #9~#10 Preview QA — 장기 TripWindow(26박)·상세 페이지 갭
- **결정** P2는 `main` 유지 · v2 **additive** on `cursor/world-events-efa3` · Wave1 통합 후 **#18** main 병합
- **docs** `world-events-detail-ux-plan.md` · `world-events-sample-log.md` · 핸드오프 `main` cherry-pick
- **다음 세션 #12** — Phase B · `EventDetailPage` · edinburgh Tier0~2 · PR #152 · `/world-events/edinburgh-fringe-2026`

## 운영 — 푸시·커밋 규칙 정리

- **규칙 SSOT**: `.ai-context` **§1.5.3~§1.5.4** · [`docs-on-main-workflow.md`](./docs-on-main-workflow.md) · `AGENTS.md` · `.cursor/rules/gateo-docs-on-main.mdc`
- **Cursor User Rule** `16942118` §1.5.3 동기화 · **main** push 완료

## 운영 — 로직=feature · 문서=main 워크플로 도입

- **도입**: `docs-on-main-workflow.md` · §1.5.4 · Cloud §6 **필수**화 · docs-only `origin/main` push = feature 세션 종료 시 즉시

## 세계행사 일정 #12 — Phase B 상세 셸 · 샘플 #1 edinburgh

- **세션** `세계행사 일정 #12, 상세 셸 · 샘플1 edinburgh`
- **브랜치** `cursor/world-events-efa3` · PR #153
- **산출** `/world-events/:eventId` · `EventDetailPage` · `EventDetailStaticPanel` · schema Tier0.5 · edinburgh overrides · `smoke:world-events-detail` · 허브·PlaceCard 「행사 상세」
- **VERIFY** `smoke:world-events` · `smoke:world-events-detail` · `build` PASS
- **다음** #13 Phase C-0~1 AI 가이드 · edinburgh 1건

## 세계행사 일정 #13 — Phase C AI 가이드 · 샘플1 edinburgh

- **세션** `세계행사 일정 #13, AI 가이드 · 샘플1 edinburgh`
- **브랜치** `cursor/world-events-efa3` · PR #153
- **산출** EventTravelGuide v0.1 · `update-event-travel-guide` Edge · `event_travel_guide` migration · audit/smoke · `EventTravelGuidePanel` · edinburgh fixture · Preview fixture 폴백
- **VERIFY** `audit:event-travel-guide` · `smoke:event-travel-guide` · `smoke:world-events-detail` · `build` PASS
- **사람 QA** Preview `/world-events/edinburgh-fringe-2026` — Tier3 AI 패널·하단 raw JSON · Edge deploy 후 LIVE invoke
- **다음** #14 sample #2~#4 Tier0.5

## 세계행사 일정 #14 — 샘플2~4 Tier0.5

- **세션** `세계행사 일정 #14, 샘플2~4 munich·vienna·amsterdam`
- **브랜치** `cursor/world-events-efa3` · PR #153
- **산출** munich·vienna·amsterdam Tier0.5 overrides · `smoke:world-events-detail` 4건 assert · sample-log
- **VERIFY** `smoke:world-events` · `smoke:world-events-detail` · `build` PASS
- **다음** #15 샘플 #5~#8 tokyo·kyoto·bangkok·bali

## 세계행사 일정 #14 — Preview 빌드 복구

- **이슈** #14 핸드오프 커밋에서 `cloudPreviewWorkLog.js` #13 edinburgh 항목 `{`·`id` 누락 → Vercel Preview `Expected ',', got ':'` (14508e4 등 연쇄 ERROR)
- **조치** `8bad7636` — 누락 객체 헤더 복구 · Preview **Ready**
- **재검증** `build` · `smoke:world-events` · `smoke:event-travel-guide` · `audit:event-travel-guide` PASS
- **Preview** `https://www.gateo.kr/qa/world-events` · git `days-git-cursor-world-events-efa3-catgeots-projects.vercel.app`

## 세계행사 일정 #14 — 권장 박수 섹션

- **이슈** 사람 QA — 킹스데이 상세에 「권장 박수」섹션 없음(Hero 인라인 「권장 숙박」만)
- **조치** `77e64e8c` — `EventDetailStaticPanel` 독립 섹션(제목 「권장 박수」) · 하이라이트 아래 배치
- **VERIFY** `build` · `smoke:world-events-detail` PASS

## 세계행사 일정 #14 — Tier3 AI fixture munich·vienna·amsterdam

- **세션** `세계행사 일정 #14, 샘플2~4 munich·vienna·amsterdam` (잔여)
- **이슈** 옥토버페스트 등 Tier0~2만 있고 에든버러 대비 「행사 맞춤 여행 가이드」Tier3 누락
- **조치** fixture 3건 · `loadEventTravelGuideFixture` · Preview fixture 전건 로드 · `dde4fe4f`
- **VERIFY** `audit:event-travel-guide` · `smoke:event-travel-guide` · `smoke:world-events` · `build` PASS
- **다음** #15 샘플 #5~#8 tokyo·kyoto·bangkok·bali

## 운영 — docs-handoff 충돌 방지 규칙·audit

- **배경** #14 — `main` docs push 후 feature `merge` 생략 → `feature-handoff-index` stash 충돌
- **규칙** `plans/**` **feature 커밋 금지** · 종료 시 C + `audit:docs-handoff-sync` · §충돌 방지 절
- **산출** `scripts/audit-docs-handoff-sync.mjs` · `gateo-docs-on-main` 등 동기화 · `main` `0a48dab1`

## 세계행사 일정 #15 — 샘플5~8 Tier0.5

- **세션** `세계행사 일정 #15, 샘플5~8 tokyo·kyoto·bangkok·bali`
- **브랜치** `cursor/world-events-efa3` · PR #153 · tip `6d707772`
- **산출** tokyo·kyoto·bangkok·bali Tier0.5 overrides · `smoke:world-events-detail` 8건 assert · sample-log
- **권장 박수** tokyo 4 · kyoto 3(요이야마) · bangkok 3 · bali 4(갈룽안) · AI 미적용(Tier0.5만)
- **VERIFY** `smoke:world-events` · `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → 아시아 칩 → 4건 「행사 상세」
- **다음** #16 sample #9~#12 + Phase D in-page 위젯

## 세계행사 일정 #16 — Phase D · 샘플9~12

- **세션** `세계행사 일정 #16, 샘플9~12 · in-page 숙소항공`
- **브랜치** `cursor/world-events-efa3` · PR #153 · tip `e165c4c5`
- **산출** `EventStayStrip` · `StayRangeCalendar` · `eventVisitWindows` visitPresets · CTA maxNights cap · rio·nyc·iceland·sydney Tier0.5
- **회귀** `GlobeStayStrip` HomePlaceCardSummary 유지 · edinburgh tripWindow 4박 cap (전체 span CTA 제거)
- **VERIFY** `smoke:world-events` · `smoke:world-events-detail` · `smoke:trip-window-edinburgh` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/rio-carnival-2027` · 내 여행 일정·숙소 스트립
- **다음** #17 sample #13~#15 · 위젯 마감
