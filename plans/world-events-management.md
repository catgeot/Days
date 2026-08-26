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
| 8 | PlaceCard에서 해당 slug QA | ✅ |

**금지**: `worldEvents.json` 직접 편집 · 존재하지 않는 slug

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

Preview: `https://www.gateo.kr/qa/world-events` → git Preview `/world-events`

| 경로 | 확인 |
|------|------|
| `/korea` → 축제 상세 1건 | 숙소·플래너·항공 링크에 행사 맞춤 `checkIn`/`checkOut` |
| `/place/vienna` | 「이 도시의 행사」접이식 · 플래너·숙소·공식 일정 CTA |
| `/world-events` | 지역 칩 5개 전환 · 카드 「여행지 카드」→ `/place/:slug?fromEvent&checkIn&checkOut` · 플래너·숙소 CTA |
| `/world-events` **에든버러 프린지** | 유럽 칩 → 「여행지 카드」 URL에 `fromEvent=edinburgh-fringe-2026` · `checkIn`/`checkOut`(행사 전후 1일 버퍼, 진행 중이면 checkIn=오늘) · 플래너 CTA 동일 날짜 |
| **홈** 좌상단 바로가기 | 「한국의 축제」 아래 **「세계의 행사」** → `/world-events` |

**금지**: `worldEvents.json` 직편집 · Wave2·EN·`/events` 통합(세션 #9 범위 밖).

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

- i18n: `titleEn` 필수 여부 (Q10 — KO MVP 후)
- 감사 스크립트: 중복 id · 과거 행사 만료 정책
- 상용 API (Ticketmaster 등): P3-b — 비용·약관
