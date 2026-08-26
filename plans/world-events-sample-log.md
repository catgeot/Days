# 세계 행사 Wave1 — 샘플 상세 QA 로그

**역할**: [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) 15건 샘플 루프 건별 기록.  
**규칙**: 샘플 세션(#11~#16) 종료마다 5~10줄 append.

| # | eventId | 세션 | Tier0.5 | AI | 상태 |
|---|---------|------|---------|-----|------|
| 1 | `edinburgh-fringe-2026` | #11, #12 | — | — | 대기 |
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

## #9 Preview QA — pivot 입력 (코드 세션 아님)

- **일시**: 2026-08-26
- **피드백**: 장기 행사 TripWindow → 30박 숙소·항공 · 플래너에 행사 맥락 없음 · 상세 페이지 필요
- **결정**: main 병합 **#18** · v2 플랜 착수 · **#12**부터 구현 (docs `main` 동기화 완료)
