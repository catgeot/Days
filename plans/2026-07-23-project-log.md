# 2026-07-23 프로젝트 일지

직전: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md)

## Mapbox 정착지 — R17~R18 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R19 후임 기동)

- tip **182 hub / 546 settlements** (+20 hub / +60) · R17 그라나다·히로시마·탈린·태백·동해·아산·서산·창원·리버풀·말라가 · R18 뉘른베르크·가나자와·류블랴나·홍천·정선·울진·이천·밀양·버밍엄·제노바 · skip 0
- R17/R18 VERIFY: audit issues 0 · smoke 시드+exact(`아르미야`/`하쓰카이치`/`마르두`/`철암`/`묵호`/`배방`/`대산`/`진해`/`버켄헤드`/`토레몰리노스`/`퓌르트`/`노노이치`/`돔잘레`/`내촌`/`사북`/`죽변`/`부발`/`삼랑진`/`솔리헐`/`네르비`) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r17`/`_tmp-r18`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R19 A**: `bologna` · `bergen` · `vilnius` · `hoengseong` · `yeoju` / **B**: `yangsan` · `sacheon` · `pocheon` · `cardiff` · `strasbourg`
  - **R20 A**: `verona` · `nagoya` · `riga` · `boeun` · `okcheon` / **B**: `yeongdeok` · `cheongsong` · `yanggu` · `leeds` · `padua`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R19부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R15~R16 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R17 후임 기동)

- tip **162 hub / 486 settlements** (+20 hub / +60) · R15 로테르담·빌바오·인스브루크·신안·나주·화순·광양·원주·프랑크푸르트·토리노 · R16 겐트·두브로브니크·삿포로·충주·천안·삼척·양평·김해·맨체스터·툴루즈 · skip 0
- R15/R16 VERIFY: audit issues 0 · smoke 시드+exact(`스키담`/`게초`/`지도읍`/`오펜바흐`/`신트니클라스`/`차브타트`/`오타루`/`샐퍼드`/`블라냐크` 등) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r15`/`_tmp-r16`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R17 A**: `granada` · `hiroshima` · `tallinn` · `taebaek` · `donghae` / **B**: `asan` · `seosan` · `changwon` · `liverpool` · `malaga`
  - **R18 A**: `nuremberg` · `kanazawa` · `ljubljana` · `hongcheon` · `jeongseon` / **B**: `uljin` · `icheon` · `miryang` · `birmingham` · `genoa`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R17부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R13~R14 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R15 후임 기동)

- tip **142 hub / 426 settlements** (+20 hub / +60) · R13 발렌시아·마르세유·리옹·정읍·김제·익산·완주·해남·함부르크·브라티슬라바 · R14 자그레브·잘츠부르크·보르도·무안·영암·강진·장성·함평·글래스고·앤트워프 · skip 0
- R13/R14 VERIFY: audit issues 0 · smoke 시드+exact(`토렌트`/`엑상프로방스`/`빌뢰르반`/`사모보르`/`페삭`/`페이즐리`/`모르트셀` 등) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r13`/`_tmp-r14`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R15 A**: `rotterdam` · `bilbao` · `innsbruck` · `sinan` · `naju` / **B**: `hwasun` · `gwangyang` · `wonju` · `frankfurt` · `turin`
  - **R16 A**: `ghent` · `dubrovnik` · `sapporo` · `chungju` · `cheonan` / **B**: `samcheok` · `yangpyeong` · `gimhae` · `manchester` · `toulouse`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R15부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R11~R12 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R13 후임 기동)

- tip **122 hub / 366 settlements** (+20 hub / +60) · R11 오슬로·바르샤바·합천·곡성·영광·밀라노·부안·고창·레이캬비크·제네바 · R12 크라쿠프·베네치아·니스·무주·진안(전북)·임실·순창·장수·쾰른·나폴리 · skip 0
- R11/R12 VERIFY: audit issues 0 · smoke 시드+exact(`베르룸`/`몬차`/`비엘리치카`/`진안읍`/`레버쿠젠` 등) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r11`/`_tmp-r12`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R13 A**: `valencia` · `marseille` · `lyon` · `jeongeup` · `gimje` / **B**: `iksan` · `wanju` · `haenam` · `hamburg` · `bratislava`
  - **R14 A**: `zagreb` · `salzburg` · `bordeaux` · `muan` · `yeongam` / **B**: `gangjin` · `jangseong` · `hampyeong` · `glasgow` · `antwerp`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R13부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R09~R10 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R11 후임 기동)

- tip **102 hub / 306 settlements** (+20 hub / +60) · R09 아테네·취리히·에든버러·남원·거창·완도·진도·영주·세비야·포르투 · R10 브뤼셀·코펜하겐·더블린·함양·산청·고흥·장흥·구례·스톡홀름·헬싱키 · skip 0 (남원 `주천면`→`이백면` 이름충돌 보정)
- R09/R10 VERIFY: audit issues 0 · smoke 시드+exact(`피레아스`/`마토지뉴스`/`뢰번`/`에스포` 등) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r09`/`_tmp-r10`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- R10 = 계획서 중간 점검 포인트이나 **체인 정지 없음** — R11 후임 프롬프트 준비
- **다음 배치표 2개**
  - **R11 A**: `oslo` · `warsaw` · `hapcheon` · `gokseong` · `yeonggwang` / **B**: `milan` · `buan` · `gochang` · `reykjavik` · `geneva`
  - **R12 A**: `krakow` · `venice` · `nice` · `muju` · `jinan` / **B**: `imsil` · `sunchang` · `jangsu` · `cologne` · `naples`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R11부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R07~R08 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R09 후임 기동)

- tip **82 hub / 246 settlements** (+20 hub / +60) · R07 LA·SF·치앙라이·파주·부여·고성(강원)·인제·보성·마드리드·베를린 · R08 피렌체·비엔나·뮌헨·하동·제천·문경·단양·영월·리스본·부다페스트 · skip 0
- R07/R08 VERIFY: audit issues 0 · smoke 시드+exact(`산타모니카`/`간성읍`/`피에솔레`/`센텐드레` 등) PASS
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r07`/`_tmp-r08`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R09 A**: `athens` · `zurich` · `edinburgh` · `namwon` · `geochang` / **B**: `wando` · `jindo` · `yeongju` · `seville` · `porto`
  - **R10 A**: `brussels` · `copenhagen` · `dublin` · `hamyang` · `sancheong` / **B**: `goheung` · `jangheung` · `gurye` · `stockholm` · `helsinki`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R09부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R05~R06 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R07 후임 기동)

- tip **62 hub / 186 settlements** (+20 hub / +60) · R05 이스탄불·다낭·목포·진주·거제·군산·담양·수원·바르셀로나·밴쿠버 · R06 푸켓·치앙마이·청주·태안·울릉·강화·가평·공주·프라하·암스테르담 · skip 0
- R05/R06 VERIFY: audit issues 0 · smoke 시드+exact(`카디쾨이`/`호이안`/`파통`/`비노흐라디` 등) PASS
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r05`/`_tmp-r06`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R07 A**: `los-angeles` · `san-francisco` · `chiang-rai` · `paju` · `buyeo` / **B**: `goseong` · `inje` · `boseong` · `madrid` · `berlin`
  - **R08 A**: `florence` · `vienna` · `munich` · `hadong` · `jecheon` / **B**: `mungyeong` · `danyang` · `yeongwol` · `lisbon` · `budapest`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R07부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R03~R04 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R05 후임 기동)

- tip **42 hub / 126 settlements** (+20 hub / +60) · R03 해외8+포항·춘천 · R04 시드니·두바이·평창·양양·남해·안동·보령·순천·멜버른·오클랜드 · skip 0
- R03/R04 VERIFY: audit issues 0 · smoke 시드+exact(`첨사추이`/`본다이`/`대관령면`/`폰슨비` 등) PASS
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r03`/`_tmp-r04`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R05 A**: `istanbul` · `danang` · `mokpo` · `jinju` · `geoje` / **B**: `gunsan` · `damyang` · `suwon` · `barcelona` · `vancouver`
  - **R06 A**: `phuket` · `chiang-mai` · `cheongju` · `taean` · `ulleung` / **B**: `ganghwa` · `gapyeong` · `gongju` · `prague` · `amsterdam`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R05부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R01~R02 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**

- tip **22 hub / 66 settlements** (+20 hub / +60) · R01 국내10 · R02 국내4+도쿄·오사카·교토·방콕·타이베이·싱가포르 · skip 0
- R01/R02 VERIFY: audit issues 0 · smoke 시드+exact(`성북동`/`송도동`/`시부야`/`사카이` 등) PASS
- **다음 배치표 2개**
  - **R03 A**: `hong-kong` · `rome` · `london` · `new-york` · `fukuoka` / **B**: `hanoi` · `okinawa` · `ho-chi-minh` · `pohang` · `chuncheon`
  - **R04 A**: `sydney` · `dubai` · `pyeongchang` · `yangyang` · `namhae` / **B**: `andong` · `boryeong` · `suncheon` · `melbourne` · `auckland`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R03부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — Phase 0 스캐폴드

**상태**: ✅ 시드 2 hub / 6 settlements · audit·smoke PASS · Phase 0 커밋됨 · Phase 1a R01~ 진행 중(미커밋)

- SSOT [`mapboxSettlementPlaces.json`](../src/pages/Home/data/mapboxSettlementPlaces.json) · resolve · 검색 우선순위(여행지→hub→명소→settlements≤3)
- 시드: `sokcho`(설악동·노학동·청호동) · `paris`(베르사유·생드니·불로뉴비양쿠르)
- 큐 R01–R63 ([`mapbox-settlement-queue.md`](./mapbox-settlement-queue.md)) · method §5.3 · 계획 [`mapbox-settlement-plan.md`](./mapbox-settlement-plan.md)

## cityAttractionHubs — R68~R69 오케스트레이터 세대 (큐 소진 · 체인 종료)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **R48–R69 큐 소진** · 후임 Task 불필요(사람 보고)

- tip **630 hub / 4390 명소** (+20) · R68 남미·미국10 · R69 미·아프리카·남아시아·중국10 · `_tmp-r68*`/`_tmp-r69*` 정리
- 워커2 초안 → tip 선반영(EXISTS) → 메인 audit·스모크 VERIFY만 · EXISTS 예비 대체 없음
- R68/R69 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS · audit issues 0
- **다음 배치표**: 없음 (큐 소진) · 신규 R은 큐 문서에 R70+ 추가 후 재개
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- **방법 v2.1**: 큐 소진 시 사람 보고로 체인 종료 · 3단안 미적용

## cityAttractionHubs — R66~R67 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R68 후임 기동)

- tip **610 hub / 4250 명소** (+20) · R66 중국 관광10 · R67 코카서스·중앙亞·이란·네팔10 · `_tmp-r66*`/`_tmp-r67*` 정리
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r66`/`_tmp-r67`)·직렬 A→B·VERIFY까지 완료
- R66 보정: `qingdao` alias `청도` 드롭(`cheongdo` 충돌)
- R66/R67 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS · EXISTS 0
- **다음 배치표 2개**
  - **R68 A**: `arequipa` · `ushuaia` · `el-calafate` · `quito` · `la-paz` / **B**: `panama-city` · `minneapolis` · `tampa` · `maui` · `anchorage`
  - **R69 A**: `charleston` · `savannah` · `kampala` · `dar-es-salaam` · `livingstone` / **B**: `dhaka` · `islamabad` · `thimphu` · `wuhan` · `dunhuang`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R68부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지 · 3단안 미적용

## cityAttractionHubs — R64~R65 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**

- tip **590 hub / 4110 명소** (+20) · R64 미령·지중해·기타10 · R65 러시아·태평양·알프스·튀르키예10 · `_tmp-r64*`/`_tmp-r65*` 정리
- R64/R65 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS · EXISTS 0 · 충돌 보정 없음
- **다음 배치표 2개**
  - **R66 A**: `qingdao` · `sanya` · `xiamen` · `zhangjiajie` · `guilin` / **B**: `lijiang` · `lhasa` · `harbin` · `kunming` · `dalian`
  - **R67 A**: `tbilisi` · `yerevan` · `baku` · `almaty` · `tashkent` / **B**: `samarkand` · `tehran` · `shiraz` · `isfahan` · `pokhara`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지 · P1 시작
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R66부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지 · 3단안 미적용

## cityAttractionHubs — R62~R63 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**

- tip **570 hub / 3970 명소** (+20) · R62 베트남·필리핀·롬복10 · R63 동남아·일본10 · `_tmp-r62*`/`_tmp-r63*` 정리
- R62 보정: `호이안 구시가지` name_en → `Hoi An Historic Quarter` (danang `Hoi An Ancient Town` 충돌)
- R62/R63 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS · shrine 유지(구마모토·하코다테·이시가키·미야코지마·쓰시마)
- **다음 배치표 2개**
  - **R64 A**: `guam` · `saipan` · `santorini` · `cappadocia` · `kotor` / **B**: `bled` · `ibiza` · `crete` · `havana` · `ulaanbaatar`
  - **R65 A**: `moscow` · `st-petersburg` · `fiji` · `mauritius` · `tahiti` / **B**: `bora-bora` · `zermatt` · `cinque-terre` · `bodrum` · `antalya`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R64부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지 · 3단안 미적용

## 오케스트레이터 3단 검토안 문서화 (미적용)

**상태**: ✅ [`orchestrator-3tier-draft.md`](./orchestrator-3tier-draft.md) · 공식은 v2.1 유지

- 컨트롤러→지휘자→워커2 구조·요약 계약·적용 조건 기록
- v2.1 이관 체인에서 **첫 메인이 큐 완료를 사람 채팅에 보고하지 않는 이유**(지휘권·보고권 이양) 정리
- R62는 v2.1 · Task 안정 후 v3 후보

## cityAttractionHubs — R62–R69 사전 큐 준비

**상태**: ✅ 큐 문서 · R62–R63 VERIFY 완료 · 잔여 R64–R69 (상단 이관 절 기준)

- [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md) **R62–R69 (80 hub)** 사전 배치

## cityAttractionHubs — #22~#47 tip 점검·커밋

**상태**: ✅ audit issues 0 · resolve 스모크 PASS · **커밋·push** (`main`)

- 중단 직후 점검: tip **410 hub / 2850 명소** · #47(`chemnitz`…`daedeok`) 완전 반영 · `_batch*`/`_tmp*` 잔여 없음 · #48 미착수
- 구성: 국내 **210** / 해외 **200** (배치당 5:5 유지) · 최근 KR은 광역 **구 단위** 비중 큼(~53) · 해외는 독일·영국 편중(76/200)

### 국내 vs 해외 — 재개 방향 (권고)

| 옵션 | 판단 |
|------|------|
| 국내 구·시군 계속 | ❌ 비권고 — 주요 시군 대부분 커버, 잔여는 구 세분·검색 수요 대비 한계효용↓ |
| **해외 허브 우선** | ✅ **권고** — 미국·중국·동남아·인도·중동·중남미 공백 큼 · DE/UK 중소도시 추가 속도↓ |
| 혼합 5:5 유지 | 보류 — 국내 쪽 후보 품질이 떨어짐 |

**사전 배치 큐**: [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md) — **R48~R61** (14×10=140 hub) · 라운드당 워커A5+워커B5  
- **다음 시작 R48**: A=`chicago`·`miami`·`seattle`·`boston`·`las-vegas` / B=`honolulu`·`washington-dc`·`philadelphia`·`denver`·`atlanta`  
- `new-york`·`hong-kong` 등은 **EXISTS** → 큐에서 제외됨  
- 구 배치안 `muenster`…`bukgu_busan` **보류**

**제시어**: `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R48부터 워커2 · 큐 순서」

상세 배치 이력: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md) #22~#47 절.

## cityAttractionHubs — R48~R61 해외 큐 완료 · 커밋

**상태**: ✅ tip **550 hub / 3830 명소** · audit issues 0 · R48–R61 전부 ✅ · **커밋·push** (`main`)

- 410→550 (+140) · 오케스트레이터 v2.1(§4.2 지휘권 이양) · 후임 Task 부재 시 본인 런 예외로 머지한 세대 포함
- 방법론: [`orchestrator-method.md`](./orchestrator-method.md) v2.1 · 큐 [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md) 소진
- 다음: 새 해외 큐가 필요하면 큐 문서 확장 후 `오케스트레이터` 재개 · UI/`releaseNotes`는 별도 합의

## cityAttractionHubs — R60~R61 오케스트레이터 세대 (큐 소진)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **R48–R61 큐 소진**

- tip **550 hub / 3830 명소** (+20) · R60 동유럽·지중해·노르웨이10 · R61 유럽·남아시아·브루나이10 · `_tmp-r60`/`_tmp-r61` 정리
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- R60 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS · 보정 `Alexander Nevsky Cathedral Sofia`(tallinn 충돌)
- R61 VERIFY: hub/exact + 회귀·R60 샘플 PASS

## cityAttractionHubs — R58~R59 오케스트레이터 세대 (이관)


**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R60 후임 기동)

- tip **530 hub / 3690 명소** (+20) · R58 호주·NZ·일본10 · R59 일본·세르비아10 · `_tmp-r58`/`_tmp-r59` 정리
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r58`/`_tmp-r59`)·직렬 A→B·VERIFY까지 완료
- R58/R59 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS · shrine 유지(고베·센다이·나라·닛코·하코네·나가사키·마츠모토·다카야마)
- **다음 배치표 2개**
  - **R60** A=`bucharest`·`sofia`·`tirana`·`skopje`·`sarajevo` / B=`podgorica`·`valletta`·`nicosia`·`stavanger`·`trondheim`
  - **R61** A=`montpellier`·`palermo`·`faro`·`cork`·`galway` / B=`belfast`·`madeira`·`lahore`·`karachi`·`bandar-seri-begawan`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지: 솔로 계주 · tip 병렬 머지 · shrine 제거 · 시드(`sokcho`/`paris`) 덮어쓰기 · 워커 띄운 뒤 초안 전 턴 종료
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R60부터 워커2 · §4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## cityAttractionHubs — R56~R57 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R58 후임 기동)

- tip **510 hub / 3550 명소** (+20) · R56 중동·북아프리카10 · R57 아프리카·오세아니아10 · `_tmp-r56`/`_tmp-r57` 정리
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r56`/`_tmp-r57`)·직렬 A→B·VERIFY까지 완료
- R56/R57 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS
- **다음 배치표 2개**
  - **R58** A=`perth`·`adelaide`·`gold-coast`·`cairns`·`hobart` / B=`wellington`·`queenstown`·`christchurch`·`rotorua`·`kobe`
  - **R59** A=`yokohama`·`sendai`·`nara`·`nikko`·`hakone` / B=`nagasaki`·`matsumoto`·`takayama`·`beppu`·`belgrade`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지: 솔로 계주 · tip 병렬 머지 · shrine 제거 · 시드(`sokcho`/`paris`) 덮어쓰기 · 워커 띄운 뒤 초안 전 턴 종료
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R58부터 워커2 · §4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## cityAttractionHubs — R54~R55 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R56 후임 기동)

- tip **490 hub / 3410 명소** (+20) · R54 동남아·인도10 · R55 인도·남아시아·중동10 · `_tmp-r54`/`_tmp-r55` 정리
- **본인 런 예외/파이프 단절: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r54`/`_tmp-r55`)·직렬 A→B·VERIFY까지 완료
- R54/R55 VERIFY: hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑` PASS
- **다음 배치표 2개**
  - **R56** A=`doha`·`riyadh`·`jeddah`·`tel-aviv`·`jerusalem` / B=`amman`·`cairo`·`marrakech`·`casablanca`·`luxor`
  - **R57** A=`alexandria`·`tunis`·`fes`·`muscat`·`cape-town` / B=`johannesburg`·`nairobi`·`addis-ababa`·`zanzibar`·`brisbane`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지: 솔로 계주 · tip 병렬 머지 · shrine 제거 · 시드(`sokcho`/`paris`) 덮어쓰기 · 워커 띄운 뒤 초안 전 턴 종료
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R56부터 워커2 · §4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## cityAttractionHubs — R52~R53 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R54 후임 기동)

- tip **470 hub / 3270 명소** (+20) · R52 중국·대만·마카오10 · R53 동남아10 · `_tmp*` 정리됨
- R52/R53: tip EXISTS 선행 머지 → VERIFY만 · R53 보정: penang `George Town`→`George Town Penang`(washington-dc 충돌)
- **다음 배치표 2개**
  - **R54** A=`phnom-penh`·`luang-prabang`·`vientiane`·`yangon`·`kota-kinabalu` / B=`johor-bahru`·`delhi`·`mumbai`·`bangalore`·`jaipur`
  - **R55** A=`kolkata`·`chennai`·`hyderabad`·`agra`·`varanasi` / B=`goa`·`kathmandu`·`colombo`·`male`·`abu-dhabi`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지: 솔로 계주 · tip 병렬 머지 · shrine 제거 · 시드(`sokcho`/`paris`) 덮어쓰기 · 워커 띄운 뒤 초안 전 턴 종료
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R54부터 워커2 · §4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## cityAttractionHubs — R50~R51 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**

- tip **450 hub / 3130 명소** (+20) · R50 캐나다·멕시코·남미10 · R51 남미·중국10 · `_tmp*` 정리됨
- R50: 파이프 단절 복구 시 tip 이미 440(EXISTS) → VERIFY만 · R51: `Plaza de Armas`→도시접두 2 · alias `광주` 드롭(충돌)
- **다음 배치표 2개**
  - **R52** A=`xian`·`hangzhou`·`shenzhen`·`nanjing`·`suzhou` / B=`chongqing`·`macau`·`kaohsiung`·`taichung`·`tainan`
  - **R53** A=`kuala-lumpur`·`jakarta`·`manila`·`cebu`·`bali` / B=`penang`·`yogyakarta`·`surabaya`·`krabi`·`siem-reap`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지: 솔로 계주 · tip 병렬 머지 · shrine 제거 · 시드(`sokcho`/`paris`) 덮어쓰기 · 워커 띄운 뒤 초안 전 턴 종료
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R52부터 워커2 · §4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## cityAttractionHubs — R48~R49 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · resolve 스모크 PASS · **미커밋** · **§4.2 후임 Task 이관**

- tip **430 hub / 2990 명소** (+20) · R48 미국10 · R49 미+캐나다10 · `_tmp*` 정리됨
- R49 보정: `가든 디스트릭트`→`뉴올리언스 가든 디스트릭트` 등 접두 4건 · `country_en` US=`USA`
- **다음 배치표 2개**
  - **R50** A=`ottawa`·`quebec-city`·`mexico-city`·`cancun`·`guadalajara` / B=`oaxaca`·`rio-de-janeiro`·`sao-paulo`·`buenos-aires`·`lima`
  - **R51** A=`santiago`·`bogota`·`medellin`·`cusco`·`cartagena` / B=`montevideo`·`beijing`·`shanghai`·`guangzhou`·`chengdu`
- 우선: 해외 큐 순서만 · DE/UK 중소·KR 구 금지 · tip 직렬 A→B · VERIFY 전 이관 금지
- 금지: 솔로 계주 · tip 병렬 머지 · shrine 제거 · 시드(`sokcho`/`paris`) 덮어쓰기
- 스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng}]
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R50부터 워커2 · §4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## 오케스트레이터 방법 v2.1 (지휘권 이양 명시)

**상태**: ✅ method §1.1·§3.0·§4.2 · Rule `gateo-orchestrator.mdc` 갱신

- 세대 후 **사람 제시어 대기 금지** · 현 메인이 Task로 후임 메인에 지휘권 이양
- 제시어는 최초·§3.3 E·파이프 단절 복구용만

## 오케스트레이터 방법 v2 (2026-07-23)

**상태**: ✅ [`orchestrator-method.md`](./orchestrator-method.md) · Rule `gateo-orchestrator.mdc` · project-context · `.ai-context` 4절

- **고정**: 후임 메인 = **워커 2 재기동 → tip 직렬 머지 → 이관** (본인 런·배치마다 이관 금지)
- **재발 방지**: Task만·tip 미append 금지 · 이관서에 **다음 배치표 2개** · 명소 커버리지 §5.1(해외 우선)
- **§3.3 문제 조치**: audit FAIL→부분 제거/롤백 · A/B 비대칭 머지 · 중단 체크리스트 · 재작업/스킵 · 사람 escalate
- #22~#47 퇴화(솔로 계주) 교훈 반영
- **무결성**: 매 라운드 VERIFY PASS tip만 정상 — FAIL을 남긴 채 다음 턴 금지
