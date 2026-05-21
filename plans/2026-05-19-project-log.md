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

### gateo.kr 스모크 QA (배포 9a1c8a6)

- **파타고니아** `/place/patagonia/planner`: 연관 칩 **우수아이아(USH)·토레스 델 파이네(PUQ)** · 배너·Trip.com **BRC** · 클릭→`/place/ushuaia/planner` 전환 **USH** 일치.
- **우수아이아** `/place/ushuaia/planner`: 연관 **파타고니아(BRC·EZE)·토레 PUQ** · Trip.com **USH**.
- **아이슬란드** `/place/iceland/planner`: 연관 **레이캬비크(KEF)** · Trip.com·배너 **KEF**.
- **보홀** `/place/bohol/planner`: 배너 **TAG+CEB** · Trip.com **TAG**.
- **요코하마** `/place/yokohama/planner`: 배너 **HND+NRT** · Trip.com **HND**.
- **대마도** `/place/tsushima/planner`: 배너 **TSJ+FUK** · Trip.com **TSJ**.

### Phase D-4 — skippedNoIata 12→0

- sync: blocklist 11건 → `skippedBlocklisted` 분리 · **아바나** DB `HAV` 패치 + 허브 → `placeIds` 동기화.
- `audit:airports` **`none: 0`** · Hub **265**.

### Phase D-5 — delete 3건 + unmapped 1차 배치

- `place_toolkit` 삭제: **하이원팰리스호텔·닭갈비·달** (각 1행).
- unmapped: **alias 4** → `TRAVEL_SPOT_TOOLKIT_SYNONYMS` · **placeIds_only** sync 유지.
- `toolkit:audit-place-id`: **294행** · `unmapped 47` · P0 `unmapped 1`(브루나이) · `duplicateSlug 4`(alias 의도).
- `audit:airports` **`none: 0`** 유지.

### 다음

1. ~~`unmapped` reconcile/delete 후보~~ → **세션 A·B·C** (이번 세션, 아래).
2. gateo.kr 스모크·배포.

### 세션 C — madeira 승격

- `travelSpots.js` **madeira** 1건(id 366) · overrides FNC · aliases/synonyms · `travelSpotAirports` `linkedSlug`.
- `generate:airports` **Mapped 245/246** · `audit:airports` **`none: 0`**.

### 세션 B — borneo-region R3

- `travelSpotClusters.json` **borneo-region**(`borneo`·`kota-kinabalu`).

### 세션 A — reconcile apply

- `madagascar-unmapped`: Maroantsetra·안치라나나·노시베 섬 → **마다가스카르** merge+delete 3건.
- `unmapped-orphans`: 로라이마 산·우베를란지아·콜로니아 delete 3건.
- 브루나이 `flag_only`·borneo 병합 없음.

### 배포·gateo.kr 스모크 QA (`a9e1d41`)

- **파타고니아** `/place/patagonia/planner`: 연관 **우수아이아(USH)·토레스 델 파이네(PUQ)** · 배너·Trip.com **BRC**(+EZE 후보).
- **아이슬란드** `/place/iceland/planner`: 연관 **레이캬비크(KEF)** · Trip.com **KEF**.
- **보홀** `/place/bohol/planner`: **TAG+CEB** · Trip.com **TAG**.
- **요코하마** `/place/yokohama/planner`: **HND+NRT** · Trip.com **HND**.
- **대마도** `/place/tsushima/planner`: **TSJ+FUK** · Trip.com **TSJ** (→ 이후 FUK·배너 문구 수정, 아래).
- **마데이라** `/place/madeira/planner`: **FNC** · Trip.com **FNC** (신규 slug).
- **보르네오** `/place/borneo/planner`: **BKI/KCH/KUL** · 연관 **코타키나발루(BKI)** (borneo-region).
- `npm run audit:airports` → **none: 0**.

### 대마도·쓰시마 정합 (`tsushima` slug)

- **동일 여행지**: 대마도 = 쓰시마(対馬島) · 히타카츠 = 부산 페리 도착 항구(북부).
- **혼동 원인**: 공항 배너(TSJ) vs 툴킷 여정(부산 페리·ICN 직항 없음) · 데이터 오타 **津島**(아이치) → **対馬** 정정.
- **수정**: `bannerNote`·`preferredLinkIata` **FUK** · aliases(쓰시마·히타카츠) · `travelSpots` desc/keywords · 津島 alias 제거.
- **배포 후 QA**: `/place/tsushima/planner` — 페리 우선 안내·Trip.com **FUK** · `audit:airports` **none: 0**.

### 다음 (백로그)

1. ~~`unmapped` **40** · `new_slug_candidate`(블라디보스토크·이르쿠츠크·앨리스스프링스 등) 승격~~ → **세션 D** (이번, 아래).
2. (선택) PlaceCard 연관 칩 · `el-calafate` 세부 slug(제품 승인 후 G).
3. Trip.com 모바일 도착지 자동입력(§플래너 Trip.com 배너 상호작용 미완).

## 배포(85fffad) 스모크 + 세션 F·D·E (2026-05-21)

### gateo.kr 스모크 QA (배포 85fffad 반영)

- **대마도** `/place/tsushima/planner`: 대마도=쓰시마(対馬島) 안내 · 배너 **TSJ+FUK** · Trip.com **FUK** · 페리(부산→히타카츠) 여정·ICN 직항 없음 문구 일치.
- **마데이라** `/place/madeira/planner`: 배너·Trip.com **FNC** (승격 slug).
- **보르네오** `/place/borneo/planner`: **BKI** 배너·Trip.com **BKI** · 연관 칩 **코타키나발루(BKI)**.
- `npm run audit:airports` → **none: 0**.

### 세션 F — 대마도 배포 QA

- gateo.kr `/place/tsushima/planner` 위 스모크 기준 **이상 없음**(코드 수정 불필요).
- PlaceCardSummary 연관 칩: tsushima 클러스터 없음 → **보류**.

### 세션 D — citiesData 승격 3건

- `travelSpots.js`: **vladivostok**(367)·**irkutsk**(368)·**alice-springs**(369).
- `travel-spot-airport-overrides.mjs`: VVO·IKT·ASP curated **high**.
- aliases · `TRAVEL_SPOT_TOOLKIT_SYNONYMS` · `placeIds` **linkedSlug**.
- `extract-list` · `generate:airports` **Mapped 248/249** · `sync` · `audit:airports` **none: 0**.
- `place-id-residual-classification.json`: 3건 **status: promoted**.

### 세션 E — unmapped placeIds 배치

- alias 4건·placeIds_only sync 유지(브루나이 `flag_only`·borneo 병합 없음).
- `toolkit:audit-place-id`: **mapped 251** · **unmapped 37** · P0 **unmapped 1**(브루나이) · `duplicateSlug 4`(alias 의도).
- `audit:airports` **none: 0** 유지.

### 다음

1. **프론트·JSON 배포** — D 승격 3건·airports JSON.
2. gateo.kr QA: `/place/vladivostok/planner` · `/place/irkutsk/planner` · `/place/alice-springs/planner` (배포 후).
3. `el-calafate`(FTE) — 제품 승인 후 세션 G.

### brunei slug 승격 (2026-05-21)

- `travelSpots.js` **brunei**(370) · overrides **BWN** · aliases/synonyms · `placeIds` **linkedSlug**.
- `borneo-region` slugs: `borneo` · `kota-kinabalu` · **`brunei`** (교차 링크, 병합 없음).
- `toolkit:audit-place-id`: P0 **unmapped 0** (브루나이 mapped) · `audit:airports` **none: 0**.

### 세션 G — el-calafate 승격 (2026-05-21)

- `travelSpots.js` **el-calafate**(371) · overrides **FTE** · `rentalAirportHubs` FTE · aliases/synonyms.
- `patagonia-region` slugs: `patagonia` · **`el-calafate`** · `ushuaia` · `torres-del-paine`.
- DB `toolkit:patch-guide-iata --apply` 1건(el-calafate EZE 제거→FTE) · extract · generate · sync.
- `audit:airports` **none: 0** · `toolkit:audit-place-id` P0 **unmapped 0** · mapped **253**.

### el-calafate 새로고침 「알 수 없는 지역」수정

- 원인: `loc-{lat}-{lng}` URL 새로고침 시 `citiesData`만 조회 → SSOT 미매칭.
- `resolveTravelSpotFromCoords` · `mergeCanonicalTravelSpot` 좌표 병합 · `getPlaceUrlParam` slug 우선.

### 다음

1. ~~**프론트·JSON 배포** + Edge `update-place-toolkit`(FTE HUB_COORDS).~~ → 이번 커밋·배포.
2. gateo.kr QA: `/place/el-calafate/planner` FTE · 연관 칩 · `/explore` 검색.
3. 세션 C — `unmapped` 36 `placeIds_only` 배치.

---

## 배포 스모크 QA (10b8823 · 2026-05-21)

### gateo.kr

- **엘칼라파테** `/place/el-calafate/planner`: 배너·Trip.com **FTE** · 연관 칩 **파타고니아(BRC·EZE)·우수아이아(USH)·토레스 델 파이네(PUQ)** · slug URL·이름·desc 유지(새로고침).
- **파타고니아** `/place/patagonia/planner`: 연관 **엘칼라파테(FTE)·USH·PUQ** · 배너·Trip.com **BRC**.
- **/explore** 검색: `엘칼라파테`·`El Calafate` → 자동완성 **엘칼라파테** 노출.
- `npm run audit:airports` → **none: 0** · `toolkit:audit-place-id` P0 **unmapped 0** · `unmapped 36`(placeIds_only·승격 보류 3건).

### 세션 C — placeIds_only 13건 travelSpots 승격 (2026-05-21)

- **승격 slug(372–384)**: hamburg · cocos-islands · pitcairn-islands · greenland · falkland-islands · solomon-islands · nauru · queenstown · minneapolis · perth · bahamas · sri-jayawardenapura · venezuela.
- overrides·`rentalAirportHubs`(HAM·CCK·MPM·HIR·INU·NAS·CCS·GOH) · aliases/synonyms · `extract-list` **264**건.
- `generate:airports` **Mapped 263/264** · `audit:airports` **`none: 0`** · `toolkit:audit-place-id` **mapped↑ unmapped 36→21** · P0 **unmapped 0**.
- 함부르크 HAM·베네수엘라 CCS·포클랜드 MPM 등 툴킷 오탐 overrides 보정.

### 다음

1. **프론트·JSON 배포** + (선택) `toolkit:patch-guide-iata --apply` 세션 C 13건.
2. gateo.kr QA: 퀸스타운 ZQN · 함부르크 HAM · 퍼스 PER 등 신규 slug.
3. (선택) PlaceCardSummary 연관 칩 · Trip.com 모바일 도착지.

## 세션 종료 (2026-05-21 · 세션 G)

- **커밋**: el-calafate 승격·patagonia-region·loc URL 새로고침 수정·문서.
- **배포 후 QA**: `/place/el-calafate/planner` FTE · 새로고침 이름·desc · `audit:airports none:0`.

## 플래너 Trip.com 모바일 배너·UX (완료)

### 배경

- 데스크톱 900×200 Trip.com iframe이 모바일에서 잘리고 검색 UI가 작게 보임.
- 플래너 보조 설명·맨 위 FAB·핀치 줌·제휴 뱃지/X 버튼 겹침 등 가독성·조작 이슈.

### 구현

- **`affiliate.js`**: `TRIPCOM_FLIGHT_AD` 모바일 **S17158794** · `trip_sub1` 「플래너 항공권 모바일」 · `buildTripcomPlannerFlightUrl` `adId`/`tracking` 분기.
- **`TripcomFlightBannerWidget`**: `useTripcomPlannerBannerDimensions`(≤767px → 320×480) · 모바일 스케일 상한 1.
- **`PlannerAffiliateLinkBadge`**: 우상단 「제휴링크」를 `-translate-x-full`로 왼쪽 이동(Trip.com 도착 공항 X와 비겹침).
- **`readableText.js`**: 보조·캡션 `text-xs` 통일 · `plannerScrollSurfaceClass`(`pinch-zoom-scroll`).
- **`PlannerTab`**: 보조글 상향 · FAB 파란 원형·하단 배치 · `overflow-x-hidden` · 콘텐츠 `max-w-2xl`~`4xl` 단계.
- **`PlaceChatPanel`**: 플래너 모드 고정 헤더 탭 → `planner-scroll-to-top` 이벤트(iOS 상태바 탭 대체).

### QA

- gateo.kr 모바일: Trip.com 모바일 배너·도착 IATA 자동 반영 · 제휴링크/X 비겹침 · 핀치 줌·맨 위 버튼·헤더 탭 스크롤 **정상**.

## 플래너 Trip.com 항공 링크·CTA (완료)

### 배경

- Trip.com iframe 클릭 시 **빈 탭**이 남고 Chrome에서 gateo 복귀가 불편.
- `/flights/` 직링크에도 **제휴 파라미터**(`Allianceid`, `SID`, `trip_sub1`, `trip_sub3`, IATA)가 포함되므로 ad 배너 재경유는 불필요.
- 툴킷 항공 CTA: 보라 그라데이션 위 **회색 보조글**(`plannerCaption`)로 시인성 저하.

### 구현

- ~~**`TripcomFlightBannerWidget`**: iframe 오버레이~~ → **`ce2ee7a`에서 제거**(iframe 직접 조작, `partnerNavigation`으로 링크 정책 분리).
- **`WhiteLabelWidget`**: `/flights/` 직링크 · `openTripcomExternalUrl`.
- **`affiliate.js`**: `resolveTripcomFlightTracking` · 필수 준비 **`trip_sub1=플래너 필수준비 항공권 검색 일반`**, **`trip_sub3=D17159522`**.
- **`PreTravelChecklist`**: 항공·숙소·픽업 **→ 화살표 제거** · 항공 `/flights/` 직연결.
- **`FlightSearchCta`**: ICN→IATA 뱃지 · 고대비 그라데이션 · `ToolkitCard` 항공 파트 적용.

### QA (로컬)

- 모바일: Trip.com 이동 후 **뒤로가기**로 플래너 복귀 · 빈 탭 없음.
- 툴킷 항공 CTA: 부제·노선 뱃지 **가독성** 개선.

## 플래너 클룩 렌터카·여정 키워드 (완료)

### 배경

- 여정 타임라인 **렌터카 검색** 버튼이 `자동차`·`차량`·`렌탈` 등 넓은 키워드로 **오탐** 다수.
- 렌터카 배너를 **정식 공항명** 검색으로 연동했으나, 좌표·허브 오탐과 클룩 인덱스(예: 호놀룰루 ✅ / 다니엘 K. 이누우에국제공항 ❌) 때문에 **여행지명**이 더 낫다는 판단.

### 구현

- **`JourneyTimeline`**: 렌터카 키워드 **축소**(렌터카·렌트카·car rental 등만). 버튼 URL **`getKlookRentalHomeUrl`**(aff_adid 1277252). 보조 문구 **`getRentalCarTimelineActionDescription`**(연동 IATA 안내).
- **`ToolkitCard` / `utils.js` (`airport_transfer`)**: **공항 픽업 검색**·**렌터카 홈** 링크 버튼 → 렌터카 홈. 기존 **안내 문구** 유지(항공편명·공항 코드 subtext). **`KlookCarBannerWidget`** 유지.
- **`affiliate.js`**: 배너·`getKlookRentalUrlByLocation` 검색어 **`resolveKlookRentalBannerSearchLabel`** — 기본 **`location.name`**. 홍콩·도쿄 등 **`city_id` 딥링크** 유지.
- **`klookBannerLayout`**: 배너 하단 「여행지명으로 검색… 렌터카 검색 링크」.
- **`readableText`**: `plannerLinkHint`(버튼 보조글 크기·굵기).
- **문서**: [`klook-rental-search-data.md`](./klook-rental-search-data.md) — 검색어 역할·향후 `klookRentalSearchLabel` 예외 스키마. [`.ai-context.md`](../.ai-context.md)·[`travel-spots-management.md`](./travel-spots-management.md) 링크.

### 후속 (여행지·공항 DB 완료 후)

- `travelSpotAirports.json`에 **`klookRentalSearchLabel`** / **`klookRentalSearchMode: 'airport'`** 예외만 수동 추가(나리타 등).
- gateo.kr QA: 배너 클릭 검색어·렌터카 홈 링크·호놀룰루·다중 공항 샘플.

## 플래너 Trip.com 배너 상호작용·모바일 도착지 (`ce2ee7a`, 배포)

### 배경

- 배너가 **전체 오버레이 링크**(`pointer-events-none` + `/flights/` 덮개)라 목적지·일자 수정 불가 → 링크 배너처럼만 동작.
- 이전 **새 탭·복귀 UX** 수정(오버레이·`omitLocaleBundle`·`noreferrer` 등)이 모바일 **도착지 자동입력**과 엇갈림.
- 관찰: **Referer(gateo.kr)가 전달되면** Trip.com 모바일이 `aAirportCode` 자동입력을 무시하는 경우가 있고, **Referer 없을 때**는 URL 파라미터만으로 도착지가 채워지는 사례 확인(데스크톱은 정상).

### 구현 (`ce2ee7a` → `main` 푸시 · Vercel Production)

- **`TripcomFlightBannerWidget`**: 오버레이 제거 → iframe 직접 조작 가능.
- **`affiliate.js`**: 모바일 `omitLocaleBundle` 제거 — ad·`/flights/` URL에 데스크톱과 동일하게 `locale`·`curr`·`trip_sub3`·`aAirportCode`·`dAirportCode` 포함.
- **`partnerNavigation.js`**: Trip.com 전용 분기
  - 데스크톱 `_blank` + `rel=noopener`(Referer 유지 → 새 탭 **gateo.kr** 복귀 링크).
  - 모바일 `_self` + `rel=noreferrer` + iframe `referrerPolicy=no-referrer`(도착지 파라미터 우선).
  - `openTripcomExternalUrl` — 모바일은 `<a rel=noreferrer>` 클릭으로 이동(`location.assign`은 Referer 전송).
- **`WhiteLabelWidget`**, **`PreTravelChecklist`**, 배너 「전체 화면 검색」에 위 정책 적용.
- **버그 수정**: `getPartnerLinkRel` 미정의 ReferenceError → `getTripcomLinkRel`로 정정.

### QA (로컬)

- **데스크톱**: 화면·배너·도착지 자동입력 **정상**.
- **모바일**: 플래너·배너 **화면 정상**(크래시 해소). **도착지 자동입력은 미해결** — 배너 iframe·「전체 화면 검색」 동일.

### 다음 세션

1. 실기기에서 모바일 ad(`S17158794`) vs `/flights/` 직링크·Referer 조합 재현·Trip.com 측 동작 확인.
2. 필요 시 모바일만 `mode=ad` 직연결·파라미터 실험 또는 Trip 제휴 문의.
3. §「플래너 Trip.com 항공 링크·CTA」·§「모바일 배너·UX」 문서를 **현재 코드**(오버레이 제거·`partnerNavigation`) 기준으로 정리(문서는 아직 구 구현 설명).
