# 세계 행사·축제 데이터 운영 가이드 (초안)

**상태**: P0 착수 대기 — Wave1 수동 SSOT · P3 공식 피드 POC 방향 잠금  
**마스터 플랜**: [`world-events-plan.md`](./world-events-plan.md) §5.1  
**Q&A**: [`world-events-qa-index.md`](./world-events-qa-index.md)

---

## 1. 역할

| 데이터 | SSOT | 용도 |
|--------|------|------|
| **해외·큐레이션 행사** | `world-event-overrides.mjs` → `worldEvents.json` | PlaceCard · `/world-events` |
| **해외·공식 피드 (P3-a)** | Edge fetch → draft → overrides 병행 | 갱신 보조 · **구현 시 세부 논의** |
| **국내 축제** | TourAPI + 런타임 어댑터 | `/korea` (JSON 중복 저장 안 함) |
| **여행지 연결** | [`travelSpots.js`](../src/pages/Home/data/travelSpots.js) `slug` | 행사 `slug` FK |
| **국내 허브** | [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json) | 선택 `hubId` |

---

## 2. 행사 추가 체크리스트 (Phase 2 — 수동)

| # | 작업 | 필수 |
|---|------|------|
| 1 | `travelSpots`에 slug 존재 확인 | ✅ |
| 2 | `world-event-overrides.mjs`에 1건 추가 | ✅ |
| 3 | `id` 유일 · `startDate`/`endDate` `YYYY-MM-DD` | ✅ |
| 4 | `sourceUrl` 공식 일정·티켓 페이지 | ✅ (가능하면) |
| 5 | `bookingHints` — MRT/Trip 검색어·시즌 메모 | 권장 |
| 6 | `npm run generate:world-events` | ✅ |
| 7 | `npm run audit:world-events` PASS | ✅ |
| 8 | PlaceCard·상세 `/world-events/{id}` QA | ✅ |
| 9 | **D5-b** `glossaryTerms` 3~5 · `heroImages` 3 · `highlightContextLinks` 1~2 | **표준 상세 필수** (#34~) |
| 10 | D2 `actionChips` | **신규 추가 금지** — D5-b가 대체(bali 패턴) |

**금지**: `worldEvents.json` 직접 편집 · 존재하지 않는 slug · **신규 `plans/*-plan.md`** (D5는 [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0.5만)

---

## 3. `type` · `recurrence` 판단 (초안)

| type | 예시 |
|------|------|
| `festival` | 옥토버페스트, 프린지, 음악 페스티벌 |
| `opera` | 단일 오페라 공연 (날짜 확정 시) |
| `season` | 오페라·발레 **시즌** (기간만) |
| `concert` | 단일 콘서트 |
| `heritage` | UNESCO·문화유산 관련 행사 |

| recurrence | 의미 |
|------------|------|
| `annual` | 매년 대략 같은 시기 (`recurrenceNote`에 월·주) |
| `fixed` | 확정된 단일 기간 |
| `tbd` | 연도·일정 미정 — `sourceUrl` 필수 |

---

## 4. 연간 갱신

| 시점 | 작업 |
|------|------|
| 시즌 시작 **3개월 전** | 시즌형(`season`) start/end·URL 검수 |
| 연초 | `annual` 행사 연도별 id·날짜 갱신 |
| TourAPI | 국내 — 기존 `/korea` 캐시 정책 유지 |
| P3-a 피드 (도입 후) | 피드 fetch 실패·stale 알림 — **운영 절차는 P3 착수 시** |

---

## 5. 국내 vs 해외 구분

| | 국내 | 해외 (P2) | 해외 (P3-a 피드) |
|--|------|-----------|------------------|
| 소스 | TourAPI `contentTypeId=15` | `world-event-overrides.mjs` | 공식 ICS · RSS · open data |
| 저장 | Edge 캐시 + sessionStorage | 정적 JSON | Edge 캐시 + overrides |
| UI | `/korea` | PlaceCard · `/world-events` | 동일 |
| 날짜 형식 | API `YYYYMMDD` → `tripWindow` | JSON `YYYY-MM-DD` | 파싱 후 `YYYY-MM-DD` |

---

## 6. 검증 명령 (P0–P2 통합)

```bash
# 통합 smoke (generate · audit · P0–P2 domain smokes)
npm run smoke:world-events

# 개별 (디버그용)
npm run smoke:world-events-hub
npm run smoke:trip-window-from-festival
npm run smoke:trip-window-edinburgh
npm run smoke:korea-festival-stay-url
npm run smoke:korea-festival-planner-link
npm run generate:world-events
npm run audit:world-events
npm run build
```

**세션 #9 게이트**: `smoke:world-events` + `build` PASS.

---

## 6.1 사람 QA 체크리스트 (P0–P2 · Q12)

**PROD** (`#22`): `https://www.gateo.kr/world-events` · bundle `index-vN5gm04K.js` (PR #153 merge `6712f777`)

| 경로 | 확인 |
|------|------|
| `/korea` → 축제 상세 1건 | **FestivalStayStrip** — 일정 프리셋·숙소·항공+숙소·**무니 FAB** · 플래너 직링크 **없음** |
| `/korea` → **횡성한우축제** | 인근 hub **횡성** 우선(평창 오탐 없음) · FestivalStayStrip 일정 prefill |
| `/place/vienna` | 「이 도시의 행사」접이식 · 플래너·숙소·공식 일정 CTA |
| `/world-events` | 지역 칩 5개 전환 · 카드 「여행지 카드」→ `/place/:slug?fromEvent&checkIn&checkOut` · 플래너·숙소 CTA |
| `/world-events` **에든버러 프린지** | 유럽 칩 → 「여행지 카드」 URL에 `fromEvent=edinburgh-fringe-2026` · `checkIn`/`checkOut`(행사 전후 1일 버퍼, 진행 중이면 checkIn=오늘) · 플래너 CTA 동일 날짜 |
| **홈** 좌상단 바로가기 | 「한국의 축제」 아래 **「세계의 행사」** → `/world-events` |

### 6.1.1 v2 상세 페이지 — Wave1 15건 (main `b2ac6888`+)

**표준 상세 (D5-b)** = 발리 [`bali-galungan-season-2026`](https://www.gateo.kr/world-events/bali-galungan-season-2026) 패턴. **Preview D5-b: 15/15**(파일럿 3 + Wave2 2 + 배치 A 4 + 배치 B 3 + 배치 C 4 + 배치 D 1).

**PROD 진입**: `https://www.gateo.kr/world-events`  
**Preview 진입**: `https://www.gateo.kr/qa/world-events`  
**상세 직링크**: `https://www.gateo.kr/world-events/{eventId}` (Preview는 git URL 동일 path)

**배치 A D5-b Preview (#34 · PR #158)**

| eventId | Preview path | D5-b 확인 |
|---------|--------------|-----------|
| `vienna-staatsoper-season-2026` | `/world-events/vienna-staatsoper-season-2026` | glossary 4 · 갤러리 3 · Tier3 AI 패널 |
| `amsterdam-kings-day-2027` | `/world-events/amsterdam-kings-day-2027` | glossary 4 · 갤러리 3 · Tier3 AI 패널 |
| `prague-spring-festival-2027` | `/world-events/prague-spring-festival-2027` | glossary 4 · 갤러리 3 · 인라인 링크 |
| `marrakech-rose-festival-2027` | `/world-events/marrakech-rose-festival-2027` | glossary 4 · 갤러리 3 · 인라인 링크 |

**배치 B D5-b Preview (#35 · PR #158)**

| eventId | Preview path | D5-b 확인 |
|---------|--------------|-----------|
| `tokyo-sakura-season-2027` | `/world-events/tokyo-sakura-season-2027` | glossary 4 · 갤러리 3 · 인라인 링크 |
| `kyoto-gion-matsuri-2027` | `/world-events/kyoto-gion-matsuri-2027` | glossary 4 · 갤러리 3 · 야사카 공식 링크 |
| `bangkok-songkran-2027` | `/world-events/bangkok-songkran-2027` | glossary 4 · 갤러리 3 · 방수 Klook 링크 |

**배치 C D5-b Preview (#36 · PR #158)**

| eventId | Preview path | D5-b 확인 |
|---------|--------------|-----------|
| `rio-carnival-2027` | `/world-events/rio-carnival-2027` | glossary 4 · 갤러리 3 · 삼바드롬 공식 링크 |
| `new-york-thanksgiving-season-2026` | `/world-events/new-york-thanksgiving-season-2026` | glossary 4 · 갤러리 3 · 메이시스 퍼레이드 공식 |
| `iceland-midnight-sun-2027` | `/world-events/iceland-midnight-sun-2027` | glossary 4 · 갤러리 3 · 골든서클 렌터카 |
| `sydney-vivid-2027` | `/world-events/sydney-vivid-2027` | glossary 4 · 갤러리 3 · 비비드 공식 링크 |

**배치 D D5-b Preview (#37 · PR #158)**

| eventId | Preview path | D5-b 확인 |
|---------|--------------|-----------|
| `hanoi-tet-2027` | `/world-events/hanoi-tet-2027` | glossary 4 · 갤러리 3 · vietnam.travel 뗏 안내 링크 |

**공통 D5-b 체크**: 상단 바로가기 칩·실행 스트립 **없음** · 본문 용어 첫 등장 클릭→MOONi 모달 · 하이라이트 인라인 링크 · 히어로+썸네일 갤러리

**파일럿 3건 D5-b (#32 병합 후 · PROD)**

| 대상 | PROD URL | 확인 |
|------|----------|------|
| **발리** | `/world-events/bali-galungan-season-2026` | EventStayStrip · **항공+숙소** → Trip `packages/list` · ICN→**DPS** · 일정 prefill |
| **국내축제** | `/korea` → 축제 상세 | FestivalStayStrip · TripWindow 프리셋 · 무니 FAB · MRT 숙소 `checkIn`/`checkOut` |
| **횡성** | `/korea` → 횡성한우축제 | 인근 hub **횡성** · FestivalStayStrip 동작 |

**공통 (15건 각각)**

| 항목 | 확인 |
|------|------|
| Tier0~2 | Hero · `detailOverview` · highlights 3 · stayAreas 2 · **권장 박수** 섹션 |
| TripWindow | 「내 여행 일정」프리셋 2~3종 · **행사 전체 span 아님** · 플래너·숙소 CTA 동일 날짜 |
| EventStayStrip | 숙소 카드 · **항공+숙소** → Trip `packages/list`(일정·ICN→도착 IATA·인원 prefill) |
| 무니 FAB | 우하단 Mooni 버튼 · 행사 맥락 대화 진입 |
| 허브 회귀 | `/world-events` 카드 「행사 상세」→ 동일 URL · 「여행지 카드」→ `/place/:slug?fromEvent&checkIn&checkOut` |

**Tier3 AI fixture (#1~#4만)** — 「행사 맞춤 여행 가이드」패널 · DB 없으면 **번들 fixture** 폴백(PROD·Preview 공통) · LIVE Edge 배포 후 DB 우선

> **PROD QA 힌트 (#22, 수정 보류)** — Tier3 요약·섹션이 Tier0~2(행사 소개·하이라이트·예약 팁)와 **겹쳐 보일 수 있음**. Wave1 fixture는 Tier0 기반 샘플이라 중복 가능. 차별화(액션형 조언·일정 시나리오·Tier0에 없는 fact만)는 **Tier3 iterate / Wave2+** 에서 검토 — 지금 코드·카피 수정 **하지 않음**.

| # | eventId | 권장 박 | 특이 확인 |
|---|---------|---------|-----------|
| 1 | `edinburgh-fringe-2026` | 4 | 장기(25일) · 프리셋 cap · AI fixture |
| 2 | `munich-oktoberfest-2026` | 3 | AI fixture · Theresienwiese 권역 |
| 3 | `vienna-staatsoper-season-2026` | 3 | season · AI fixture |
| 4 | `amsterdam-kings-day-2027` | 2 | 단기 · AI fixture |
| 5 | `tokyo-sakura-season-2027` | 4 | season · 개화 변동 copy |
| 6 | `kyoto-gion-matsuri-2027` | 3 | 요이야마 피크 |
| 7 | `bangkok-songkran-2027` | 3 | 3일 축제 |
| 8 | `bali-galungan-season-2026` | 4 | 종교 시즌 |
| 9 | `rio-carnival-2027` | 4 | ICN→GIG 항공 prefill |
| 10 | `new-york-thanksgiving-season-2026` | 3 | season 윈도 |
| 11 | `iceland-midnight-sun-2027` | 4 | 장시즌 |
| 12 | `sydney-vivid-2027` | 3 | 중기 페스티벌 |
| 13 | `prague-spring-festival-2027` | 3 | #18 신규 · 위젯 전건 |
| 14 | `marrakech-rose-festival-2027` | 2 | 단기 |
| 15 | `hanoi-tet-2027` | 4 | 연휴 윈도 · #18 마감 샘플 |

**에이전트 VERIFY**: `smoke:world-events` · `smoke:world-events-detail` · `smoke:event-travel-guide` · `audit:event-travel-guide` · `smoke:korea-festival-stay-url` · `smoke:korea-festival-personal` · `build` PASS · PROD URL 18건 HTTP 200 (#22)

**Wave2 착수 게이트** (G1~G4 · [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) F-0): 본 §6.1·§6.1.1 **사람 PROD OK** → 브랜치 `cursor/world-events-wave2` **합의** → overrides 착수

**금지**: `worldEvents.json` 직편집 · Wave2·EN·`/events` 통합(세션 #9 범위 밖) · PROD QA 전 Wave2 overrides.

---

## 7. P3-a 공식 피드 — 계획 포함 · 구현 시 논의

**포함 여부**: ✅ [`world-events-plan.md`](./world-events-plan.md) §5.1 · Q14  
**구현 시기**: 세션 **#9 이후** (선택 세션 #11) — **P2 MVP 수동 SSOT 완료 후**

| 지금 잠금 (방향) | P3 착수 세션에서 논의 |
|------------------|----------------------|
| ICS → RSS → open data 우선순위 | 축제별 URL·라이선스·robots |
| 1~2건 POC | `munich` · `edinburgh` · `sydney` 등 후보 확정 |
| `WorldEvent` + generate + audit 파이프 재사용 | 자동 merge vs 검수 큐 |
| 수동 overrides 병행 | cron 주기 · DB 캐시 키 |
| 스크래핑 비권장 | Ticketmaster(P3-b) 병행 여부 |

**P3-a 착수 전 Read**: 플랜 §5.1만 — 피드 URL 목록·Edge 코드는 그 세션에서 작성.

---

## 8. 기타 미정 (P0–P2)

- 감사 스크립트: 중복 id · 과거 행사 만료 정책
- 상용 API (Ticketmaster 등): P3-b — 비용·약관

## 8.1 i18n (Q10 — 세션 #38)

| 단계 | 시점 | 내용 |
|------|------|------|
| **i18n-0** | 현재 | `titleEn`·chip/glossary En·외부 링크 locale — 부분 EN |
| **i18n-1** | **#38 ✅** | `detailOverviewEn`·`highlightsEn` 스키마 · audit · 파일럿 3 En · Preview QA PASS |
| **i18n-2** | **#39~#41 ✅ PROD** | EN 허브·glossary·비파일럿 폴백 · `/en/world-events` SEO · PR #158 merge `d7216431` · PROD `?lang=en`·Trip `www.trip.com` |

**MVP 정의**: Wave1 **15건 D5-b KO 완성** 후 i18n-1. 상세: [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) **F-0.6**.
