# 세계 행사 Wave1 — 샘플 상세 QA 로그

**역할**: [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) 15건 샘플 루프 건별 기록.  
**규칙**: 샘플 세션(#11~#16) 종료마다 5~10줄 append.

| # | eventId | 세션 | Tier0.5 | AI | 상태 |
|---|---------|------|---------|-----|------|
| 1 | `edinburgh-fringe-2026` | #11, #12, #13 | ✅ overview·highlights·stayAreas·4박 | ✅ v0.1 fixture | Tier0~2+AI v0.1 |
| 2 | `munich-oktoberfest-2026` | #14 | ✅ overview·highlights·stayAreas·3박 | ✅ v0.1 fixture | Tier0~2+AI v0.1 |
| 3 | `vienna-staatsoper-season-2026` | #14 | ✅ overview·highlights·stayAreas·3박 | ✅ v0.1 fixture | Tier0~2+AI v0.1 |
| 4 | `amsterdam-kings-day-2027` | #14 | ✅ overview·highlights·stayAreas·2박 | ✅ v0.1 fixture | Tier0~2+AI v0.1 |
| 5 | `tokyo-sakura-season-2027` | #15 | — | — | 대기 |
| 6 | `kyoto-gion-matsuri-2027` | #15 | — | — | 대기 |
| 7 | `bangkok-songkran-2027` | #15 | — | — | 대기 |
| 8 | `bali-galungan-season-2026` | #15 | — | — | 대기 |
| 9 | `rio-carnival-2027` | #15 | — | — | 대기 |
| 10 | `new-york-thanksgiving-season-2026` | #15 | — | — | 대기 |
| 11 | `iceland-midnight-sun-2027` | #15 | — | — | 대기 |
| 12 | `sydney-vivid-2027` | #15 | — | — | 대기 |
| 13 | `prague-spring-festival-2027` | #16 | — | — | 대기 |
| 14 | `marrakech-rose-festival-2027` | #16 | — | — | 대기 |
| 15 | `hanoi-tet-2027` | #16 | — | — | 대기 |

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

## v2 pivot — Preview QA 피드백 (#12 전)

- **일시**: 2026-08-26
- **피드백**: 장기 행사 TripWindow → 30박 숙소·항공 · 플래너에 행사 맥락 없음 · 상세 페이지 필요
- **결정**: main 병합 **#18** · v2 플랜 착수 · **#12**부터 구현 (docs `main` 동기화 완료)
