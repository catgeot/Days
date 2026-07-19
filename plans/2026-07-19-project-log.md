# 2026-07-19 프로젝트 일지

**직전**: [`2026-07-12-project-log.md`](./2026-07-12-project-log.md)

---

## E2E Health 워크플로 실패 원인·수정

**상태**: ✅ 로컬 검증 통과 · 커밋 대기

- **증상**: E2E Health #32~#41 (2026-07-09~18) 매일 실패 · Smoke는 정상
- **원인**: `25569df`에서 위키 탭 UI를 「여행 위키」→「여행 스케치」로 변경했으나 `e2e/place.spec.js`가 옛 라벨을 계속 조회
- **수정**: `e2e/place.spec.js` 기대값을 「여행 스케치」로 갱신
- **검증**: `SMOKE_SITE_URL=https://gateo.kr npx playwright test e2e/place.spec.js` → 1 passed
- **재발 방지 문서**: `site-health-monitoring-plan.md` §2-B-1 · operator next-steps · `.ai-context` 헬스 절

---

## 장소카드 국가명 진입 경로 불일치

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시

- **증상**: 검색 진입 시 국가명 정상 → 동일 마커 재클릭 시 `Global`/`Explore` · 갤러리·플래너 불일치
- **원인**: Mapbox GeoJSON 히트에 `country` 없음 + `uiPlace` 좌표 매칭 시 placeholder 국가 미보강 + resolve 시 `name`이 `slug`보다 우선
- **수정**: `hydrateMarkerFromSpotCatalog` · `mergeCanonicalTravelSpot` placeholder 보강 · slug-first resolve · 탐색 `navigateToPlace` · 재진입 country coalesce
- **후속**: 구세션 잔존 Global — `healPlaceholderCountry` · place cache v2 + v1 purge · temp 핀 국가 자가치유
- **검증**: node 스크립트 ALL PASS · 사용자: 신규 검색 후 마커 국가명 일치 확인

## 살타(salta) 플래너 — 지리 검증 geoMismatch fix

**상태**: ✅ 사용자 QA 통과 · 커밋·푸시 `1263284` · Edge 배포됨

- **증상**: place_id `salta` 일치하나 `essentialGuideMatchesLocation` 실패 → 플래너 빈 화면 · Edge 강제 갱신 후에도 `hasGuide: false`
- **원인**: DB primary `['EZE','AEP','SLA']` — EZE/AEP(~1290km)만 허브 검증·SLA는 `RENTAL_AIRPORT_HUBS` 미등록이라 `primaryKnown`에서 탈락 → `.some()` 전부 실패
- **수정**:
  - `toolkitPlaceIdResolve` — airportsIndex 좌표 폴백 · 지리 검증 가능 IATA에 허브 외 포함(로컬+원거리 혼합 시 로컬로 통과)
  - `rentalAirportHubs` SLA 추가
  - DB `toolkit:patch-guide-iata --apply` salta→`['SLA']` (+ tukao·ascension·luxor 잔여 패치)
  - Edge `update-place-toolkit` — EZE/AEP/SLA/MDZ/BRC 허브 · 「전부 원거리만 거부」(혼합 허용)
- **검증**: node — mixed primary PASS · EZE-only FAIL · `fetchToolkitRow(salta)` `hasUsable: true` · primary `['SLA']`
- **재발 검토**: Salta형 클라 공백은 완화 · 잔여 **중간** — Edge `HUB_COORDS`≪클라 index · AI 원거리-only · 배너 hub-only · Mapbox uiPlace 머지. 후속: Edge 좌표 공유 · banner index 필터 · uiPlace place_id 격리

---

## Mapbox·신규 지명 플래너/공항 재발 방지

**상태**: ✅ 코드·Edge 배포 · 커밋 (푸시·프론트 배포는 요청 시)

- **1 Edge 좌표 SSOT**: `generate:toolkit-airport-coords` → `toolkitAirportCoords.json`(hub+index ~4172) · `update-place-toolkit` 수동 `HUB_COORDS` 제거 · 배포 `phdjnbfitvmrguqzverm`
- **2 배너 index**: `filterAirportsNearDestination`·planner primary에 airportsIndex · hub 미등록 로컬 IATA 배너 가능
- **3 uiPlace 격리**: slug/name 풀머지는 50km 이내만 · ephemeral `search-`/`loc-`/`city-` place_id 후보 우선
- **스모크**: Edge `[EZE,SLA]` 통과 · `[EZE]` 거부 · 배너 SLA · index-only UTK · far uiPlace soft-merge · near 흡수
- **부수 UX**: 빈 플래너에서 「먼 slug 흡수 → 남의 공항」은 막힘 · 허브 반경 밖·index 폴백 없음이면 배너 공백 가능(의도적 격리 + 미보완)

---

## 다음 세션 — 항공경로↔플래너 공항 데이터 정합 검토

**목표**: 계획서 **새로** 수립. 구현 전에 다각도 검토만(또는 계획 확정까지).

**관찰**: 공항 IATA가 플래너 배너·Trip·시네마 arc 등에서 **서로 다른 resolver/데이터**를 볼 수 있음 → 같은 핀에서 표시·링크 불일치 위험.

### 다음 세션 제시어 (복붙)

```
@.ai-context.md @plans/2026-07-19-project-log.md

공항 데이터 무결성 — 항공경로(시네마) vs 플래너 배너·Trip 도착 IATA가 서로 다른 SSOT를 보는지 다각도 검토 후, 새 계획서 수립.

## 배경
- 직전: Mapbox·플래너 재발 방지(Edge toolkitAirportCoords · 배너 index · uiPlace 격리) 커밋·Edge 배포.
- 사용자: 플래너·항공경로가 공항을 쓰는데 데이터가 갈라져 보임 → 분리 유지 vs 동일 SSOT 여부 검토 후 계획.

## 이 세션에서 할 일
1. 소비처 매핑(읽기만): 시네마 dest · resolveCinemaDestIata · resolvePlannerFlightArrivalIata · resolveRentalPickupBannerInfo · overrides/hubs/airportsIndex/toolkit primary.
2. 같은 location 샘플 3~5곳(카탈로그·uiPlace·살타형)에서 IATA가 갈라지는지 표로 정리.
3. 옵션 비교: (A) 역할별 분리 유지+명시적 우선순위 문서화 (B) 표시·검색용 dest IATA 단일 resolver (C) 하이브리드.
4. 새 plans/*-plan.md 초안(범위·비범위·완료 기준·위험) — 사용자와 합의 전 코드 대량 변경 금지.

## 금지
- travelSpotAirports.json spots 직접 수정 · RENTAL_MULTI만 단독 수정
- Heuristic 항공 SSOT Phase 본구현과 범위 혼동(별도 계획)
- 사용자 합의 없는 「완료」단정·대규모 리팩터

## 참고 파일(필요 시 grep)
- src/utils/rentalAirportMatch.js
- src/utils/airportsIndexLookup.js
- src/utils/rentalAirportHubs.js
- src/pages/Home/lib/ (flight cinema dest)
- scripts/data/travel-spot-airport-overrides.mjs
```
