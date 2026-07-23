# 2026-07-23 프로젝트 일지

직전: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md)

## Trip.com 숙소 city ID — 성수기 선제 (아조레스·타히티)

**상태**: ✅ city **49** · 사람 수동 확인 후 등록 · **커밋·push**

- 배경: 라로통가형 — MRT `total`&gt;5여도 성수기 bookable 급감 → ≤5 CTA 시 city 없으면 세션 잔존
- 등록 (제목·hreflang 검증): `azores`→**3737**(폰타 델가다) · `tahiti`→**61672**(타히티 섬 허브≠보라보라)
- 다음 워치(미등록): 뉴칼레도니아·괌·모리셔스·몰디브·로포텐·사이판·이스터 등

## Trip.com 숙소 city ID — CTA 후보 gap 채움

**상태**: ✅ city **47** · LIVE size50 CTA gap **0** · **커밋·push** (`f6c8848`)

- 원인: MRT 저재고(bookable≤5)·empty 시 Trip CTA에 `city=` 없으면 **직전 세션 지역 잔존** (대마도 등)
- 감사: `MRT_STAY_AUDIT_SIZE=50` LIVE · `audit:tripcom-hotel-city-gaps`가 `total≤5|priced≤5` 포함
- 등록 19 (제목·hreflang 검증): `tsushima`→**95255** · `malta`→**1264** · `lombok`→**1392** · `bora-bora`→**61019** · `yosemite`→**346626**(밸리) · `havana`→**690** · `moscow`→**366** · `bled`→**4102** · `corsica`→**1712**(아작시오) · `torres-del-paine`→**10149**(나타레스) · `borneo`→**1393**(코타키나발루) · `chichen-itza`→**36428**(바야돌리드) · `everest-base-camp`→**7380**(루클라) · `uluru`→**61767**(율라라) · `peninsula-valdes`→**5624**(마드린) · `vladivostok`→**628** · `irkutsk`→**672** · `kamchatka`/`kamchatka-peninsula`→**56415**
- 금지 유지: 미검증 city · 전수 카탈로그 · Trip 스크래핑

### 에이전트 핸드오프

| | |
|--|--|
| **읽을 것 3** | 본 절 · `PLANNER_TRIPCOM_HOTEL_CITY_IDS` · `npm run audit:tripcom-hotel-city-gaps` |
| **할 일** | PROD QA: 대마도→몰타 등 CTA 연속 클릭 시 세션 잔존 없는지 · Vercel 반영 후 |
| **금지 3** | 미검증 city · LIVE 없이 priced 전수 추측 · `VITE_` |
| **제시어** | `숙소-이어하기` · 「Trip CTA city 세션 잔존 QA(대마도·몰타)」 |

## TourAPI — 3단계 QA·시드 (진행)

**상태**: ✅ Edge LIVE · audit/smoke PASS · SSOT **40 spots / 19 contentId** · 랭킹·hub 키워드 · **속도/깨진사진 보정** · 캐시 v1.8 · **미커밋** · UI QA·push·릴리스 합의 대기  
**계획**: [`tourapi-edge-proxy-plan.md`](./tourapi-edge-proxy-plan.md)

- Edge 갤러리 QA: 경복궁(근정전) · 해운대 · 서울전경 · 제주오름 상단 · 파리 TourAPI 미적용 PASS
- 시드+: 창경궁·광화문·흥인지문·롯데월드타워·오죽헌·창덕궁(keyword) · hub `photoKeywords`(서울/부산/제주)
- 랭킹: 공항·축제·상품관·자물쇠 등 강등 · CACHE **v1.8**
- **속도**: searchPhoto 키워드 **병렬** · 키워드≤3 · rows 축소 · thumbnail은 detail만
- **깨진 URL**: 로드 프로브 후 제외 · UI `onError`→세션 드롭
- 한계: data.go.kr 원본 RTT·CDN 품질은 상한 있음 · 재방문은 session/place_stats 캐시
- Agent 브라우저: 로컬 HTTPS self-signed 인증서 우회 **미승인** → 사람 로컬 UI 스팟체크 필요
- 금지 유지: `VITE_` · UI 대규모 · 합의 전 releaseNotes

### TourAPI 세션 — 에이전트 핸드오프 (UI·릴리스)

| | |
|--|--|
| **읽을 것 3** | [`.ai-context.md`](../.ai-context.md) 3·6절 · [`tourapi-edge-proxy-plan.md`](./tourapi-edge-proxy-plan.md) §3단계 · 본 절 |
| **할 일** | 로컬 UI QA(경복궁·서울·해운대·파리) · 커밋/push 요청 시 실행 · 릴리스 **합의 후** 반영 |
| **금지 3** | `VITE_` 노출 · UI 임의 변경 · 합의 전 releaseNotes |
| **제시어** | 아래 「다음 세션 제시어」 블록 |

**다음 세션 제시어** (복붙):

```
TourAPI-이어하기
@plans/2026-07-23-project-log.md
@plans/tourapi-edge-proxy-plan.md
3단계 마무리: 로컬 UI QA 결과 반영 + 커밋/push + 릴리스 합의.
시드40·랭킹·캐시 v1.7 코드 준비됨. UI/릴리스는 합의 후.
```

## TourAPI — 국내 관광 사진·정보 (2단계 매핑·갤러리)

**상태**: ✅ SSOT(당시 34) · 전경 랭킹 · audit/smoke · **커밋** · Edge photographer 재배포 · 3단계에서 40으로 확장

- SSOT: overrides → `generate:tourapi` → `travelSpotTourApi.json` · `tourApiMatch` · soft 국내
- 갤러리: session → TourAPI → place_stats → Unsplash/Pexels
- 출처: `galleryImageAttribution` `tourapi` → 한국관광공사

## TourAPI — 1단계 Edge (완료)

**상태**: ✅ Edge 배포 · LIVE 스모크 PASS · **커밋**

- Edge `tourapi-proxy` — action: `searchKeyword`/`detailCommon`/`detailImage`/`searchPhoto` · Secret `TOUR_API_SERVICE_KEY` only
- 배포: `npx supabase functions deploy tourapi-proxy --project-ref phdjnbfitvmrguqzverm --no-verify-jwt`
- `npm run smoke:tourapi` · LIVE 경복궁 chain PASS

## 갤러리 — 남이섬 TourAPI 보강

**상태**: ✅ 커밋·push

- `namiseom` 키워드: `남이섬 전경`(0건) → `남이섬 메타세쿼이아`·`짚와이어_남이섬`
- `detailImage` 8→20 · 갤러리 목표 18→24 · 캐시 `v1.10`
- curated `photoKeywords` 있을 때 자동 전경/야경 생략 (슬롯 낭비 방지)

## 검색 — 정착지 exact 허브형 역펼침

**상태**: ✅ 커밋·push

- `설악동`/`베르사유` exact: 부모 hub + 히트 지역 + 명소 + 형제 지역 (탐색 메뉴)
- 명소 exact(`낙산사`)는 정착지 미포함 유지 · hub exact(`속초`) 기존 ≤3 유지
- Enter `requireChoice` 동일 클러스터 · hybrid Mapbox skip

## 숙소 모달 — 더보기·하단 CTA·구간 구분

**상태**: ✅ 커밋·push

- fetch 50 유지 · UI `MRT_STAY_PAGE_SIZE`(20)씩 「N곳 더 보기」·정렬은 전체 목록 기준
- 하단 패딩·맨 위(우측) 여유 · 앱 내 더보기(amber 필) vs MRT 사이트 링크(텍스트) 구분
- 저재고: MRT 사이트 「더 보기」제외 · 관광청·Trip만 · 예약가능/일정조정 구분 박스 강화
- 캐시 prefix `gateo:mrt-stays:v18`

## 검색바 — Enter 선택 카드 강제 + 홈 써머리

**상태**: ✅ 커밋·push · QA 대기

- Explore Enter: `handleSmartSearch(q, { requireChoice: true })` — 후보 1개여도 선택 카드 (빈/파리·명소·정착지·geocode/AI)
- 선택·드롭다운 클릭: 카탈로그 포함 **홈 써머리** (`/place` 직행 제거)
- 티커·`?search=`는 `requireChoice` 없음(현행 자동 점프)
- 명소 역펼침(드롭다운) 유지 · 정착지 tip 미수정

## Mapbox 정착지 — R61~R63 오케스트레이터 세대 (큐 소진 · 체인 종료)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **커밋·push** · **R01–R63 큐 소진** · **후임 Task 불필요 · 사람 보고**

- tip **629 hub / 1884 settlements** (+27 hub / +80) · R61 CA/IR/NP/PE/AR10 · R62 LATAM/US9(`el-calafate` skip) · R63 AF/SA/CN8 · hub skip 1(`el-calafate` sparse &lt;2 ≤50km)
- R61 VERIFY: audit 0 · smoke 시드+exact(`숨가이트`/`탈가르`/`치르치크`/`우르구트`/`카라지`/`마르브다슈트`/`나자파바드`/`레크나트`/`세로콜로라도`/`알만사`) PASS
- R62 VERIFY: audit 0 · smoke 시드+exact(`상골키`/`엘알토`/`아라이한`/`세인트폴`/`세인트피터즈버그`/`카훌루이`/`이글리버`/`마운트플레전트`/`풀러`) PASS
- R63 VERIFY: audit 0 · smoke 시드+exact(`엔테베`/`키바하`/`빅토리아폴스`/`나라양간즈`/`라왈핀디`/`파로`/`차이뎬`/`칠리`) PASS · `dunhuang` 초안 파손 1회 §3.3 부분 교정 후 재VERIFY
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY( R61→R62→R63 같은 턴)
- **체인 종료**: 큐 잔여 없음 · 후임 오케스트레이터 Task 기동 불필요 · tip 머지 커밋·push · 다음 Phase 1b `mapboxId`는 별도
- 금지 유지: tip 병렬 · POI · 시드 `sokcho`/`paris` 덮어쓰기 · UI/releaseNotes

## Mapbox 정착지 — R59~R60 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R61 후임 기동)

- tip **602 hub / 1804 settlements** (+20 hub / +60) · R59 피지·모리셔스·타히티·보라보라·체르마트·친퀘테레·보드룸·안탈리아·칭다오·산야 · R60 샤먼·장가계·구이린·리장·라사·하얼빈·쿤밍·다롄·트빌리시·예레반 · hub skip 0
- R59/R60 VERIFY: audit issues 0 · smoke 시드+exact(`부니다와`/`포트루이스`/`파페에테`/`바이타페`/`태슈`/`몬테로소`/`비테즈`/`라라`/`청양`/`톈두`/`지메이`/`우링위안`/`링촨`/`슈허`/`두일룽더칭`/`아청`/`안닝`/`진저우다롄`/`루스타비`/`아슈타라크`) PASS
- 보정: 섬·산악·CN/TR/IT/CH/GE/AM suburb·city·locality·place only(hub 도시명 미투입·fiji 고원 마을·사찰/유적 POI 제외) · ≤50km · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R61 A**: `baku` · `almaty` · `tashkent` · `samarkand` · `tehran` / **B**: `shiraz` · `isfahan` · `pokhara` · `arequipa` · `ushuaia`
  - **R62 A**: `el-calafate` · `quito` · `la-paz` · `panama-city` · `minneapolis` / **B**: `tampa` · `maui` · `anchorage` · `charleston` · `savannah`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · CA/IR/NP/LATAM/US 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피 · sparse면 스킵 OK · R63(잔여 8 hub)은 다음다음 세대
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R61부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R57~R58 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R59 후임 기동)

- tip **582 hub / 1744 settlements** (+20 hub / +60) · R57 아유타야·방비엥·바간·구마모토·하코다테·이시가키·미야코지마·쓰시마·괌·사이판 · R58 산토리니·카파도키아·코토르·블레드·이비자·크레타·하바나·울란바토르·모스크바·상트페테르부르크 · hub skip 0
- R57/R58 VERIFY: audit issues 0 · smoke 시드+exact(`방파인`/`냥우`/`마시키`/`나나에`/`가비라`/`히라라`/`이즈하라`/`하갓냐`/`가라판`/`피라`/`괴레메`/`도브로타`/`레스체`/`산타율라리아`/`레팀노`/`베다도`/`준모드`/`힘키`/`푸시킨`) PASS
- 보정: TH/LA/MM/JP 섬·EU/CU/MN/RU suburb·city·locality·place only(hub 도시명 미투입·섬 내 locality·bagan/cappadocia 인근 마을·사찰/유적 POI 제외) · ≤50km · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R59 A**: `fiji` · `mauritius` · `tahiti` · `bora-bora` · `zermatt` / **B**: `cinque-terre` · `bodrum` · `antalya` · `qingdao` · `sanya`
  - **R60 A**: `xiamen` · `zhangjiajie` · `guilin` · `lijiang` · `lhasa` / **B**: `harbin` · `kunming` · `dalian` · `tbilisi` · `yerevan`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · 섬·CN/TR/IT/CH/GE/AM 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피 · sparse면 스킵 OK
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R59부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R55~R56 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R57 후임 기동)

- tip **562 hub / 1684 settlements** (+20 hub / +60) · R55 파로·코크·골웨이·벨파스트·마데이라·라호르·카라치·반다르스리브가완·호이안·후에 · R56 나트랑·푸꾸옥·사파·보라카이·팔라완·엘니도·보홀·롬복·코사무이·랑카위 · hub skip 0
- R55/R56 VERIFY: audit issues 0 · smoke 시드+exact(`올량`/`코브`/`오란모어`/`리스번`/`푼샬`/`셰이쿠푸라`/`클리프턴`/`가동`/`디엔반`/`흐엉투이`/`깜란`/`즈엉동`/`라오까이`/`마녹마녹`/`푸에르토프린세사`/`코롱코롱`/`타그빌라란`/`마타람`/`차웽`/`쿠아`) PASS
- 보정: EU/IE/PT/PK/BN/VN/SEA suburb·city·locality only(hub 도시명 미투입·섬 허브는 섬 내 locality·POI 제외) · ≤50km · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R57 A**: `ayutthaya` · `vang-vieng` · `bagan` · `kumamoto` · `hakodate` / **B**: `ishigaki` · `miyakojima` · `tsushima` · `guam` · `saipan`
  - **R58 A**: `santorini` · `cappadocia` · `kotor` · `bled` · `ibiza` / **B**: `crete` · `havana` · `ulaanbaatar` · `moscow` · `st-petersburg`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · TH/LA/MM/JP/섬·EU/CU/MN/RU 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피 · sparse면 스킵 OK
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R57부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R53~R54 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R55 후임 기동)

- tip **542 hub / 1624 settlements** (+20 hub / +60) · R53 나라·닛코·하코네·나가사키·마츠모토·다카야마·벳푸·베오그라드·부쿠레슈티·소피아 · R54 티라나·스코페·사라예보·포드고리차·발레타·니코시아·스타방에르·트론헤임·몽펠리에·팔레르모 · hub skip 0
- R53/R54 VERIFY: audit issues 0 · smoke 시드+exact(`야마토코리야마`/`우쓰노미야`/`오다와라`/`이사하야`/`시오지리`/`히다`/`오이타`/`판체보`/`오테페니`/`페르니크`/`두러스`/`쿠마노보`/`일리자`/`단일로브그라드`/`슬리에마`/`스트로볼로스`/`산드네스`/`말빅`/`라테스`/`몬레알레`) PASS
- 보정: JP/EU/MED suburb·city·locality only(hub 도시명 미투입·신사·사찰 POI 제외) · ≤50km · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R55 A**: `faro` · `cork` · `galway` · `belfast` · `madeira` / **B**: `lahore` · `karachi` · `bandar-seri-begawan` · `hoi-an` · `hue`
  - **R56 A**: `nha-trang` · `phu-quoc` · `sapa` · `boracay` · `palawan` / **B**: `el-nido` · `bohol` · `lombok` · `koh-samui` · `langkawi`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · EU/IE/PT/PK/BN/VN/SEA 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피 · sparse면 스킵 OK
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R55부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R51~R52 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R53 후임 기동)

- tip **522 hub / 1564 settlements** (+20 hub / +60) · R51 페스·무스카트·케이프타운·요하네스버그·나이로비·아디스아바바·잔지바르·브리즈번·퍼스·애들레이드 · R52 골드코스트·케언즈·호바트·웰링턴·퀸스타운·크라이스트처치·로토루아·고베·요코하마·센다이 · hub skip 0
- R51/R52 VERIFY: audit issues 0 · smoke 시드+exact(`세프루`/`시브`/`스텔렌보스`/`샌드턴`/`웨스트랜즈`/`비쇼프투`/`스톤타운`/`입스위치`/`프리맨틀`/`글레넬그`/`사우스포트`/`팜코브`/`샌디베이`/`로워헛`/`애로타운`/`리틀턴`/`응옹고타하`/`아시야`/`가마쿠라`/`나토리`) PASS
- 보정: AF/AU/NZ/JP suburb·city·locality only(hub 도시명 미투입·POI 제외) · ≤50km · gold-coast hub alias `Surfers Paradise` 충돌→`사우스포트` · zanzibar 섬 정착지(스톤타운·부부부·파제) · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R53 A**: `nara` · `nikko` · `hakone` · `nagasaki` · `matsumoto` / **B**: `takayama` · `beppu` · `belgrade` · `bucharest` · `sofia`
  - **R54 A**: `tirana` · `skopje` · `sarajevo` · `podgorica` · `valletta` / **B**: `nicosia` · `stavanger` · `trondheim` · `montpellier` · `palermo`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · JP/EU/MED 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피 · sparse면 스킵 OK
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R53부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R49~R50 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R51 후임 기동)

- tip **502 hub / 1504 settlements** (+20 hub / +60) · R49 하이데라바드·아그라·바라나시·고아·카트만두·콜롬보·말레·아부다비·도하·리야드 · R50 제다·텔아비브·예루살렘·암만·카이로·마라케시·카사블랑카·룩소르·알렉산드리아·튀니스 · hub skip 0
- R49/R50 VERIFY: audit issues 0 · smoke 시드+exact(`세쿤데라바드`/`다얄바그`/`사르나트`/`마르가오`/`파탄`/`데히왈라`/`훌후말레`/`무사파`/`알와크라`/`디리야`/`오브후르`/`라마트간`/`베들레헴`/`자르카`/`기자`/`아이트우리르`/`모함메디아`/`아르만트`/`아부키르`/`라마르사`) PASS
- 보정: IN/SA/ME/AF suburb·city·locality only(hub 도시명 미투입·POI 제외) · ≤50km · 제다 `투왈`·마라케시 `아미즈미즈`·알렉산드리아 `보르게알아랍` 거리초과→`브리에만`/`타메슬루트`/`암레야` · male 섬 정착지 3 · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R51 A**: `fes` · `muscat` · `cape-town` · `johannesburg` · `nairobi` / **B**: `addis-ababa` · `zanzibar` · `brisbane` · `perth` · `adelaide`
  - **R52 A**: `gold-coast` · `cairns` · `hobart` · `wellington` · `queenstown` / **B**: `christchurch` · `rotorua` · `kobe` · `yokohama` · `sendai`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · AF/AU/NZ/JP 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피 · sparse면 스킵 OK
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R51부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R47~R48 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R49 후임 기동)

- tip **482 hub / 1444 settlements** (+20 hub / +60) · R47 마닐라·세부·발리·페낭·욕야카르타·수라바야·크라비·시엠립·프놈펜·루앙프라방 · R48 비엔티안·양곤·코타키나발루·조호르바루·델리·뭄바이·방갈로르·자이푸르·콜카타·첸나이 · hub skip 0
- R47/R48 VERIFY: audit issues 0 · smoke 시드+exact(`마카티`/`만다우에`/`우붓`/`조지타운`/`슬레만`/`시도아르조`/`아오낭`/`푸옥`/`타크마우`/`시엥응은`/`핫사이퐁`/`탄린`/`페남팡`/`이스칸다르푸테리`/`구르가온`/`나비뭄바이`/`화이트필드`/`아메르`/`하우라`/`탐바람`) PASS
- 보정: SEA/IN suburb·city·locality only(hub 도시명 미투입·발리 사찰 POI 제외) · ≤50km · `우동`→`오우동`(haeundae 충돌) · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R49 A**: `hyderabad` · `agra` · `varanasi` · `goa` · `kathmandu` / **B**: `colombo` · `male` · `abu-dhabi` · `doha` · `riyadh`
  - **R50 A**: `jeddah` · `tel-aviv` · `jerusalem` · `amman` · `cairo` / **B**: `marrakech` · `casablanca` · `luxor` · `alexandria` · `tunis`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · IN/SA/ME/AF 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피 · sparse(몰디브 등)면 스킵 OK
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R49부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R45~R46 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R47 후임 기동)

- tip **462 hub / 1384 settlements** (+20 hub / +60) · R45 메데인·쿠스코·카르타헤나·몬테비데오·베이징·상하이·광저우·청두·시안·항저우 · R46 선전·난징·쑤저우·충칭·마카오·가오슝·타이중·타이난·쿠알라룸푸르·자카르타 · hub skip 0
- R45/R46 VERIFY: audit issues 0 · smoke 시드+exact(`엔비가도`/`산헤로니모`/`투르바코`/`시우다드델라코스타`/`통저우`/`자딩`/`포산`/`원장`/`셴양`/`샤오산`/`바오안`/`장닝`/`쿤산`/`베이베이`/`타이파`/`펑산`/`펑위안`/`융캉`/`페탈링자야`/`데폭`) PASS
- 보정: LATAM/CN/TW/SEA suburb·city only(hub 도시명 미투입) · ≤50km(증성·도강언·태창 제외) · name 충돌 0
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R47 A**: `manila` · `cebu` · `bali` · `penang` · `yogyakarta` / **B**: `surabaya` · `krabi` · `siem-reap` · `phnom-penh` · `luang-prabang`
  - **R48 A**: `vientiane` · `yangon` · `kota-kinabalu` · `johor-bahru` · `delhi` / **B**: `mumbai` · `bangalore` · `jaipur` · `kolkata` · `chennai`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · SEA/IN 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R47부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R43~R44 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R45 후임 기동)

- tip **442 hub / 1324 settlements** (+20 hub / +60) · R43 올랜도·샌디에고·포틀랜드·뉴올리언스·오스틴·토론토·몬트리올·캘거리·오타와·퀘벡시티 · R44 멕시코시티·칸쿤·과달라하라·오아하카·리우·상파울루·부에노스아이레스·리마·산티아고·보고타 · hub skip 0
- R43/R44 VERIFY: audit issues 0 · smoke 시드+exact(`윈터파크`/`출라비스타`/`비버턴`/`메타이리`/`라운드록`/`미시소가`/`라발`/`에어드리`/`가티노`/`레비`/`나우칼판`/`푸에르토모렐로스`/`사포판`/`산타마리아델툴레`/`니테로이`/`구아룰류스`/`비센테로페스`/`카야오`/`마이푸`/`소아차`) PASS
- 보정: US/CA/LATAM suburb·city only(hub 도시명 미투입) · name 충돌 회피(`바우건`←Vaughan vs cologne `본`)
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R45 A**: `medellin` · `cusco` · `cartagena` · `montevideo` · `beijing` / **B**: `shanghai` · `guangzhou` · `chengdu` · `xian` · `hangzhou`
  - **R46 A**: `shenzhen` · `nanjing` · `suzhou` · `chongqing` · `macau` / **B**: `kaohsiung` · `taichung` · `tainan` · `kuala-lumpur` · `jakarta`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · LATAM/CN/TW/SEA 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R45부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R41~R42 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R43 후임 기동)

- tip **422 hub / 1264 settlements** (+20 hub / +59) · R41 카셀·도르트문트·뷔르츠부르크·금정·연제·사하·사상·대덕·시카고·마이애미 · R42 시애틀·보스턴·라스베이거스·호놀룰루·워싱턴DC·필라델피아·덴버·애틀랜타·달라스·휴스턴 · hub skip 0 · `yeonje` partial(2, 최소2)
- R41/R42 VERIFY: audit issues 0 · smoke 시드+exact(`벨마르`/`보훔`/`슈바인푸르트`/`장전동`/`연산동`/`하단동`/`괘법동`/`읍내동`/`에번스턴`/`마이애미비치`/`벨뷰`/`케임브리지`/`헨더슨`/`케일루아`/`알링턴`/`어퍼다비`/`골든`/`디케이터`/`어빙`/`벨레어`) PASS
- 보정: KR 구 hub 하위 동만 · US suburb/city only(hub 도시명 미투입) · name 충돌 회피(`브루클라인`/`어퍼다비`/`웨스트유니버시티`)
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼·직렬 A→B·VERIFY까지 완료
- **다음 배치표 2개**
  - **R43 A**: `orlando` · `san-diego` · `portland` · `new-orleans` · `austin` / **B**: `toronto` · `montreal` · `calgary` · `ottawa` · `quebec-city`
  - **R44 A**: `mexico-city` · `cancun` · `guadalajara` · `oaxaca` · `rio-de-janeiro` / **B**: `sao-paulo` · `buenos-aires` · `lima` · `santiago` · `bogota`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · US/CA/LATAM 인근 suburb·city only · placeId hubId prefix · 전역 name 충돌 회피
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R43부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R39~R40 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R41 후임 기동)

- tip **402 hub / 1205 settlements** (+20 hub / +60) · R39 카를스루에·울름·에르푸르트·중랑·동대문·중구·강북·부평·슈투트가르트·본 · R40 비스바덴·마인츠·마그데부르크·부산진·남동·계양·미추홀·동래·켐니츠·자를브뤼켄 · hub skip 0
- R39/R40 VERIFY: audit issues 0 · smoke 시드+exact(`에틀링겐`/`노이울름`/`바이마르`/`면목동`/`청량리동`/`필동`/`수유동`/`산곡동`/`루트비히스부르크`/`바트고데스베르크`/`뤼데스하임`/`잉겔하임`/`셰네베크`/`전포동`/`구월동`/`계산동`/`용현동`/`온천동`/`츠비카우`/`푈클링겐`) PASS
- 보정: KR 구 hub 하위 동만(구명 미투입) · `bupyeong` 부평동 스킵(`incheon`) · `busanjin` 부전동·`michuhol` 주안동·`dongnae` 사직동 기등록 회피
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r39`/`_tmp-r40`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R41 A**: `kassel` · `dortmund` · `wuerzburg` · `geumjeong` · `yeonje` / **B**: `saha` · `sasang` · `daedeok` · `chicago` · `miami`
  - **R42 A**: `seattle` · `boston` · `las-vegas` · `honolulu` · `washington-dc` / **B**: `philadelphia` · `denver` · `atlanta` · `dallas` · `houston`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · KR 구 hub는 하위 동·위성만 · placeId hubId prefix · 전역 name 충돌 회피
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R41부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R37~R38 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R39 후임 기동)

- tip **382 hub / 1145 settlements** (+20 hub / +60) · R37 첼튼엄·하이델베르크·파사우·강서·구로·금천·노원·도봉·레스터·코번트리 · R38 레딩·프라이부르크·아우크스부르크·양천·은평·성북·성동·광진·더비·만하임 · hub skip 0
- R37/R38 VERIFY: audit issues 0 · smoke 시드+exact(`프레스트버리`/`네카르슈타이나흐`/`필스호펜`/`화곡동`/`신도림동`/`가산동`/`상계동`/`쌍문동`/`오드비`/`케닐워스`/`캐버샴`/`브라이자흐`/`프리드베르크`/`목동`/`응암동`/`돈암동`/`성수동`/`자양동`/`미클오버`/`슈베칭겐`) PASS
- 보정: KR 구 hub는 하위 동만(구명 미투입) · `seongbuk` 성북동 스킵(seoul) · `eunpyeong` 갈현 스킵(기등록)
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r37`/`_tmp-r38`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R39 A**: `karlsruhe` · `ulm` · `erfurt` · `jungnang` · `dongdaemun` / **B**: `junggu` · `gangbuk` · `bupyeong` · `stuttgart` · `bonn`
  - **R40 A**: `wiesbaden` · `mainz` · `magdeburg` · `busanjin` · `namdong` / **B**: `gyeyang` · `michuhol` · `dongnae` · `chemnitz` · `saarbrucken`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · KR 구 hub는 하위 동·위성만 · placeId hubId prefix · 전역 name 충돌 회피
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R39부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R35~R36 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R37 후임 기동)

- tip **362 hub / 1085 settlements** (+20 hub / +60) · R35 솔즈베리·그라이프스발트·슈베린·마포·용산·송파·수영·관악·노리치·포츠담 · R36 바이마르·밤베르크·레겐스부르크·종로·서대문·동작·영등포·강동·입스위치·콜체스터 · hub skip 0
- R35/R36 VERIFY: audit issues 0 · smoke 시드+exact(`에이姆斯베리`/`엘데나`/`크리비츠`/`합정동`/`한남동`/`잠실동`/`민락동`/`신림동`/`윔몬덤`/`바벨스베르크`/`아폴다`/`할슈타트`/`슈타트암호프`/`혜화동`/`연희동`/`노량진동`/`여의도동`/`천호동`/`펠릭스토`/`위븐호`) PASS
- 보정: KR 구 hub는 하위 동만(구명 미투입) · `mapo` 연남 스킵(seoul) · `yongsan` 이태원 스킵(seoul) · `suyeong` 광안 스킵(busan) · `gangdong` 고덕 스킵(yesan alias) · `bamberg` Hallstadt=`할슈타트`(Hallstatt AT 미등록)
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r35`/`_tmp-r36`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R37 A**: `cheltenham` · `heidelberg` · `passau` · `gangseo` · `guro` / **B**: `geumcheon` · `nowon` · `dobong` · `leicester` · `coventry`
  - **R38 A**: `reading` · `freiburg` · `augsburg` · `yangcheon` · `eunpyeong` / **B**: `seongbuk` · `seongdong` · `gwangjin` · `derby` · `mannheim`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · KR 구 hub는 하위 동·위성만 · placeId hubId prefix · 전역 name 충돌 회피
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R37부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R33~R34 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R35 후임 기동)

- tip **342 hub / 1025 settlements** (+20 hub / +60) · R33 체스터·로스토크·그디니아·기장·울주·달성·유성·연수·케임브리지·옥스퍼드 · R34 소포트·스트랄준트·비스마르·수성·달서·해운대·강남·서초·더럼·윈체스터 · hub skip 0
- R33/R34 VERIFY: audit issues 0 · smoke 시드+exact(`훌`/`바르네뮌데`/`오르워보`/`일광읍`/`온산읍`/`현풍읍`/`봉명동`/`옥련동`/`체스터턴`/`카울리`/`카를리코보`/`안더스호프`/`도르프메클렌부르크`/`만촌동`/`성서동`/`우동`/`역삼동`/`반포동`/`자일스게이트`/`위크`) PASS
- 보정: KR 구·군은 hub명 미투입 · `ulju` 언양읍 스킵(ulsan 충돌) · `yeonsu` 송도 스킵(incheon) · `haeundae` placeId `haeundae-*`(busan-haeundae-dong 충돌 회피) · `durham` Durham/더럼 미사용(newcastle 충돌) · `yuseong` alias `도안` 미사용(jeungpyeong)
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r33`/`_tmp-r34`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R35 A**: `salisbury` · `greifswald` · `schwerin` · `mapo` · `yongsan` / **B**: `songpa` · `suyeong` · `gwanak` · `norwich` · `potsdam`
  - **R36 A**: `weimar` · `bamberg` · `regensburg` · `jongno` · `seodaemun` / **B**: `dongjak` · `yeongdeungpo` · `gangdong` · `ipswich` · `colchester`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지 · KR 구 hub는 하위 동·위성만
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R35부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R31~R32 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R33 후임 기동)

- tip **322 hub / 965 settlements** (+20 hub / +59) · R31 요엔수·키일·카를로바츠·연기·창녕·함안·영천·청도·바스·슈체친 · R32 포리·뤼베크·오파티야·세종·증평·경남고성·옹진·경기광주·요크·캔터베리 · hub skip 0 (`jeungpyeong` 2건=군 단위 최소)
- R31/R32 VERIFY: audit issues 0 · smoke 시드+exact(`리페리`/`엑커른푀르데`/`두가레사`/`조치원`/`남지읍`/`가야읍`/`금호읍`/`화양읍`/`치퍼넘`/`폴리스`/`울빌라`/`트라페뮌데`/`볼로스코`/`한솔동`/`증평읍`/`고성읍`/`영흥면`/`오포읍`/`핵스비`/`휘트스터블`) PASS
- R31 보정: `yeongi` alias `연동` 제거(jeju) · `yeongcheon` 화산면→화북면(haenam) · `bath` Keynsham→치퍼넘(bristol name_en) · featureType town→place
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r31`/`_tmp-r32`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R33 A**: `chester` · `rostock` · `gdynia` · `gijang` · `ulju` / **B**: `dalseong` · `yuseong` · `yeonsu` · `cambridge` · `oxford`
  - **R34 A**: `sopot` · `stralsund` · `wismar` · `suseong` · `dalseo` / **B**: `haeundae` · `gangnam` · `seocho` · `durham` · `winchester`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R33부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R29~R30 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R31 후임 기동)

- tip **302 hub / 906 settlements** (+20 hub / +60) · R29 위배스퀼레·브레멘·오시예크·예산·청양·영동·칠곡·경산·사우스햄튼·비드고슈치 · R30 라흐티·하노버·바라주딘·금산·고령·성주·군위·의령·포츠머스·루블린 · skip 0
- R29/R30 VERIFY: audit issues 0 · smoke 시드+exact(`무우라메`/`델멘호르스트`/`자코보`/`삽교읍`/`정산면`/`황간면`/`왜관읍`/`하양읍`/`이스트리`/`솔레츠쿠야프스키`/`홀롤라`/`가르센`/`차코베츠`/`추부면`/`쌍림면`/`선남면`/`의흥면`/`부림면`/`고스포트`/`스비드니크`) PASS
- R29 보정: `yesan` 덕산면→고덕면(`덕산` alias vs jincheon) · `yeongdong` 학산면→양강면(yeongam 충돌)
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r29`/`_tmp-r30`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- R30 = 계획서 중간 점검 포인트이나 **체인 정지 없음** — R31 후임 프롬프트 준비
- **다음 배치표 2개**
  - **R31 A**: `joensuu` · `kiel` · `karlovac` · `yeongi` · `changnyeong` / **B**: `haman` · `yeongcheon` · `cheongdo` · `bath` · `szczecin`
  - **R32 A**: `pori` · `lubeck` · `opatija` · `sejong` · `jeungpyeong` / **B**: `goseongnam` · `ongjin` · `gwangju_gi` · `york` · `canterbury`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R31부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R27~R28 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R29 후임 기동)

- tip **282 hub / 846 settlements** (+20 hub / +60) · R27 오울루·브레겐츠·라이프치히·성남·용인·화성·김천·당진·엑서터·우치 · R28 쿠오피오·드레스덴·리예카·논산·계룡·서천·홍성·구미·플리머스·카토비체 · skip 0
- R27/R28 VERIFY: audit issues 0 · smoke 시드+exact(`켐펠레`/`도른비른`/`마르크클레베르크`/`서현동`/`동백동`/`동탄`/`율곡동`/`송악읍`/`엑스머스`/`파비아니체`/`시린야르비`/`프라이탈`/`카스타프`/`강경읍`/`금암동`/`장항읍`/`광천읍`/`인동동`/`솔태시`/`호주프`) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r27`/`_tmp-r28`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R29 A**: `jyvaskyla` · `bremen` · `osijek` · `yesan` · `cheongyang` / **B**: `yeongdong` · `chilgok` · `gyeongsan` · `southampton` · `bydgoszcz`
  - **R30 A**: `lahti` · `hannover` · `varazdin` · `geumsan` · `goryeong` / **B**: `seongju` · `gunwi` · `uiryeong` · `portsmouth` · `lublin`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R29부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R25~R26 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R27 후임 기동)

- tip **262 hub / 786 settlements** (+20 hub / +60) · R25 로비니·탐페레·클라겐푸르트·부천·과천·시흥·김포·고양·브라이턴·그단스크 · R26 포레치·투르쿠·필라흐·양주·동두천·광명·의왕·안산·스완지·포즈난 · skip 0
- R25/R26 VERIFY: audit issues 0 · smoke 시드+exact(`바르사르`/`노키아`/`펠덴`/`중동`/`별양동`/`정왕동`/`운양동`/`화정동`/`호브`/`프루슈치그단스키`/`노비그라드`/`난탈리`/`아르놀트슈타인`/`백석읍`/`생연동`/`철산동`/`내손동`/`고잔동`/`머블스`/`루보니`) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r25`/`_tmp-r26`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R27 A**: `oulu` · `bregenz` · `leipzig` · `seongnam` · `yongin` / **B**: `hwaseong` · `gimcheon` · `dangjin` · `exeter` · `lodz`
  - **R28 A**: `kuopio` · `dresden` · `rijeka` · `nonsan` · `gyeryong` / **B**: `seocheon` · `hongseong` · `gumi` · `plymouth` · `katowice`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R27부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R23~R24 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R25 후임 기동)

- tip **242 hub / 726 settlements** (+20 hub / +60) · R23 풀라·오르후스·린츠·연천·안성·평택·오산·구리·브리스틀·아헨 · R24 시베니크·오덴세·그라츠·남양주·하남·의정부·안양·군포·노팅엄·브로츠와프 · skip 0
- R23/R24 VERIFY: audit issues 0 · smoke 시드+exact(`파자나`/`실케보르`/`벨스`/`연천읍`/`공도읍`/`송탄`/`세마동`/`교문동`/`클리브던`/`헤르초겐라트`/`보디체`/`스벤보르`/`레오벤`/`다산동`/`미사동`/`가능동`/`평촌동`/`산본동`/`비스턴`/`올레시니차`) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r23`/`_tmp-r24`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R25 A**: `rovinj` · `tampere` · `klagenfurt` · `bucheon` · `gwacheon` / **B**: `siheung` · `gimpo` · `goyang` · `brighton` · `gdansk`
  - **R26 A**: `porec` · `turku` · `villach` · `yangju` · `dongducheon` / **B**: `gwangmyeong` · `uiwang` · `ansan` · `swansea` · `poznan`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R25부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R21~R22 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R23 후임 기동)

- tip **222 hub / 666 settlements** (+20 hub / +60) · R21 스플리트·룩셈부르크·예테보리·화천·철원·영양·봉화·의성·뉴캐슬·바리 · R22 자다르·브뤼헤·말뫼·괴산·진천·음성·예천·상주·셰필드·트리어 · skip 0
- R21/R22 VERIFY: audit issues 0 · smoke 시드+exact(`트로기르`/`에슈쉬르알제트`/`묄른달`/`화천읍`/`갈말읍`/`영양읍`/`봉화읍`/`의성읍`/`게이츠헤드`/`비톤토`/`닌`/`오스텐더`/`룬드`/`괴산읍`/`진천읍`/`음성읍`/`예천읍`/`함창읍`/`로더럼`/`콘츠`) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r21`/`_tmp-r22`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R23 A**: `pula` · `aarhus` · `linz` · `yeoncheon` · `anseong` / **B**: `pyeongtaek` · `osan` · `guri` · `bristol` · `aachen`
  - **R24 A**: `sibenik` · `odense` · `graz` · `namyangju` · `hanam` / **B**: `uijeongbu` · `anyang` · `gunpo` · `nottingham` · `wroclaw`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R23부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

## Mapbox 정착지 — R19~R20 오케스트레이터 세대 (이관)

**상태**: ✅ tip append · audit issues 0 · smoke PASS · **미커밋** · **§4.2 후임 Task 이관**(서브 Task 부재 → 상위가 R21 후임 기동)

- tip **202 hub / 606 settlements** (+20 hub / +60) · R19 볼로냐·베르겐·빌뉴스·횡성·여주·양산·사천·포천·카디프·스트라스부르 · R20 베로나·나고야·리가·보은·옥천·영덕·청송·양구·리즈·파도바 · skip 0
- R19/R20 VERIFY: audit issues 0 · smoke 시드+exact(`카살레키오`/`오사네`/`트라카이`/`우천면`/`가남읍`/`물금읍`/`삼천포`/`소흘읍`/`페나스`/`실티그하임`/`빌라프랑카`/`가스가이`/`유르말라`/`보은읍`/`옥천읍`/`영해면`/`주왕산면`/`해안면`/`브래드퍼드`/`아바노테르메`) PASS
- **본인 런 예외: Task 부재** — 워커2 Task 불가 → 메인 초안 버퍼(`_tmp-r19`/`_tmp-r20`)·직렬 A→B·VERIFY까지 완료 · tmp 삭제
- **다음 배치표 2개**
  - **R21 A**: `split` · `luxembourg` · `gothenburg` · `hwacheon` · `cheorwon` / **B**: `yeongyang` · `bonghwa` · `uiseong` · `newcastle` · `bari`
  - **R22 A**: `zadar` · `bruges` · `malmo` · `goesan` · `jincheon` / **B**: `eumseong` · `yecheon` · `sangju` · `sheffield` · `trier`
- 우선: 큐 순서만 · 목표3/최대5/최소2·미달스킵 · hub당1행 · `mapboxId` null OK · POI 금지
- 금지 3: tip 병렬 머지 · 본인 런(기본) · 워커 로그 전체 Read / tip JSON 전문 스캔
- 스키마: hubId, settlements[2..5]{placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases} · featureType place|city|locality
- **복구용 제시어**(정상 이관 트리거 아님): `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「R21부터 워커2 · §3.3·§4.2」
- **방법 v2.1**: 이관=현 메인이 Task로 후임 오케스트레이터 기동 · 사람 제시어 대기 금지

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

**상태**: ✅ 시드 2 hub / 6 settlements · audit·smoke PASS · Phase 0 커밋됨 · **Phase 1a R01–R63 큐 소진 · tip 머지 커밋·push**

- SSOT [`mapboxSettlementPlaces.json`](../src/pages/Home/data/mapboxSettlementPlaces.json) · resolve · 검색 우선순위(여행지→hub→명소→settlements≤3)
- 시드: `sokcho`(설악동·노학동·청호동) · `paris`(베르사유·생드니·불로뉴비양쿠르)
- 큐 R01–R63 ([`mapbox-settlement-queue.md`](./mapbox-settlement-queue.md)) · method §5.3 · 계획 [`mapbox-settlement-plan.md`](./mapbox-settlement-plan.md)
- tip **629 hub / 1884 settlements** · hub skip `el-calafate`(sparse) · 다음: Phase 1b `mapboxId` 등(별도)

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

## /place/:slug 새로고침 Safe Path (hub명소·정착지)

**상태**: ✅ hydrate 수정 · 커밋·푸시

- 원인: `resolvePlaceTargetFromSlug`가 TRAVEL_SPOTS/cities만 봄 → hub명소·정착지 URL(`/place/nami-island` 등) 새로고침 시 `contextLocation` null → PlaceCard Safe Path 홈 이동
- 수정: hub/attraction/settlement slug kebab 통일 + `placeRouteHydrate`에 SSOT lookup 추가 (레거시 compact slug도 수용)
