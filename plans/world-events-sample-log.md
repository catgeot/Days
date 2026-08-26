# 세계 행사 Wave1 — 샘플 상세 QA 로그

**역할**: [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) 15건 샘플 루프 건별 기록.  
**규칙**: 샘플 세션(#11~#16) 종료마다 5~10줄 append.

| # | eventId | 세션 | Tier0.5 | AI | 상태 |
|---|---------|------|---------|-----|------|
| 1 | `edinburgh-fringe-2026` | #11, #12, #13 | ✅ overview·highlights·stayAreas·4박 | ✅ v0.1 fixture | Tier0~2+AI v0.1 |
| 2 | `munich-oktoberfest-2026` | #13 | — | — | 대기 |
| 3 | `vienna-staatsoper-season-2026` | #13 | — | — | 대기 |
| 4 | `amsterdam-kings-day-2027` | #13 | — | — | 대기 |
| 5 | `tokyo-sakura-season-2027` | #14 | — | — | 대기 |
| 6 | `kyoto-gion-matsuri-2027` | #14 | — | — | 대기 |
| 7 | `bangkok-songkran-2027` | #14 | — | — | 대기 |
| 8 | `bali-galungan-season-2026` | #14 | — | — | 대기 |
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
- **다음**: #13 Tier3 AI 1건 (Edge `update-event-travel-guide`)

## #1 edinburgh-fringe-2026 — #13 Phase C AI v0.1

- **일시**: 2026-08-26
- **인프라**: `EventTravelGuide` 스키마 v0.1 · `audit:event-travel-guide` · Edge `update-event-travel-guide` · `event_travel_guide` · `EventTravelGuidePanel`(Preview raw JSON)
- **샘플 #1**: Tier0 facts → fixture `edinburgh-fringe-2026.json` · audit PASS
- **프리셋 품질**: 개막 3박·중순 2박·막바지 3박 — 장기(25일) 행사에 짧은 윈도 3종 ✅
- **환각 점검**: venue·stayAreas·recommendedNights(4) facts 일치 · 전체 기간 숙박 미권장 cautions ✅
- **누락**: LIVE Edge invoke·DB 배포는 Secrets·migration 후 — Preview는 fixture 기반 audit만
- **VERIFY**: `smoke:event-travel-guide` · `smoke:world-events-detail` · `build` PASS
- **다음**: #14 sample #2 munich · (선택) LIVE invoke 후 사람 Preview Tier3 QA

- **일시**: 2026-08-26
- **피드백**: 장기 행사 TripWindow → 30박 숙소·항공 · 플래너에 행사 맥락 없음 · 상세 페이지 필요
- **결정**: main 병합 **#18** · v2 플랜 착수 · **#12**부터 구현 (docs `main` 동기화 완료)
