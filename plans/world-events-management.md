# 세계 행사·축제 데이터 운영 가이드 (초안)

**상태**: 📋 Q&A 단계 — Phase 0 착수 전 스켈레톤  
**마스터 플랜**: [`world-events-plan.md`](./world-events-plan.md)  
**Q&A**: [`world-events-qa-index.md`](./world-events-qa-index.md)

---

## 1. 역할

| 데이터 | SSOT | 용도 |
|--------|------|------|
| **해외·큐레이션 행사** | `world-event-overrides.mjs` → `worldEvents.json` | PlaceCard · (향후) `/events` |
| **국내 축제** | TourAPI + 런타임 어댑터 | `/korea` (JSON 중복 저장 안 함) |
| **여행지 연결** | [`travelSpots.js`](../src/pages/Home/data/travelSpots.js) `slug` | 행사 `slug` FK |
| **국내 허브** | [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json) | 선택 `hubId` |

---

## 2. 행사 추가 체크리스트 (Phase 2+)

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

---

## 5. 국내 vs 해외 구분

| | 국내 | 해외 |
|--|------|------|
| 소스 | TourAPI `contentTypeId=15` | `world-event-overrides.mjs` |
| 저장 | Edge 캐시 + sessionStorage | 정적 JSON |
| UI | `/korea` | PlaceCard (1차) |
| 날짜 형식 | API `YYYYMMDD` → `tripWindow` 정규화 | JSON `YYYY-MM-DD` |

---

## 6. 검증 명령 (Phase 0 착수 후)

```bash
npm run generate:world-events
npm run audit:world-events
npm run build
```

---

## 7. 미정 (Q&A 후 보강)

- 파일럿 slug 목록 (Q3)
- API 피드 후보·Edge 캐시 키 (Q2=C 시)
- i18n: `titleEn` 필수 여부
- 감사 스크립트 규칙 (중복 id · 과거 행사 만료 정책)
