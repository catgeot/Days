# 2026-07-22 프로젝트 일지

이전: [`2026-07-21-project-log.md`](./2026-07-21-project-log.md)

## MRT 숙소 — 전수 감사 누락분 마무리

**상태**: ✅ main 반영 · Edge 재배포 · LIVE 통과

- 모바일 PR #3 머지 검토: squash만 들어감 · 클라우드 tip(`a20bf16` 272곳 감사·오버라이드)은 누락 → 데스크톱 반영
- `npm run audit:mrt-stays` · 캐시 `v11` · Edge `fetch-mrt-stays` 재배포 ✅
- LIVE 14케이스 통과(베네수엘라 `NO_REGION`=Trip.com CTA 정상)

## 트립닷컴 숙소 검색 연동 (항공권 미러)

**상태**: ✅ QA 확인 · 커밋

- `TRIPCOM_HOTEL_AD`(`S18836274`/`S18836330`) · `buildTripcomHotelSearchUrl` `mode: ad|list` · `PLANNER_TRIPCOM_HOTEL_CITY_IDS`(홍콩·마카오·바티칸·이스탄불·베네수엘라)
- Summary「숙소 찾기」빈 결과·에러: `/hotels/list` CTA · 결과 **≤5**: 툴바「더 보기」+ 목록 하단 안내 CTA
- 상시 검색바 미적용 · 스크래핑 금지 유지
- Trip 호텔 partners/ad iframe은 city/날짜/인원 프리필 **미지원** → CTA+`StayDateBar` SSOT
- 기본 일정 **보름(+14)·3박**·성인2·아동0

### UX — 저재고(≤5) 하단 Trip CTA

- `MRT_STAY_LOW_COUNT=5` · `items.length <= 5` (사모아 4곳 포함)
- 목록 하단: 「재고가 적어요…」+ 「트립닷컴에서 숙소 검색」 (`StayLowInventoryFooter`)
- 툴바 칩「트립닷컴에서 더 보기」유지 · campaign `숙소찾기 저재고`

### Trip.com city ID — 사모아·폰페이 (세션 잔존 방지)

- 증상: 사모아 후 폰페이 CTA → Trip이 `city` 없어 이전 도시(사모아) 유지
- `samoa`→**`4371`**(아피아) · `pohnpei`→**`321825`**(콜로니아·Pohnpei)
- LIVE: 콜로니아 목록 확인 · cityName만 쓰지 말고 `city` 필수

### Trip.com city ID — 태평양 배치 (전수 클릭 불필요)

- 원인: Trip CTA에 `city=` 없으면 **직전 세션 도시 잔존** (코스라에·나우루·키리바시 등 연쇄)
- 도구: `npm run audit:tripcom-hotel-city-gaps` · LIVE JSON 있으면 empty/no_region/ok&n≤5 중 city·sparse 미등록만
- 공개 URL 검증 후 등록 (오매핑·허브 불일치면 sparse, 이번 배치 해당 없음)

| slug | city | Trip 도시 | 비고 |
|------|------|-----------|------|
| `kosrae` | `321824` | 토폴 | 1건+ |
| `yap` | `75099` | 콜로니아(Yap) | **목록 0** · sparse · city 유지(≠ pohnpei) |
| `kiribati` | `6121` | 타라와 | **목록 0**(오늘·+14·+60) · sparse · city 유지 |
| `nauru` | `681951` | 로나베 | **목록 0**(오늘·+14·+60) · sparse · city 유지 |
| `tonga` | `36478` | 누쿠알로파 | ✅ |
| `vanuatu` | `4115` | 포트빌라 | ✅ |
| `rarotonga` | `36473` | 아바루아 | ✅ |
| `aitutaki` | `6707` | 아이투타키 | ✅ |
| `fiji` | `791` | 난디 | 관문 |
| `palau` | `5780` | 코로르 | ✅ |

- QA: 사모아 → 코스라에/나우루/키리바시/야프 CTA — 각각 해당 도시로 열리는지
- **재확인 2026-07-22**: `nauru`/`kiribati`/`yap` Trip 목록 **0건**(오늘·게이트오 기본 +14·+60). 도시 오매핑 아님(로나베/타라와/콜로니아). 사모아 아피아는 동기간 ~38건. → sparse UX + city 유지(세션 잔존 방지). 상세 URL 잔존 가능·예약 목록 없음.

### UX — 빈 결과: 헤더 여행지 + 트립 CTA만

- `TripcomHotelBannerWidget` 제거(PC·모바일 공통) · `StayDateBar` 좌상단 여행지 표기
- empty/error: 시인성 문구 + 중앙 CTA만 (`/hotels/list` 프리필) — 배너·iframe 없음
- CTA 비주얼: **gateo.kr 배포**와 동일 — `border-sky-300/40 bg-sky-500/20 rounded-xl` · 문구「트립닷컴에서 숙소 검색」

### MRT NO_REGION ↔ Trip.com 재고 대조 (2026-07-22)

**LIVE 감사** (`MRT_STAY_AUDIT_LIVE=1`): OK 198 · **NO_REGION 14** · error 60(일시 `accommodation/search failed`, 재고 없음과 구분)

| slug | Trip.com | city ID / 비고 |
|------|----------|----------------|
| `venezuela` | ✅ 카라카스 ~40곳 | **`811`** · 등록 `606`은 중국 난핑(오류) |
| `svalbard` | ✅ 롱이어비엔 11곳 | `7398` |
| `faroe-islands` | ✅ 토르스하운 ~43곳 | `38171` |
| `falkland-islands` | ✅ Stanley | `76974` |
| `chuuk` | ❌ 재고 없음 | city 등록 철회 → sparse UX |
| `christmas-island` | ❌ 오매핑 | `93327`=캐나다 Christmas Island · 철회 → sparse |
| `cocos-islands` | △ 1건·예약 불가 | city 철회 → sparse UX |
| `persepolis` | 시라즈 당일 투어가 일반적 | Trip 시라즈도 실재고 0 → sparse · 안내 문구만 |
| `timbuktu` | 바마코=관문≠당일허브 | sparse UX |
| `antarctica` · `diego-garcia` · `midway-atoll` · `pitcairn-islands` · `kerguelen-islands` | 사실상 없음 | sparse UX |

### 숙소 city ID — NO_REGION 마무리

- `venezuela`: `606`(난핑) → **`811`**(카라카스)
- `svalbard`→`7398` · `faroe-islands`→`38171` · `falkland-islands`→`76974`
- sparse UX: 극지 5 + `chuuk` · `christmas-island` · `cocos-islands` · `persepolis` · `timbuktu` + **`nauru`·`kiribati`·`yap`**(Trip 목록 0·city 유지)
- `persepolis`: 시라즈 hub city 철회(Trip 실재고 0) · empty는 당일 투어 안내 + OTA 한계 문구

## 숙소 empty/저재고 — 인증 여행사·안내 링크

**상태**: ✅ 관광청 QA·city gap · `900c434` push (`origin/main`) · **Vercel 배포 후 PROD QA**

- SSOT: `scripts/data/stay-agency-link-overrides.mjs` → `npm run generate:stay-agencies` → `travelSpotStayAgencyLinks.json`
- 런타임: `src/utils/stayAgencyLinks.js` · UI: `GlobeStayStrip` empty/error + 저재고 footer (공식 화이트 카드 1순위 · Trip 보조 CTA)
- 시드 **20**: 남극·핏케언·나우루·통가·키리바시·야프·추크·폰페이·코스라에·사모아 · 크리스마스·코코스·바누아투·팔라우·라로통가·스발바르·페로·포클랜드·그린란드·솔로몬
- 나우루: 죽은 `.nr` 관광사·`.gov` UTM 403 수정 · 코코스 Trip **`77705`** · 크리스마스/코코스 MRT `ignoreStayAdmin`(퍼스 오탐) · 캐시 `v12`
- `npm run audit:stay-agencies` ✅ · 릴리스 노트는 합의 후 `releaseNotes.js`

### 관광청 링크 QA · city/sparse gap (2026-07-22 이어하기)

- 시드 20 URL: 브라우저 전수 유효 · Node fetch 403은 WAF(폰페이·사모아·쿡) — 링크 유지 · evidence에 브라우저 검증 기록
- 로컬 UI: 나우루 — 공식 3링크(`.gov` UTM 없음)·sparse 문구·Trip `city=681951` ✅ · 남극 — IAATO + sparse·city 없음 ✅
- **PROD(gateo.kr)**: `900c434` push 완료 · **Vercel 배포 반영 후** 나우루 관광청 카드·Trip `city=681951`·나우루→그린란드 세션 잔존 QA
- 세션 잔존 수정(시드): `greenland`→**`6838`**(누크) · `solomon-islands`→**`6909`**(호니아라)
- true gap city: `bermuda`→**`59607`** · `yakutsk`→**`4224`** · `milford-sound`→**`3716`**(티아나우·관문) · `tikal`→**`6760`**(플로레스 GT·관문)
- `audit:tripcom-hotel-city-gaps`: ok 샘플 `n`과 `total` 혼동 수정 → CTA 후보 **gap 0** (city 27 · sparse 13)
- `chuuk` city 재등록 보류(재고 없음·sparse 유지)
- **나우루**: 방문 안내 → 공식 **Accommodation** 페이지로 교체(호텔 2·유닛형·정부 연락) · note에 숙소 문의 경로 명시 · 개별 호텔 OTA/미검증 목록 링크는 넣지 않음

### PROD QA (배포 후 · 2026-07-22 이어하기)

**상태**: ✅ `a805d2b` Vercel 반영 · 나우루 empty · 그린란드 city 세션 잔존 없음

| 항목 | 결과 |
|------|------|
| Vercel | PROD 번들 `index-DsgRN61P.js`에 `accommodation.aspx` · `nauru:"681951"` · `greenland:"6838"` |
| 나우루 empty | 공식 3링크(숙소 안내·비자·Nauru Airlines) + note + Trip CTA `city=681951`(로나베) |
| 나우루→그린란드 | Trip 세션 시드(로나베) 후 `city=6838` → **누크** 17곳 · 나우루 잔존 없음 |
| 그린란드 in-app (당시) | MRT 17건(요금 없음 포함) → Trip CTA 미노출 · city는 번들·Trip URL로 검증 |
| note | 현 문구 유지 |
| 릴리스 노트 | **미갱신**(사용자) |

### 저재고 Trip CTA · 예약 가능 목록만 (커밋)

**상태**: ✅ `254c1a9` push · **Vercel 배포 후 PROD 그린란드 QA**

- `filterBookableMrtStays` — 선택 일정 요금 있는 건만 목록 · 0건이면 empty+Trip · 캐시 `v13`
- 저재고: 예약 가능 건 ≤5 → 하단 Visit Greenland + Trip(`city=6838`) · 툴바 Trip「더 보기」제거
- 푸터 카피: PC 한 줄 · 모바일 2줄 · disclaimer「관계가 아닙니다…공식 안내」
- 릴리스 노트: 미갱신

### 숙소 달력 UX · 쿡 제도 관광청 상시

**상태**: ✅ `a12249b`

- 날짜 입력칸: 상시 `border-amber-300/40`
- 달력: max `17.5rem` · **오늘** · **변경하기**(일정 dirty 시만·즉시 조회) · 체크아웃 툴팁
- 헤더 **변경하기**: 인원 dirty일 때만
- `rarotonga`/`aitutaki`: Cook Islands Tourism · `alwaysShow: true` · 시드 21

### MRT 키워드 · 요금 필터 완화 (아이슬란드·라로통가)

**상태**: ✅ `a12249b` · **다음 세션에서 Trip CTA·홈 괴리 심화**

- `iceland`→**레이캬비크** · `rarotonga`→**아바루아**(alt 아로랑기)
- 목록: 요금無 **숨기지 않음**(요금 우선 정렬) · 캐시 `v15`
- Trip `iceland`→**`831`**

#### QA 메모 (2026-07-22) — Trip CTA 조건 회귀

| 의도(기존) | 현재 코드 | 증상 |
|------------|-----------|------|
| **예약 가능(요금有) ≤5** → 하단 Trip | **목록 건수(요금無 포함) ≤5** → Trip | 라로통가: 기본일정 예약가능 **0**인데 요금無 카드로 목록>5 → **Trip 미노출** |
| | | 아이슬란드: 예약가능 **2** · 목록은 더 김 → **Trip 미노출** |

- `showLowInventoryCta` = `items.length <= MRT_STAY_LOW_COUNT(5)` (`GlobeStayStrip`) — **bookableCount 기준이 아님**
- `bookableCount` / `moreWithDateChange`는 meta·카피용으로만 존재
- **다음**: 저재고 CTA를 `bookableCount <= 5`(또는 0)로 되돌리되, 목록은 요금無 유지할지 합의

#### 다음 세션 핵심 (심화)

- **왜 Edge/게이트오 목록 ≠ MRT 홈 동일 일정 결과인가** (아이슬란드·라로통가)
  - regionId·키워드 사다리·page size 20·정렬·요금 필드·홈 검색 UI 차이
  - LIVE: `usedKeyword`·`region`·`totalCount`·`bookableCount` vs 홈 화면 대조
- Trip city 전수는 보류 · CTA 뜨는 slug만 city 필수(세션 잔존)

### 에이전트 핸드오프 (다음 세션)

- **읽을 것 3**: 본 절「Trip CTA 조건 회귀」·「다음 세션 핵심」· `fetchMrtStays` v15 + `GlobeStayStrip` `showLowInventoryCta`
- **금지 3**: 미검증 여행사 URL · Trip 스크래핑 · `VITE_` MRT 키 · 홈 괴리 원인 추측만으로 region 대량 변경
- **다음 작업**: (1) 저재고 Trip을 **bookableCount≤5**로 복구·사용자 선택권 (2) API↔MRT 홈 괴리 LIVE 대조(아이슬란드·라로통가)
- **제시어**: `숙소-이어하기` + `@plans/2026-07-22-project-log.md` · 「Trip CTA bookableCount 복구 + MRT 홈 괴리부터」

### Trip CTA bookableCount 복구 + API↔MRT 홈 괴리 (이어하기)

**상태**: ✅ Edge 재배포 · `35b24d2` push(`origin/main`) · **Vercel PROD QA**

#### 수정

- `GlobeStayStrip` `showLowInventoryCta` ← **`bookableCount ≤ 5`**
- `rarotonga` 키워드 **`라로통가` CITY** · 캐시 `v17`
- Edge/클라 fetch **size 50** · UI 요금有 우선 후 **20** 노출
- 요금有 / 「일정 조정 시 예약」섹션·카드(`dateFlexible`) 복구
- 숙소 달력: max `19.5rem` · 날짜 칸 `h-8`
- 파트너 `sort`/`filter`는 **무시** 확인 · 다페이지(B) 보류

#### LIVE 대조 요약

| 대상 | 파트너 API | MRT 홈 |
|------|------------|--------|
| 아이슬란드 `44026` | total 287 · size50 요금有 **8** | 타이틀 336 · 소비자 API 이원 |
| 라로통가 CITY `44325` | total 143 | 홈과 total 일치(NH 아바루아 함정 해소) |

#### 다음 세션

- **읽을 것**: size50/UI20 · bookable CTA · `dateFlexible` 구분 · `rarotonga` CITY
- **금지**: 소비자 `unionstay` 스크래핑 · region 전수 추측 변경
- **남은 일**: PROD QA(아이슬란드·라로통가 · Trip CTA · 달력·섹션 구분) · 다페이지(B)는 보류
- **제시어**: `숙소-이어하기` · 「PROD QA·아이슬란드 요금有부터」

### 숙소 패널 UX — 달력 3개월 · 풀높이 헤더 · 하단 카피

**상태**: ✅ `84e503e` push(`origin/main`) · Vercel PROD QA

- **PC 달력**: 세 달 표시 · 체크인 달(기본 +14일)이 **가운데**(예: 7·8·9) · 모바일은 한 달·기존 크기 유지
- **저재고 푸터**: 「바로 예약만」문구 제거 → 일정 조정 숙소 동시 노출에 맞춤 · CTA「트립닷컴에서 더 찾아보기」
- **PC 패널**: `top-0`–`bottom-0` 풀높이 · 고정 헤더(GATEO 로고 `h-9` + 여행지명 + 닫기) · DateBar 중복 제거
- 파일: `stayDateControls.jsx` · `GlobeStayStrip.jsx` · `Logo.jsx`

### 지구본 — Style is not done loading 가드

**상태**: ✅ `3bf2848` push(`origin/main`) · 로컬 QA 이상 없음

- 2초 reveal 폴백에서 `gateoMarkerLayersReady` → `getLayer` Uncaught 수정
- ready 계열 try/catch: 마커·reach·cluster·flight cinema

## Explore 검색 — 도시·명소 하이브리드 제안

**상태**: ✅ QA(속초·파리·키보드) · 커밋

- 검색바 드롭다운에 도시+명소+여행지 혼합 제안 · 큐레이션 SSOT `cityAttractionHubs.json`(속초·파리 시드) 우선 · 허브 exact는 Mapbox 대기 없음
- Enter 시 허브·모호함 → 선택 카드 · mood 다후보 선택 UI · 최근 검색은 **입력 키워드** 우선 · 모바일 검색 시 키보드 자동 닫힘
- 핵심: `cityAttractionHubs.js` · `searchSuggestions.js` · `mapboxSearchBox.js` · `SearchSuggestionList.jsx` · `SearchDiscoveryModal` · `useHomeHandlers`
- **다음**: SSOT 배치는 아래 cityAttractionHubs 절 · 릴리스 노트 합의 후

## cityAttractionHubs — 국내+해외 합본 · 후쿠오카·하노이 (#6)

**상태**: 데이터 append · resolve 스모크 ✅ · draft PR 검수 대기

- 국내 14 hub PR(#4 `city-attraction-hubs-batch-4a6f`) + 해외 10 hub PR(#5 `city-attraction-overseas-hubs-dc8c`) JSON **append 합치기**
- 신규: `fukuoka`(7) · `hanoi`(7)
- `cityAttractionHubs.js` `KIND_LABELS`에 **`shrine: '신사'`** 추가(도쿄·교토·후쿠오카 shrine 배지용) — **삭제·temple로 병합 금지**
- 총 **28 hub** · 명소 **176** · 시드 속초·파리 intact
- 스모크: `부산`/`도쿄`/`후쿠오카`/`하카타`/`하노이`/`nyc` hub · `성산일출봉`/`도쿄타워`/`다자이후 텐만구`/`호안끼엠 호수` exact
- **머지 후**: #4·#5 닫아도 됨(내용 포함)

## cityAttractionHubs — 오키나와·호치민·포항·춘천 (#7)

**상태**: 데이터 append · resolve 스모크 ✅ · draft PR 검수 대기

- **브랜치**: `cursor/city-attraction-okinawa-hcm-domestic-3b6f` = #6 tip(`f115c4e`) **위 1커밋**(`2021e4a`)
- 신규(각 7): `okinawa` · `ho-chi-minh` · `pohang` · `chuncheon`
- 총 **32 hub** · 명소 **204** · shrine KIND_LABEL 유지 · 시드 intact
- alias: 오키나와→`나하`/`naha` · 호치민→`사이공`/`saigon`/`hcmc` · 포항→`포항시` · 춘천→`춘천시`
- exact: `슈리성`/`츄라우미 수족관` · `벤탄 시장`/`통일궁` · `호미곶 해맞이광장`/`스페이스워크` · `남이섬`/`소양강스카이워크`

## cityAttractionHubs — 핸드오프 docs (#8)

**상태**: docs only · #7 tip 위 1커밋

- 일지에 머지 순서·스키마·스모크·금지·제시어 보강 (채팅 2줄 핸드오프 보완)

## cityAttractionHubs — 시드니·두바이 + 국내 6 (#9 · 배치 8)

**상태**: 데이터 append · resolve 스모크 ✅ · PR 검수 대기

- **기반**: #8 tip · 한 배치 **8 hub × 7명소**
- 해외: `sydney` · `dubai`
- 국내: `pyeongchang` · `yangyang` · `namhae` · `andong` · `boryeong`(alias **`대천`**) · `suncheon`
- 총 **40 hub** · 명소 **260** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 양양에 **낙산사 미포함**(속초 exact 선점 유지)

## cityAttractionHubs — 멜버른·오클랜드·이스탄불·다낭 + 국내 6 (#10)

**상태**: 데이터 append · resolve 스모크 ✅ · PR 검수 대기

- **브랜치**: `cursor/city-attraction-batch9-dfd8` = #9 tip(`2a43f80`) **위 append**
- 한 배치 **10 hub × 7명소** (8~12 권장 범위)
- 해외: `melbourne` · `auckland` · `istanbul` · `danang`(호이안 올드타운 포함)
- 국내: `mokpo` · `jinju` · `geoje`(alias **`거제도`**) · `gunsan` · `damyang` · `suwon`
- 총 **50 hub** · 명소 **330** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 멜버른 정원은 `멜버른 로열 보태닉 가든`(시드니 `로열 보태닉 가든`과 분리) · 목포 `목포갓바위`(대구 `팔공산갓바위`와 분리)
- hub 스모크: `멜버른`/`오클랜드`/`이스탄불`/`다낭`/`목포`/`진주`/`거제`/`거제도`/`군산`/`담양`/`수원` + 회귀(시드니·대천·오키나와·하카타·부산·nyc·속초·파리)
- exact: `페더레이션 스퀘어`/`스카이타워`/`아야 소피아`/`미케 비치`/`바나힐`/`호이안 올드타운` · `유달산`/`진주성`/`외도보타니아`/`죽녹원`/`수원화성`

## cityAttractionHubs — 바르셀로나·밴쿠버·푸켓·치앙마이 + 국내 6 (#11)

**상태**: 데이터 append · resolve 스모크 ✅ · PR 검수 대기

- **브랜치**: `cursor/city-attraction-batch11-fc76` = #10 tip(`ae5e817`) **위 append**
- 한 배치 **10 hub × 7명소** (#10 핸드오프 「다음 후보」+ 치앙마이·가평·공주)
- 해외: `barcelona` · `vancouver` · `phuket`(alias **`푸껫`**) · `chiang-mai`
- 국내: `cheongju` · `taean`(alias **`안면도`**) · `ulleung`(alias **`울릉도`**) · `ganghwa`(alias **`강화도`**) · `gapyeong` · `gongju`
- 총 **60 hub** · 명소 **400** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 가평에 **남이섬 미포함**(춘천 exact 선점) · 강화에 **전등사 미포함**(인천 `강화도 전등사` exact 유지)
- hub 스모크: `바르셀로나`/`밴쿠버`/`푸켓`/`푸껫`/`치앙마이`/`청주`/`태안`/`안면도`/`울릉도`/`강화도`/`가평`/`공주` + 회귀(멜버른·거제도·시드니·대천·속초·파리)
- exact: `사그라다 파밀리아`/`스탠리 파크`/`파통 비치`/`도이수텝`/`청남대`/`꽃지해수욕장`/`성인봉`/`보문사`/`아침고요수목원`/`공산성`

## cityAttractionHubs — 프라하·암스테르담·LA·샌프란 + 국내 5 (#12)

**상태**: 데이터 append · resolve 스모크 ✅ · PR 검수 대기

- **브랜치**: `cursor/city-attraction-batch12-50e4` = #11 tip(`3fa6d2c`) **위 append**
- 한 배치 **10 hub × 7명소** (#11 핸드오프 「다음 후보」)
- 해외: `prague` · `amsterdam` · `los-angeles`(alias **`la`**/`엘에이`) · `san-francisco`(alias **`sf`**/`샌프란`) · `chiang-rai`
- 국내: `paju` · `buyeo` · `goseong`(alias **`강원고성`**/`화진포` · 경남 고성 아님) · `inje` · `boseong`
- 총 **70 hub** · 명소 **470** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 고성 통일전망대는 **`고성 통일전망대`**(파주 `오두산통일전망대`와 분리) · 인제에 설악 권금성 미포함(속초 exact)
- hub 스모크: `프라하`/`암스테르담`/`로스앤젤레스`/`la`/`샌프란시스코`/`sf`/`치앙라이`/`파주`/`부여`/`고성`/`강원고성`/`인제`/`보성` + 회귀(바르셀로나·가평·속초·파리)
- exact: `프라하성`/`카를교`/`안네 프랑크의 집`/`할리우드 사인`/`금문교`/`화이트 템플`/`임진각`/`부소산성`/`고성 통일전망대`/`백담사`/`보성녹차밭`

## cityAttractionHubs — 마드리드·베를린·피렌체·비엔나·뮌헨 + 국내 5 (#13)

**상태**: ✅ **#13 squash 머지** → `main` (`e2c1ca9`) · #6~#12 내용 포함

- **브랜치**: `cursor/city-attraction-batch13-e93e` = #12 tip(`7f6be32`) **위 append**
- 한 배치 **10 hub × 7명소** (#12 핸드오프 「다음 후보」)
- 해외: `madrid` · `berlin` · `florence`(alias **`firenze`**) · `vienna`(alias **`wien`**/`빈`) · `munich`(alias **`münchen`**)
- 국내: `hadong` · `jecheon` · `mungyeong` · `danyang` · `yeongwol`
- 총 **80 hub** · 명소 **540** · shrine KIND_LABEL 유지 · 시드 intact
- hub 스모크: `마드리드`/`베를린`/`피렌체`/`firenze`/`비엔나`/`빈`/`뮌헨`/`하동`/`제천`/`문경`/`단양`/`영월` + 회귀(프라하·속초·파리)
- exact: `프라도 미술관`/`브란덴부르크 문`/`피렌체 대성당`/`쇤브룬 궁전`/`마리엔광장`/`화개장터`/`의림지`/`문경새재`/`도담삼봉`/`고씨동굴`
- **남은 정리(데스크톱)**: draft **#4~#12** 닫기 — 클라우드 토큰에 close 권한 없음(이미 #13에 흡수)

## cityAttractionHubs — 리스본·부다페스트·아테네 + 국내 5 (#14)

**상태**: ✅ squash 머지 (`5af8f5c` · PR #14)

- **브랜치**: `cursor/city-attraction-batch14-cc26` = `main`(#13 tip `e2c1ca9`) **위 append**
- 한 배치 **10 hub × 7명소** (#13 핸드오프 「다음 후보」)
- 해외: `lisbon`(alias **`lisboa`**/`리스보아`) · `budapest` · `athens` · `zurich` · `edinburgh`(alias **`에딘버러`**)
- 국내: `namwon` · `geochang` · `wando` · `jindo` · `yeongju`
- 총 **90 hub** · 명소 **610** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 부다페스트 의회는 **`헝가리 국회의사당`**(국내 동명 혼동 방지) · 남원에 선암사 미포함(순천 exact)
- hub 스모크: `리스본`/`lisboa`/`부다페스트`/`아테네`/`취리히`/`에든버러`/`에딘버러`/`남원`/`거창`/`완도`/`진도`/`영주` + 회귀(마드리드·속초·파리)
- exact: `벨렘탑`/`아크로폴리스`/`파르테논 신전`/`에든버러 성`/`광한루원`/`부석사`/`소수서원`/`수승대`/`완도타워`/`운림산방`

## cityAttractionHubs — 세비야·포르투·브뤼셀·코펜하겐·더블린 + 국내 5 (#15)

**상태**: ✅ squash 머지 (`1241a75` · PR #15)

- **브랜치**: `cursor/city-attraction-batch15-7299` = #14 tip **위 append**
- 한 배치 **10 hub × 7명소** (#14 핸드오프 「다음 후보」+ 코펜하겐·더블린·구례)
- 해외: `seville`(alias **`sevilla`**) · `porto`(alias **`포르토`**/`oporto`) · `brussels`(alias **`브루셀`**/`bruxelles`) · `copenhagen`(alias **`københavn`**) · `dublin`
- 국내: `hamyang` · `sancheong` · `goheung`(alias **`나로도`**) · `jangheung` · `gurye`
- 총 **100 hub** · 명소 **680** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 세비야 `플라자 데 에스파냐`는 마드리드 Plaza Mayor와 분리 · 구례 화엄사·섬진강은 **`구례` 접두**(타 권역 혼동 방지)
- hub 스모크: `세비야`/`sevilla`/`포르투`/`포르토`/`브뤼셀`/`브루셀`/`코펜하겐`/`더블린`/`함양`/`산청`/`고흥`/`나로도`/`장흥`/`구례` + 회귀(리스본·남원·속초·파리)
- exact: `세비야 대성당`/`히랄다 탑`/`리벨류 서점`/`아토미움`/`인어공주 동상`/`기네스 스토어하우스`/`상림공원`/`남사예담촌`/`나로우주센터`/`장흥 편백숲 우드랜드`/`구례 화엄사`

## cityAttractionHubs — 스톡홀름·헬싱키·밀라노 + 부안·고창 등 (#16 / PR #17)

**상태**: ✅ squash 머지 (`38e83e0` · PR #17) · main tip

- **브랜치**: `cursor/city-attraction-batch16-73d0` = #15 tip **위 append** · **PR #17**
- 한 배치 **10 hub × 7명소** (#15 핸드오프 「다음 후보」+ 부안·고창 · 밀라노)
- 해외: `stockholm` · `helsinki` · `oslo` · `warsaw`(alias **`warszawa`**/`바르샤와`) · `milan`(alias **`milano`**)
- 국내: `hapcheon` · `gokseong` · `yeonggwang` · `buan` · `gochang`
- 총 **110 hub** · 명소 **750** · shrine KIND_LABEL 유지 · 시드 intact
- 경쟁 draft **PR #16**(`batch15-7bac`) → **닫힘**(본 PR #17로 대체)

## cityAttractionHubs — 레이캬비크·제네바·베네치아 + 무주·진안 등 (#18)

**상태**: 데이터 append · resolve 스모크 ✅ · draft **PR #18** 검수 대기

- **브랜치**: `cursor/city-attraction-batch18-7595` = #17 tip(main `38e83e0`) **위 append**
- 한 배치 **10 hub × 7명소** (#17 핸드오프 「다음 후보」+ 베네치아·니스·장수)
- 해외: `reykjavik`(alias **`레이캬빅`**) · `geneva`(alias **`genève`**/`genf`) · `krakow`(alias **`크라코프`**/`cracow`) · `venice`(alias **`베니스`**/`venezia`) · `nice`
- 국내: `muju` · `jinan` · `imsil` · `sunchang` · `jangsu`
- 총 **120 hub** · 명소 **820** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: `베니스`→이탈리아 베네치아 hub · LA **`베니스 비치`** exact는 유지 · 임실은 **`임실 섬진강`**(구례·곡성 접두와 분리) · 제네바 성당은 **`제네바 생피에르 대성당`**
- hub 스모크: `레이캬비크`/`레이캬빅`/`제네바`/`genève`/`크라쿠프`/`크라코프`/`베네치아`/`베니스`/`니스`/`무주`/`진안`/`임실`/`순창`/`장수` + 회귀(스톡홀름·밀라노·속초·파리)
- exact: `할그림스키르캬`/`블루라군`/`제트 도`/`바벨 성`/`산마르코 광장`/`리알토 다리`/`영국인 산책로`/`덕유산국립공원`/`마이산`/`임실치즈테마파크`/`순창고추장민속마을`/`논개생가`

## cityAttractionHubs — 쾰른·나폴리·발렌시아 + 정읍·익산 등 (#19)

**상태**: 데이터 append · resolve 스모크 ✅ · draft PR 검수 대기 · **#18 tip 조상 포함**(머지 스택)

- **브랜치**: `cursor/city-attraction-batch19-8cba` = #18 tip(`65db005` · `batch18-7595`) **위 append**
- 한 배치 **10 hub × 7명소** (#18 핸드오프 「다음 후보」+ 마르세유·리옹·해남)
- 해외: `cologne`(alias **`콜론`**/`köln`/`koln`) · `naples`(alias **`napoli`**) · `valencia`(alias **`valència`**) · `marseille`(alias **`마르세이유`**) · `lyon`(alias **`리용`**)
- 국내: `jeongeup` · `gimje` · `iksan` · `wanju` · `haenam`
- 총 **130 hub** · 명소 **890** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 정읍은 임실 **`옥정호`**와 분리(황토현전적지) · 완주 **`송광사 완주`**/`모악산 완주`(순천 송광사·김제 모악산과 구분) · `초콜릿 박물관`은 쾰른 한정명
- hub 스모크: `쾰른`/`콜론`/`köln`/`나폴리`/`napoli`/`발렌시아`/`마르세유`/`리옹`/`리용`/`정읍`/`김제`/`익산`/`완주`/`해남` + 회귀(레이캬비크·무주·속초·파리)
- exact: `쾰른 대성당`/`폼페이 유적`/`예술과학도시`/`구항 마르세유`/`푸르비에르 대성당`/`내장산국립공원`/`금산사`/`미륵사지`/`대둔산`/`땅끝마을`

## cityAttractionHubs — 함부르크·잘츠부르크·보르도 + 무안·영암 등 (#20)

**상태**: 데이터 append · resolve 스모크 ✅ · draft PR 검수 대기

- **브랜치**: `cursor/city-attraction-batch20-3eac` = #19 tip(`781217b` · `batch19-8cba`) **위 append**
- 한 배치 **10 hub × 7명소** (#19 핸드오프 「다음 후보」+ 잘츠부르크·보르도)
- 해외: `hamburg` · `bratislava`(alias **`포조니`**) · `zagreb`(alias **`자그렙`**) · `salzburg`(alias **`잘쯔부르크`**) · `bordeaux`
- 국내: `muan` · `yeongam` · `gangjin` · `jangseong` · `hampyeong`
- 총 **140 hub** · 명소 **960** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: `보르도 생미셸 대성당`(동명 분리) · `법천사 무안`/`금곡사 강진`/`용천사 함평`/`축령산 장성` 접두 · `상토원 자그레브`
- hub 스모크: `함부르크`/`브라티슬라바`/`자그레브`/`자그렙`/`잘츠부르크`/`잘쯔부르크`/`보르도`/`무안`/`영암`/`강진`/`장성`/`함평` + 회귀(쾰른·napoli·속초·파리)
- exact: `엘프필하모니`/`미니어처 분데스란트`/`브라티슬라바 성`/`자그레브 대성당`/`호엔잘츠부르크 성`/`물의 거울`/`시테 뒤 뱅`/`월출산국립공원`/`다산초당`/`백양사`/`돌머리해수욕장`

### PR 머지 순서

| 순서 | PR | 비고 |
|------|-----|------|
| ✅ | **#13** | squash → main. #6~#12 포함 |
| ✅ | **#14** | 리스본·남원 등 |
| ✅ | **#15** | 세비야·고흥 등 |
| ✅ | **#17** | 스톡홀름·밀라노·부안 등 (#16 stack) |
| ✅ 닫힘 | draft **#16** | #17로 대체 |
| 다음 | **#18** | #17 tip 위 10 hub |
| 다음 | **#19** | #18 tip 위 10 hub. 단독 머지 시 #18 포함 |
| 다음 | **본 배치(#20)** | #19 tip 위 10 hub. 단독 머지 시 #18·#19 포함 |
| — | #4~#12 | #13에 흡수 · **데스크톱에서 draft 닫기** |

### 현재 hub 맵 (140)

| 구분 | hubId |
|------|-------|
| 시드 | `sokcho` · `paris` |
| 국내 | …(기존 69) · **`muan`** · **`yeongam`** · **`gangjin`** · **`jangseong`** · **`hampyeong`** |
| 해외 | …(기존 60) · **`hamburg`** · **`bratislava`** · **`zagreb`** · **`salzburg`** · **`bordeaux`** |

- **제주**: `jeju`(제주시) / `seogwipo`(서귀포) **분리**. alias `제주`·`제주도` → 제주시. 성산·중문·천지연 등은 서귀포.
- **고성**: `goseong` = **강원 고성**(화진포·DMZ). 경남 고성과 혼동 주의.
- **shrine 사용 중**: 메이지신궁(tokyo) · 후시미 이나리(kyoto) · 쿠시다 신사·다자이후 텐만구(fukuoka)

### 스키마·수정 규칙

- SSOT: [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json) (배열 append) · resolver [`cityAttractionHubs.js`](../src/pages/Home/lib/cityAttractionHubs.js)
- hub 필드: `hubId` · `name` · `name_en` · `country` · `country_en` · `lat`/`lng` · `aliases[]` · `attractions[]`(보통 6~7)
- attraction: `name` · `name_en` · `kind` · `lat`/`lng` — kind enum: `beach`·`market`·`temple`·**`shrine`**·`viewpoint`·`landmark`·`museum`·`neighborhood`·`park`
- 매칭: **exact / prefix만** (부분 containment 스냅 금지 — `.ai-context` Smart Search 규칙과 동일)
- 명소 `name`/`name_en` **전역 unique**(normalize) — 선등록 exact가 이김
- **배치 권장**: hub **8~12**/PR · 국내+해외 병렬 PR 지양(한 tip 위에 append)
- **금지**: 시드 `sokcho`/`paris` 덮어쓰기 · `shrine` KIND_LABEL 제거 · Mapbox 라벨·SearchDiscoveryModal UI·`releaseNotes` 무단 변경 · `travelSpots.js` 전체 스캔

### resolve 스모크 (에이전트가 돌린 방식)

```bash
node --input-type=module -e "
import { resolveCityAttractionHub, resolveHubAttraction, getKindLabel, listCityAttractionHubs } from './src/pages/Home/lib/cityAttractionHubs.js';
console.log(listCityAttractionHubs().length); // 140
const hubs = ['함부르크','브라티슬라바','자그레브','자그렙','잘츠부르크','잘쯔부르크','보르도','무안','영암','강진','장성','함평','쾰른','napoli','속초','파리'];
const exact = ['엘프필하모니','미니어처 분데스란트','브라티슬라바 성','자그레브 대성당','호엔잘츠부르크 성','물의 거울','시테 뒤 뱅','월출산국립공원','다산초당','백양사','돌머리해수욕장','땅끝마을','낙산사'];
for (const q of hubs) console.log('hub', q, !!resolveCityAttractionHub(q));
for (const q of exact) console.log('exact', q, !!resolveHubAttraction(q));
console.log('shrine', getKindLabel('shrine')); // 신사
"
```

### 에이전트 핸드오프 (명소-이어하기)

- **읽을 것 3**: 본 절「#20」·「스키마·수정 규칙」·「PR 머지 순서」 (+ `.ai-context` 3절 Smart Search / 도시 허브)
- **금지 3**: `shrine` 라벨 삭제 · JSON 전면 rewrite(append만) · 미합의 `releaseNotes` · UI/Mapbox 동기화 무단
- **다음 작업 (사용자 선택)**:
  1. **머지**: **#18** → **#19** → **본 배치(#20)** · #4~#12 draft **닫기**(데스크톱)
  2. **다음 배치**(8~12 hub): 예) 글래스고·앤트워프·로테르담 · 국내 영광 외 미등록 시·군(예: 신안·진도 기등록 주의)·유럽 2선 도시
  3. 데스크톱 QA: 드롭다운 · Enter 선택 카드 · `자그렙`→자그레브 · `잘쯔부르크`→잘츠부르크 · `월출산국립공원`/`다산초당` exact · 모바일 키보드
  4. 릴리스 노트는 **합의 후**만
- **제시어**: `명소-이어하기` + `@plans/2026-07-22-project-log.md` · 「다음 8~12 hub 배치 (#20 tip 위 append)」 / 「#18→#19→#20 머지부터」
