# 2026-05-19 Project Log

이전 일지: [`plans/2026-05-18-project-log.md`](./2026-05-18-project-log.md)

## Phase 1 배포 스모크 QA + Phase 2 감사·apply (진행)

### 프로덕션 스모크 QA (gateo.kr)

- **앙코르 와트** `/place/angkor-wat/planner`: 플래너·공항 배너·Trip.com **SAI**, ICN→SAI 문구 일치.
- **보르네오** `/place/borneo/planner`: 툴킷 보르네오(코타키나발루·MDAC) 정상, 연동 **BKI**·후보 KCH/KUL, 브루나이 문구 없음.
- **Siem Reap** `/explore` 검색 → 홈 카드 **앙코르 와트**(`Angkor Wat`)로 정규화 확인(Phase 1 `mergeCanonicalTravelSpot`).

### Phase 2 — `toolkit:audit-place-id` (313→312행)

- 전수: `mapped 261` · `unmapped 52` · `duplicateSlug 16` · `geoMismatch 11` · `wrongAlias 0`.
- **P0**: `duplicateSlug 0`(apply 후) · `unmapped 1`(브루나이, `flag_only` 유지) · `geoMismatch 0`.
- 리포트: `scripts/outputs/place-toolkit-place-id-audit.json`.

### reconcile apply

- `npm run toolkit:reconcile-place-id -- --apply --only=angkor-wat`: **`앙코르와트`** 중복 행 merge+delete 1건(5/18 재생성분).
- 보르네오·브루나이: dry-run 기준 DB 변경 없음(보르네오 단일 행 OK, 브루나이 `flag_only`).

### Phase 2 P1·P2 reconcile apply (312→301행)

- `place-toolkit-reconcile-rules.mjs`: P1 6 slug + P2 4 slug 규칙 추가.
- **P1 apply** (`bali,kuala-lumpur,uyuni-salt-flat,plitvice-lakes,everest-base-camp,alaska`): 중복 6행 delete — `우붓`→`발리`, `쿠알라셀랑고르`→`쿠알라룸푸르`, `우유니`→`우유니 소금사막`, `플리트비체 국립공원`→`플리트비체 호수`, `에베레스트`→`에베레스트 베이스캠프`, `앵커리지`→`알래스카`.
- **P2 apply** (`banff-national-park,galapagos,phuket,iceland`): 5행 delete — `로키 산맥`, `다윈`, `태국 파타야`, `일룰리사트`, `일루리삿` → 각 canonical.
- 브루나이 `flag_only`·보르네오 병합 없음 유지.

### 재감사·공항 sync

- `toolkit:audit-place-id`: `duplicateSlug 15→5` · `geoMismatch 11→8` · P0 `wrongAlias 0` · `unmapped 1`(브루나이).
- `sync:airports-from-toolkit` + `audit:airports` **`none: 0`** — `phuket` BKK→HKT, `galapagos` SIN→GPS/GYE, `iceland` CPH→KEF 등 JSON 반영.
- 잔여 `duplicateSlug`: `lalibela`, `antarctica`, `raja-ampat`, `miyakojima`, `reykjavik`.

### gateo.kr 스모크 QA (변경 slug)

- **발리** `/place/bali/planner`: 제목·툴킷 **발리**, 공항·Trip.com **DPS** 일치.
- **갈라파고스** `/place/galapagos/planner`: 제목·본문 GPS/SCY 정상; 배너 **SIN** 잔존 — DB audit는 GPS/GYE, `travelSpotAirports.json` sync 완료 → **배포 후** 배너 재확인.

### Phase 2 P3 reconcile apply (301→295행)

- `place-toolkit-reconcile-rules.mjs`: P3 5 slug 규칙 추가.
- **apply** (`lalibela,antarctica,raja-ampat,miyakojima,reykjavik`): 6행 merge+delete — `아디스아바바`→`랄리벨라`, `맥머도 기지`·`남극해`→`남극 대륙`, `라자암팟`→`라자 암팟`, `오키나와`→`미야코지마`, `레이니스퍄라`→`레이캬비크`.
- 브루나이 `flag_only` 유지.

### 재감사·공항 sync (P3 후)

- `toolkit:audit-place-id`: **`duplicateSlug 0`** · `geoMismatch 8→6` · `unmapped 1`(브루나이).
- `sync:airports-from-toolkit` + `audit:airports` **`none: 0`**.

### gateo.kr 스모크 QA (P3 slug)

- **레이캬비크** `/place/reykjavik/planner`: 제목·툴킷 **레이캬비크**, 공항·Trip.com **KEF** 일치(레이니스퍄라 중복 행 제거 반영).
- **랄리벨라** `/place/lalibela/planner`: 제목·툴킷 **랄리벨라**, 배너 **ADD+LLI**, Trip.com **ADD** — 아디스아바바 별도 행 없음.

### Phase 3 + 2d (이번 세션)

- **2d** `update-place-toolkit`: slug→SSOT 한글 `place_id` 정규화(`canonicalPlaceIdMap.json`·`PlannerTab` canonical 전달). Edge `HUB_COORDS` GPS/GYE/KEF/HKT/CUZ/USH/PUQ/ADD/MDY 추가.
- **3a** `travel-spot-airport-overrides.mjs`: galapagos·iceland·phuket·reykjavik·lalibela·ushuaia·cusco·patagonia curated `high`; midway·kerguelen·antarctica 승격. `rentalAirportHubs` LLI 추가.
- **3b** DB `toolkit:patch-guide-iata --apply` 4건(우수아이아·쿠스코·남극·파타고니아 primary IATA). `generate:airports` + `sync:airports-from-toolkit`.
- **감사**: `toolkit:audit-place-id` **`duplicateSlug 0`** · **`geoMismatch 0`** · `audit:airports` **`none: 0`**.

### 다음

1. `travelSpotAirports.json`·규칙·Edge Function **배포** (`update-place-toolkit` 재배포 필수).
2. gateo.kr 스모크: 갈라파고스 GPS/GYE·파타고니아 USH/PUQ 배너.
3. `unmapped` 52·툴킷 IATA 없음 37건 점진 검수.

## Phase D + 배포 후 QA (이번 세션)

### gateo.kr 스모크 QA (배포 c82ca95 반영)

- **갈라파고스** `/place/galapagos/planner`: 배너·Trip.com **GPS** (GYE 후보), SIN 잔존 없음.
- **파타고니아** `/place/patagonia/planner`: **USH·PUQ** 배너, EZE 없음.
- **우수아이아** `/place/ushuaia/planner`: 배너·Trip.com **USH**, EZE는 여정 타임라인 경유만(배너 아님).
- (선택) **레이캬비크** **KEF** · **랄리벨라** **ADD+LLI** 일치.

### Phase D — skippedNoIata 37→26

- `travel-spot-airport-overrides.mjs`: singapore·london·seoul(ICN+GMP)·jeju·kilimanjaro(JRO+NBO)·everest-base-camp·kuala-lumpur·amsterdam·cape-town·luxor·serengeti·similan-islands curated **high**.
- `rentalAirportHubs.js`: **JRO**(킬리만자로) 추가.
- medium→high: grand-canyon·hampi·nazca-lines·abu-simbel·sahara-desert·timbuktu.
- DB `toolkit:patch-guide-iata --apply` **12건**(우선 10 slug + 세렝게티·파타고니아 EZE 정리).
- `generate:airports` + `sync:airports-from-toolkit` + `audit:airports` **`none: 0`** 유지.

### 다음

1. **프론트·JSON 배포**(travelSpotAirports·overrides·rentalAirportHubs).
2. gateo.kr 스모크: 서울 ICN+GMP·킬리만자로 JRO 배너(배포 후).
3. 잔여 `skippedNoIata` 26·`unmapped` 52 점진 검수(annapurna·bohol·yokohama 등).

## 파타고니아 slug 범위 분리 (이번 세션)

- **patagonia** → 아르헨티나 **북부**(바릴로체·BRC/EZE), 좌표·desc·`name_en: Patagonia (Northern)` 재정의.
- **ushuaia** → USH·티에라델푸에go (남극·남부 크루즈 관문).
- **torres-del-paine** → PUQ·칠레 W트레킹 (북부·우수아이아와 별도 안내).
- `rentalAirportHubs` **BRC** 추가 · USH에서 patagonia alias 제거.
- DB `파타고니아` IATA USH/PUQ→**BRC/EZE** · 배너·툴킷·여정(바릴로체) 정합.
- `audit:airports` **`none: 0`** 유지.

### 다음

1. **프론트·JSON 배포** + Edge(재배포 완료).
2. gateo.kr QA: patagonia BRC/EZE·ushuaia USH·torres PUQ 배너·여정 일치.

## Phase D-2 + gateo.kr 스모크 QA (이번 세션)

### gateo.kr 스모크 QA (배포 3586fec)

- **킬리만자로** `/place/kilimanjaro/planner`: 배너 **JRO+NBO**, Trip.com **JRO** (NBO 단독 아님).
- **싱가포르** `/place/singapore/planner`: 배너·Trip.com **SIN**.
- **런던** `/place/london/planner`: 배너·Trip.com **LHR**.
- **제주** `/place/jeju/planner`: 공항 배너 **CJU** (툴킷 미생성·배너만).

### Phase D-2 — skippedNoIata 26→19

- `travel-spot-airport-overrides.mjs`: **bohol**(CEB+TAG)·**yokohama**(HND+NRT)·**tsushima**(TSJ+FUK) curated **high**.
- `rentalAirportHubs.js`: **TAG**(타그비라란)·**TSJ**(대마공항) 추가.
- `regionalGatewayIatas.ts`: annapurna-circuit·bohol·yokohama·tsushima.
- DB `toolkit:patch-guide-iata --apply` **7건**(안나푸르나·디에고가르시아·사하라·시미란·보홀·대마도·요코하마).
- `generate:airports` + `sync:airports-from-toolkit` + `audit:airports` **`none: 0`** · curated **93** slug.

### (선택) unmapped 52

- `toolkit:audit-place-id`: `unmapped 52` · P0 `unmapped 1`(브루나이 `flag_only`) · `duplicateSlug 0` · `geoMismatch 1`(디에고 가르시아 MLE — P0 제외).

### 다음

1. ~~**프론트·JSON 배포**~~ → **`1d0b3cd`** push·Vercel 반영 · Edge `update-place-toolkit` 재배포.
2. ~~gateo.kr QA (배포 후)~~: 보홀 **TAG+CEB** · 요코하마 **HND+NRT** · 대마도 **TSJ+FUK** 일치.
3. 잔여 `skippedNoIata` 19·`unmapped` 52 점진 검수.

## 연관 여행지 UI Gate·Phase D-3 (이번 세션)

### Gate 해제·연관 UI 1차

- **Gate G1–G3** 충족: `audit:airports` **`none: 0`** · `duplicateSlug 0` · **`skippedNoIata` 19→12** (≤20).
- `travelSpotClusters.json` — **patagonia-region**(patagonia·ushuaia·torres-del-paine) · **iceland-region**(iceland·reykjavik).
- `RelatedTravelSpots` + **PlannerTab** 배너 아래 교차 링크(관문 IATA 칩).
- 분류표: `scripts/data/place-id-residual-classification.json`.

### Phase D-3 — skippedNoIata·unmapped 배치

- DB `toolkit:patch-guide-iata --apply` **7건**(마데이라 FNC·발레타 MLA·블라디보스토크 VVO·이르쿠츠크 IKT·앨리스스프링스 ASP·아오시마 OIT·Ad Dakhiliyah MCT).
- `rentalAirportHubs` FNC·MLA·VVO·IKT·ASP·OIT·MCT 추가 → sync **placeId만** 7건 반영.
- 별칭: 나자레→lisbon · 빌라두코르부→porto · 리마→machu-picchu · 스코푸가포스→iceland · **마나도** blocklist.
- `audit:airports` **`none: 0`** 유지 · Hub **264**.

### 다음

1. **프론트·JSON 배포** — 연관 UI·hubs·travelSpotAirports.
2. gateo.kr QA: `/place/patagonia/planner` 연관 칩(ushuaia·torres) · iceland↔reykjavik.
3. 잔여 `skippedNoIata` **12**(국내·blocklist 위주) · `unmapped` 52 분류표 기반 배치.
