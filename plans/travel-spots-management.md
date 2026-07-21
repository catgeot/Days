# 여행지 데이터·도착 공항 운영 가이드

gateo.kr 홈 여행지(`TRAVEL_SPOTS`)를 **추가·수정**할 때와, 플래너 **렌터카·픽업·항공권·페리** 배너/카드를 맞출 때 참고합니다.

**짧은 맥락**: [`.ai-context.md`](../.ai-context.md) 3절·6절  
**정체성·공항 이슈(다중 place_id)**: [`destination-airport-identity-plan.md`](./destination-airport-identity-plan.md)  
**클룩 렌터카 배너 검색어**(여행지명 vs 공항명·예외 JSON): [`klook-rental-search-data.md`](./klook-rental-search-data.md)  
**일지**: `plans/YYYY-MM-DD-project-log.md`

---

## 1. 데이터 파일 역할

| 파일 | 용도 |
|------|------|
| [`src/pages/Home/data/travelSpots.js`](../src/pages/Home/data/travelSpots.js) | **SSOT** — slug, 좌표, tier, SEO·글로브·사이트맵. **`denseRegion`**: 밀집 권역(예: `western-europe`)이면 지구본 tier 단계 노출 · 섬·단독=`null`([`globeSpotVisibility.js`](../src/pages/Home/lib/globeSpotVisibility.js)). 투어 center는 [`globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json) |
| [`src/pages/Home/data/globeLandmarks.json`](../src/pages/Home/data/globeLandmarks.json) | **3D 투어** slug별 대표 뷰포인트·template·orbit (핀 좌표 변경 없이 감성 보정) |
| [`travelSpots-list.json`](../src/pages/Home/data/travelSpots-list.json) | 경량 목록(AI·검색용). **6k줄 `travelSpots.js` 전체 로드 금지** |
| [`travelSpotAirports.json`](../src/pages/Home/data/travelSpotAirports.json) | **`spots`**: 공식 slug → IATA · **`placeIds`**: DB `place_id`/사용자 지명 → IATA. `sync:airports-from-toolkit`으로 툴킷 반영, `generate`는 `spots`만 추론·`placeIds`는 유지 |
| [`scripts/data/travel-spot-airport-overrides.mjs`](../scripts/data/travel-spot-airport-overrides.mjs) | 수동·검수 매핑(오지·다중 공항·오탐 보정) |
| [`src/utils/rentalAirportHubs.js`](../src/utils/rentalAirportHubs.js) | IATA별 **한국어 공식명**·좌표·`radiusKm`·aliases |
| [`src/utils/rentalAirportMatch.js`](../src/utils/rentalAirportMatch.js) | 런타임: JSON **최우선** → 툴킷 → 다중공항 규칙 → 좌표. 렌터카 **배너 검색어**만 `resolveKlookRentalBannerSearchLabel`(여행지명 우선) |
| [`travelSpotFerries.json`](../src/pages/Home/data/travelSpotFerries.json) | **`spots`**: slug → 페리 tier·노선·예약 provider |
| [`scripts/data/travel-spot-ferry-overrides.mjs`](../scripts/data/travel-spot-ferry-overrides.mjs) | 페리 노선 수동·검수 매핑 |
| [`src/utils/ferryBookingMatch.js`](../src/utils/ferryBookingMatch.js) | 플래너 페리 카드·타임라인 URL resolve |
| [`scripts/data/flight-booking-overrides.mjs`](../scripts/data/flight-booking-overrides.mjs) | OTA 미지원·**2차 항공** tier·공식 예약 URL SSOT |
| [`travelSpotFlightBookings.json`](../src/pages/Home/data/travelSpotFlightBookings.json) | slug → tier · `officialLinks[]` · `bookingNote` (generate 산출물) |
| [`src/utils/flightBookingMatch.js`](../src/utils/flightBookingMatch.js) | tier resolve · United 딥링크 · Trip 디스클레이머 |
| [`src/utils/affiliate.js`](../src/utils/affiliate.js) | `getKlookRentalUrlByLocation`(배너), `getKlookFerryUrl`, `getTripcomCruiseUrl` |

`travelSpots-list.json` 재생성:

```bash
node scripts/extract-travel-spots-list.cjs
```

---

## 2. 여행지 추가 체크리스트 (대량 추가 시)

**순서를 건너뛰지 말 것** — 공항만 맞추고 페리를 빼면 플래너에 「페리 (쾌속선) 예약」 카드·노선 링크가 비거나 잘못된 Direct Ferries 홈으로만 연결됩니다.

| # | 작업 | 필수 | 상세 |
|---|------|------|------|
| 1 | `travelSpots.js` 1건 추가 | ✅ | `slug` **유일**(중복 시 JSON·사이트맵 덮어씀). 알려진 중복: `berlin`(id 173·187) |
| 2 | 필수 필드 | ✅ | `slug`, `name`, `name_en`, `lat`, `lng`, `country`, `tier`, `continent`, `categories` 등 기존 행 패턴 |
| 3 | `travelSpots-list.json` 재생성 | ✅ | `node scripts/extract-travel-spots-list.cjs` |
| 4 | **도착 공항** | ✅ | [3절](#3-도착-공항-매핑) — `rentalAirportHubs` → `travel-spot-airport-overrides.mjs` → `generate:airports` → `audit:airports` |
| 5 | **페리·크루즈 분류** | ✅ | [4절](#4-페리-노선-매핑) — 아래 **5a~5e** |
| 6 | 로컬 QA | ✅ | `/place/{slug}` · 플래너 탭 · 배너 공항 · **페리 카드·예약 버튼** · (크루즈지) 타임라인 Trip.com |
| 7 | `npm run build` | ✅ | 사이트맵 URL 생성 |

### 5a. 페리 tier 판단 (신규 slug마다 1회)

`desc`·`keywords`·공항 `bannerNote`를 보고 **4절 tier 표**에서 하나를 고릅니다.

| 질문 | tier |
|------|------|
| 공항 없이·버스+페리만·페리가 **유일 실용 경로**? | `required` |
| 공항 도착 후 **페리·쾌속선 환승이 흔함**? | `common` |
| **관광 크루즈·유람선**만 (하롱베이·남극 관문 등)? | `cruise_only` |
| 항구도시·드래곤보트·페리토(빙하) 등 **페리 예약 불필요**? | `none` — overrides·generate 생략 가능 |

`none`이 아니면 **5b**로 진행합니다.

### 5b. `travel-spot-ferry-overrides.mjs` 등록

[`scripts/data/travel-spot-ferry-overrides.mjs`](../scripts/data/travel-spot-ferry-overrides.mjs)에 slug 항목 추가:

```javascript
'my-new-island': {
  tier: 'required', // 또는 common / cruise_only
  summary: '한 줄 안내 (플래너 카드 상단)',
  routes: [
    {
      id: 'route-id',
      label: '출발 → 도착',
      duration: '약 N시간',
      directFerries: false, // DF 취항 있으면 true + direct_ferries provider
      bookings: [
        { provider: 'direct', name: '운항사명', url: 'https://...' },
        { provider: 'twelve_go', name: '12Go', url: 'https://12go.asia/ko/travel/from/to/' },
        { provider: 'direct_ferries', name: 'Direct Ferries' }, // url은 런타임 resolve
      ],
    },
  ],
  fallbacks: ['klook_ferry'], // 노선 URL 없을 때
  dfRecommendations: ['추천 노선 텍스트 (선택)'],
  twelveGoBannerLabel: '출발 → 도착', // (선택) 12Go 배너 짧은 라벨
  twelveGoWidget: true, // (선택) compact UI — 배너 + direct 운항사만 (예: tsushima)
  confidence: 'high',
},
```

**provider 규칙**: `direct` → 운항사 공식 · `direct_ferries` → DF 제휴 · `twelve_go` → 12Go 노선 URL (`affiliate.js`의 `get12GoAffiliateUrl`로 `z`·`sub_id` 부착) · `klook_ferry` → fallback만.

**12Go UI (2026-05-21)**: `routes[].bookings`에 `twelve_go`가 있으면 [`TwelveGoSearchWidget`](../src/components/PlaceCard/tabs/planner/components/TwelveGoSearchWidget.jsx) **클릭형 제휴 배너** 노출(노선별). Form script embed는 React SPA에서 비활성 이슈로 사용하지 않음. `twelveGoWidget: true` 여행지(대마도)는 상단 링크 그리드 생략·운항사 direct만 버튼.

공항 `bannerNote`에 「버스·페리」「페리·전용선」이 있으면 **공항 overrides와 함께** 페리 overrides도 넣어 여정·카드가 일치하게 합니다.

### 5c. JSON 재생성·감사

```powershell
cd c:\dev\days
npm run generate:ferries
npm run audit:ferries
```

| 명령 | 기대 |
|------|------|
| `generate:ferries` | `travelSpotFerries.json`에 신규 slug 반영 |
| `audit:ferries` | **gapCount: 0** (`required`/`common`은 `routes[].bookings` 또는 `fallbacks` 필수) |

`scripts/outputs/ferry-candidates.json` — 자동 후보·검수 큐.

### 5d. 플래너 QA (페리)

- **`required` / `common`**: AI 툴킷 없어도 「페리 (쾌속선) 예약」 카드 **표시**
- **12Go**: 노선 URL 있으면 제휴 배너(`TwelveGoSearchWidget`) + 운항사/DF 버튼. `twelve_go`는 버튼이 아닌 배너로만 노출
- **다중 노선** (`routes.length > 1`): 노선별 카드 · 12Go compact 배너(제목은 카드 헤더만) · Powered by 12Go는 목록 하단 1회 — [`ferry-ssot-validation.md` 5절](ferry-ssot-validation.md#5-플래너-ui-페리-카드)
- **AI `ferry_booking.url`**: SSOT `routes`가 있으면 **예약 버튼 미노출** (`resolveAiFerryExtraBooking`). advice는 ToolkitCard 본문만
- 예약 버튼: 운항사 · Direct Ferries · (fallback) Klook 페리
- **Direct Ferries 취항 없음** 지역(대마도 등): DF 버튼 없이 **운항사 direct**만 있는지 확인. 대마도: 팬스타 쓰시마링크 · 스타라인 니나호(`thestarline.co.kr`)

### 5e. 크루즈만 (`cruise_only`)

- 페리 카드 **없음**
- 여정 타임라인에 「크루즈」 단계가 있으면 **Trip.com 크루즈** 버튼 (`getTripcomCruiseUrl`)

---

**한 줄 요약 (신규 여행지)**: `travelSpots.js` → list 추출 → **공항 overrides + generate:airports** → **페리 tier 판단 + ferry overrides + generate:ferries** → QA → build.

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

**플래너 DB 조회**: Supabase `place_id`는 **대소문자 구분**입니다. 검색 지오코딩 slug(`ruul`, `utwe`)로 저장된 툴킷은 [`toolkitPlaceIdResolve.js`](../src/utils/toolkitPlaceIdResolve.js) `buildToolkitPlaceIdCandidates`가 소문자·`formatUrlName` 변형까지 조회합니다. 정리 시 삭제보다 `npm run toolkit:reconcile-place-id`로 canonical slug(`yap` 등) 리네임 권장.

### 작업 순서

1. 새 IATA가 필요하면 **`rentalAirportHubs.js`**에 `officialKo`(예약·항공권에서 쓰는 표기) 추가.
2. 자동 추론이 틀리면 **`travel-spot-airport-overrides.mjs`**에 `primaryIatas`, `kind: 'multi'`, `bannerNote` 등.
3. 재생성·감사:

```powershell
cd c:\dev\days
npm run sync:airports-from-toolkit   # place_toolkit → travelSpotAirports.json (DB 수정 없음)
npm run generate:airports            # spots 재생성 + TRAVEL_SPOT_PLACE_ID_OVERRIDES → placeIds 병합
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

### 3.1 2차 항공·분할 예약 (주항공 + Island Hopper·전세기 등)

국제선(1차)과 현지·호퍼·전세기(2차)가 **갈라지는** 여행지는 공항 overrides만으로는 부족합니다. **공항 SSOT**와 **항공 예약 tier SSOT**를 함께 맞춥니다.

#### IATA 역할 분리 (혼동 금지)

| 필드 | 파일 | UI·제휴 |
|------|------|---------|
| `preferredLinkIata` | `travel-spot-airport-overrides.mjs` | 렌터카·픽업·배너 **최종** 도착 |
| `tripFlightArrivalIata` | 동일 | Trip.com `aAirportCode` — **OTA로 검색 가능한 관문**(예: HNL, AUH) |
| `flightRouteHubIatas` | **`travel-spot-airport-overrides.mjs` SSOT** (시네마) | arc·Bar 경유 hub · **`[]`(빈 배열)= corridor DXB 생략·직항 arc** · `flightRouteWaypoints` 병행(태평양·유럽 남방 우회). **미국(LAX/ATL) → 중동·유럽(DXB/DOH/CDG 등) 교체는 플래너·항공권 팁에 대안이 명시될 때만** — 대안 없으면 LAX 유지. **`MAX_FLIGHT_LEG_HOURS=16`** · graph-unresolved → hub 수동 · `generate:airports` · **수동 override는 v2 graph 재생성 영향 없음** (`generate:flight-routes` skip) |
| `flightRouteWaypoints` | 동일 | arc 지리 waypoint만 — **ICN↔LAX 직항** `[[180,12]]` · **ICN↔AMS 직항** `[[125,33],[15,42]]` 등 hub 없이 가능 · **배너·Trip IATA와 무관** |
| `officialLinks[].destinationIata` | `flight-booking-overrides.mjs` | 항공사 공식 예약 URL 목적지 — **IATA와 다를 수 있음** (예: 코스라에 렌터카 `KOS` · United `KSA`) |

`primaryIatas`에는 관문+최종을 넣되, **`kind: 'multi'` + `bannerNote`**로 「Trip은 GUM까지 · YAP는 United」처럼 여정을 설명합니다.

**트레킹·국제선/국내선 분리 예** (`annapurna-circuit`): 국제선 도착 **KTM**(트리부반·카트만두) · `tripFlightArrivalIata: KTM` · 렌터카·픽업 `preferredLinkIata: KTM` · 포카라 **PKR**은 `searchHintIatas`·`bannerNote` 대안만 — `preferredLinkIata: PKR`로 Trip 도착 지정 금지.

#### tier (`flight-booking-overrides.mjs`)

| tier | 의미 | 예 |
|------|------|-----|
| `standard` | Trip/OTA만 (본 파일 **미등록**) | 일반 대도시 |
| `segmented` | Trip = 1차 관문 · 공식 링크 = 2차 | Micronesia ICN→**GUM** · United **GUM→**{YAP\|TKK\|PNI\|KSA\|MAJ} (HNL 아일랜드 호퍼는 배너 대안) |
| `agency-only` | 2차가 OTA·항공사 URL 없음 · 현지 에이전시 | `socotra` SCT 전세기 |
| `carrier-only` | (예약) 특정 항공사만 | 필요 시 추가 |

#### 작업 순서 (2차 항공 slug 1건)

1. **`rentalAirportHubs.js`** — 신규 IATA·한글 공식명·aliases.
2. **`travel-spot-airport-overrides.mjs`** — `preferredLinkIata`, `tripFlightArrivalIata`, `flightRouteHubIatas`·`flightRouteWaypoints`(시네마 arc), `bannerNote`, `searchHintIatas`(동급 관문만).
3. **`flight-booking-overrides.mjs`** — `tier`, `bookingNote`, `officialLinks[]` (United 등 **브라우저 QA 후** 고정).
4. 재생성:

```powershell
cd c:\dev\days
npm run generate:airports
npm run audit:airports    # none: 0
npm run generate:flights
```

5. QA: `/place/{slug}` — 배너 최종 IATA = 렌터카 · Trip 캡션 = `tripFlightArrivalIata` · United 버튼 · 「항공권 팁 확인」 스크롤 · tier≠standard Trip 부제.

#### 주의 (2차 등록 시)

- **`travelSpotAirports.json` / `travelSpotFlightBookings.json` 직접 편집 금지** — overrides → `generate:*` 만.
- **공항 overrides만** 고치고 flight tier를 빼면 → Trip·United·디스클레이머 불일치.
- **United·항공사 URL의 목적지 코드**는 표준 IATA와 다를 수 있음 — 링크 QA 없이 SSOT 고정 금지 (`KOS`≠United `KSA` 사례).
- **`bannerNote`(배너)와 `bookingNote`(항공 카드)** 문구는 같은 여정을 가리키게 맞출 것.
- **`citiesData`만 있는 slug**(`marshall-islands` 등): `location.slug` 없으면 flight tier 조회 실패 → [`index.jsx`](../src/pages/Home/index.jsx) hydration·[`flightBookingMatch.js`](../src/utils/flightBookingMatch.js) slug alias 확인.
- **`rentalAirportMatch.js` 로직·`TITLE_ARRIVAL_AIRPORT_PHRASES`** — 사용자 승인 없이 변경 금지.
- Micronesia·Island Hopper: Trip **GUM** · 2차 **United GUM→*** — `officialLinks.originIata` **GUM**. essential_guide·배너와 시네마 `flightRouteHubIatas: ['GUM']` 정합. HNL 전구간 호퍼(UA154 등)는 `bannerNote`·`bookingNote` **대안**만.

---

## 4. 페리 노선 매핑

플래너 **페리 카드·여정 타임라인** 예약 링크 SSOT. `travelSpots.js`에는 좌표·SEO만 두고, 예약 URL은 아래 JSON·오버라이드에 둡니다.

| 파일 | 용도 |
|------|------|
| [`travelSpotFerries.json`](../src/pages/Home/data/travelSpotFerries.json) | slug → `tier`, `routes`, `fallbacks`, `dfRecommendations`, `twelveGoWidget` |
| [`travel-spot-ferry-overrides.mjs`](../scripts/data/travel-spot-ferry-overrides.mjs) | 검증된 노선·운항사·12Go 노선 URL (SSOT) |
| [`affiliate.js`](../src/utils/affiliate.js) | `get12GoAffiliateUrl`, `TWELVE_GO_PARTNER_ID` (`15927471`) |
| [`ferryBookingMatch.js`](../src/utils/ferryBookingMatch.js) | 런타임: 카드 노출·provider 우선순위·URL resolve·배너 라벨 |
| [`TwelveGoSearchWidget.jsx`](../src/components/PlaceCard/tabs/planner/components/TwelveGoSearchWidget.jsx) | 12Go 제휴 클릭 배너 |
| [`FerryBookingWidget.jsx`](../src/components/PlaceCard/tabs/planner/components/FerryBookingWidget.jsx) | 플래너 페리 카드 UI |

### tier

| tier | 페리 카드 | 예 |
|------|-----------|-----|
| `required` | **항상** (AI 무관) | tsushima, boracay, gili-meno |
| `common` | **항상** | phuket, bohol, santorini |
| `cruise_only` | 숨김 — Trip.com 크루즈만 | halong-bay, ushuaia |
| `none` | 숨김 | sydney, hamburg (항구도시·관광 보트) |

### Provider 우선순위 (같은 노선)

1. `direct` — 운항사 공식 (Direct Ferries 취항 없을 때, 예: JR Beetle)
2. `direct_ferries` — Direct Ferries **제휴 탐색 홈만**(버튼). 항구명 노선 URL 딥링크는 사용하지 않음 — [`ferry-ssot-validation.md` 5절](ferry-ssot-validation.md#5-플래너-ui-페리-카드)
3. `twelve_go` — 12Go 노선 딥링크 → UI는 **배너**로만 (`get12GoAffiliateUrl`: `z=15927471`, `sub_id={slug}-planner`)
4. `klook_ferry` — Klook 페리 통합 페이지 (`aff_adid=1281898`)

크루즈 키워드(여정 플래너) → `getTripcomCruiseUrl()` (페리와 분리).

**`travelSpotFerries.json`을 직접 수정하지 말 것** — 검수는 `travel-spot-ferry-overrides.mjs`에 넣은 뒤 `generate:ferries`.

### 작업 순서

```powershell
cd c:\dev\days
npm run generate:ferries   # travelSpots + 오버라이드 → travelSpotFerries.json
npm run audit:ferries      # required/common booking gap 0 목표
```

새 페리 필수 여행지 추가 시: `travel-spot-ferry-overrides.mjs`에 `routes[].bookings` 등록 후 `generate:ferries`.

### 헬스체크 기대값

| 명령 | 기대 |
|------|------|
| `audit:ferries` | `gapCount: 0`, `required`/`common` 전부 booking 또는 fallback |

출력: `scripts/outputs/ferry-audit.json`, `scripts/outputs/ferry-candidates.json`

**검증 범위**: SSOT 등록 slug(~33)는 **전수 검증** · 전체 여행지(~265)는 **전수 아님** — 후보·신규·기본 여행지만 큐레이션. 상세: [`ferry-ssot-validation.md`](ferry-ssot-validation.md).

---

## 5. 다중 공항·섬 관광지 패턴

한 여행지에 관문이 여러 개일 때(보라카이, 팔라완, 로포텐, 시칠리아 등):

- `primaryIatas: ['…', '…']`, `kind: 'multi'`, `preferredLinkIata`(제휴 링크 기본 검색)
- **`searchHintIatas`**: 티켓 목적지로 **실제로 고를 수 있는 동급 공항**만 (나가사키 NGS/FUK, 보르네오 BKI/KCH). 없으면 검색·배너 후보는 **linkHub 1개**.
- `bannerNote`로 「국제선은 A 경유, 최종 B」·권역 혼동(브루나이 BWN vs 사바 BKI) 안내 — **환승 코드는 여기만**.

**국제선 관문 + 국내선 최종** (아콩카과 MDZ, **쿠스코·마추픽추·잉카 트레일** CUZ, 흐바르 SPU): `primaryIatas`에 경유지를 넣어도 **`searchHintIatas` 생략** → 배너·검색은 최종 공항만; EZE·LIM 등은 `bannerNote`.

**쿠스코 예** (`cusco`): 국제선 **LIM** → 국내선 **CUZ**. `primaryIatas: ['CUZ','LIM']`, `preferredLinkIata: 'CUZ'`, `bannerNote`에 LIM 안내. slug `cusco`와 placeId `쿠스코`·`마추픽추`를 overrides·`TRAVEL_SPOT_PLACE_ID_OVERRIDES`로 함께 맞출 것 — 한쪽만 고치면 여정 플래너와 배너가 어긋남.

**보라카이 예**: 칼리보 `KLO`(국제선·패키지 다수) + 카틱란 `MPH`(직항·국내선). 페리 SSOT: `kalibo-boracay` / `caticlan-boracay` 노선과 `bannerNote`를 함께 맞출 것. 한글명은 `칼리보 국제공항` / `카틱란 공항` — 영문 인명만 옮긴 「고도프로 항공기지」류 표기는 사용자에게 낯설 수 있음.

**엘니도 예**: `ENI`·`PPS`·`MNL` 다중 공항 + `bannerNote`에 루트 1(MNL→ENI)·루트 2(PPS 육로) 비교(줄바꿈 `\n`, 배너 `whitespace-pre-line`). 툴킷 「항공권 예약 팁」과 배너를 맞출 때는 오버라이드 우선.

**로포텐 예** (`lofoten`): `BOO`·`EVE`·`LKN`·`SVJ` + `searchHintIatas` 4종 + 긴 `bannerNote`. 연동 기본 `EVE`(렌터카 북→남), 페리·모스케네스 루트는 후보에서 `BOO`. **OSL** 등 국제 경유는 `primaryIatas`에 넣지 않고 `bannerNote`만.

**경유만·최종 분리** (보로부두르 `YIA`, 흐바르 `SPU`): 최종 IATA만 `primaryIatas` 단일; 경유(CGK/DPS·DBV/ZAG 귀국)는 `bannerNote`만.

**국제선 관문 + 국내선 최종 (추가 사례, 2026-06-11)**:

| slug / placeId | 경유 | 최종 `preferredLinkIata` |
|----------------|------|--------------------------|
| `miyakojima` | 나하 경유 **MMY** | 인천 직항 **SHI** (`searchHintIatas`: SHI·MMY) |
| `lalibela` | **ADD** 국제선 | **LLI** |
| `aitutaki` / `아이투타키` | **AKL**·**RAR** | **AIT** — slug `aitutaki` + placeId 별칭 |
| `rarotonga` | AKL 등 | **RAR** (라로통가 본섬 목적) |
| `costa-rica` | — | **SJO**·**LIR** (`searchHintIatas` 동일, 일정별 선택) |
| `la-spezia` | — | **FCO** 기본 · **MXP**·**FLR**·**PSA** 후보 (공항 없는 항구, 기차 연결) |
| `cape-verde` | LIS·CMN 경유 | **SID**·**RAI** (휴양 vs 행정) |
| `콘다오` (placeIds) | **SGN** 국제선 | **VCS** — 쿠스코 패턴, `searchHintIatas` 생략 |

**툴킷-only 여행지** (`citiesData`·DB `place_id`만, slug 없음): 배너는 `essential_guide` → `extractArrivalIataCodesFromEssentialGuide`가 IATA를 뽑습니다. **허브 미등록 IATA는 무시**되므로 `rentalAirportHubs.js` 등록이 필수(예: **TIA**, **AIT**, **VCS**). slug가 없으면 `TRAVEL_SPOT_PLACE_ID_OVERRIDES` 등록 후 **`npm run generate:airports`**(JSON `placeIds` 병합) — DB 툴킷 행이 없어도 반영. `placeIds`에 `linkedSlug`만 있고 slug에 curated가 있으면 런타임이 slug 행을 우선(`rentalAirportMatch.js`).

**타임라인 파서 한글 오탐** (`rentalAirportMatch.js` `TITLE_ARRIVAL_AIRPORT_PHRASES`): 짧은 별칭이 다른 지명에 포함되면 잘못된 허브가 잡힙니다. 수정 시 **허브 등록 + 구체 지명 패턴**을 함께 넣을 것.

| 잘못된 패턴 | 오탐 예 | 올바른 방향 |
|-------------|---------|-------------|
| `티라` → JTR | **티라나** | `티라나`→TIA, `티라(?!나)`→JTR |
| `통가` → TBU | **라로통가** | `(?<![로])통가`→TBU, `라로통가`→RAR |

---

## 6. 자주 하는 실수

- **`travel-spot-airport-overrides.mjs` 미수정** → `travelSpotAirports.json`·`RENTAL_MULTI_AIRPORT_DESTINATIONS`만 고치면 `generate:airports`·`sync:airports-from-toolkit` 후 **원복**(흐바르 DBV, 로포텐 BOO 단독, 쿠스코 CUZ 단독 등). 검수 반영은 **overrides → generate** 순서가 SSOT. slug에 override가 있어도 **placeIds**(한글 `쿠스코` 등)는 `TRAVEL_SPOT_PLACE_ID_OVERRIDES` 또는 sync 후 JSON 정합 확인.
- 다중 관문인데 `searchHintIatas`·`bannerNote` 없음 → 배너에 연동 공항 1개만 보임(로포텐·보라카이 패턴).
- 허브에 없는 IATA를 오버라이드에만 넣음 → generate 시 해당 오버라이드 **무시**
- PowerShell에서 `&&` 실패 → `;`로 명령 연결
- `travelSpots.js` **slug 중복** → 마지막 행만 JSON에 남음
- 플래너 툴킷만 고치고 JSON 미갱신 → 배너는 예전 공항 유지
- **공항만 등록하고 페리 tier·overrides 생략** → 대마도·보라카이 등에서 페리 카드 미노출 또는 Direct Ferries 홈만 연결
- **`travelSpotFerries.json` 직접 편집** → 다음 `generate:ferries`에 덮어씀. 반드시 `travel-spot-ferry-overrides.mjs` 수정
- `required`/`common`인데 `bookings`·`fallbacks` 둘 다 비움 → `audit:ferries` gap
- 항구도시를 `common`으로 분류 → 시드니·함부르크 등 **오탐**. `none` 또는 미등록
- 크루즈 관광지를 `common`으로 분류 → 하롱베이·우수아이아는 **`cruise_only`**
- **허브 없이 툴킷 IATA만** → 플래너 배너가 경유 공항만 남음(아이투타키 AIT·티라나 TIA). `rentalAirportHubs` 먼저
- **시네마/`airportsIndex`만으로 도착이 보여도 허브 미등록이면 Trip `aAirportCode` 누락** → 허브 등록·placeId override 후 `audit:airports`의 `cinemaTripGap` 확인 (카바라티 AGX 사례)
- **`TITLE_ARRIVAL_AIRPORT_PHRASES` 짧은 한글 별칭** → 티라나·라로통가 등 오탐. §5 표 참고
- **국제 경유지를 `preferredLinkIata`로** → 랄리벨라 ADD·아이투타키 RAR. 최종 공항은 쿠스코 패턴(`preferredLinkIata` = 최종)
- **2차 항공인데 `tripFlightArrivalIata`·flight tier 누락** → Trip이 MAJ까지 검색되거나 United·디스클레이머 없음 — §3.1
- **`flight-booking-overrides` 없이 `bannerNote`만** → 배너와 항공 카드 메시지·버튼 불일치
- **United URL에 렌터카 IATA 그대로** → 예약 실패(`KOS` vs `KSA`) — 항공사 QA 후 `destinationIata` 고정
- **`travelSpotFlightBookings.json` 직접 편집** → `generate:flights`에 덮어씀

---

## 7. 관련 npm 스크립트

| 스크립트 | 설명 |
|----------|------|
| `npm run generate:ferries` | `travelSpotFerries.json` 재생성 |
| `npm run audit:ferries` | 페리 booking gap·DF mismatch 감사 |
| `npm run generate:airports` | `travelSpotAirports.json` 재생성(spots + placeId-only 오버라이드 병합) |
| `npm run generate:flights` | `travelSpotFlightBookings.json` 재생성 (2차 항공 tier) |
| `npm run audit:airports` | 배너·지리 갭 감사 JSON |
| `npm run audit:flight-route-gaps` | routeKind·uiPlace gap-report JSON |
| `npm run generate:graph-direct-review` | `audit:flight-route-gaps` 후 graph-direct tier 검수 MD (`scripts/outputs/`) |
| `npm run enrich:airports` | low-confidence·오버라이드 수 리포트만 |
| `npm run sync:airports-from-toolkit` | DB `place_toolkit` → JSON (읽기만) |
| `npm run toolkit:audit-place-id` | slug·unmapped·duplicateSlug 감사 |
| `npm run toolkit:reconcile-place-id` | 중복 `place_id` 병합·삭제 |

---

## 8. Mapbox 지명 클릭·UI 해석 (툴킷 alias와 분리)

Mapbox **행정·도시 지명** 클릭은 gateo **큐레이션 SSOT**(`travelSpots.js`)와 별개로 동작합니다. 오매칭 보정을 위해 미등록 지명마다 `travelSpots`를 추가하지 **않습니다**(§8.2 승격 분기 참고).

| 구분 | 데이터·로직 | 용도 |
|------|-------------|------|
| **툴킷·DB** | [`travel-spot-place-id-aliases.mjs`](../scripts/data/travel-spot-place-id-aliases.mjs) · `mergeCanonicalTravelSpot` | `place_toolkit.place_id` → SSOT slug · 플래너·sync |
| **역지오 country** | [`travelRegionCountry.js`](../src/pages/Home/lib/travelRegionCountry.js) · [`geocoding.js`](../src/pages/Home/lib/geocoding.js) | Nominatim `country=France/US` → **영토명**(FR-PF·US-GU·MH 등 ISO/state) |
| **지구본 UI** | `uiPlace: true` · `finalizeUiPlacePin` | Mapbox 라벨 — **표시 지명 유지** · country는 역지오+영토복원 · `galleryRegionSpot`은 근처 SSOT/cities(**50km**, Tahaa↔bora-bora ~33km) |

**클릭 경로** ([`useHomeHandlers.js`](../src/pages/Home/hooks/useHomeHandlers.js) · [`HomeGlobeMapbox.jsx`](../src/pages/Home/components/HomeGlobeMapbox.jsx)):

우선순위: **gateo 마커(줌≥4면 hit ~14px, 미만 ~32px)** → cluster POI → **Mapbox POI/natural/landmark(줌≥5.5)** → place/settlement 라벨(줌≥4) → bare map(`uiPlace`).

| 경로 | 국가·지명 | SSOT 좌표 스냅 |
|------|-----------|----------------|
| Mapbox **지명·POI** 클릭 | 라벨 + [`travelRegionCountry`](../src/pages/Home/lib/travelRegionCountry.js) | **이름·slug 병합만** (`uiPlace` coord 스냅 차단) · 갤러리 맥락은 근접 SSOT/cities |
| **검색바** (Smart Search) | [`geocoding.js`](../src/pages/Home/lib/geocoding.js) **Mapbox forward 우선** → Nominatim · 영토복원 · 국가 한글 정규화 | **이름·별칭 SSOT만** 연결 · **coord 스냅 금지** (홍천 휴게소→홍천군 방지) · 그 외 `uiPlace` |
| **지오코딩** 성공(빈 지도) | 쿼리 + geocode + 영토복원 · 역지오는 industrial/natural feature명 우선 | uiPlace · gallery만 근접 SSOT/cities |
| **바다·무지명** 클릭 | — | tier km 이내 `curatedLocationFromCoords`만 · 없으면 **클릭 좌표 uiPlace**(`좌표 탐색`) — 전역 nearest 스냅 **금지** |
| **gateo 마커** 클릭 | 마커 slug · SSOT `country`(영토명) · **saved는 `curation_data.country` 승격** | 카탈로그 slug 있으면 좌표 재매칭 **안 함** · 국가 비면 카탈로그/역지오 자가치유 |
| **URL** `/place/:slug` | [`placeRouteHydrate.js`](../src/pages/Home/lib/placeRouteHydrate.js) · 세션 캐시 · 즐겨찾기 · `healPlaceholderCountry` | `search-`/`loc-`/`label-` · uiPlace slug(`tahaa`·`salta` 등) |

**라벨 줌 게이트** ([`globeZoomPolicy.js`](../src/pages/Home/lib/globeZoomPolicy.js) · [`globeMapboxLabelPolicy.js`](../src/pages/Home/lib/globeMapboxLabelPolicy.js)): 줌 &lt;4 대륙·대양만 · 4–5.5 도시·국가 · **≥5.5 POI·자연·랜드마크**. 도로/transit는 계속 숨김.

**Smart Search 자유 탐색** ([`useHomeHandlers.js`](../src/pages/Home/hooks/useHomeHandlers.js) · [`geocoding.js`](../src/pages/Home/lib/geocoding.js)): 지구본 POI와 같이 **세부 장소도 검색·탐색**. Mapbox Geocoding 우선 · 시설 쿼리(`휴게소` 등, `isFacilityQuery`)는 행정구역-only 히트·수식어 strip·`search_dictionary`의 시·군 교정 캐시 **거부**. AI 폴백은 시설을 군/시로 축소하지 않음 · Nominatim 미매칭(횡성호 등)은 AI 좌표+역지오 uiPlace · `maybeSingle`.

**유명 명소(에펠탑 등)** ([`geocoding.js`](../src/pages/Home/lib/geocoding.js) `LANDMARK_QUERY_RE` · `resolveLandmarkGeocodePlan`): `KEYWORD_SYNONYMS`로 **도시 리다이렉트 금지**(에펠탑→파리 회귀). 본명+도시·국가 쿼리(`Tour Eiffel, Paris` + `country=fr`) · Mapbox `types=poi` · Street/Road 라벨 페널티(필리핀 `Eiffel Tower Street` 등) · uiPlace로 연다(도시 SSOT 스냅 아님).

**Explore 최근 기록** ([`exploreRecentHistory.js`](../src/pages/Home/lib/exploreRecentHistory.js) · [`SearchDiscoveryModal.jsx`](../src/pages/Home/components/SearchDiscoveryModal.jsx)):

| 항목 | 클릭 |
|------|------|
| 최근 검색어 | 재검색 (`onSearch` · AI 가능) |
| 최근 방문지 · 키워드 매칭 여행지 | **AI 금지** · 카탈로그→`/place/` · uiPlace(좌표 있음)→지구본 홈(`handleLocationSelect`+`fromSearch`) |
| 키워드(보라) 칩 | 검색창에만 채움 (제출 안 함) |

방문지·키워드 destination은 compact `{name,slug,lat,lng,country…}` 저장(문자열 legacy 호환). 좌표 없는 옛 기록은 검색창만 채움. 목록별 popover 「전체 삭제」.

**fuzzy**: [`travelSpotResolve.js`](../src/utils/travelSpotResolve.js) — 접두 부분 일치(`porto`⊂`portovecchio`)·suffix contains(`nice`⊂`venice`, `니스`⊂`베니스`) 차단. `citiesData` 전용 지명(`nice`/`니스`)은 blocklist. 툴킷·검색·`mergeCanonicalTravelSpot` 경로에 적용.

### 8.0 미등록 uiPlace — `Explore`/`Global` 잔존 방지 (2026-07-20)

SSOT에 없는 지구본·검색 핀(살타·Tahaa 등)은 카탈로그 hydrate만으로는 국가를 못 채웁니다. **placeholder 국가**(`Explore`·`Global`·빈 값·`SEARCHING`)가 장소카드에 남으면 아래를 깨지 마세요.

| 계층 | 역할 | 파일 |
|------|------|------|
| **lift** | `saved_trips.curation_data` → 상위 `country`/`slug` | [`liftCurationCountryFields`](../src/utils/travelSpotResolve.js) · [`HomeGlobeMapbox`](../src/pages/Home/components/HomeGlobeMapbox.jsx) 마커 병합 |
| **heal** | placeholder면 근처 SSOT/cities로 보강 | [`healPlaceholderCountry`](../src/utils/travelSpotResolve.js) |
| **역지오 자가치유** | SSOT 50km 밖·미등록도 coords로 국가 복구 | [`useHomeHandlers`](../src/pages/Home/hooks/useHomeHandlers.js) `handleLocationSelect` · [`index.jsx`](../src/pages/Home/index.jsx) `/place/` URL sync |
| **재즐겨찾기** | `is_bookmarked`만 토글 **금지** — 현재 카드 국가로 `curation_data` 갱신 | [`useTravelData`](../src/pages/Home/hooks/useTravelData.js) `toggleBookmark` |
| **캐시** | v1 Explore 캐시 폐기 · placeholder만 있는 캐시 비사용 | [`placeLocationCache.js`](../src/pages/Home/lib/placeLocationCache.js) v2 |
| **hydrate** | 즐겨찾기 복원 시 Explore를 하드코딩하지 않음 | [`placeRouteHydrate.js`](../src/pages/Home/lib/placeRouteHydrate.js) |

**에이전트 금지**: 마커 GeoJSON에 `country` 생략 · 재북마크 시 `curation_data` 미갱신 · URL/카드 fallback에 `"Explore"` 고정 재도입.

**한계**: Nominatim 실패·바다/무주소 좌표는 국가 공란 가능. 여행 가치가 큰 지점만 §8.2 **승격**.

**MOONi (미등록 uiPlace)**: 장소카드 → 무니는 SSOT slug 없이도 **국가+지명**(`formatPlaceChatLabel` · `buildMooniBoundSpotFromLocation`)으로 소개·프롬프트·대화 주제 칩을 연다. **플래너 보기·카탈로그 퀵리플라이 slug**만 TRAVEL_SPOTS 등록 시. 카드 보조 지명(`getPlaceTitleLines`)은 한글끼리 행정 변형(구시로/구시로시) 숨김 · 영문만 괄호.

### 8.1 SSOT `country` — 여행 표기 (宗主国 vs 영토)

플래너·장소 카드·갤러리 backup에 쓰입니다. **정치적 宗主国(미국·영국·프랑스) 단독 표기는 지양** — 영토·섬 이름 우선.

| slug (예) | `country` / `country_en` |
|-----------|--------------------------|
| `guam` | 괌 / Guam |
| `hawaii`, `honolulu` | 하와이 / Hawaii |
| `midway-atoll` | 미드웨이 환초 / Midway Atoll |
| `pitcairn-islands` | 핏케언 제도 / Pitcairn Islands |
| `bora-bora` | 프랑스령 폴리네시아 / French Polynesia |

Mapbox **하위 지명**(Fa'anui·Tahaa 등)은 SSOT 승격 없이 `uiPlace` + `galleryRegionSpot`(근처 `bora-bora`, [`UI_PLACE_GALLERY_REGION_MAX_KM`](../src/utils/travelSpotResolve.js) **50**)로 갤러리 backup `{지명} Bora Bora` 처리.

**항공 arc·Bar (C-3 ✅)**

| 구분 | 동작 |
|------|------|
| **50km 이내** | [`getFlightRouteAirportRow`](../src/utils/rentalAirportMatch.js) → formal slug `flightRouteHubIatas` 상속 · Edge **스킵** |
| **50km 밖 uiPlace** | override **없음** → [`shouldResolveFlightRouteViaEdge`](../src/utils/rentalAirportMatch.js) · Edge `resolve-flight-route` v2 → 실패 시 JSON `lookupGraphRouteByDestIata` |
| **50km 밖 + placeIds override** | `placeIds` `flightRouteHubIatas`(등) 있으면 arc SSOT · Edge **스킵** (Manihiki·아이투타키 한글 place_id 등 ~12키) |
| **배너** | [`getTravelSpotAirportRow`](../src/utils/rentalAirportMatch.js) **불변** (arc 전용 row와 분리) |

**로컬 QA 샘플** (`npm run audit:flight-route-gaps` uiPlace 7건과 동일)

| 진입 | 지명 | 기대 |
|------|------|------|
| 검색 | **보라보라** · **함피** | SSOT · Edge 없음 |
| 검색 또는 Mapbox 라벨 | **Tahaa** · **Fa'anui** | uiPlace sync · `ICN→NRT→PPT→BOB` |
| 검색 | **Manihiki** | placeIds override · dest **MHX** · sync/Bar `ICN→NRT→PPT→RAR→MHX` (Edge 스킵) |
| 검색 | **DMZ** · **서울** | no-preview · 버튼 비활성 |

Edge 조회 중 버튼 **「조회 중…」** · Network `resolve-flight-route` 확인(콘솔 로그 없음 · cold start 1~5s). [`FlightCinemaContext`](../src/pages/Home/lib/FlightCinemaContext.jsx): globe ready → Edge → 시네마.

---

## 8.2 잔여 unmapped·정체성 (DB 정리 전)

툴킷 `place_id`가 **공식 `travelSpots` slug에 없으면** audit `unmapped`. 검색·감정 검색 유입 지명은 **여행 가치에 따라** 처리 분기(승격이 유일 해법 아님).

| 유형 | 예 | 선행 작업 |
|------|-----|-----------|
| **alias** | 사뭇쁘라깐주→`bangkok`, 아오시마→`kumamoto` | [`travel-spot-place-id-aliases.mjs`](../scripts/data/travel-spot-place-id-aliases.mjs) |
| **승격** | 아바나→`havana`, 발레타→`malta`, 바티칸→`vatican`, 우붓→`ubud` | `travelSpots.js` + 2절 체크리스트 |
| **placeIds-only** | 어센션 섬 | `TRAVEL_SPOT_PLACE_ID_OVERRIDES` + sync `placeIds` (travelSpots 승격 없음) |
| **삭제** | 메히칼리·트럼프 등 | DB 행 삭제 후 재감사 |
| **reconcile** | duplicateSlug 7(나자레·리마…) | `toolkit:reconcile-place-id` — 신규 여행지 아님 |
| **유지** | blocklist(춘천·독도·**nice**·**니스**…) | `citiesData` 전용 — travelSpots fuzzy 오매칭 방지 |

**curated high·원정지**(디에고 가르시아·핏케언 등): `travel-spot-airport-overrides.mjs` `confidence: high` + `bannerNote`. 플래너는 `toolkitPlaceIdResolve`에서 **primary IATA만** 지리 검사(타임라인 경유 SIN 등 면제). `mergeCanonicalTravelSpot` 후 툴킷 조회.

---

## 9. 갤러리 검색 특수 케이스 (`usePlaceGallery.js`)

Unsplash·Pexels는 `name_en`을 우선 검색합니다. 지명 단독 결과가 빈약하거나 부적절하면 [`usePlaceGallery.js`](../src/components/PlaceCard/hooks/usePlaceGallery.js)의 `GALLERY_QUERY_OVERRIDES`(slug → primary/backup)를 추가합니다.

| slug | 표시명 | primary 검색 | 비고 |
|------|--------|--------------|------|
| `yap` | 야프 | `Federated States of Micronesia` | DB 캐시 스킵 · 국가 키워드 |
| `chuuk` | 추크 라군 | `Chuuk Lagoon` (`name_en`) | 검색 별칭 `추크`, `truk` 유지 |

**미크로네시아 연방 4주**(id 387–390): `yap` · `chuuk` · `kosrae` · `pohnpei` — `travelSpots.js` SSOT · 공항 YAP/TKK/KOS/PNI. 갤러리 **더 많은 사진 불러오기**는 30초 쿨다운 · Unsplash+Pexels 병합.

상세·우선순위: [`2026-05-19-project-log.md`](./2026-05-19-project-log.md) · [`place-id-residual-classification.json`](../scripts/data/place-id-residual-classification.json) `nextSessionPlan`.
