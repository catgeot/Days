# 세계 행사 Wave1 — 샘플 상세 QA 로그

**역할**: [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) 15건 샘플 루프 건별 기록.  
**규칙**: 샘플 세션(#11~#16) 종료마다 5~10줄 append.

| # | eventId | 세션 | Tier0.5 | AI | 상태 |
|---|---------|------|---------|-----|------|
| 1 | `edinburgh-fringe-2026` | #11~#13, #23, #25 | ✅ overview·highlights·stayAreas·4박 | ✅ v0.2 pilot fixture | D2 action+mooni chips |
| 2 | `munich-oktoberfest-2026` | #14, #23, #25 | ✅ overview·highlights·stayAreas·3박 | ✅ v0.2 pilot fixture | D2 action+mooni chips |
| 3 | `vienna-staatsoper-season-2026` | #14, #34 | ✅ overview·highlights·stayAreas·3박 | ✅ v0.1 fixture | **D5-b** (#34) |
| 4 | `amsterdam-kings-day-2027` | #14, #34 | ✅ overview·highlights·stayAreas·2박 | ✅ v0.1 fixture | **D5-b** (#34) |
| 5 | `tokyo-sakura-season-2027` | #15, #35 | ✅ overview·highlights·stayAreas·4박 | — | **D5-b** (#35) |
| 6 | `kyoto-gion-matsuri-2027` | #15, #35 | ✅ overview·highlights·stayAreas·3박 | — | **D5-b** (#35) |
| 7 | `bangkok-songkran-2027` | #15, #35 | ✅ overview·highlights·stayAreas·3박 | — | **D5-b** (#35) |
| 8 | `bali-galungan-season-2026` | #15, #23, #25 | ✅ overview·highlights·stayAreas·4박 | ✅ v0.2 pilot fixture | D2 action+mooni chips |
| 9 | `rio-carnival-2027` | #16 | ✅ overview·highlights·stayAreas·4박 | — | Tier0~2+위젯 |
| 10 | `new-york-thanksgiving-season-2026` | #16 | ✅ overview·highlights·stayAreas·3박 | — | Tier0~2+위젯 |
| 11 | `iceland-midnight-sun-2027` | #16 | ✅ overview·highlights·stayAreas·4박 | — | Tier0~2+위젯 |
| 12 | `sydney-vivid-2027` | #16 | ✅ overview·highlights·stayAreas·3박 | — | Tier0~2+위젯 |
| 13 | `prague-spring-festival-2027` | #18, #34 | ✅ overview·highlights·stayAreas·3박 | — | **D5-b** (#34) |
| 14 | `marrakech-rose-festival-2027` | #18, #34 | ✅ overview·highlights·stayAreas·2박 | — | **D5-b** (#34) |
| 15 | `hanoi-tet-2027` | #18 | ✅ overview·highlights·stayAreas·4박 | — | Tier0~2+위젯 |

---

## #1 edinburgh-fringe-2026 — #12 Phase B

- **일시**: 2026-08-26
- **Tier0~2**: Hero(SSOT) · detailOverview 1단락 · highlights 3 · stayAreas 2 · recommendedNights 4 · festival typeIntro · bookingHints
- **라우트**: `/world-events/edinburgh-fringe-2026` · 15건 lookup OK (`getWorldEventById`)
- **허브**: 카드 제목·「행사 상세」→ 상세 URL · 「여행지 카드」→ `/place/edinburgh?fromEvent=…`
- **VERIFY**: `smoke:world-events-detail` PASS

## #1 edinburgh-fringe-2026 — #13 Phase C AI v0.1

- **일시**: 2026-08-26
- **인프라**: `EventTravelGuide` 스키마 v0.1 · `audit:event-travel-guide` · Edge `update-event-travel-guide` · `event_travel_guide` · `EventTravelGuidePanel`(Preview raw JSON)
- **샘플 #1**: Tier0 facts → fixture `edinburgh-fringe-2026.json` · audit PASS
- **프리셋 품질**: 개막 3박·중순 2박·막바지 3박 — 장기(25일) 행사에 짧은 윈도 3종 ✅
- **환각 점검**: venue·stayAreas·recommendedNights(4) facts 일치 · 전체 기간 숙박 미권장 cautions ✅
- **누락**: LIVE Edge invoke·DB 배포는 Secrets·migration 후 — Preview는 fixture 기반 audit만
- **VERIFY**: `smoke:event-travel-guide` · `smoke:world-events-detail` · `build` PASS
- **다음**: #14 sample #2 munich · (선택) LIVE invoke 후 사람 Preview Tier3 QA

## #2 munich-oktoberfest-2026 — #14 Tier0.5

- **일시**: 2026-08-26
- **패턴**: festival · 장기(16일) · recommendedNights **3** (개막·주말 중심 짧은 방문)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(Theresienwiese·Hauptbahnhof) · typeIntro festival · bookingHints 유지
- **라우트**: `/world-events/munich-oktoberfest-2026`
- **VERIFY**: `smoke:world-events-detail` Tier0.5 assert PASS
- **다음**: #15 샘플 #5~#8

## #2 munich-oktoberfest-2026 — #14 Tier3 AI v0.1

- **일시**: 2026-08-26
- **fixture**: `munich-oktoberfest-2026.json` · 개막·중순·평일 3종 프리셋 · Theresienwiese·Hauptbahnhof facts 일치
- **Preview**: `loadEventTravelGuideFixture` — fixture 있는 eventId 전건 Tier3 패널
- **VERIFY**: `audit:event-travel-guide` · `smoke:event-travel-guide` PASS

## #3 vienna-staatsoper-season-2026 — #14 Tier3 AI v0.1

- **일시**: 2026-08-26
- **fixture**: `vienna-staatsoper-season-2026.json` · season 짧은 방문 3종 · 1구·Karlsplatz facts 일치
- **VERIFY**: `audit:event-travel-guide` PASS

## #4 amsterdam-kings-day-2027 — #14 Tier3 AI v0.1

- **일시**: 2026-08-26
- **fixture**: `amsterdam-kings-day-2027.json` · 전날 체크인 2박 패턴 · Jordaan·De Pijp facts 일치
- **VERIFY**: `audit:event-travel-guide` PASS · span 1일 vs 2박 preset — audit WARN 허용

## #3 vienna-staatsoper-season-2026 — #14 Tier0.5

- **일시**: 2026-08-26
- **패턴**: season · 초장기(10개월) · recommendedNights **3** (공연 일정 맞춤 단기)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(1구·Karlsplatz) · typeIntro season
- **라우트**: `/world-events/vienna-staatsoper-season-2026`
- **VERIFY**: `smoke:world-events-detail` PASS
- **메모**: 시즌 span ≠ 숙박 — TripWindow 프리셋은 장기 heuristic 유지

## #4 amsterdam-kings-day-2027 — #14 Tier0.5

- **일시**: 2026-08-26
- **패턴**: festival · 단기(1일) · recommendedNights **2** (전날 체크인)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(Jordaan·De Pijp) · bookingHints(교통 통제) 연계
- **라우트**: `/world-events/amsterdam-kings-day-2027`
- **VERIFY**: `smoke:world-events-detail` PASS

## #5 tokyo-sakura-season-2027 — #15 Tier0.5

- **일시**: 2026-08-26
- **패턴**: season · 개화 시기 변동(약 17일) · recommendedNights **4** (만개 전후·예보 버퍼)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(우에노·신주쿠) · typeIntro season · bookingHints 유지
- **라우트**: `/world-events/tokyo-sakura-season-2027`
- **VERIFY**: `smoke:world-events-detail` Tier0.5 assert PASS

## #6 kyoto-gion-matsuri-2027 — #15 Tier0.5

- **일시**: 2026-08-26
- **패턴**: festival · 장기(31일) · 피크 7/16~17 요이야마 · recommendedNights **3**
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(기온·교토역) · typeIntro festival
- **라우트**: `/world-events/kyoto-gion-matsuri-2027`
- **VERIFY**: `smoke:world-events-detail` PASS

## #7 bangkok-songkran-2027 — #15 Tier0.5

- **일시**: 2026-08-26
- **패턴**: festival · 중기(3일) · recommendedNights **3** (4/13~15 커버)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(실롬·카오산) · bookingHints(방수) 연계
- **라우트**: `/world-events/bangkok-songkran-2027`
- **VERIFY**: `smoke:world-events-detail` PASS

## #8 bali-galungan-season-2026 — #15 Tier0.5

- **일시**: 2026-08-26
- **패턴**: season · 종교 시즌(약 10일) · recommendedNights **4** (갈룽안·쿠닝안 전후)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(우붓·스미냑) · typeIntro season
- **라우트**: `/world-events/bali-galungan-season-2026`
- **VERIFY**: `smoke:world-events-detail` PASS · `smoke:world-events` · `build` PASS
- **다음**: #16 sample #9~#12 + Phase D in-page 위젯

## #9 rio-carnival-2027 — #16 Tier0.5

- **일시**: 2026-08-26
- **패턴**: festival · 단기(6일) · recommendedNights **4** · Phase D EventStayStrip
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(코파·이파네마)
- **라우트**: `/world-events/rio-carnival-2027`
- **VERIFY**: `smoke:world-events-detail` PASS

## #10 new-york-thanksgiving-season-2026 — #16 Tier0.5

- **일시**: 2026-08-26
- **패턴**: season · 단기(11일) · recommendedNights **3**
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(미드타운·헤럴드)
- **라우트**: `/world-events/new-york-thanksgiving-season-2026`
- **VERIFY**: `smoke:world-events-detail` PASS

## #11 iceland-midnight-sun-2027 — #16 Tier0.5

- **일시**: 2026-08-26
- **패턴**: season · 장기(61일) · recommendedNights **4** · visitPresets 3
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(레이캬비크·라우가르달루르)
- **라우트**: `/world-events/iceland-midnight-sun-2027`
- **VERIFY**: `smoke:world-events-detail` PASS

## #12 sydney-vivid-2027 — #16 Tier0.5

- **일시**: 2026-08-26
- **패턴**: festival · 중기(24일) · recommendedNights **3** · visitPresets 3
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(서큘러 키·더 록스)
- **라우트**: `/world-events/sydney-vivid-2027`
- **VERIFY**: `smoke:world-events-detail` · `smoke:trip-window-edinburgh` · `build` PASS
- **다음**: #17 sample #13~#15 · 위젯 전건

## #13 prague-spring-festival-2027 — #18 Tier0.5

- **일시**: 2026-08-27
- **패턴**: season · 중기(31일) · recommendedNights **3** · Phase D EventStayStrip
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(구시가·말라 스트라나)
- **라우트**: `/world-events/prague-spring-festival-2027`
- **VERIFY**: `smoke:world-events-detail` PASS

## #14 marrakech-rose-festival-2027 — #18 Tier0.5

- **일시**: 2026-08-27
- **패턴**: festival · 단기(3일) · recommendedNights **2** (전날 체크인·투어)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(메디나·구엘리즈)
- **라우트**: `/world-events/marrakech-rose-festival-2027`
- **VERIFY**: `smoke:world-events-detail` PASS

## #15 hanoi-tet-2027 — #18 Tier0.5 + Wave1 마감

- **일시**: 2026-08-27
- **패턴**: season · 연휴(7일) · recommendedNights **4**
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(올드쿼터·호안끼엠)
- **위젯**: EventStayStrip packages/list prefill(일정·인원) · GuestStepper light · EventMooniFab
- **라우트**: `/world-events/hanoi-tet-2027`
- **VERIFY**: `smoke:world-events` · `smoke:world-events-detail`(15건) · `build` PASS
- **다음**: #20 사람 Preview OK → PR #153 merge

## #19 Wave1 통합 QA — #19

- **일시**: 2026-08-27
- **범위**: 15건 상세 URL 전건 · §6.1 회귀 · PR #153 병합 준비
- **VERIFY**: `smoke:world-events` · `smoke:world-events-detail` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `build` PASS
- **문서**: `world-events-management.md` §6.1.1 QA 표 추가
- **사람 QA**: §6.1.1 15건 각각 Tier0~2·프리셋·항공+숙소 prefill·무니 FAB
- **다음**: PR #153 merge · PROD QA

## #1 edinburgh-fringe-2026 — Wave1.5 D1 (#23)

- **일시**: 2026-08-27
- **세션**: `세계행사 일정 #23, Wave1.5 D1 AI 정적 분리` · PR #154 · `cursor/world-events-wave2`
- **변경**: EventTravelGuide **v0.2** — `summary`·`recommended_nights` 제거(정적 Tier0.5와 역할 분리) · PROD Tier3 억제 · Preview 파일럿 3건만 패널
- **fixture**: `edinburgh-fringe-2026.json` v0.2 — trip_presets 3 · sections(공연 예매·이동) · booking_tips · cautions
- **VERIFY**: `audit:event-travel-guide` · `smoke:world-events-detail` · `smoke:event-travel-guide` · `build` PASS
- **다음**: 사람 Preview D1 QA → **#24 D2** 무니·행사 액션 칩

## #1 edinburgh-fringe-2026 — D1 사람 QA 피드백 → D2/D3 (#24 논의)

- **일시**: 2026-08-27
- **맥락**: Wave1.5 D1 Preview QA — AI v0.2 섹션 본문만 검수(§6.1·15건 회귀는 Wave1 종료)
- **피드백 (사람)**: Tier3 `sections`에 **Royal Mile** · **city venues** · **edfringe.com** 등 축제 핵심 키워드가 나오지만 **클릭·실행 링크 없음** — 사용자가 검색 사이트에 키워드를 다시 입력해야 함
  - 「공연 선택·예매」: Royal Mile·올드타운 프리 공연 → edfringe.com 사전 예매 권장 — **예매·핵심 권역이 축제의 중심인데 페이지가 실행까지 연결하지 못함**
  - 「일정·이동 팁」: Royal Mile 혼잡·「공연장 위치를 지도에 미리 표시」 — **지역·지도 정보가 필요하지만 사이트 내 제공 부담이면 외부 링크(지도·검색)라도 필요**
- **이미 있는 정적층 (AI와 미연결)**:
  - 상단 CTA `sourceUrl` → edfringe.com 「공식」
  - Hero `venue` · highlights · stayAreas(올드타운·Royal Mile → MRT 숙소 링크)
  - → 키워드는 SSOT에 있지만 **AI 섹션·액션 칩과 묶여 있지 않음**
- **D1 범위 밖 (의도)** — 스키마 v0.2에 URL 필드 없음 · 무니 행사 시드·칩 미구현
- **D2 (#24) 요구** — 행사 **액션 칩**·**무니 시드·칩** 예시:
  - 공식 티켓 예매 → `sourceUrl` (edfringe.com)
  - Royal Mile / 프리 공연 → Google Maps 또는 검색 `Royal Mile Edinburgh Fringe`
  - 공연장 지도 → edfringe venue map 또는 「Edinburgh Fringe venues map」검색
  - 무니 칩 → 「프리 공연 어디서?」「하루 3편 일정 짜줘」 등 행사 맥락 시드
  - 참고 패턴: 국내 `FestivalDetailSheet` Google·네이버 검색 URL
- **D3 (#25) 요구** — Google·네이버 검색 · `cityAttractionHubs` 브릿지(명소·지도 허브)
- **D1 QA 결론**: 역할 분리(겹침 완화)는 목적 달성 · **실행층(링크·지도·예매 동선) 공백** → D2 착수 전 본 절로 핸드오프

## #2 munich-oktoberfest-2026 — Wave1.5 D2 (#25)

- **일시**: 2026-08-27
- **세션** `세계행사 일정 #25, Wave1.5 D2 무니 행사칩` · PR #154 · `cursor/world-events-wave2`
- **액션 칩**: 공식 사이트(oktoberfest.de) · Theresienwiese Google Maps · 텐트 예약 검색
- **무니 칩**: 텐트 예약 · 평일/주말 · Theresienwiese 교통 — FAB 열면 행사 맥락 시드 표시
- **에든버러 D2**(pilot): 공식 예매(edfringe) · Royal Mile 지도 · 공연장 지도 · 무니 「프리 공연」「하루 3편」
- **VERIFY**: `smoke:world-events-detail` · `build` PASS
- **다음**: 사람 Preview D2 QA → **#26 D3** 미디어·명소

## #3 bali-galungan-season-2026 — Wave1.5 D3 (#26)

- **일시**: 2026-08-27
- **세션** `세계행사 일정 #26, Wave1.5 D3 미디어·명소` · PR #154 · `cursor/world-events-wave2`
- **미디어** `heroImage`(펜jor) · `youtubeVideos` 2건 · Google·네이버 검색 섹션
- **명소** `hubId:bali` → `cityAttractionHubs` 우붓·울루와뚜 등 `/place` 칩 · 도시 허브 링크
- **파일럿** edinburgh·munich 동일 패턴(hero·YouTube·검색·명소)
- **VERIFY**: `smoke:world-events-detail` · `build` PASS
- **다음**: 사람 Preview D3 QA → **#27 D4** EventStayStrip·파일럿 회귀

## #3 bali — D3 Preview QA 피드백·핫픽스 (#26)

- **피드백** 히어로 404 · 갈룽안 안내→baligoldentour 404 · 펜져 영문 Google · Google 검색 무결과(한·영 혼합 쿼리) · 무니 칩 시드 나열만·타 칩 미동작
- **핫픽스** `ea74f5ee` — Wikimedia hero · ko.wikipedia · 한글 검색 쿼리 · 무니 칩 재전송
- **재QA** bali 상세 — 히어로·구글/네이버·무니 칩 3종

## #3 bali — D3 재QA 핫픽스 (#26)

- **피드백** ko위키 갈룽안 없음 · 펜jor 한글 Google 무결과 · MOONi 대화칩 미전송
- **핫픽스** `bd586518` — en.wikipedia/Galungan · penjor en Google · MOONi chatDraft 대기
- **다음** 사람 Preview 재QA OK → **#27 D4**

## Wave1.5 D4 — stayAreas→MRT (#27)

- **산출** EventStayStrip 권역 칩 · `mrtKeyword` MRT 조회 · MRT 더보기 · `4922f7a9`
- **VERIFY** `smoke:world-events-detail` · `smoke:world-events` · `build` PASS
- **Preview** edinburgh·munich·bali — 권역 칩·숙소 카드·개막 프리셋
- **다음** 사람 Preview D4 QA → **#28 D5**

## #8 bali — D5 실행·어필리에이트 피드백 (#28)

- **피드백** 렌터카·기사 투어·사롱·셀endang 안내는 충분하나 **실행 링크 부재** — Google 등 외부 검색 이탈
- **요구** Klook 렌터카·GYG/MRT 투어는 **사이트 내 제휴** · 사롱·대여는 **큐레이션 외부 칩**으로 gateo에서 연결
- **계획** Wave1.5 **D5** — [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0.5 (신규 plans 파일 **금지**)
- **다음** #28 D5 bali pilot → 파일럿 3건 패턴화 → **#29 Wave2**

## #8 bali — D5 구현 (#28)

- **산출** `EventExecutionStrip` · shop actionChips(사롱·Klook) · `c6e38c1c`
- **VERIFY** `smoke:world-events-detail` · `build` PASS
- **Preview** `/world-events/bali-galungan-season-2026` — Klook·GYG·PKC·사롱 칩
- **다음** 사람 Preview D5 QA → D5-b 파일럿 3건 패턴화 → **#30 Wave2**

## #1 edinburgh — D5-b-2 (#31)

- **산출** glossary 4종(fringe·royal-mile·old-town·new-town) · heroImages 3장 · highlightContextLinks(0·1) · feature `3bd88e99`
- **다음** main 병합 후 PROD QA

## #2 munich — D5-b-2 (#31)

- **산출** glossary 4종(theresienwiese·beer-tent·oktoberfest·hackerbruecke) · heroImages 3장 · highlightContextLinks(0·1)
- **다음** main 병합 후 PROD QA

## #8 bali — D5-b Preview QA 피드백·계획 (#29)

- **피드백** `EventActionChips`(갈룽안 안내·우붓 사원·펜져·사롱) 본문과 중복 · `EventExecutionStrip`(Klook·GYG) 상업적·흐름 단절
- **결정** D5-b — glossary 클릭→무니 모달(채팅 아님) · `highlightContextLinks` 인라인 · `heroImages` 갤러리 · Google `hl` locale SSOT
- **제거** 바로가기 섹션 · 실행·예약 스트립(bali) — SSOT [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0.5 D5-b
- **다음** #29 구현 세션 — bali pilot → OK 시 #30 Wave2

## #9 bali — D5-b 본문 UX 구현 (#29)

- **산출** glossary 5종(galungan·kuningan·penjor·사례 복장·사롱) · heroImages 3장 · highlightContextLinks(0·2) · `a78fb520`
- **UI** 본문 용어→MOONi 모달(채팅 아님) · 하이라이트 인라인 렌터카·투어·사롱 링크 · EventExecutionStrip 제거
- **VERIFY** smoke·build PASS
- **다음** 사람 Preview QA → OK 시 **#31 Wave2** singapore·dubai

## #9 bali — D5-b Preview 3차 (#30)

- **피드백** 히어로 스와이프·갤러리 모달 · 사롱 Klook 영문·Maps 이탈 · YouTube 키워드 로케일
- **수정** `EventHeroGalleryModal` · `searchTarget` google/klook · `youtubeSearchQueryKo/En` · `14a8bf42`
- **VERIFY** smoke·build PASS
- **다음** 사람 Preview QA → OK 시 **#31 Wave2** singapore·dubai

## #9 bali — D5-b Preview 4차 (#30)

- **피드백** 히어로 「행사 하이라이트」오버레이 · 갤러리 모달 동일 3장 · glossary 무니 매클릭 API · YouTube 영문 리스트
- **수정** 히어로 텍스트 제거 · `event_hero_gallery`+Wikimedia Edge · `event_term_glossary_cache` · YouTube ko fetch·리스트 더보기 · `2b4e890f`
- **VERIFY** smoke·audit·build PASS
- **다음** 사람 Preview 재QA → OK 시 **#31 Wave2** singapore·dubai

## v2 pivot — Preview QA 피드백 (#12 전)

- **일시**: 2026-08-26
- **피드백**: 장기 행사 TripWindow → 30박 숙소·항공 · 플래너에 행사 맥락 없음 · 상세 페이지 필요
- **결정**: main 병합 **#18** · v2 플랜 착수 · **#12**부터 구현 (docs `main` 동기화 완료)

## #3 vienna — D5-b-3 배치 A (#34)

- **산출** glossary 4종(staatsoper·stehplatz·musikverein·innere-stadt) · heroImages 3장 · highlightContextLinks(0·1) · `541e5dbe`
- **VERIFY** smoke D5-b batch A assert PASS
- **Preview** `/world-events/vienna-staatsoper-season-2026` — Tier3 AI 패널 유지

## #4 amsterdam — D5-b-3 배치 A (#34)

- **산출** glossary 4종(kings-day·jordaan·vondelpark·orange-tradition) · heroImages 3장 · highlightContextLinks(0·1)
- **Preview** `/world-events/amsterdam-kings-day-2027` — Tier3 AI 패널 유지

## #13 prague — D5-b-3 배치 A (#34)

- **산출** glossary 4종(prague-spring·rudolfinum·old-town·mala-strana) · heroImages 3장 · highlightContextLinks(0·1)
- **Preview** `/world-events/prague-spring-festival-2027`

## #14 marrakech — D5-b-3 배치 A (#34)

- **산출** glossary 4종(rose-festival·kelaat-mgouna·medina·gueliz) · heroImages 3장 · highlightContextLinks(0·1)
- **Preview** `/world-events/marrakech-rose-festival-2027`
- **다음** 사람 Preview 배치 A QA → **#35** 배치 B(tokyo·kyoto·bangkok)

## #5 tokyo — D5-b-3 배치 B (#35)

- **산출** glossary 4종(sakura·hanami·ueno-park·chidorigafuchi) · heroImages 3장 · highlightContextLinks(0·2) · mooniChips
- **VERIFY** smoke D5-b batch B assert PASS
- **Preview** `/world-events/tokyo-sakura-season-2027`

## #6 kyoto — D5-b-3 배치 B (#35)

- **산출** glossary 4종(yoi-yama·yamaboko·gion·yasaka-jinja) · heroImages 3장 · highlightContextLinks(0·2) · 야사카 공식 href
- **Preview** `/world-events/kyoto-gion-matsuri-2027`

## #7 bangkok — D5-b-3 배치 B (#35)

- **산출** glossary 4종(songkran·silom·khao-san·water-proof) · heroImages 3장 · highlightContextLinks(0·1) · 방수 Klook 링크
- **Preview** `/world-events/bangkok-songkran-2027`
- **다음** 사람 Preview 배치 B QA → **#36** 배치 C(rio·new-york·iceland·sydney)
