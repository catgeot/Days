# 2026-05-18 Project Log

이전 일지: [`plans/2026-05-17-project-log.md`](./2026-05-17-project-log.md)

## 플래너 Trip.com 항공권 제휴 (완료)

### 배경

- 항공권 CTA가 Travelpayouts 화이트라벨(`flights.gateo.kr`) 기반이라 플래너 탭 이탈·검색 UX가 다소 딱딱함.
- 트립닷컴 제휴 마이그레이션 중 — 항공부터 Trip.com으로 전환.

### 구현

- **`affiliate.js`**: `buildTripcomPlannerFlightUrl`, `getPlannerFlightArrivalIata`, `TRIPCOM_FLIGHT_AD`(S17104971). 출발 `dAirportCode=ICN`, 도착 `aAirportCode`는 `resolveRentalPickupBannerInfo` SSOT.
- **`TripcomFlightBannerWidget`**: 제휴 ad iframe 900×200, 카드 폭 스케일, `data-tripcom-arrival-iata` 디버그 속성.
- **`PlannerTab`**: 스마트 툴킷 상단 **트립링크 패키지 배너** → Trip.com 항공 배너(모바일 포함). 뱃지 **「제휴링크」** 우측 상단.
- **`WhiteLabelWidget`**: Trip.com 항공 홈 새 탭, 여행지별 URL. 미사용 `hotel` 분기·iframe 모달·`HotelWidget.jsx` 제거.
- **`ToolkitCard` / `PreTravelChecklist`**: 항공 버튼만 유지(배너는 툴킷 상단 단일 노출).

### QA (당일)

- 로컬·프로덕션(gateo.kr): 배너·Trip.com 링크 **도착지(IATA) 자동 입력** 정상.
- Vercel: `0d92bb5` 배포가 Initializing/Queued에서 지연됐으나 **Redeploy 후 Production 반영** 완료.

### Phase 0 세션 1 — 별칭·공항 JSON (완료)

- **0a** `travel-spot-place-id-aliases.mjs`: `Brunei`/`브루나이`/`마나도`→`borneo` 제거; `Siem Reap`/`시엠립`/`Angkor Wat`/`앙코르 와트`→`angkor-wat` 추가.
- **0b** `travel-spot-airport-overrides.mjs`: `angkor-wat`·`angkor-thom` **SAI** `high` (구 REP 폐쇄).
- **0c** `travelSpotAirports.json`: `placeIds.보르네오` 다중공항(BKI·KCH·KUL); 시엠립·앙코르 계열 `placeIds` + `linkedSlug: angkor-wat`. `rentalAirportHubs` SAI 허브·REP 폐쇄 표기. `npm run generate:airports` · `audit:airports` (`none: 0`).
- 로컬 QA: 앙코르 플래너 툴킷·배너·Trip.com **SAI** 일치 확인.

### Phase 0 세션 2 — toolkit 감사·reconcile dry-run (완료)

- `npm run toolkit:audit-place-id` · `toolkit:reconcile-place-id --dry-run` 구현 (`scripts/audit-place-toolkit-place-id.mjs`, `reconcile-place-toolkit-place-id.mjs`, `place-toolkit-reconcile-rules.mjs`).
- P0 dry-run(313행): **wrongAlias 0** · **angkor-wat** `앙코르 와트`/`앙코르와트` 중복 → apply 시 `앙코르와트` 삭제 예정 · **보르네오** 단일 행 OK · **브루나이** unmapped·`flag_only`(보르네오 병합 안 함). 리포트 `scripts/outputs/place-toolkit-place-id-*.json`.

### Phase 0 세션 3 — angkor DB apply·QA (완료)

- `toolkit:reconcile-place-id --apply --only=angkor-wat`: `앙코르와트` → canonical `앙코르 와트` merge+delete 1건 (313→312행).
- `toolkit:audit-place-id --p0`: **P0 duplicateSlug 0** · wrongAlias 0 · P0 unmapped `브루나이` 1건만.
- QA(gateo.kr): `/place/angkor-wat/planner`·「시엠립」검색→Siem Reap — 플래너·Trip.com 배너 **SAI**·ICN→SAI 문구 일치.
- **브루나이**: `place_toolkit` 단일 행 유지, reconcile **병합 안 함**(`flag_only`). 공식 `travelSpots` slug 없음 — Phase 4에서 별도 여행지 추가 여부·행 삭제 여부 수동 결정.

### Phase 1 세션 1 — 런타임 정규화 (완료)

- **1a** `src/utils/travelSpotResolve.js` — `mergeCanonicalTravelSpot`·`resolveTravelSpotFromPlaceId`. `useHomeHandlers`·`Home/index.jsx`에서 `enrichLocationWithRentalAirport` 전 적용.
- **1b** `TRAVEL_SPOT_TOOLKIT_SYNONYMS` 화이트리스트 — `buildToolkitPlaceIdCandidates` 역방향 별칭 전체 주입 제거.
- **1c** `usePlannerData` `placeKey` → `getPlaceStableKey`(canonical_slug 우선).
- QA(gateo.kr): 앙코르 와트·보르네오·브루나이 — 지구본·검색·플래너·IATA 연결 이상 없음 확인.

### 바간 도착 공항 보정 (완료)

- **원인**: `bagan`·MDL 허브 별칭에 바간 포함, 오버라이드·JSON이 **MDL(만달레이)** 로 고정.
- **수정**: **NYU(냥우)** 허브 추가, `bagan` curated → NYU. 툴킷 여정(RGN→NYU)과 배너·Trip.com 도착 코드 일치.

### 세션 종료 (2026-05-18)

- Phase 0(P0 데이터·angkor DB apply) + Phase 1 세션 1(런타임 정규화) 코드·문서 커밋.

### 다음 (내일 제안)

1. **배포** — `main` push → Vercel Production 반영 후 동일 3경로 스모크 QA.
2. **Phase 2 세션** — `npm run toolkit:audit-place-id` 리포트 검토 → `duplicateSlug`·`unmapped` 우선순위 정리 → `reconcile --dry-run` 후 `--apply` 배치(보르네오 등, 브루나이는 `flag_only` 유지).
3. **(선택)** `TRAVEL_SPOT_TOOLKIT_SYNONYMS` — 감사 리포트 상위 slug만 화이트리스트 확장.

### 문서

- [`destination-airport-identity-plan.md`](./destination-airport-identity-plan.md) — 문제 요약, Phase 0~4, DB 스크립트 설계, 세션 분할.
