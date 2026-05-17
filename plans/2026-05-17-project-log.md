# 2026-05-17 Project Log

이전 일지: [`plans/2026-05-14-project-log.md`](./2026-05-14-project-log.md)

## 여행지–도착 공항 SSOT·스크립트

- **`travelSpotAirports.json`**: **`spots`**(slug별 IATA, 244) + **`placeIds`**(DB `place_id`·별칭 키, sync 후 ~286). 한 파일에서 공식 여행지·사용자 추가 지명 공항을 함께 관리.
- **스크립트**: `generate-travel-spot-airports.mjs`, `audit-rental-airports.mjs`, `enrich-travel-spot-airports-ai.mjs`, **`sync-travel-spot-airports-from-toolkit.mjs`**. npm: `generate:airports` · `audit:airports` · `enrich:airports` · **`sync:airports-from-toolkit`**.
- **오버라이드** `travel-spot-airport-overrides.mjs` — slug 수동 검수(피피 섬 HKT 등).
- **place_id 별칭** `travel-spot-place-id-aliases.mjs` + `scripts/lib/travel-spot-place-resolve.mjs` — `에베레스트`→`everest-base-camp`, `우유니`→`uyuni-salt-flat`, 접미사 제거·`travelSpots-list` `searchKeys`.
- **운영 가이드**: [`plans/travel-spots-management.md`](./travel-spots-management.md).

## 런타임·동기화 (세션 후반)

- **`rentalAirportMatch`**: 배너 우선순위 — 오버라이드 → **live 툴킷** → `toolkit-sync` JSON → `runtime-infer`. slug 없으면 `placeIds`·`location.name` 조회.
- **sync 실행**(서비스 롤): 툴킷 308행 → slug 166 · placeId-only 29 · `placeIds` 286키. DB는 읽기만.
- **audit**: `inferNearestMismatch`(runtime-infer vs 최근접 허브) 검수 큐 추가.

## 플래너 배너·허브 (당일 초반)

- **보라카이**: KLO·MPH 다중 공항. **엘니도·팔라완**: ENI·PPS·MNL·`bannerNote`.
- **`RentalPickupBanner`**: 단일 공항 `bannerNote`·`whitespace-pre-line`.
- **`update-place-toolkit`**: `primary_arrival_airports_iata` 프롬프트 — `phdjnbfitvmrguqzverm` 배포(`--no-verify-jwt`).

## 플래너 툴킷 로드·도착 공항 보정 (당일 저녁)

### DB 툴킷이 화면에 안 뜨던 문제

- **원인**: `usePlannerData`가 `location.name` 단일 키만 조회; `essential_guide`가 `{}`여도 캐시 유지.
- **대응**: [`src/utils/toolkitPlaceIdResolve.js`](../src/utils/toolkitPlaceIdResolve.js) — `name`·`name_en`·`slug`·별칭으로 `.in('place_id', …)` 조회, **카테고리 실내용**·**목적지 좌표와 IATA 거리(900km)** 로 유효성 판별.
- **`usePlannerData`**: `location` 객체 전달, 불일치·빈 가이드는 재조회. **`PlannerTab`**: `getEssentialGuide`·툴킷 불일치 안내.

### 도착 공항 배너 오탐 (툴킷 여정은 맞고 배너만 틀림)

| 여행지 | 툴킷(맞음) | 배너(기존 오류) | 수정 |
|--------|------------|-----------------|------|
| 카르스텐츠 피라미드 | 티미카 **TIM** | 센타니 **DJJ** | 허브 TIM, 오버라이드 TIM+CGK/DPS, medium static보다 live 툴킷 우선 |
| 크레타 | **HER**·**CHQ** | HER만 | CHQ 허브, HER+CHQ multi, ATH 제거 |
| 산티아고 데 콤포스텔라 | **SCQ** | 경유 **MAD** | SCQ 허브, SCQ+MAD multi, 「허브 경유」 타임라인 제외 |

- **`rentalAirportMatch`**: 목적지에서 900km 초과 IATA는 planner 배너에서 제외(폴백). `confidence: medium` 오버라이드는 live `essential_guide`보다 후순위.
- **`update-place-toolkit`**: 요청에 `lat`/`lng`/`slug` 전달, 저장 전 지명·IATA 검증(시애틀↔파푸아 등).

## 후속

- 툴킷 신규·갱신 시 `npm run sync:airports-from-toolkit` 루틴화.
- `skippedNoIata`·`inferNearestMismatch` 샘플 검수; `berlin` slug 중복 정리.
- Edge `update-place-toolkit` 재배포(좌표 검증·프롬프트 강화 반영).
