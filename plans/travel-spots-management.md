# 여행지 데이터·도착 공항 운영 가이드

gateo.kr 홈 여행지(`TRAVEL_SPOTS`)를 **추가·수정**할 때와, 플래너 **렌터카·픽업·항공권 기준** 배너(도착 공항)를 맞출 때 참고합니다.

**짧은 맥락**: [`.ai-context.md`](../.ai-context.md) 3절·6절  
**정체성·공항 이슈(다중 place_id)**: [`destination-airport-identity-plan.md`](./destination-airport-identity-plan.md)  
**클룩 렌터카 배너 검색어**(여행지명 vs 공항명·예외 JSON): [`klook-rental-search-data.md`](./klook-rental-search-data.md)  
**일지**: `plans/YYYY-MM-DD-project-log.md`

---

## 1. 데이터 파일 역할

| 파일 | 용도 |
|------|------|
| [`src/pages/Home/data/travelSpots.js`](../src/pages/Home/data/travelSpots.js) | **SSOT** — slug, 좌표, tier, SEO·글로브·사이트맵 |
| [`travelSpots-list.json`](../src/pages/Home/data/travelSpots-list.json) | 경량 목록(AI·검색용). **6k줄 `travelSpots.js` 전체 로드 금지** |
| [`travelSpotAirports.json`](../src/pages/Home/data/travelSpotAirports.json) | **`spots`**: 공식 slug → IATA · **`placeIds`**: DB `place_id`/사용자 지명 → IATA. `sync:airports-from-toolkit`으로 툴킷 반영, `generate`는 `spots`만 추론·`placeIds`는 유지 |
| [`scripts/data/travel-spot-airport-overrides.mjs`](../scripts/data/travel-spot-airport-overrides.mjs) | 수동·검수 매핑(오지·다중 공항·오탐 보정) |
| [`src/utils/rentalAirportHubs.js`](../src/utils/rentalAirportHubs.js) | IATA별 **한국어 공식명**·좌표·`radiusKm`·aliases |
| [`src/utils/rentalAirportMatch.js`](../src/utils/rentalAirportMatch.js) | 런타임: JSON **최우선** → 툴킷 → 다중공항 규칙 → 좌표. 렌터카 **배너 검색어**만 `resolveKlookRentalBannerSearchLabel`(여행지명 우선) |
| [`src/utils/affiliate.js`](../src/utils/affiliate.js) | `getKlookRentalUrlByLocation`(배너), `getKlookRentalHomeUrl`(링크 버튼) |

`travelSpots-list.json` 재생성:

```bash
node scripts/extract-travel-spots-list.cjs
```

---

## 2. 여행지 추가 체크리스트 (대량 추가 시)

1. **`travelSpots.js`에 1건 추가** — `slug`는 **유일**해야 함(중복 시 JSON·사이트맵이 덮어씀). 현재 알려진 중복: `berlin`(id 173·187) — 정리 권장.
2. 필수 필드: `slug`, `name`, `name_en`, `lat`, `lng`, `country`, `tier`, `continent`, `categories` 등 기존 행과 동일 패턴.
3. `node scripts/extract-travel-spots-list.cjs`
4. **도착 공항** (아래 3절). DB에 툴킷이 있으면 `npm run sync:airports-from-toolkit`으로 JSON 일괄 반영(DB는 읽기만).
5. 로컬에서 `/place/{slug}`·플래너 탭·배너 공항명 확인
6. `npm run build` — `vite.config.js`가 `TRAVEL_SPOTS`로 사이트맵 URL 생성

---

## 3. 도착 공항 매핑

### 우선순위 (런타임)

1. `travelSpotAirports.json` 중 **수동 오버라이드** (`curated-override`, `confidence: high`, `multi-rule`)
2. 플래너 `essential_guide` / `primary_arrival_airports_iata` (실시간 DB)
3. JSON의 **toolkit-sync** (`sync:airports-from-toolkit` 스냅샷)
4. JSON의 **좌표·런타임 추론** (`runtime-infer`, `geo-nearest`)
5. `RENTAL_MULTI_AIRPORT_DESTINATIONS` · 좌표 최근접

**검색·배너·교차 링크 분리 (2026-05-21)**:

| 표면 | 규칙 |
|------|------|
| 배너 연동 공항 | `preferredLinkIata` / `linkHub` 1개 |
| 배너 「다른 도착 후보」 | **`searchHintIatas` 2개 이상**일 때만 (`resolveBannerPeerAlternateAirports`) |
| 항공·렌터카 검색 힌트 | `resolveSearchHintIataCodes` — 기본 linkHub; 동급 관문은 `searchHintIatas` |
| 환승·국제선 관문 (EZE·LIM·KUL) | **`bannerNote`만** — 후보·검색·교차 링크 라벨 제외 |
| 권역 `RelatedTravelSpots` | `formatSearchHintIataLabel` (예: borneo `BKI·KCH`) |

**툴킷이 있는데 배너가 여정과 다르면** → JSON의 `runtime-infer`가 막고 있는 경우가 많습니다. 먼저 플래너를 열어 툴킷이 로드되는지 확인하고, 계속 어긋나면 `travel-spot-airport-overrides.mjs`에 검수 매핑을 추가한 뒤 `generate:airports`를 실행하세요.

`npm run audit:airports` 리포트의 **`inferNearestMismatch`**(추론 공항 ≠ 최근접 허브) 목록으로 수동 검수 큐를 줄일 수 있습니다.

**DB `place_id` ≠ travelSpots 공식명**일 때는 [`scripts/data/travel-spot-place-id-aliases.mjs`](../scripts/data/travel-spot-place-id-aliases.mjs)에 `place_id → slug` 별칭을 추가합니다. `travelSpots-list.json`의 `searchKeys`·접미사 제거(제도·국립공원 등)도 자동 시도합니다. `citiesData`만 있고 `travelSpots`에 없는 지명은 별칭으로 해결되지 않습니다.

### 작업 순서

1. 새 IATA가 필요하면 **`rentalAirportHubs.js`**에 `officialKo`(예약·항공권에서 쓰는 표기) 추가.
2. 자동 추론이 틀리면 **`travel-spot-airport-overrides.mjs`**에 `primaryIatas`, `kind: 'multi'`, `bannerNote` 등.
3. 재생성·감사:

```powershell
cd c:\dev\days
npm run sync:airports-from-toolkit   # place_toolkit → travelSpotAirports.json (DB 수정 없음)
npm run generate:airports            # 툴킷·오버라이드 없는 slug만 추론으로 채움
npm run audit:airports
npm run enrich:airports
```

4. (선택) `npm run build`

### 헬스체크 기대값

| 명령 | 기대 |
|------|------|
| `generate:airports` | `Mapped: 244 / 245`, `missing: 0`, `unregisteredIatasInOverrides` 없음 |
| `audit:airports` | `none: 0` (배너 없는 여행지 0) |
| `enrich:airports` | **리포트만** 갱신. `Low-confidence slugs: 0` 목표 |

- **245행 / 244 slug**: `travelSpots.js`에 동일 slug 중복 1건(`berlin`) 때문. 의도된 매핑 수는 244.
- `audit`의 `geoGaps`·`farMatch`는 **경고용**(오버라이드로 멀리 있는 관문 공항을 쓰는 경우 등).

출력: `scripts/outputs/rental-airport-audit.json`, `scripts/outputs/travel-spot-airports-enrich-report.json`

### `generate`와 순환 참조

`generate-travel-spot-airports.mjs`는 `ignoreStaticAirportMap: true`로 JSON 없이 추론합니다. **오버라이드·허브를 바꾼 뒤에는 반드시 `generate`를 다시 실행**하세요. `enrich`만으로는 JSON이 바뀌지 않습니다.

---

## 4. 다중 공항·섬 관광지 패턴

한 여행지에 관문이 여러 개일 때(보라카이, 팔라완, 로포텐, 시칠리아 등):

- `primaryIatas: ['…', '…']`, `kind: 'multi'`, `preferredLinkIata`(제휴 링크 기본 검색)
- **`searchHintIatas`**: 티켓 목적지로 **실제로 고를 수 있는 동급 공항**만 (나가사키 NGS/FUK, 보르네오 BKI/KCH). 없으면 검색·배너 후보는 **linkHub 1개**.
- `bannerNote`로 「국제선은 A 경유, 최종 B」·권역 혼동(브루나이 BWN vs 사바 BKI) 안내 — **환승 코드는 여기만**.

**국제선 관문 + 국내선 최종** (아콩카과 MDZ, 잉카 트레일 CUZ, 흐바르 SPU): `primaryIatas`에 경유지를 넣어도 **`searchHintIatas` 생략** → 배너·검색은 최종 공항만; EZE·LIM 등은 `bannerNote`.

**보라카이 예**: 칼리보 `KLO`(국제선·패키지 다수) + 카틱란 `MPH`(직항·국내선). 한글명은 `칼리보 국제공항` / `카틱란 공항` — 영문 인명만 옮긴 「고도프로 항공기지」류 표기는 사용자에게 낯설 수 있음.

**엘니도 예**: `ENI`·`PPS`·`MNL` 다중 공항 + `bannerNote`에 루트 1(MNL→ENI)·루트 2(PPS 육로) 비교(줄바꿈 `\n`, 배너 `whitespace-pre-line`). 툴킷 「항공권 예약 팁」과 배너를 맞출 때는 오버라이드 우선.

---

## 5. 자주 하는 실수

- 허브에 없는 IATA를 오버라이드에만 넣음 → generate 시 해당 오버라이드 **무시**
- PowerShell에서 `&&` 실패 → `;`로 명령 연결
- `travelSpots.js` **slug 중복** → 마지막 행만 JSON에 남음
- 플래너 툴킷만 고치고 JSON 미갱신 → 배너는 예전 공항 유지

---

## 6. 관련 npm 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run generate:airports` | `travelSpotAirports.json` 재생성 |
| `npm run audit:airports` | 배너·지리 갭 감사 JSON |
| `npm run enrich:airports` | low-confidence·오버라이드 수 리포트만 |
| `npm run sync:airports-from-toolkit` | DB `place_toolkit` → JSON (읽기만) |
| `npm run toolkit:audit-place-id` | slug·unmapped·duplicateSlug 감사 |
| `npm run toolkit:reconcile-place-id` | 중복 `place_id` 병합·삭제 |

---

## 7. 잔여 unmapped·정체성 (DB 정리 전)

툴킷 `place_id`가 **공식 `travelSpots` slug에 없으면** audit `unmapped`. 검색·감정 검색 유입 지명은 **여행 가치에 따라** 처리 분기(승격이 유일 해법 아님).

| 유형 | 예 | 선행 작업 |
|------|-----|-----------|
| **alias** | 바티칸→`rome`, 사뭇쁘라깐주→`bangkok`, 아오시마→`kumamoto` | [`travel-spot-place-id-aliases.mjs`](../scripts/data/travel-spot-place-id-aliases.mjs) |
| **승격** | 아바나→`havana`, 발레타→`malta` | `travelSpots.js` + 2절 체크리스트 |
| **placeIds-only** | 어센션 섬 | `TRAVEL_SPOT_PLACE_ID_OVERRIDES` + sync `placeIds` (travelSpots 승격 없음) |
| **삭제** | 메히칼리·트럼프 등 | DB 행 삭제 후 재감사 |
| **reconcile** | duplicateSlug 7(나자레·리마…) | `toolkit:reconcile-place-id` — 신규 여행지 아님 |
| **유지** | blocklist(춘천·독도…) | 추가 작업 없음 |

**curated high·원정지**(디에고 가르시아·핏케언 등): `travel-spot-airport-overrides.mjs` `confidence: high` + `bannerNote`. 플래너는 `toolkitPlaceIdResolve`에서 **primary IATA만** 지리 검사(타임라인 경유 SIN 등 면제). `mergeCanonicalTravelSpot` 후 툴킷 조회.

상세·우선순위: [`2026-05-19-project-log.md`](./2026-05-19-project-log.md) · [`place-id-residual-classification.json`](../scripts/data/place-id-residual-classification.json) `nextSessionPlan`.
