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
- **다음** 사람 Preview D4 QA → **#28 D5** 실행·어필리에이트

## 세계행사 일정 #27 — D5 계획 반영 (docs)

- **결정** Wave1.5 **D5** 신설 — 렌터카·투어·사롱 등 **실행 링크·제휴 체류** (발리 pilot)
- **문서** [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0.5 D5 · index §9 · sample-log — **신규 계획서 없음**
- **세션** Wave2 데이터 **#28→#29** 연기
- **다음** **#28 D5** 구현 — `cursor/world-events-wave2` · PR #154

## 세계행사 일정 #28 — Wave1.5 D5 실행·어필리에이트

- **세션** `세계행사 일정 #28, Wave1.5 D5 실행·어필리에이트`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `c6e38c1c`
- **산출** `EventExecutionStrip`(Klook 렌터카·GYG 투어·PKC 더보기) · bali `actionChips` shop(사롱·Klook) · schema kind `rental|tour|shop`
- **VERIFY** `smoke:world-events-detail` · `smoke:world-events` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026` — 실행·예약 스트립·사롱 칩
- **다음** **#29 D5-b** 본문 UX (glossary 모달·인라인 링크·히어로 갤러리)

## 세계행사 일정 #29 — D5-b 계획 확정 (docs)

- **세션** `세계행사 일정 #29, Wave1.5 D5-b 본문 UX` — **계획만** (구현·검증은 다음 세션)
- **피드백** 바로가기 칩·실행 스트립 흐름 단절 → 본문 glossary 모달 · 하이라이트 인라인 어필리에이트 · 히어로 갤러리
- **문서** [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0.5 **D5-b** 통합 (별도 plan 아티팩트 SSOT 아님)
- **다음** feature `cursor/world-events-wave2` — D5-b 구현 · smoke · build · Preview QA → OK 시 **#30 Wave2**

## 세계행사 일정 #29 — Wave1.5 D5-b 본문 UX

- **세션** `세계행사 일정 #29, Wave1.5 D5-b 본문 UX`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `a78fb520`
- **산출** `glossaryTerms`·`heroImages`·`highlightContextLinks` · `EventRichText`·`EventTermExplainModal` · 히어로 썸네일 갤러리 · `EventExecutionStrip`·바로가기 칩 제거(bali)
- **VERIFY** `generate:world-events` · `smoke:world-events-detail` · `smoke:world-events` · `smoke:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026` — 본문 용어 클릭 모달 · 하이라이트 인라인 링크 · 히어로 3장
- **다음** 사람 Preview D5-b QA → OK 시 **#31 Wave2** singapore·dubai

## 세계행사 일정 #30 — Wave1.5 D5-b Preview QA

- **세션** `세계행사 일정 #30, Wave1.5 D5-b Preview QA`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `f66a87b9`
- **피드백** glossary 동일 단어 문단 내 반복 링크(가독성·중복 API) · 히어로 썸네일 2·3장 404 · summary 카드가 히어로와 중복·축소감
- **수정** `EventRichText` 문단 내 첫 등장만 링크 · bali `heroImages` Wikimedia URL 교체 · 히어로·summary 원복 · 썸네일 히어로 카드 밖 분리
- **VERIFY** `generate:world-events` · `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026`
- **다음** 사람 재QA → OK 시 **#31 Wave2** singapore·dubai

## 세계행사 일정 #30 — Wave1.5 D5-b Preview 재QA (2차)

- **세션** `세계행사 일정 #30, Wave1.5 D5-b Preview 재QA`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `9f66dac5`
- **피드백** 히어로·썸네일 동일 영역 분할로 축소감 · 하이라이트 간 glossary 링크 반복 · 어필리에이트 버튼 시인성 부족
- **수정** 히어로(4:3~16:9) 단독 + 썸네일 갤러리 카드 분리 · D5-b summary 숨김·메타 스트립 · 패널 전체 glossary 첫 등장만 · amber 버튼 강조
- **VERIFY** `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026`
- **다음** 사람 Preview 재QA → OK 시 **#31 Wave2** singapore·dubai

## 세계행사 일정 #30 — Wave1.5 D5-b Preview 3차

- **세션** `세계행사 일정 #30, Wave1.5 D5-b Preview 재QA 확인`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `14a8bf42`
- **피드백** 히어로 사진 스와이프·갤러리 모달 요청 · 사롱 Klook 영문·Google Maps 이탈 · 영상 키워드 로케일
- **수정** 히어로 스와이프·더보기 모달 · `highlightContextLinks` Google/Klook 로케일 SSOT · YouTube 검색 버튼
- **VERIFY** `generate:world-events` · `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026`
- **다음** 사람 Preview QA → OK 시 **#31 Wave2** singapore·dubai

## 세계행사 일정 #30 — Wave1.5 D5-b Preview QA (4차)

- **세션** `세계행사 일정 #30, Wave1.5 D5-b Preview QA`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `2b4e890f`
- **피드백** 히어로 내 「행사 하이라이트」오버레이 · 갤러리 모달 동일 사진 3장 · glossary 무니 매클릭 API · YouTube 영문 리스트
- **수정** 히어로 텍스트 오버레이 제거 · `fetch-event-hero-gallery`+`event_hero_gallery` DB · `explain-event-term`+`event_term_glossary_cache` · YouTube ko fetch+리스트 더보기
- **VERIFY** `smoke:world-events-detail` · `smoke:world-events` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026`
- **배포** migration `20260828120000_event_hero_gallery` · Edge `fetch-event-hero-gallery` · `explain-event-term` (Secrets·DB 적용 후 캐시 동작)
- **다음** 사람 Preview 재QA → OK 시 **#31 Wave2** singapore·dubai

## 세계행사 일정 #30 — Edge 배포·히어로 문구 (#30 후속)

- **브랜치** `cursor/world-events-wave2` · tip `021eab6a`
- **배포 완료** Edge `fetch-event-hero-gallery` · `explain-event-term` · DB migration 적용
- **수정** 히어로 「행사 하이라이트」·제목·캡션 — 이미지 **하단 흰 영역** 배치(오버레이 아님)
- **다음** Preview 재QA — 갤러리 확장·glossary 재클릭·YouTube ko

## 세계행사 일정 #30 — 히어로 문구 시즌 파트 복원

- **브랜치** `cursor/world-events-wave2` · tip `8c0e8f94`
- **수정** 「행사 하이라이트」·제목 — **시즌 메타 스트립**(type·일정·장소 카드) 상단 · 히어로는 사진만
- **다음** Preview 재QA

## 세계행사 일정 #30 — 갤러리 Wikimedia 다중 폴백

- **세션** `세계행사 일정 #30, Wave1.5 D5-b Preview 재QA`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `ad875626`
- **피드백** Unsplash에 「갈룽안·사원 축제 시즌」사진 많음 · 모달 추가 사진 없음
- **원인** Supabase Secrets에 `UNSPLASH_ACCESS_KEY` 없음 · Wikimedia 폴백 쿼리(`Galungan & Temple…`) 0건 · 3장만 DB 캐시
- **수정** glossary en·짧은 en 다중 Wikimedia 쿼리 · Edge·클라이언트 폴백 · 6장 미만 캐시 저장 금지 · `fetch-event-hero-gallery` 재배포
- **VERIFY** Edge live 11장(시드3+wikimedia8) · `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026` — 사진 더보기 6장+
- **선택** Supabase Secrets에 `UNSPLASH_ACCESS_KEY`(=Vercel `VITE_UNSPLASH_ACCESS_KEY`) 등록 시 Unsplash 우선
- **다음** 사람 Preview 재QA → OK 시 **#31 Wave2** singapore·dubai

## 세계행사 일정 #30 — Wave1.5 D5-b Preview 재QA (locale·영상)

- **세션** `세계행사 일정 #30, Wave1.5 D5-b Preview 재QA`
- **브랜치** `cursor/world-events-wave2` · PR [#154](https://github.com/catgeot/Days/pull/154) · tip `a6c91f6e`
- **피드백** 영상 더보기가 본문 길이 확장 · glossary 재클릭 로딩 · en/ko YouTube·검색 locale 혼선
- **수정** YouTube 10개 패널 내부 스크롤(더보기 제거) · glossary 메모리 캐시 · `place_videos` locale 분리 · en에서 네이버 숨김
- **VERIFY** `smoke:world-events-detail` · `smoke:world-events` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/bali-galungan-season-2026` — ko/en 무니·검색·YouTube·갤러리 6장+
- **다음** 사람 Preview 재QA OK → **#31 Wave2** singapore·dubai

## 세계행사 일정 #31 — Wave1.5 main 병합

- **세션** `세계행사 일정 #31, Wave2 singapore·dubai` (요청: Wave2 전 main 병합·테스트)
- **병합** PR [#154](https://github.com/catgeot/Days/pull/154) → `main` `c7de9736`
- **VERIFY** (feature·main) `audit:event-travel-guide` · `smoke:world-events-detail` · `smoke:world-events` · `smoke:event-travel-guide` · `build` PASS
- **PROD QA** `https://www.gateo.kr/world-events` · 파일럿 3상세(edinburgh·munich·bali) — Vercel 배포 후
- **다음** 사람 PROD QA OK → **#32 Wave2** singapore·dubai (`cursor/world-events-wave2` 재개)

## 세계행사 일정 #31 — PROD QA 피드백·D5-b-2 착수

- **세션** `세계행사 일정 #31, PROD QA — Wave1.5 D5-b`
- **피드백** main `73f4ccdc` 병합 후 bali만 D5-b 본문 틀(glossary·갤러리·인라인 링크) · edinburgh·munich는 D2 바로가기 칩 잔존
- **원인** D5-b overrides는 bali pilot만 · 플랜 F-0.5 **D5-b-2**(파일럿 3건 패턴화)가 Wave2 전 게이트
- **수정** feature `3bd88e99` — edinburgh·munich `glossaryTerms`·`heroImages`·`highlightContextLinks` · smoke assert
- **다음** feature→main 재병합 → PROD 파일럿 3건 §6.1.1 → OK 시 **#33 Wave2** singapore·dubai

## 세계행사 일정 #32 — PROD QA 히어로 썸네일 404

- **세션** `세계행사 일정 #32, PROD QA — D5-b 파일럿 3건`
- **피드백** edinburgh·munich 히어로 썸네일 2·3장 깨짐(위키 URL 404) · bali는 정상
- **원인** overrides `heroImages` 2·3번 Wikimedia 경로 만료 · 갤러리 fetch는 모달 열 때만 동작
- **수정** `b5c352dc` — edinburgh·munich 위키 URL 교체 · `EventDetailHero` 마운트 시 `fetch-event-hero-gallery`(Unsplash→위키)로 썸네일·히어로 갱신 · smoke HEAD 검증
- **VERIFY** `generate:world-events` · `smoke:world-events-detail` · `build` PASS
- **Preview** `https://www.gateo.kr/qa/world-events` → `/world-events/edinburgh-fringe-2026` · munich · bali — 썸네일 3장
- **다음** 사람 Preview 히어로 재QA → PR [#156](https://github.com/catgeot/Days/pull/156) merge → PROD §6.1.1

## 세계행사 일정 #32 — 히어로 stale 캐시 (재수정)

- **피드백** Preview 재QA 후에도 edinburgh 썸네일 2·3번 깨짐(1/12·4·5번은 정상)
- **원인** `event_hero_gallery` DB 캐시에 **예전 404 URL**이 남아 클라이언트가 캐시를 그대로 반환 · overrides URL 교체만으로는 미반영
- **수정** `6df63661` — 시드 URL 불일치 시 `force` 재fetch · 캐시 hit 시 현재 시드 재병합 · `img onError` 제거 · Edge 동일 로직
- **VERIFY** `smoke:world-events-detail` · `build` PASS
- **배포** Edge `fetch-event-hero-gallery` 재배포 필요(Supabase link 없으면 사람)
- **Preview** `/qa/world-events` → edinburgh — 썸네일 1~3 모두 로드 확인

## 세계행사 일정 #32 — Wave1 12건 히어로 추가

- **피드백** 빈·하노이·뉴욕 등 비파일럿 상세에 히어로 없음 · 뮌헨 PROD는 D2 바로가기 칩( D5-b-2 미병합)
- **원인** `hasWorldEventD3Media`가 파일럿 3 ID만 허용 · 나머지 12건 `heroImage` 미설정
- **수정** `e0e6e22b` — Wave1 15건 전체 `heroImage` · D3 게이트=데이터 보유 시 표시
- **VERIFY** `generate:world-events`(15) · `smoke:world-events-detail` · `build` PASS
- **Preview** `/qa/world-events` → vienna·hanoi·new-york-thanksgiving 등 히어로 1장
- **다음** PR #156 merge → PROD 파일럿 3건 D5-b §6.1.1 → OK 시 #33 Wave2

## 세계행사 일정 #32 — PR #156 main 병합

- **병합** PR [#156](https://github.com/catgeot/Days/pull/156) → `main` `b2ac6888`
- **포함** D5-b-2(edinburgh·munich·bali) · 히어로 stale 캐시 fix · Wave1 15건 heroImage · D3 게이트 데이터화
- **VERIFY** (병합 전) `smoke:world-events-detail` · `build` PASS · Vercel CI SUCCESS
- **PROD QA** `https://www.gateo.kr/world-events` — Vercel 배포 후
- **다음** 사람 PROD 테스트 → OK 시 **#33 Wave2** singapore·dubai

## 세계행사 일정 #32 — Edge fetch-event-hero-gallery 배포

- **배포** `npx supabase functions deploy fetch-event-hero-gallery --project-ref phdjnbfitvmrguqzverm --no-verify-jwt` ✅
- **LIVE** invoke edinburgh `force:true` → 12장 · `fromCache:false`
- **다음** PROD 갤러리·썸네일 재QA

## 세계행사 일정 — 중간점검·로드맵 (docs)

- **세션** 중간점검 (계획서 갱신만)
- **결정** 갈룽안 D5-b = **표준 상세** · Wave1 15건 중 **3/15만** D5-b · 12건은 #34~#37 배치
- **영문** Q10 — MVP = 15건 D5-b KO 후 **#38 i18n-1** ([`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0.6)
- **문서** `world-events-detail-ux-plan` F-0.5 D5-b-3·F-0.6 · `world-events-plan` §9 · `management` §8.1 · qa-index Q15
- **다음** **#33** PROD §6.1.1 → Wave2 singapore·dubai

## 세계행사 일정 #33 — PROD QA · Wave2 singapore·dubai

- **세션** `세계행사 일정 #33, PROD QA · Wave2 singapore·dubai`
- **브랜치** `cursor/world-events-wave2` · PR [#157](https://github.com/catgeot/Days/pull/157) · tip `37bac1fe`
- **에이전트 VERIFY** PROD 파일럿 3 URL HTTP 200 · `smoke:world-events` · `smoke:world-events-detail` · `audit:event-travel-guide` · `build` PASS
- **산출** `singapore-gp-2026` · `dubai-fitness-challenge-2026` D5-b overrides · 허브 지역 singapore/dubai · 17건
- **Preview** `/qa/world-events` → `/world-events/singapore-gp-2026` · `/world-events/dubai-fitness-challenge-2026`
- **사람 QA** PROD 파일럿 3 §6.1.1(edinburgh·munich·bali) · Wave2 Preview D5-b
- **다음** Preview OK + PROD §6.1.1 OK → PR #157 merge → **#34** D5-b 배치 A(vienna·amsterdam·prague·marrakech)

## 세계행사 일정 #33 — Preview QA · Wave2 merge · #34 배치 A

- **세션** `세계행사 일정 #33, Preview QA · Wave2 merge`
- **PROD §6.1.1** 파일럿 3 HTTP 200 · bundle `glossaryTerms`·galungan·Theresienwiese 확인
- **PR #157 merged** → main `4caf5b1c` — Wave2 singapore·dubai PROD 배포 대기
- **#34** D5-b 배치 A — vienna·amsterdam·prague·marrakech overrides · tip `541e5dbe` · PR [#158](https://github.com/catgeot/Days/pull/158)
- **VERIFY** `generate:world-events` · `smoke:world-events-detail` · `smoke:world-events` · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → singapore·dubai · vienna·amsterdam·prague·marrakech
- **다음** 사람 Preview 배치 A QA → **#35** D5-b 배치 B(tokyo·kyoto·bangkok)

## 세계행사 일정 #34 — D5-b 배치 A Preview QA

- **세션** `세계행사 일정 #34, D5-b 배치 A Preview QA`
- **브랜치** `cursor/world-events-wave2` · PR [#158](https://github.com/catgeot/Days/pull/158) · tip `24ab4d6f`
- **에이전트 VERIFY** `generate:world-events` · `smoke:world-events` · `smoke:world-events-detail` · `audit:event-travel-guide` · `build` PASS
- **배치 A** vienna·amsterdam·prague·marrakech — glossary 4 · heroImages 3 · highlightContextLinks 2 · actionChips 없음
- **Preview** 4 URL HTTP **200** · `/qa/world-events` → 4건 상세
- **사람 QA** D5-b 본문(용어 모달·갤러리·인라인 링크) · 바로가기/실행 스트립 없음 · vienna/amsterdam Tier3 AI 패널
- **다음** Preview OK → **#35** D5-b 배치 B(tokyo·kyoto·bangkok)

## 세계행사 일정 #34 — glossary 무니 답변 끊김 핫픽스

- **이슈** vienna `stehplatz` MOONi 모달 — 답변이 「입석 티」에서 중간 끊김
- **원인** Gemini 2.5 Flash thinking 토큰 + 잘린 응답 `event_term_glossary_cache` 영구 캐시
- **수정** Edge `explain-event-term` — thought 파트 제외 · `thinkingBudget:0` · 잘림 검증·재시도 · 클라 `force` 재호출 · tip `bbed5c49`
- **배포** Edge `explain-event-term` LIVE · force 재생성 144자 완전 문장 확인
- **Preview** `/qa/world-events` → vienna 스탠딩석 재QA

## 세계행사 일정 #35 — D5-b 배치 B overrides

- **세션** `세계행사 일정 #35, D5-b 배치 B overrides`
- **브랜치** `cursor/world-events-wave2` · PR [#158](https://github.com/catgeot/Days/pull/158) · tip `a3cfba49`
- **산출** tokyo·kyoto·bangkok D5-b overrides — glossary 4 · heroImages 3 · highlightContextLinks 2 · mooniChips · actionChips 없음
- **VERIFY** `generate:world-events` · `smoke:world-events` · `smoke:world-events-detail`(D5_B_BATCH_B assert) · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/tokyo-sakura-season-2027` · kyoto-gion-matsuri-2027 · bangkok-songkran-2027
- **사람 QA** D5-b 본문(용어 모달·갤러리·인라인 링크) · 바로가기/실행 스트립 없음
- **다음** Preview OK → **#36** D5-b 배치 C(rio·new-york·iceland·sydney)

## 세계행사 일정 #35 — glossary 참고 링크 KO (#35 QA)

- **피드백** tokyo `우에노 공원` MOONi 모달 「참고 링크」→ `en.wikipedia.org/wiki/Ueno_Park`
- **원인** `referenceUrl`만 EN Wikipedia SSOT · 로케일 분기 없음
- **수정** `referenceUrlKo` + `getGlossaryTermReferenceUrl` · overrides KO URL(우에노 공원 등) · tip `df61ed3c`
- **Preview** `/qa/world-events` → tokyo 상세 · 우에노 공원 참고 링크 `ko.wikipedia.org/wiki/우에노_공원` 재QA

## 세계행사 일정 #36 — D5-b 배치 C overrides

- **세션** `세계행사 일정 #36, D5-b 배치 C overrides`
- **브랜치** `cursor/world-events-wave2` · PR [#158](https://github.com/catgeot/Days/pull/158) · tip `74bced2a`
- **산출** rio·new-york·iceland·sydney D5-b overrides — glossary 4 · heroImages 3 · highlightContextLinks 2 · mooniChips · actionChips 없음
- **VERIFY** `generate:world-events` · `smoke:world-events` · `smoke:world-events-detail`(D5_B_BATCH_C assert) · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/rio-carnival-2027` · new-york-thanksgiving-season-2026 · iceland-midnight-sun-2027 · sydney-vivid-2027
- **사람 QA** D5-b 본문(용어 모달·갤러리·인라인 링크) · 바로가기/실행 스트립 없음
- **다음** Preview OK → **#37** D5-b 배치 D(hanoi + 15건 회귀)

## 세계행사 일정 #37 — D5-b 배치 D overrides

- **세션** `세계행사 일정 #37, D5-b 배치 D overrides`
- **브랜치** `cursor/world-events-wave2` · tip `2ec65536` · PR [#158](https://github.com/catgeot/Days/pull/158)
- **산출** hanoi-tet-2027 D5-b overrides — glossary 4 · heroImages 3 · highlightContextLinks 2 · mooniChips · actionChips 없음
- **VERIFY** `generate:world-events` · `smoke:world-events`(15건 회귀) · `smoke:world-events-detail`(D5_B_BATCH_D assert) · `audit:event-travel-guide` · `build` PASS
- **Preview** `/qa/world-events` → `/world-events/hanoi-tet-2027` · Wave1 15건 D5-b KO **완성**(Preview)
- **사람 QA** D5-b 본문(용어 모달·갤러리·인라인 링크) · 바로가기/실행 스트립 없음
- **다음** Preview OK → **#38** i18n-1(En 본문 스키마·파일럿 3)
