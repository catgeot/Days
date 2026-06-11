# 2026-06-11 프로젝트 일지

**이전**: [`2026-06-09-project-log.md`](./2026-06-09-project-log.md)

## 도착 공항 매칭 (플래너 배너·Trip.com)

- **미야코지마**: `SHI`·`MMY` 다중공항, 직항 기본 SHI (`overrides` + `generate:airports`)
- **랄리벨라**: `preferredLinkIata` ADD→**LLI** (국제선 경유·최종 분리)
- **아이투타키·티라나 등 툴킷-only**: 허브 **AIT**·**TIA** 추가; 파서 오탐 보정(`티라(?!나)`, `(?<![로])통가`)
- **추가 검수(동일 일)**: `costa-rica` SJO·LIR · `la-spezia` FCO·MXP·FLR·PSA · `cape-verde` SID·RAI · `콘다오` SGN→**VCS** (허브 LIR·PSA·RAI·VCS)
- **`generate:airports`**: `TRAVEL_SPOT_PLACE_ID_OVERRIDES` → JSON `placeIds` 병합 · `linkedSlug` curated 폴백
- `audit:airports` **none: 0** · 가이드 [`travel-spots-management.md`](./travel-spots-management.md) §3·§5·§6 갱신
- **상하이**: `PVG`·`SHA` 다중공항 — 허브 SHA 추가, overrides·`RENTAL_MULTI`·`generate:airports` (배너 연동/후보·툴킷 여정 정합)
- **다음 세션**: 다른 다중공항·항공권 배너 세부 조정 이어감 (릴리스 노트는 합의 후)

---

## 항공권·배너 세션 — 에이전트 핸드오프

**첫 세션**(전반 파악): `.ai-context` 6절 공항 + 본 일지 + [`travel-spots-management.md`](./travel-spots-management.md) §3·§5·§6 읽기 OK.

**이어하기 세션**(토큰 절약): 아래 **「읽을 것 3 + 금지 3」** 과 **「다음 세션」** 만 우선. `travel-spots-management.md` **전체 Read 금지** — 다중공항·경유 패턴이 불명확할 때만 §5 표 grep.

### 읽을 것 3

1. [`.ai-context.md`](../.ai-context.md) — 3절 금지·**6절 공항 표**(npm·파일 역할)
2. **본 일지** — 아래 「다음 세션」·완료 slug 목록
3. 대상 slug만 — [`travel-spot-airport-overrides.mjs`](../scripts/data/travel-spot-airport-overrides.mjs) 해당 항목 grep (전체 파일 Read 비권장)

### 금지 3 (회귀 방지)

1. `travelSpotAirports.json` **spots 직접 편집** — `overrides.mjs` → `generate:airports` 만
2. `rentalAirportMatch.js` **로직·`TITLE_ARRIVAL_AIRPORT_PHRASES` 변경** — 사용자 승인 없이 금지
3. `travelSpots.js` / `travelSpotAirports.json` **전체 Read** — `travelSpots-list.json`·slug grep

### 절차 (매 수정 후)

`rentalAirportHubs.js`(신규 IATA만) → `overrides.mjs` → `npm run generate:airports` → `npm run audit:airports` (`none: 0`)

**2차 항공·분할 예약** 추가 시: [`travel-spots-management.md`](./travel-spots-management.md) **§3.1** — `flight-booking-overrides.mjs` → `npm run generate:flights` (공항 overrides와 **동시** 갱신)

**다중공항**: `searchHintIatas` + `bannerNote` · 경유지는 `bannerNote`만 · `preferredLinkIata` = 렌터카·픽업 최종 · **`tripFlightArrivalIata`** = Trip `aAirportCode`(국제선 관문, 검색 가능 구간)

### 완료 (2026-06-11 · flight tier + UI)

| slug | tier | Trip | 2차·공식 |
|------|------|------|----------|
| yap·chuuk·pohnpei·kosrae·marshall-islands | `segmented` | HNL | United HNL→* (kosrae: **KSA**) |
| socotra | `agency-only` | AUH | SCT 에이전시 안내 |

- **UI**: `FlightOfficialBookingWidget` · Trip tier 디스클레이머 · 배너 「항공권 팁 확인」→ `#planner-prep-flight`
- **marshall-islands**: `citiesData` slug hydration + `resolveFlightBookingSlug` alias

### 다음 세션 (2026-06-11 종료 기준)

| 상태 | 작업 | 메모 |
|------|------|------|
| ⏳ **우선** | `beijing`, `tokyo` 등 | 툴킷 vs 배너·Trip `aAirportCode` 검수 |
| ⏳ | `seoul` | multi · GMP 후보 |
| ⏳ | 2차 항공 추가 slug | §3.1 — airport + flight overrides 동시 · United URL QA |
| ✅ | Micronesia·socotra·flight tier 1단계 | United QA · generate:flights |

**QA**: `/place/{slug}` 렌터카 배너 = 최종 IATA · Trip 캡션 = `tripFlightArrivalIata` · 툴킷 STEP 최종 공항 일치

### 공식 예약 링크 tier (2026-06-11 ✅ 1단계)

**배경**: Trip/스카이스캐너 미지원 구간 → `flight-booking-overrides` tier + United 등 공식 URL.

**구현**: `flight-booking-overrides.mjs` → `generate:flights` → `flightBookingMatch.js` · `FlightOfficialBookingWidget` · `FlightSearchCta` 디스클레이머 · 가이드 [`travel-spots-management.md`](./travel-spots-management.md) **§3.1**

- United HNL→{YAP|TKK|PNI|KSA|MAJ} URL QA · `buildUnitedFlightSearchUrl()` 동적 날짜
- Micronesia 5 + socotra `agency-only` · yap~kosrae `tripFlightArrivalIata: HNL` · audit airports none:0

---

## 이어하기 제시어 (복사용)

첫 세션에서 전반 확인이 끝난 뒤, **아래 중 하나를 첫 줄에 붙여** 새 대화를 시작하면 상황 파악 토큰을 줄일 수 있습니다.

### A. 슬러그 지정 이어가기 (권장)

```text
@plans/2026-06-11-project-log.md 항공권-이어하기

beijing만: 툴킷 여정 vs 배너·Trip aAirportCode 불일치 수정.
절차: overrides → generate:airports → audit(none:0).
travel-spots-management 전체 읽기 금지 — 일지 핸드오프만.
```

### B. 일지 「다음 세션」표만 따라가기

```text
@plans/2026-06-11-project-log.md 항공권-이어하기

일지 「다음 세션」표의 ⏳ 항목 순서대로 처리. 완료 slug는 건너뜀.
```

### C. 증상·스크린샷으로 시작

```text
@plans/2026-06-11-project-log.md 항공권-이어하기

/place/shanghai 플래너: (증상 한 줄). 일지 핸드오프·금지 3 준수.
```

### D. 첫 세션·전반 파악 (토큰 많이 씀 — 주 1회)

```text
관련문서 확인하고, 항공권·배너 SSOT 전반 점검 시작.
@.ai-context.md @plans/2026-06-11-project-log.md @plans/travel-spots-management.md
```

### F. 2차 항공·Trip 검수 이어가기 (다음 세션 권장)

```text
@plans/2026-06-11-project-log.md 항공권-이어하기

일지 「다음 세션」표 ⏳ 순: beijing·tokyo·seoul 툴킷 vs 배너·Trip aAirportCode.
2차 항공 추가·수정 시 travel-spots-management §3.1 — airport overrides + flight-booking-overrides 동시 · generate:airports + generate:flights.
금지 3 준수 · rentalAirportMatch TITLE_ARRIVAL 변경은 승인 후.
```

### E. OTA tier 1단계 (완료 — 참고용)

```text
@plans/2026-06-11-project-log.md 항공권-이어하기

Micronesia·socotra flight tier 1단계 완료 확인. beijing 등 ⏳ 이어가기.
```

**키워드 `항공권-이어하기`**: Rule·에이전트는 일지 **「항공권·배너 세션 — 에이전트 핸드오프」** 절만 우선하고, slug·overrides grep 위주로 진행.
