# 세계 행사 Wave1 — 샘플 상세 QA 로그

**역할**: [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) 15건 샘플 루프 건별 기록.  
**규칙**: 샘플 세션(#11~#16) 종료마다 5~10줄 append.

| # | eventId | 세션 | Tier0.5 | AI | 상태 |
|---|---------|------|---------|-----|------|
| 1 | `edinburgh-fringe-2026` | #11, #12 | ✅ overview·highlights·stayAreas·4박 | — | Tier0~2 완료 |
| 2 | `munich-oktoberfest-2026` | #14 | ✅ overview·highlights·stayAreas·3박 | — | Tier0~2 완료 |
| 3 | `vienna-staatsoper-season-2026` | #14 | ✅ overview·highlights·stayAreas·3박 | — | Tier0~2 완료 |
| 4 | `amsterdam-kings-day-2027` | #14 | ✅ overview·highlights·stayAreas·2박 | — | Tier0~2 완료 |
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
- **다음**: #13 Tier3 AI 1건 (Edge `update-event-travel-guide`) — **완료** (#13 Phase C)

## #2 munich-oktoberfest-2026 — #14 Tier0.5

- **일시**: 2026-08-26
- **패턴**: festival · 장기(16일) · recommendedNights **3** (개막·주말 중심 짧은 방문)
- **Tier0~2**: detailOverview · highlights 3 · stayAreas 2(Theresienwiese·Hauptbahnhof) · typeIntro festival · bookingHints 유지
- **라우트**: `/world-events/munich-oktoberfest-2026`
- **VERIFY**: `smoke:world-events-detail` Tier0.5 assert PASS
- **다음**: #15 샘플 #5~#8 또는 (선택) munich Tier3 AI

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

- **일시**: 2026-08-26
- **피드백**: 장기 행사 TripWindow → 30박 숙소·항공 · 플래너에 행사 맥락 없음 · 상세 페이지 필요
- **결정**: main 병합 **#18** · v2 플랜 착수 · **#12**부터 구현 (docs `main` 동기화 완료)
