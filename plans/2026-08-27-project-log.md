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
- **사람 QA** PROD `/world-events/edinburgh-fringe-2026` — 보라색 AI 패널 **확인**
- **힌트(보류)** Tier3 AI vs Tier0~2 기본 정보 **내용 겹침** 느낌 — Wave1.5 D1에서 정적 분리

## 세계행사 일정 #23 — Wave 1.5 계획 · main 문서 동기화

- **세션** `세계행사 일정 #23, Wave 1.5 계획` (계획·핸드오프 — 코드 미착수)
- **결정** Wave2 데이터(singapore·dubai) **보류** → **Wave 1.5 차별화** D1~D4 선행 (본문·AI 중복·무니·명소·미디어)
- **문서** `world-events-detail-ux-plan.md` Phase **F-0.5** · 표준 제시어 **#23~#27** · `feature-handoff-index` · `cloud-preview-continuity` §1.3 · 본 일지
- **브랜치** `cursor/world-events-wave2` (고정 · #23 D1부터 코드)
- **다음** `#23 Wave1.5 D1 AI 정적 분리` — EventTravelGuidePanel suppress · fixture 3건

## 세계행사 일정 #23 — Wave1.5 D1 AI 정적 분리

- **세션** `세계행사 일정 #23, Wave1.5 D1 AI 정적 분리`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `70a2a925`
- **산출** EventTravelGuide **v0.2**(summary/recommended_nights 제거) · `shouldShowEventTravelGuidePanel` PROD 억제 · pilot fixture edinburgh/munich/bali
- **VERIFY** `audit:event-travel-guide` · `smoke:world-events-detail` · `smoke:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → edinburgh/munich/bali — 정적 Tier0~0.5 + Preview-only AI 패널
- **다음** **#24 D1 Preview QA** (D2는 QA OK 후 #25)

## 세계행사 일정 #24 — D1 QA 피드백 · sample-log

- **맥락** D1 Preview QA 논의 — 에든버러 AI v0.2 섹션에 Royal Mile·edfringe·지도 힌트만 있고 실행 링크 없음
- **문서** [`world-events-sample-log.md`](./world-events-sample-log.md) #1 — D1 피드백 → **D2 액션 칩·무니 시드** · **D3 검색·hub** 요구 기록
- **다음** `#24 Wave1.5 D2` 무니 행사칩 착수

## 세계행사 일정 #25 — Wave1.5 D2 무니 행사칩

- **세션** `세계행사 일정 #25, Wave1.5 D2 무니 행사칩`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `8a413ce3`
- **산출** overrides `actionChips`·`mooniChips` (pilot edinburgh·munich·bali) · `EventActionChips` · `EventMooniChips` · 무니 `eventContext` 시드
- **D2 요구** sample-log #1 — 공식 예매·Royal Mile·공연장 지도 링크 · 무니 「프리 공연」「하루 3편」칩
- **VERIFY** `smoke:world-events-detail` · `smoke:world-events` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/munich-oktoberfest-2026` — 행사 바로가기 칩·무니 질문 칩·FAB 시드
- **다음** 사람 Preview D2 QA → **#26 D3** 미디어·명소

## 세계행사 일정 #25 — /qa Preview 리다이렉트 수정

- **이슈** `/qa/world-events`가 구 `efa3` Preview → D2 액션·무니 칩 미표시
- **조치** `vercel.json`·`cloudQaShareLinks` → `cursor/world-events-wave2` (main `3b6fb256` 배포)
- **확인** 에든버러 상세 — 「행사 바로가기」3칩 · 무니 질문 칩 · FAB 시드

## 세계행사 일정 #26 — Wave1.5 D3 미디어·명소

- **세션** `세계행사 일정 #26, Wave1.5 D3 미디어·명소`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `b9c52a3a`
- **산출** pilot 3건 `heroImage`·`youtubeVideos` overrides · `EventDetailHero` · `EventDetailMediaSection`(Google·네이버 검색·YouTube·`cityAttractionHubs`→`/place`)
- **VERIFY** `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026` — 히어로·관련 영상·검색·발리 명소 칩
- **다음** 사람 Preview D3 QA → **#27 D4** 숙소·파일럿 회귀

## 세계행사 일정 #26 — D3 Preview QA 피드백·핫픽스

- **피드백** 히어로 404 · 갈룽안 안내→여행사(baligoldentour) 404 · 펜져 검색 영문 · Google 검색 결과 없음(한글+영문 venue 혼합) · 무니 칩 시드만 표시·다른 칩 미동작
- **조치** `ea74f5ee` — Wikimedia hero URL 교체 · 갈룽안→ko.wikipedia · 펜져 한글 Google · `buildWorldEventSearchQuery` ko=도시명만 · 무니 칩 재오픈·시드 숨김
- **재QA** `/qa/world-events` → `/world-events/bali-galungan-season-2026` — 히어로·검색·무니 칩 3종
- **다음** D3 재QA OK → **#27 D4**

## 세계행사 일정 #26 — Wave1.5 D3 재QA

- **세션** `세계행사 일정 #26, Wave1.5 D3 재QA`
- **피드백** ko위키 갈룽안 없음 · 펜jor 한글 Google 무결과 · MOONi 대화칩 미전송
- **조치** `bd586518` — en.wikipedia/Galungan · penjor en Google · MOONi chatDraft 대기·FAB remount 최소화
- **VERIFY** `generate:world-events` · `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026` — 갈룽안·펜jor·무니 칩 3종·주제 칩
- **다음** 사람 Preview 재QA OK → **#27 D4**

## 세계행사 일정 #27 — Wave1.5 D4 개막 프리셋

- **피드백** 「내 여행 일정」개막 3박 초기값·칩 불일치 · 활성 칩 재클릭 MRT 재호출 · 개막 3박=행사 당일 체크인(개막 전날 필요)
- **조치** `ce744216` — opening=행사 전날 체크인 · tripWindow↔opening SSOT · 활성 칩 ring+disabled · 동일 날짜 apply skip
- **VERIFY** `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → munich·bali — 개막 3박 강조·재클릭 무로딩
- **사람 QA** Preview OK — 개막 3박·초기값·중복 API
- **다음** D4 잔여 — stayAreas→MRT · 파일럿 3건 회귀

## 세계행사 일정 #27 — Wave1.5 D4 stayAreas→MRT

- **세션** `세계행사 일정 #27, Wave1.5 D4 숙소·파일럿 회귀`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `4922f7a9`
- **산출** EventStayStrip `stayAreas` 권역 칩 · `mrtKeyword` MRT 조회 · MRT 더보기 · `fetchMrtStays` keywordOverride
- **VERIFY** `smoke:world-events-detail` · `smoke:world-events` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → edinburgh·munich·bali — 권역 칩·숙소 카드·개막 프리셋
- **다음** 사람 Preview D4 QA → **#28 Wave2** singapore·dubai
