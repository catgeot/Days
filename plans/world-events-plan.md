# 세계 축제·행사 기반 여행 일정 — 마스터 플랜

**세션 표기**: `세계행사 일정 #1, 플랜 수립`  
**브랜치**: `cursor/world-events-efa3`  
**상태**: 📋 **플랜·Q&A 단계** (코드 미착수)  
**관련**: [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) · [`travel-spots-management.md`](./travel-spots-management.md) · [`world-events-qa-index.md`](./world-events-qa-index.md)

| Phase | 내용 | 상태 |
|-------|------|------|
| **P0** | 공통 Event 스키마 · generate/audit · `tripWindow` | ⏳ Q&A 후 착수 |
| **P1** | 국내 `/korea` ↔ 숙소·플래너 날짜 브리지 | 대기 |
| **P2** | 해외 큐레이션 파일럿 (vienna·iceland 등) | 대기 |
| **P3** | `/events` 허브 또는 외부 피드 POC | 선택 |

---

## 0. 목표 (한 줄)

**축제·공연·시즌 행사 일정에 맞춰 숙소·항공·플래너 날짜를 조율**할 수 있는 데이터·UX 토대를 만든다.

- 국내: 기존 TourAPI `/korea` **확장** (데이터 80% 있음)
- 해외: `travelSpots` slug에 **큐레이션 Event** 연결 (비엔나 오페라·아이슬란드 백야 등)
- 공통: `TripWindow`로 `YYYYMMDD` ↔ `YYYY-MM-DD` 브리지

---

## 1. 현재 갭

| 영역 | 있음 | 없음 |
|------|------|------|
| **국내** | [`/korea`](../src/pages/Korea/index.jsx) — TourAPI 축제·달력·지도·상세·MRT 링크 | 축제 날짜 → 숙소/항공 기본일, 플래너 딥링크 |
| **해외** | [`travelSpots.js`](../src/pages/Home/data/travelSpots.js) slug·공항·숙소 제휴 | 행사 일정 SSOT |
| **날짜** | 축제 `YYYYMMDD` / 숙소·항공 `YYYY-MM-DD` | 공통 모델·정규화·쿼리 전달 |

```mermaid
flowchart LR
  subgraph sources [DataSources]
    TourAPI[TourAPI_KR]
    CuratedSSOT[worldEventOverrides]
  end
  subgraph core [EventLayer]
    EventSSOT[worldEvents.json]
    DateBridge[tripWindow.js]
  end
  subgraph ui [Surfaces]
    KoreaHub["/korea"]
    PlaceCard["/place/:slug"]
    Planner[Planner]
  end
  TourAPI --> KoreaHub
  CuratedSSOT --> generate --> EventSSOT
  EventSSOT --> KoreaHub
  EventSSOT --> PlaceCard
  DateBridge --> Planner
  KoreaHub --> DateBridge
  PlaceCard --> DateBridge
```

---

## 2. Phase 0 — 공통 Event 레이어 (토대)

### 2.1 `WorldEvent` 스키마 (초안 · Q&A로 확정)

| 필드 | 설명 | 확정 |
|------|------|------|
| `id` | 안정 ID (`vienna-staatsoper-2026-winter`) | 초안 |
| `slug` | `travelSpots` slug 또는 국내 hub | 초안 |
| `hubId` | 국내 `cityAttractionHubs` id (선택) | 초안 |
| `type` | `festival` \| `opera` \| `concert` \| `season` \| `heritage` | **Q1** |
| `title` / `titleEn` | 표시명 | 초안 |
| `startDate` / `endDate` | `YYYY-MM-DD` | 초안 |
| `recurrence` | `annual` \| `fixed` \| `tbd` + `recurrenceNote` | **Q2** |
| `venue` | 장소명·좌표(선택) | 초안 |
| `source` | `tourapi` \| `curated` \| `official_url` | 초안 |
| `sourceUrl` | 공식 일정·티켓 | 초안 |
| `bookingHints` | 숙소 키워드·항공 시즌 메모 | 초안 |
| `priority` | 노출 순위 | 초안 |

### 2.2 SSOT 파일 (공항·페리와 동일 패턴)

```
scripts/data/world-event-overrides.mjs   # 수동 입력
scripts/generate-world-events.mjs
src/pages/Home/data/worldEvents.json     # 직접 편집 금지
scripts/audit-world-events.mjs
src/shared/tripWindow.js                 # 날짜 브리지
```

- `package.json`: `generate:world-events`, `audit:world-events`
- 국내 TourAPI: **런타임 어댑터**로 `WorldEvent` 변환 (JSON 중복 최소)

### 2.3 `TripWindow` (날짜 브리지)

```js
tripWindowFromEvent({ startDate, endDate }, { bufferDays: 1, minNights: 2 })
// → { checkIn, checkOut, source: 'event', eventId }
```

소비처: `FestivalDetailSheet` · PlaceCard 플래너 · MRT/Trip.com 위젯 쿼리

---

## 3. Phase 1 — 국내 MVP

| 작업 | 파일 |
|------|------|
| 상세시트 CTA — 축제 날짜로 숙소·투어 | [`FestivalDetailSheet.jsx`](../src/pages/Korea/FestivalDetailSheet.jsx) |
| 플래너 딥링크 | `/place/{hubSlug}/planner?checkIn=&checkOut=&fromEvent=` |
| 달력 → 기간 일정 | [`FestivalCalendar.jsx`](../src/pages/Korea/FestivalCalendar.jsx) |
| 즐겨찾기 다건 합집합 날짜 | [`festivalPersonalStore.js`](../src/pages/Korea/festivalPersonalStore.js) |

검증: `smoke:korea-festival-*` + `smoke:trip-window-from-festival` (신규)

---

## 4. Phase 2 — 해외 큐레이션 파일럿

TourAPI 해외 미지원 → **핵심 행사만 수동 SSOT**.

| slug | 행사 예시 | 비고 |
|------|-----------|------|
| `vienna` | 빈 국립오페라 시즌 | `type: season` · 공식 URL 링크아웃 |
| `iceland` | 미드나잇 선·Secret Solstice | `recurrence: annual` |
| `edinburgh` | 프린지 | **Q3** 후보 |
| `rio-de-janeiro` | 카니발 | **Q3** 후보 |
| `munich` | 옥토버페스트 | **Q3** 후보 |

UI: PlaceCard 접이식 「이 도시의 행사」+ TripWindow CTA (기존 레이아웃 유지)

---

## 5. Phase 3 — 선택

- `/events` 글로벌 허브 (**Q4**)
- 공식 ICS/RSS · Ticketmaster 등 Edge 피드 POC
- [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) Phase D·E(축제로드·시트 예약) 연동

---

## 6. 기술·운영 가드

| 항목 | 방침 |
|------|------|
| 브랜치 | 본 주제 = `cursor/world-events-efa3` 고정 · 세션마다 새 브랜치 금지 |
| UI | §4.1 — 기존 비주얼 유지, CTA·섹션만 |
| 검증 | `audit:world-events` + `build` + domain smoke |
| 릴리스 노트 | 공개 시 1회만 제안 |
| 운영 | [`world-events-management.md`](./world-events-management.md) |

---

## 7. 열린 질문 (Q&A로 확정)

**답변은 [`world-events-qa-index.md`](./world-events-qa-index.md)에 누적.** 플랜 본문은 합의 후 갱신.

| ID | 질문 | 선택지 | 상태 |
|----|------|--------|------|
| **Q1** | 1차 범위 우선순위? | A 국내 브리지 / B 해외 큐레이션 / C 공통 모델 후 병행(권장) | ⏳ |
| **Q2** | 해외 데이터 전략? | A 수동 SSOT / B API 우선 / C 하이브리드(권장) | ⏳ |
| **Q3** | 파일럿 slug 목록? | vienna·iceland 필수 + edinburgh·rio·munich 등 | ⏳ |
| **Q4** | `/events` 전용 허브 시기? | P2 포함 / PlaceCard만 먼저(권장) / P3 | ⏳ |
| **Q5** | `TripWindow` 기본 버퍼? | 전일 0·1·2일 · 최소 숙박 1·2·3박 | ⏳ |
| **Q6** | 오페라·시즌 행사 표현? | 시즌 단위만 / 대표 공연 N건 / 링크만 | ⏳ |
| **Q7** | 국내 TourAPI와 해외 JSON 통합 UI? | `/korea`에 해외 탭 / PlaceCard만 / `/events`에서 통합 | ⏳ |

### Q&A 진행 방법

1. 채팅에서 **Q번호 + 답** (예: `Q1: C`, `Q3: vienna, iceland, munich`)
2. 에이전트가 `world-events-qa-index.md` 갱신 + 본 플랜 §7·해당 Phase 반영
3. **모든 Q1–Q4 확정** 후 Phase 0 코드 착수
4. 세션 종료 시 일지 2~5줄 + `feature-handoff-index` 갱신

---

## 8. 성공 기준

| Phase | 완료 조건 |
|-------|-----------|
| **P0** | generate/audit PASS · `tripWindow` 단위 검증 |
| **P1** | `/korea` 축제 상세 → MRT URL에 맞춤 날짜 · 플래너 딥링크 |
| **P2** | 5+ 해외 행사 PlaceCard 노출 + TripWindow CTA |
| **P3** | (선택) `/events` 또는 피드 1종 POC |

---

## 9. 핸드오프

**인덱스**: [`feature-handoff-index.md`](./feature-handoff-index.md)

**다음 제시어** (Q&A 이어하기):

```
세계행사 일정 #1, Q&A — 범위·파일럿 확정
@plans/feature-handoff-index.md
@plans/world-events-plan.md
@plans/world-events-qa-index.md
브랜치 cursor/world-events-efa3 · PR 초안 · 코드 미착수
답변 예: Q1 C · Q2 C · Q3 vienna,iceland,munich · Q4 PlaceCard만
금지: UI 리디자인 · spots JSON 직편집 · Q&A 없이 Phase 0 착수
```

**읽을 것 (이어하기)**:

1. 본 파일 §7 + [`world-events-qa-index.md`](./world-events-qa-index.md)
2. 미확정 Q만 질의 — 전체 코드베이스 탐색 금지
3. Q1–Q4 확정 후 Phase 0 착수 합의

**VERIFY (코드 착수 후)**: `audit:world-events` · `build`
