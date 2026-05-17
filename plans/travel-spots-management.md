# 여행지 데이터·도착 공항 운영 가이드

gateo.kr 홈 여행지(`TRAVEL_SPOTS`)를 **추가·수정**할 때와, 플래너 **렌터카·픽업·항공권 기준** 배너(도착 공항)를 맞출 때 참고합니다.

**짧은 맥락**: [`.ai-context.md`](../.ai-context.md) 3절·6절  
**일지**: `plans/YYYY-MM-DD-project-log.md`

---

## 1. 데이터 파일 역할

| 파일 | 용도 |
|------|------|
| [`src/pages/Home/data/travelSpots.js`](../src/pages/Home/data/travelSpots.js) | **SSOT** — slug, 좌표, tier, SEO·글로브·사이트맵 |
| [`travelSpots-list.json`](../src/pages/Home/data/travelSpots-list.json) | 경량 목록(AI·검색용). **6k줄 `travelSpots.js` 전체 로드 금지** |
| [`travelSpotAirports.json`](../src/pages/Home/data/travelSpotAirports.json) | slug → 도착 공항 IATA(배너·렌터카 링크). **generate로 재생성** |
| [`scripts/data/travel-spot-airport-overrides.mjs`](../scripts/data/travel-spot-airport-overrides.mjs) | 수동·검수 매핑(오지·다중 공항·오탐 보정) |
| [`src/utils/rentalAirportHubs.js`](../src/utils/rentalAirportHubs.js) | IATA별 **한국어 공식명**·좌표·`radiusKm`·aliases |
| [`src/utils/rentalAirportMatch.js`](../src/utils/rentalAirportMatch.js) | 런타임: JSON **최우선** → 툴킷 → 다중공항 규칙 → 좌표 |

`travelSpots-list.json` 재생성:

```bash
node scripts/extract-travel-spots-list.cjs
```

---

## 2. 여행지 추가 체크리스트 (대량 추가 시)

1. **`travelSpots.js`에 1건 추가** — `slug`는 **유일**해야 함(중복 시 JSON·사이트맵이 덮어씀). 현재 알려진 중복: `berlin`(id 173·187) — 정리 권장.
2. 필수 필드: `slug`, `name`, `name_en`, `lat`, `lng`, `country`, `tier`, `continent`, `categories` 등 기존 행과 동일 패턴.
3. `node scripts/extract-travel-spots-list.cjs`
4. **도착 공항** (아래 3절)
5. 로컬에서 `/place/{slug}`·플래너 탭·배너 공항명 확인
6. `npm run build` — `vite.config.js`가 `TRAVEL_SPOTS`로 사이트맵 URL 생성

---

## 3. 도착 공항 매핑

### 우선순위 (런타임)

1. `travelSpotAirports.json` (정적)
2. 플래너 `essential_guide` / `primary_arrival_airports_iata`
3. `rentalAirportMatch.js`의 `RENTAL_MULTI_AIRPORT_DESTINATIONS`
4. 좌표·`rentalAirportHubs` 최근접

**툴킷 여정과 배너가 다르면 JSON/오버라이드를 수정**합니다. JSON이 툴킷보다 우선합니다.

### 작업 순서

1. 새 IATA가 필요하면 **`rentalAirportHubs.js`**에 `officialKo`(예약·항공권에서 쓰는 표기) 추가.
2. 자동 추론이 틀리면 **`travel-spot-airport-overrides.mjs`**에 `primaryIatas`, `kind: 'multi'`, `bannerNote` 등.
3. 재생성·감사:

```powershell
cd c:\dev\days
npm run generate:airports
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
- `bannerNote`로 「국제선은 A, 섬 직항은 B」 안내

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
