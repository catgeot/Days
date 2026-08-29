# 세계 행사 일정 — Q&A 인덱스

**역할**: 플랜 [`world-events-plan.md`](./world-events-plan.md) §7 열린 질문에 대한 **합의 기록**.  
**규칙**: 답변이 확정되면 이 파일에 먼저 기록 → 마스터 플랜·Phase 상세 갱신.

**브랜치**: `cursor/world-events-efa3`  
**마지막 갱신**: 2026-08-25 (Q&A 확정 · 세션 로드맵)

---

## 확정된 결정

| ID | 질문 요약 | 결정 | 날짜 | 비고 |
|----|-----------|------|------|------|
| **Q1** | 1차 범위 우선순위 | **C** — P0 공통 모델 후 국내·해외 병행 | 2026-08-25 | |
| **Q2** | 해외 데이터 전략 | **C** — 핵심 수동 SSOT + **P3-a 공식 피드 POC** + 상용 API 후보 | 2026-08-25 | |
| **Q4** | `/events` 글로벌 허브 시기 | **B** — PlaceCard 섹션 먼저 (전용 허브는 별도, 아래 Q7) | 2026-08-25 | |
| **Q5** | TripWindow 기본값 | **플랜 기본값 OK** — 버퍼 전·후 1일, 최소 2박 | 2026-08-25 | |
| **Q6** | 오페라·시즌형 표현 | **A+C 병행** — 시즌 start/end + `sourceUrl` 링크아웃 | 2026-08-25 | |
| **Q7** | 국내·해외 UI | **B + `/world-events`** | 2026-08-25 | |
| **Q8** | P1 항공 연동 | **B** — 숙소 + 플래너 + 항공 위젯 날짜 | 2026-08-25 | |
| **Q10** | 영문 UI | **한국어 MVP 이후** — MVP = Wave1 15건 **D5-b KO** (#38 i18n-1) | 2026-08-25 · 2026-08-29 |
| **Q15** | 15건 전건 D5-b 표준화? | **예** — 파일럿 3 완료 · 나머지 12건 #34~#37 배치 | 2026-08-29 | |
| **Q3** | 해외 Wave1 slug | **§4.1 제안 12 slug 승인** | 2026-08-25 | |
| **Q9** | 즐겨찾기 다건 TripWindow | **B** — P1.5 (단일 축제 CTA 먼저) | 2026-08-25 | 세션 #10·선택 |
| **Q11** | Preview `/qa/…` | **`/qa/world-events`** — P2 허브 세션(#8)에서 등록 | 2026-08-25 | |
| **Q12** | 1차 사람 QA | **P1** `/korea` 단일 축제 · **P2** `/place/vienna` + `/world-events` | 2026-08-25 | |
| **Q13** | 해외 전용 페이지 | **`/world-events` · P2 동시** | 2026-08-25 | |
| **Q14** | P3 해외 자동 보강 | **공식 ICS/RSS/open data POC** (§5.1) · 상세는 P3 착수 시 | 2026-08-25 | 세션 #11 후보 |

---

## Q3 — 해외 Wave 1 slug (확정)

| 지역 칩 | slug | 대표 행사 | type |
|---------|------|-----------|------|
| **유럽** | `vienna` | 빈 국립오페라 시즌 | season |
| | `munich` | 옥토버페스트 | festival |
| | `edinburgh` | 에든버러 프린지 | festival |
| | `amsterdam` | 킹스데이 | festival |
| **아시아·태평양** | `tokyo` | 벚꽃 시즌 | season |
| | `kyoto` | 기온마츠리 | festival |
| | `bangkok` | 송크란 | festival |
| | `bali` | 갈룽안·사원 축제 시즌 | season |
| **아메리카** | `rio-de-janeiro` | 카니발 | festival |
| | `new-york` | 추수감사절·시즌 | season |
| **오세아니아·자연** | `iceland` | 미드나잇 선·Secret Solstice | season |
| | `sydney` | 비비드 시드니 | festival |
| **소규모·니치** | `prague` | 봄 축제 시즌 | season |
| | `marrakech` | 로즈 페스티벌 | festival |
| | `hanoi` | 뗏(Tết) 연휴 윈도 | season |

- Wave 1: slug **12** · SSOT **12~15건**
- Wave 2: `singapore`, `dubai`, `barcelona`, `istanbul` 등

---

## Q&A 로그 (시간순)

| 일시 | 내용 |
|------|------|
| 2026-08-24 | 플랜·Q&A 인덱스 초안. Q1–Q7 등록. 코드 미착수. |
| 2026-08-25 | Q14: P3-a 공식 ICS/RSS/open data POC 계획 포함. §5.1·세션 #11·management §7. |

---

## 다음 액션

1. **#33** — PROD §6.1.1 파일럿 3 · Wave2 singapore·dubai
2. **#34~#37** — Wave1 12건 D5-b 배치 ([`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0.5 D5-b-3)
3. **#38** — i18n-1 (Q10)
4. 세션 종료마다 일지 2~5줄 · `feature-handoff-index` 행 갱신
