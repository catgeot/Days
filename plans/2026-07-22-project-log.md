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

**상태**: ✅ main FF 머지 (`eab8bb4`…`de189b4` 스택 · #18~#21)

- **브랜치**: `cursor/city-attraction-batch18-7595` = #17 tip(main `38e83e0`) **위 append**
- 한 배치 **10 hub × 7명소** (#17 핸드오프 「다음 후보」+ 베네치아·니스·장수)
- 해외: `reykjavik`(alias **`레이캬빅`**) · `geneva`(alias **`genève`**/`genf`) · `krakow`(alias **`크라코프`**/`cracow`) · `venice`(alias **`베니스`**/`venezia`) · `nice`
- 국내: `muju` · `jinan` · `imsil` · `sunchang` · `jangsu`
- 총 **120 hub** · 명소 **820** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: `베니스`→이탈리아 베네치아 hub · LA **`베니스 비치`** exact는 유지 · 임실은 **`임실 섬진강`**(구례·곡성 접두와 분리) · 제네바 성당은 **`제네바 생피에르 대성당`**
- hub 스모크: `레이캬비크`/`레이캬빅`/`제네바`/`genève`/`크라쿠프`/`크라코프`/`베네치아`/`베니스`/`니스`/`무주`/`진안`/`임실`/`순창`/`장수` + 회귀(스톡홀름·밀라노·속초·파리)
- exact: `할그림스키르캬`/`블루라군`/`제트 도`/`바벨 성`/`산마르코 광장`/`리알토 다리`/`영국인 산책로`/`덕유산국립공원`/`마이산`/`임실치즈테마파크`/`순창고추장민속마을`/`논개생가`

## cityAttractionHubs — 쾰른·나폴리·발렌시아 + 정읍·익산 등 (#19)

**상태**: ✅ main FF 머지 (#18~#21 스택)

- **브랜치**: `cursor/city-attraction-batch19-8cba` = #18 tip(`65db005` · `batch18-7595`) **위 append**
- 한 배치 **10 hub × 7명소** (#18 핸드오프 「다음 후보」+ 마르세유·리옹·해남)
- 해외: `cologne`(alias **`콜론`**/`köln`/`koln`) · `naples`(alias **`napoli`**) · `valencia`(alias **`valència`**) · `marseille`(alias **`마르세이유`**) · `lyon`(alias **`리용`**)
- 국내: `jeongeup` · `gimje` · `iksan` · `wanju` · `haenam`
- 총 **130 hub** · 명소 **890** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 정읍은 임실 **`옥정호`**와 분리(황토현전적지) · 완주 **`송광사 완주`**/`모악산 완주`(순천 송광사·김제 모악산과 구분) · `초콜릿 박물관`은 쾰른 한정명
- hub 스모크: `쾰른`/`콜론`/`köln`/`나폴리`/`napoli`/`발렌시아`/`마르세유`/`리옹`/`리용`/`정읍`/`김제`/`익산`/`완주`/`해남` + 회귀(레이캬비크·무주·속초·파리)
- exact: `쾰른 대성당`/`폼페이 유적`/`예술과학도시`/`구항 마르세유`/`푸르비에르 대성당`/`내장산국립공원`/`금산사`/`미륵사지`/`대둔산`/`땅끝마을`

## cityAttractionHubs — 함부르크·잘츠부르크·보르도 + 무안·영암 등 (#20)

**상태**: ✅ main FF 머지 (#18~#21 스택)

- **브랜치**: `cursor/city-attraction-batch20-3eac` = #19 tip(`781217b` · `batch19-8cba`) **위 append**
- 한 배치 **10 hub × 7명소** (#19 핸드오프 「다음 후보」+ 잘츠부르크·보르도)
- 해외: `hamburg` · `bratislava`(alias **`포조니`**) · `zagreb`(alias **`자그렙`**) · `salzburg`(alias **`잘쯔부르크`**) · `bordeaux`
- 국내: `muan` · `yeongam` · `gangjin` · `jangseong` · `hampyeong`
- 총 **140 hub** · 명소 **960** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: `보르도 생미셸 대성당`(동명 분리) · `법천사 무안`/`금곡사 강진`/`용천사 함평`/`축령산 장성` 접두 · `상토원 자그레브`
- hub 스모크: `함부르크`/`브라티슬라바`/`자그레브`/`자그렙`/`잘츠부르크`/`잘쯔부르크`/`보르도`/`무안`/`영암`/`강진`/`장성`/`함평` + 회귀(쾰른·napoli·속초·파리)
- exact: `엘프필하모니`/`미니어처 분데스란트`/`브라티슬라바 성`/`자그레브 대성당`/`호엔잘츠부르크 성`/`물의 거울`/`시테 뒤 뱅`/`월출산국립공원`/`다산초당`/`백양사`/`돌머리해수욕장`

## cityAttractionHubs — 글래스고·앤트워프·빌바오 + 신안·원주 등 (#21)

**상태**: ✅ main FF 머지 (`de189b4` tip · #18~#21 포함)

- **브랜치**: `cursor/city-attraction-batch21-2829` = #20 tip(`dcb63e1` · `batch20-3eac`) **위 append**
- 한 배치 **10 hub × 7명소** (#20 핸드오프 「다음 후보」+ 빌바오·인스브루크·나주·화순·광양·원주)
- 해외: `glasgow`(alias **`글라스고`**) · `antwerp`(alias **`antwerpen`**/`anvers`/`안트베르펜`) · `rotterdam` · `bilbao`(alias **`bilbo`**) · `innsbruck`(alias **`인스부르크`**)
- 국내: `sinan` · `naju` · `hwasun` · `gwangyang` · `wonju`
- 총 **150 hub** · 명소 **1030** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: `인스브루크 호프부르크`(비엔나 `호프부르크`와 분리) · `화순고인돌`(고창 고인돌과 분리) · `광양 매화마을`/`광양 백운산` 접두 · `옥룡사 동백숲`(광양)
- hub 스모크: `글래스고`/`glasgow`/`글라스고`/`앤트워프`/`antwerpen`/`로테르담`/`빌바오`/`bilbo`/`인스브루크`/`인스부르크`/`신안`/`나주`/`화순`/`광양`/`원주` + 회귀(함부르크·무안·속초·파리)
- exact: `글래스고 대성당`/`안트베르펜 중앙역`/`에라스무스 다리`/`빌바오 구겐하임 미술관`/`황금 지붕`/`천사대교`/`퍼플섬`/`나주읍성`/`화순고인돌유적지`/`운주사`/`구봉산 케이블카`/`옥룡사 동백숲`/`뮤지엄산`/`치악산국립공원`

## cityAttractionHubs — 중간 정리·일시 중단 (2026-07-22)

**판정**: ✅ **이상 없음** · #18~#21 FF → `main` · **클라우드 배치 일시 중단**(데스크톱 QA·샘플 검수 후 재개)

| 항목 | 결과 |
|------|------|
| hub / 명소 | **150** / **1030** |
| `hubId`·명소명 normalize 중복 | 0 |
| kind enum·좌표·필수 필드 | 0 위반 |
| resolve 스모크 | hub·exact·`shrine`=`신사` OK |
| tip | `de189b4` |

**남은 정리(데스크톱)**: stale draft **#4~#12·#6·#18~#21** 닫기(`gh` 미로그인) · 실수로 재머지 금지

### PR 머지 순서

| 순서 | PR | 비고 |
|------|-----|------|
| ✅ | **#13** | squash → main. #6~#12 포함 |
| ✅ | **#14** | 리스본·남원 등 |
| ✅ | **#15** | 세비야·고흥 등 |
| ✅ | **#17** | 스톡홀름·밀라노·부안 등 (#16 stack) |
| ✅ 닫힘 | draft **#16** | #17로 대체 |
| ✅ | **#18~#21** | FF → main (`de189b4`) |
| 닫기 | #4~#12·#6·#18~#21 draft | 흡수 완료 · **데스크톱에서 닫기** |

### 현재 hub 맵 (150 · main)

| 구분 | hubId |
|------|-------|
| 시드 | `sokcho` · `paris` |
| 국내 | …(기존 74) · **`sinan`** · **`naju`** · **`hwasun`** · **`gwangyang`** · **`wonju`** |
| 해외 | …(기존 65) · **`glasgow`** · **`antwerp`** · **`rotterdam`** · **`bilbao`** · **`innsbruck`** |

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
console.log(listCityAttractionHubs().length); // 150
const hubs = ['글래스고','glasgow','앤트워프','antwerpen','로테르담','빌바오','bilbo','인스브루크','인스부르크','신안','나주','화순','광양','원주','함부르크','무안','속초','파리'];
const exact = ['글래스고 대성당','안트베르펜 중앙역','에라스무스 다리','빌바오 구겐하임 미술관','황금 지붕','천사대교','나주읍성','화순고인돌유적지','구봉산 케이블카','뮤지엄산','엘프필하모니','낙산사'];
for (const q of hubs) console.log('hub', q, !!resolveCityAttractionHub(q));
for (const q of exact) console.log('exact', q, !!resolveHubAttraction(q));
console.log('shrine', getKindLabel('shrine')); // 신사
"
```

### 에이전트 핸드오프 (명소-이어하기 · 오케스트레이터)

- **읽을 것 3**: [`orchestrator-method.md`](./orchestrator-method.md) · 본 절「중간 정리·일시 중단」·「스키마·수정 규칙」 (+ `.ai-context` 3절 Smart Search / 도시 허브)
- **금지 3**: `shrine` 라벨 삭제 · JSON 전면 rewrite(append만) · 미합의 `releaseNotes` · stale draft 재머지 · tip **병렬** 머지
- **다음 작업 (사용자 선택)**:
  1. stale draft **닫기** (#4~#12·#6·#18~#21)
  2. **재개**: **오케스트레이터**로 tip 위 다음 8~12 hub
  3. 릴리스 노트는 **합의 후**만 · **commit/push는 요청 시**
- **제시어**: `오케스트레이터` + `명소` · 「main tip 위 다음 10 hub」

## cityAttractionHubs — 프랑크푸르트·토리노·삿포로 + 충주·김해 등 (#22)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 OK · **미커밋**(요청 시)

- **기반**: #21 tip · 오케스트레이터 + 워커 병렬 초안 → 직렬 append
- 한 배치 **10 hub × 7명소**
- 해외: `frankfurt` · `turin`(alias **`토리노`**/`torino`) · `ghent`(alias **`gent`**) · `dubrovnik`(alias **`두브로브닉`**) · `sapporo`(alias **`삿뽀로`** · `홋카이도 신궁`=`shrine`)
- 국내: `chungju` · `cheonan` · `samcheok` · `yangpyeong` · `gimhae`
- 총 **160 hub** · 명소 **1100** · shrine KIND_LABEL 유지 · 시드 intact
- QA: #21 핸드오프 resolve+프로덕션 UI(`글라스고`/`antwerpen`/`인스부르크`/`천사대교`/`뮤지엄산`) 통과 후 재개
- 주의: 토리노·겐트 접두 · `천안 독립기념관` · 삼척 접두 · `남한강 두물머리`/`세미원` · `김해 수로왕릉`
- hub 스모크: `프랑크푸르트`/`토리노`/`torino`/`겐트`/`gent`/`두브로브니크`/`삿포로`/`삿뽀로`/`충주`/`천안`/`삼척`/`양평`/`김해` + 회귀(글래스고·속초·파리)
- exact: `뢰머베르크`/`마인타워`/`토리노 몰레 안토넬리아나`/`겐트 그라스레이`/`스트라둔`/`반예 해변`/`삿포로 시계탑`/`홋카이도 신궁`/`충주호`/`천안 독립기념관`/`삼척 환선굴`/`남한강 두물머리`/`김해 수로왕릉`
- **다음 후보(안)**: 해외 `manchester`·`toulouse`·`granada`·`hiroshima`·`tallinn` · 국내 `taebaek`·`donghae`·`asan`·`seosan`·`changwon`
- **제시어**: `오케스트레이터` + `명소` · 「다음 10 hub」 / commit 요청 시 「#22 커밋」

## cityAttractionHubs — 맨체스터·그라나다·히로시마 + 태백·동해 등 (#23)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 OK · **미커밋**

- 한 배치 **10 hub × 7명소** (#22 tip 위)
- 해외: `manchester` · `toulouse` · `granada` · `hiroshima`(`미야지마 이쓰쿠시마 신사`=`shrine`) · `tallinn`
- 국내: `taebaek` · `donghae` · `asan` · `seosan` · `changwon`(alias **`마산`**/`진해`)
- 총 **170 hub** · 명소 **1170** · shrine 유지 · 시드 intact
- 오케스트레이터 보정: `아산 현충사` kind `shrine`→`landmark`(UI「신사」방지) · 일반명 접두(`맨체스터 과학산업박물관`·`미디 운하 툴루즈`·`탈린 시청 광장`)
- hub 스모크: `맨체스터`/`툴루즈`/`그라나다`/`히로시마`/`탈린`/`태백`/`동해`/`아산`/`서산`/`창원`/`마산`/`진해` + 회귀
- exact: `알함브라 궁전`/`원폭 돔`/`미야지마 이쓰쿠시마 신사`/`동해 망상해수욕장`/`아산 현충사`/`서산 부석사`/`창원 진해군항제`
- **다음(#24)**: `liverpool`·`malaga`·`nuremberg`·`kanazawa`·`ljubljana` · `hongcheon`·`jeongseon`·`uljin`·`icheon`·`miryang`

## cityAttractionHubs — 리버풀·말라가·가나자와 + 홍천·정선 등 (#24)

**상태**: ✅ tip append · audit/issues 0 · **미커밋**

- 한 배치 **10 hub × 7명소** (#23 tip 위)
- 해외: `liverpool` · `malaga` · `nuremberg` · `kanazawa`(`오야마 신사`=`shrine`) · `ljubljana`
- 국내: `hongcheon` · `jeongseon` · `uljin` · `icheon` · `miryang`
- 총 **180 hub** · 명소 **1240**
- 오케스트레이터 보정: 류블랴나 `Dragon Bridge`/`티볼리 공원` → `류블랴나 용의 다리`/`류블랴나 티볼리 공원`(다낭·코펜하겐 충돌)
- **다음(#25)**: `birmingham`·`genoa`·`bologna`·`bergen`·`vilnius` · `hoengseong`·`yeoju`·`yangsan`·`sacheon`·`pocheon`

## cityAttractionHubs — 버밍엄·제노바·베르겐 + 횡성·포천 등 (#25)

**상태**: ✅ tip append · audit/issues 0 · **미커밋**

- 한 배치 **10 hub × 7명소** (#24 tip 위)
- 해외: `birmingham` · `genoa`(alias **`genova`**) · `bologna` · `bergen` · `vilnius`
- 국내: `hoengseong` · `yeoju` · `yangsan` · `sacheon`(alias **`삼천포`**) · `pocheon`
- 총 **190 hub** · 명소 **1310**
- 보정: `항공우주박물관`→`사천 항공우주박물관`
- **다음(#26)**: `cardiff`·`strasbourg`·`verona`·`nagoya`·`riga` · `boeun`·`okcheon`·`yeongdeok`·`cheongsong`·`yanggu`

## cityAttractionHubs — 카디프·나고야·리가 + 보은·양구 등 (#26)

**상태**: ✅ tip append · audit/issues 0 · **미커밋** · **200 hub 마일스톤**

- 한 배치 **10 hub × 7명소** (#25 tip 위)
- 해외: `cardiff` · `strasbourg`(alias **`스트라스부호`**) · `verona` · `nagoya`(`아츠타 신궁`=`shrine`) · `riga`
- 국내: `boeun` · `okcheon` · `yeongdeok` · `cheongsong` · `yanggu`(alias **`펀치볼`**)
- 총 **200 hub** · 명소 **1380**
- **다음(#27)**: `leeds`·`padua`·`split`·`luxembourg`·`gothenburg` · `hwacheon`·`cheorwon`·`yeongyang`·`bonghwa`·`uiseong`

## cityAttractionHubs — 리즈·스플리트·룩셈부르크 + 화천·철원 등 (#27)

**상태**: ✅ tip append · audit/issues 0 · **미커밋**

- 한 배치 **10 hub × 7명소** (#26 tip 위)
- 해외: `leeds` · `padua`(alias **`padova`**) · `split` · `luxembourg` · `gothenburg`(alias **`고텐부르크`**/`göteborg`)
- 국내: `hwacheon` · `cheorwon` · `yeongyang` · `bonghwa` · `uiseong`
- 총 **210 hub** · 명소 **1450**
- **다음(#28)**: `newcastle`·`bari`·`zadar`·`bruges`·`malmo` · `goesan`·`jincheon`·`eumseong`·`yecheon`·`sangju`

## cityAttractionHubs — 뉴캐슬·브뤼헤·말뫼 + 괴산·상주 등 (#28)

**상태**: ✅ tip append · audit/issues 0 · **미커밋**

- 한 배치 **10 hub × 7명소** (#27 tip 위)
- 해외: `newcastle`(alias **`newcastle upon tyne`**) · `bari` · `zadar` · `bruges`(alias **`brugge`**) · `malmo`(alias **`malmö`**)
- 국내: `goesan` · `jincheon` · `eumseong` · `yecheon` · `sangju`
- 총 **220 hub** · 명소 **1520**
- **다음(#29)**: `sheffield`·`trier`·`pula`·`aarhus`·`linz` · `yeoncheon`·`anseong`·`pyeongtaek`·`osan`·`guri`

## cityAttractionHubs — 셰필드·트리어·풀라 + 연천·구리 등 (#29)

**상태**: ✅ tip append · audit/issues 0 · **미커밋**

- 한 배치 **10 hub × 7명소** (#28 tip 위)
- 해외: `sheffield` · `trier`(alias **`trèves`**) · `pula` · `aarhus`(alias **`아르후스`**) · `linz`
- 국내: `yeoncheon` · `anseong` · `pyeongtaek` · `osan` · `guri`
- 총 **230 hub** · 명소 **1590**
- **다음(#30)**: `bristol`·`aachen`·`sibenik`·`odense`·`graz` · `namyangju`·`hanam`·`uijeongbu`·`anyang`·`gunpo`
- **오케스트레이터 이관 권고**: 세션 컨텍스트 큼 · tip 미커밋(#22~#29) · 다음 채팅은 `오케스트레이터` + 「인수인계서대로 이어서」

## cityAttractionHubs — 브리스틀·아헨·시베니크 + 남양주·안양 등 (#30)

**상태**: ✅ tip append · audit/issues 0 · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#29 tip 위)
- 해외: `bristol` · `aachen`(alias **`aix-la-chapelle`**) · `sibenik` · `odense` · `graz`
- 국내: `namyangju` · `hanam` · `uijeongbu` · `anyang` · `gunpo`
- 총 **240 hub** · 명소 **1660** (세션 시작 150→+90)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#30 일지·`.ai-context`·method |
| 건수 | **240 hub / 1660 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` |
| 다음(#31) | `nottingham`·`wroclaw`·`rovinj`·`tampere`·`klagenfurt` · `bucheon`·`gwacheon`·`siheung`·`gimpo`·`goyang` |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#31 배치」 / commit 시 「#22~#30 커밋」 |

## cityAttractionHubs — 노팅엄·브로츠와프·로비니 + 부천·고양 등 (#31)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#30 tip 위)
- 해외: `nottingham` · `wroclaw`(alias **`Breslau`**) · `rovinj` · `tampere` · `klagenfurt`
- 국내: `bucheon` · `gwacheon` · `siheung` · `gimpo` · `goyang`(alias **`일산`**)
- 총 **250 hub** · 명소 **1730** (240→250 / 1660→1730)
- 충돌 보정: 없음 (audit issues 0 직통과)
- hub 스모크: `노팅엄`/`nottingham`/`브로츠와프`/`wroclaw`/`로비니`/`탐페레`/`클라겐푸르트`/`부천`/`과천`/`시흥`/`김포`/`고양`/`일산` + exact·회귀(`속초`/`파리`/`낙산사`/`에펠탑`) · `shrine`=`신사`

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#31 일지·`.ai-context`·method |
| 건수 | **250 hub / 1730 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` |
| 다음(#32) | `brighton`·`gdansk`·`porec`·`turku`·`villach` · `yangju`·`dongducheon`·`gwangmyeong`·`uiwang`·`ansan` |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#32 배치」 / commit 시 「#22~#31 커밋」 |

**서브 오케스트레이터 이관**: #31·#32·#33 후임 서브 성공(부모 VERIFY_PASS 270/1870) · #34 후임 인계.

## cityAttractionHubs — 브라이턴·그단스크·포레치 + 양주·안산 등 (#32)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#31 tip 위)
- 해외: `brighton` · `gdansk`(alias **`Gdańsk`**/`단치히`) · `porec`(alias **`Poreč`**) · `turku`(alias **`Åbo`**) · `villach`
- 국내: `yangju` · `dongducheon` · `gwangmyeong` · `uiwang` · `ansan`
- 총 **260 hub** · 명소 **1800** (250→260 / 1730→1800)
- 충돌 보정: `양주 장흥관광지`(전남 `장흥` 분리) · 양주 **송암 미포함**(고양 exact) · `안산 시화호`(시흥 `시화나래` 분리) · `광명 안양천생태공원`/`청계산 의왕코스`/`의왕 청계사` 접두 · KR `temple` only(shrine 한국 사당 금지)
- hub 스모크: `브라이턴`/`brighton`/`그단스크`/`gdansk`/`포레치`/`투르쿠`/`필라흐`/`양주`/`동두천`/`광명`/`의왕`/`안산` + exact·회귀(`속초`/`파리`/`낙산사`/`에펠탑`) · `shrine`=`신사`

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#32 일지·`.ai-context`·method |
| 건수 | **260 hub / 1800 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` |
| 다음(#33) | `swansea`·`poznan`·`oulu`·`bregenz`·`leipzig` · `seongnam`·`yongin`·`hwaseong`·`gimcheon`·`dangjin` |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#33 배치」 / commit 시 「#22~#32 커밋」 |

**서브 오케스트레이터 이관**: #32 후임 서브 성공 · #33 후임 VERIFY_PASS 후 #34 인계.

## cityAttractionHubs — 스완지·포즈난·오울루 + 성남·당진 등 (#33)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#32 tip 위)
- 해외: `swansea`(alias **`Abertawe`**) · `poznan`(alias **`Poznań`**) · `oulu`(alias **`Uleåborg`**) · `bregenz` · `leipzig`
- 국내: `seongnam` · `yongin` · `hwaseong` · `gimcheon` · `dangjin`
- 총 **270 hub** · 명소 **1870** (260→270 / 1800→1870)
- 충돌 보정: `성남 남한산성`/`성남 탄천` 접두 · 화성 **수원화성·융건릉·화성행궁 미포함**(수원 exact) · `당진 삽교호`/`화성 공룡알화석지`/`화성 우음도`/`화성 전곡항` 접두 · `솔뫼성지`=`landmark`(KR shrine 금지) · KR `temple` only
- hub 스모크: `스완지`/`swansea`/`포즈난`/`poznan`/`Poznań`/`오울루`/`브레겐츠`/`라이프치히`/`성남`/`용인`/`화성`/`김천`/`당진` + exact·회귀(`속초`/`파리`/`낙산사`/`에펠탑`) · `shrine`=`신사`

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#33 일지·`.ai-context`·method |
| 건수 | **270 hub / 1870 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` |
| 다음(#34) | `exeter`·`lodz`·`kuopio`·`dresden`·`rijeka` · `nonsan`·`gyeryong`·`seocheon`·`hongseong`·`gumi` |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#34 배치」 / commit 시 「#22~#33 커밋」 |

**서브 오케스트레이터 이관**: #33 후임 서브 성공 · #34도 후임 서브/세션에 인계.

## cityAttractionHubs — 엑서터·우치·드레스덴 + 논산·구미 등 (#34)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#33 tip 위)
- 해외: `exeter` · `lodz`(alias **`Łódź`**) · `kuopio` · `dresden` · `rijeka`(alias **`Fiume`**)
- 국내: `nonsan` · `gyeryong` · `seocheon` · `hongseong` · `gumi`
- 총 **280 hub** · 명소 **1940** (270→280 / 1870→1940)
- 충돌 보정: `논산 탑정호`/`논산 대둔산`(완주 `대둔산` 분리) · `구미 금오산` · KR `temple` only · `직지사`/`대천해수욕장`/`간월암`/`수원화성` 미재등록 · `Frauenkirche Dresden`/`Dresden Zwinger` 접두 · `Korzo Rijeka`
- hub 스모크: `엑서터`/`exeter`/`우치`/`lodz`/`Łódź`/`쿠오피오`/`드레스덴`/`리예카`/`Fiume`/`논산`/`계룡`/`서천`/`홍성`/`구미` + exact·회귀(`속초`/`파리`/`낙산사`/`에펠탑`/`수원화성`/`직지사`) · `shrine`=`신사`

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#34 일지·`.ai-context`·method |
| 건수 | **280 hub / 1940 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` |
| 다음(#35) | `plymouth`·`katowice`·`jyvaskyla`·`bremen`·`osijek` · `yesan`·`cheongyang`·`yeongdong`·`chilgok`·`gyeongsan` |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#35 배치」 / commit 시 「#22~#34 커밋」 |

**서브 오케스트레이터 이관**: #34 후임 서브 성공 · #35도 후임 서브/세션에 인계.

## cityAttractionHubs — 플리머스·카토비체·브레멘 + 예산·경산 등 (#35)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#34 tip 위)
- 해외: `plymouth` · `katowice` · `jyvaskyla`(alias **`Jyväskylä`**) · `bremen` · `osijek`
- 국내: `yesan` · `cheongyang` · `yeongdong` · `chilgok`(alias **`왜관`**) · `gyeongsan`
- 총 **290 hub** · 명소 **2010** (280→290 / 1940→2010)
- 충돌 보정: `영동포도원` lng `127.7855` · `플리머스 바비칸`/`플리머스 국립해양수족관` · `브레멘 베저 강변`/`브레멘 뷔르거파크` · `오시예크 유럽 거리` · `청양 알프스마을` · `영동 양산팔경`(경남 양산 분리) · `경산 갓바위`(팔공산·목포 분리) · KR `temple` only
- hub 스모크: `플리머스`/`plymouth`/`카토비체`/`위배스퀼레`/`jyvaskyla`/`Jyväskylä`/`브레멘`/`오시예크`/`예산`/`청양`/`영동`/`칠곡`/`왜관`/`경산` + exact·회귀(`속초`/`파리`/`낙산사`/`에펠탑`/`수원화성`) · `shrine`=`신사`

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#35 일지·`.ai-context`·method |
| 건수 | **290 hub / 2010 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` |
| 다음(#36) | `southampton`·`bydgoszcz`·`lahti`·`hannover`·`varazdin` · `geumsan`·`goryeong`·`seongju`·`gunwi`·`uiryeong` |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#36 배치」 / commit 시 「#22~#35 커밋」 |

**서브 오케스트레이터 이관**: #35 후임 서브 성공 · #36도 후임 서브/세션에 인계.

## cityAttractionHubs — 사우스햄튼·하노버·바라주딘 + 금산·군위 등 (#36)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#35 tip 위) · 해외 워커 초안 + 국내 오케스트레이터 확정 → tip **직렬** append
- 해외: `southampton`(alias **`사우샘프턴`**) · `bydgoszcz`(alias **`브롬베르크`**) · `lahti` · `hannover`(alias **`hanover`**) · `varazdin`(alias **`Varaždin`**)
- 국내: `geumsan` · `goryeong`(alias **`대가야`**) · `seongju` · `gunwi` · `uiryeong` · KR `temple` only(`shrine` 없음)
- 총 **300 hub** · 명소 **2080** (290→300 / 2010→2080)
- 충돌 보정: `금산 대둔산`(wanju `대둔산` 분리) · `성주 가야산`(hapcheon `가야산` 분리) · `군위 팔공산` · 구시가지/시장/성당 EN·KO 도시 접두
- hub 스모크: `사우스햄튼`/`southampton`/`사우샘프턴`/`비드고슈치`/`브롬베르크`/`라흐티`/`하노버`/`hanover`/`바라주딘`/`Varaždin`/`금산`/`고령`/`성주`/`군위`/`의령` + exact·회귀(`속초`/`파리`/`낙산사`/`에펠탑`/`수원화성`) · `shrine`=`신사`
- exact: `헤렌하우젠 정원`/`마슈제`/`시벨리우스 홀`/`비드고슈치 제분섬`/`바라주딘 성`/`금산 인삼시장`/`고령 지산동 고분군`/`성주 한개마을`/`군위 화본역`/`의령 충익사`/`바게이트`

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#36 일지·`.ai-context`·method |
| 건수 | **300 hub / 2080 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#37) | `portsmouth`·`lublin`·`joensuu`·`kiel`·`karlovac` · `yeongi`·`changnyeong`·`haman`·`yeongcheon`·`cheongdo` |
| 제외 | `jangsu`·`cheongyang` **EXISTS** · `yeongi` free |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#37 배치」 / commit 시 「#22~#36 커밋」 |

**서브 오케스트레이터 이관**: #36 후임 서브 성공(#35 tip 위 직렬 게이트) · #37도 후임 서브/세션에 인계.

## cityAttractionHubs — 포츠머스·키일·카를로바츠 + 창녕·청도 등 (#37)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#36 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `portsmouth`(alias **`포트스머스`**) · `lublin` · `joensuu` · `kiel`(alias **`킬`**) · `karlovac`
- 국내: `yeongi`(alias **`조치원`**) · `changnyeong`(alias **`우포`**) · `haman`(alias **`아라가야`**) · `yeongcheon` · `cheongdo` · KR `temple` only(`shrine` 없음)
- 총 **310 hub** · 명소 **2150** (300→310 / 2080→2150)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `포츠머스`/`portsmouth`/`포트스머스`/`루블린`/`요엔수`/`키일`/`킬`/`카를로바츠`/`연기`/`조치원`/`창녕`/`우포`/`함안`/`아라가야`/`영천`/`청도` + exact·회귀(`속초`/`파리`/`낙산사`/`에펠탑`) · `shrine`=`신사`
- exact: `스피나커 타워`/`루블린 성`/`마이다네크 기념관`/`카렐리쿰`/`라보에 해군기념비`/`두보바츠 성`/`카를로바츠 아쿠아티카`/`연기 고복자연공원`/`창녕 우포늪`/`함안 말이산 고분군`/`영천 임고서원`/`청도 운문사`

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#37 일지·`.ai-context`·method |
| 건수 | **310 hub / 2150 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#38) | `bath`·`szczecin`·`pori`·`lubeck`·`opatija` · `sejong`·`jeungpyeong`·`goseongnam`·`ongjin`·`gwangju_gi` |
| 제외 | 경북·경남 다수 gun **EXISTS** · `goseong`=강원 · `gwangju`=광주광역시 → 경남고성=`goseongnam` · 경기광주=`gwangju_gi` |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#38 배치」 / commit 시 「#22~#37 커밋」 |

**서브 오케스트레이터 이관**: #37 후임 서브 성공(#36 tip 위 직렬·중첩 Task 없이 본인 완료) · #38도 후임 서브/세션에 인계.

## cityAttractionHubs — 바스·뤼베크·오파티야 + 세종·경남고성·경기광주 등 (#38)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#37 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `bath`(alias **`배스`**) · `szczecin`(alias **`스체친`**) · `pori`(alias **`유야리`**) · `lubeck`(alias **`luebeck`**/`뤼벡`) · `opatija`
- 국내: `sejong` · `jeungpyeong`(alias **`좌구산`**/`벨포레`) · `goseongnam`(name **`경남 고성`** · bare `고성`/`goseong` 미사용) · `ongjin`(alias **`백령도`**/`연평도`/`덕적도`) · `gwangju_gi`(name **`경기 광주`** · bare `광주`/`gwangju` 미사용) · KR `temple` only(`shrine` 없음)
- 총 **320 hub** · 명소 **2220** (310→320 / 2150→2220)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `바스`/`bath`/`배스`/`슈체친`/`포리`/`뤼베크`/`luebeck`/`오파티야`/`세종`/`증평`/`경남 고성`/`경남고성`/`당항포`/`옹진`/`백령도`/`경기 광주`/`곤지암`/`화담숲` + 회귀(`고성`→goseong · `광주`→gwangju · `속초`/`파리`) · `shrine`=`신사`
- exact: `로마 목욕장`/`바스 대성당`/`슈체친 성`/`홀스텐토어`/`유야리 해변`/`오파티야 해안산책로`/`세종호수공원`/`증평 좌구산휴양림`/`당항포관광지`/`고성 공룡박물관`/`옹진 백령도`/`화담숲`/`곤지암도자공원` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#38 일지·`.ai-context`·method |
| 건수 | **320 hub / 2220 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#39) | `york`·`canterbury`·`chester`·`rostock`·`gdynia` · `gijang`·`ulju`·`dalseong`·`yuseong`·`yeonsu` |
| 제외 | 대부분 시·군 **EXISTS** · `goseong`/`gwangju` bare 유지 · 국내 #39는 구·군 단위(기장·울주·달성·유성·연수) |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#39 배치」 / commit 시 「#22~#38 커밋」 |

**서브 오케스트레이터 이관**: #38 후임 서브 성공(#37 tip 위 직렬·중첩 Task 없이 본인 완료) · #39도 후임 서브/세션에 인계.

## cityAttractionHubs — 요크·캔터베리·그디니아 + 기장·울주·유성·연수 등 (#39)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#38 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `york` · `canterbury`(alias **`켄터베리`**) · `chester` · `rostock`(alias **`바르넴뮌데`**/`warnemuende`) · `gdynia`(alias **`오르워보`**)
- 국내: `gijang`(alias **`기장군`**/`오시리아`) · `ulju`(alias **`울주군`**/`언양`) · `dalseong`(alias **`달성군`**/`비슬산`) · `yuseong`(alias **`유성구`**/`수통골`) · `yeonsu`(alias **`연수구`**/`송도`) · KR `temple` only(`shrine` 없음) · 시·구 중복 명소는 prefix(`울주 간절곶`·`연수 센트럴파크` 등)
- 총 **330 hub** · 명소 **2290** (320→330 / 2220→2290)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `요크`/`york`/`캔터베리`/`켄터베리`/`canterbury`/`체스터`/`로스토크`/`바르넴뮌데`/`그디니아`/`오르워보`/`기장`/`기장군`/`울주`/`울주군`/`달성`/`달성군`/`유성`/`유성구`/`연수`/`연수구`/`송도` + 회귀(`속초`/`파리`/`고성`→goseong · `광주`→gwangju) · `shrine`=`신사`
- exact: `요크 민스터`/`캔터베리 대성당`/`체스터 성벽`/`바르넴뮌데 해변`/`그디니아 부두`/`일광해수욕장`/`울주 간절곶`/`비슬산자연휴양림`/`유성 수통골`/`연수 센트럴파크`/`트라이볼` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#39 일지·`.ai-context`·method |
| 건수 | **330 hub / 2290 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#40) | `cambridge`·`oxford`·`sopot`·`stralsund`·`wismar` · `suseong`·`dalseo`·`haeundae`·`gangnam`·`seocho` |
| 제외 | 시·군 대부분 **EXISTS** · `goseong`/`gwangju` bare 유지 · 국내 #40는 구 단위(수성·달서·해운대·강남·서초) · EXISTS면 대체 |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#40 배치」 / commit 시 「#22~#39 커밋」 |

**서브 오케스트레이터 이관**: #39 후임 서브 성공(#38 tip 위 직렬·중첩 Task 없이 본인 완료) · #40도 후임 서브/세션에 인계.

## cityAttractionHubs — 케임브리지·옥스퍼드·소포트 + 수성·해운대·강남 등 (#40)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#39 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `cambridge`(alias **`캠브리지`**) · `oxford`(alias **`옥스포드`**) · `sopot` · `stralsund`(alias **`슈트랄준트`**) · `wismar`
- 국내: `suseong`(alias **`수성구`**) · `dalseo`(alias **`달서구`**) · `haeundae`(alias **`해운대구`** · 해변 exact는 부산 hub 선점 → `해운대 동백섬` 등) · `gangnam`(alias **`강남구`**) · `seocho`(alias **`서초구`**) · KR `temple` only(`shrine` 없음) · 구/도시 prefix(`강남 코엑스`·`서초 예술의전당`)
- 총 **340 hub** · 명소 **2360** (330→340 / 2290→2360)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `케임브리지`/`캠브리지`/`cambridge`/`옥스퍼드`/`옥스포드`/`oxford`/`소포트`/`스트랄준트`/`슈트랄준트`/`비스마르`/`수성`/`수성구`/`달서`/`달서구`/`해운대`/`해운대구`/`강남`/`강남구`/`서초`/`서초구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `킹스 칼리지 채플`/`보들리언 도서관`/`소포트 부두`/`외스트제 박물관`/`비스마르 시장광장`/`수성못`/`두류공원`/`해운대 동백섬`/`강남 코엑스`/`서초 예술의전당` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#40 일지·`.ai-context`·method |
| 건수 | **340 hub / 2360 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#41) | `durham`·`winchester`·`salisbury`·`greifswald`·`schwerin` · `mapo`·`yongsan`·`songpa`·`suyeong`·`gwanak` |
| 제외 | `bath`/`brighton`/`bristol`/`gdansk`/`lubeck` **EXISTS** · `goseong`/`gwangju` bare 유지 · 국내 #41는 구 단위(마포·용산·송파·수영·관악) · EXISTS면 대체 |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#41 배치」 / commit 시 「#22~#40 커밋」 |

**서브 오케스트레이터 이관**: #40 후임 서브 성공(#39 tip 위 직렬·중첩 Task 없이 본인 완료) · #41도 후임 서브/세션에 인계.

## cityAttractionHubs — 더럼·윈체스터·솔즈베리 + 마포·용산·송파 등 (#41)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#40 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `durham` · `winchester` · `salisbury`(alias **`솔즈버리`** · exact `스톤헨지`) · `greifswald`(alias **`그라이프스발드`**) · `schwerin`
- 국내: `mapo`(alias **`마포구`**) · `yongsan`(alias **`용산구`**) · `songpa`(alias **`송파구`**) · `suyeong`(alias **`수영구`** · 부산 `광안리해수욕장` 선점 → `수영 광안리 수변`/`수영 광안대교`) · `gwanak`(alias **`관악구`**) · KR `temple` only(`shrine` 없음) · 구 prefix(`마포 홍대거리`·`용산 국립중앙박물관`·`송파 롯데월드` · seoul `홍대`/`남산서울타워` 충돌 회피)
- 총 **350 hub** · 명소 **2430** (340→350 / 2360→2430)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `더럼`/`durham`/`윈체스터`/`winchester`/`솔즈베리`/`솔즈버리`/`salisbury`/`그라이프스발트`/`greifswald`/`슈베린`/`schwerin`/`마포`/`마포구`/`용산`/`용산구`/`송파`/`송파구`/`수영`/`수영구`/`관악`/`관악구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `더럼 대성당`/`윈체스터 대성당`/`솔즈베리 대성당`/`스톤헨지`/`그라이프스발트 대성당`/`슈베린 성`/`마포 홍대거리`/`용산 국립중앙박물관`/`송파 롯데월드`/`수영 광안대교`/`관악산` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#41 일지·`.ai-context`·method |
| 건수 | **350 hub / 2430 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#42) | `norwich`·`potsdam`·`weimar`·`bamberg`·`regensburg` · `jongno`·`seodaemun`·`dongjak`·`yeongdeungpo`·`gangdong` |
| 제외 | `canterbury`/`york`/`chester`/`exeter`/`rostock`/`kiel`/`trier`/`aachen`/`bath`/`brighton`/`bristol`/`gdansk`/`lubeck` **EXISTS** · `goseong`/`gwangju` bare 유지 · 국내 #42는 구 단위(종로·서대문·동작·영등포·강동) · EXISTS면 대체 · `jung`/`seo` bare 모호 → 사용 금지 |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#42 배치」 / commit 시 「#22~#41 커밋」 |

**서브 오케스트레이터 이관**: #41 후임 서브 성공(#40 tip 위 직렬·중첩 Task 없이 본인 완료) · #42도 후임 서브/세션에 인계.

## cityAttractionHubs — 노리치·포츠담·바이마르 + 종로·서대문 등 (#42)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#41 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `norwich`(alias **`노위치`**) · `potsdam` · `weimar`(alias **`바이말`**) · `bamberg`(alias **`밤버그`**) · `regensburg`(alias **`레겐스버그`**)
- 국내: `jongno`(alias **`종로구`**) · `seodaemun`(alias **`서대문구`**) · `dongjak`(alias **`동작구`**) · `yeongdeungpo`(alias **`영등포구`**) · `gangdong`(alias **`강동구`**) · KR `temple`/`landmark` only(`shrine` 없음) · 서울 시드 충돌 회피 prefix(`종로 경복궁`·`종로 창덕궁` · EN `Jongno Changdeokgung` 등) · 송파 `올림픽공원`/마포 `선유도` 미중복(강동·영등포는 구 고유 명소)
- 총 **360 hub** · 명소 **2500** (350→360 / 2430→2500)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `노리치`/`norwich`/`포츠담`/`potsdam`/`바이마르`/`weimar`/`밤베르크`/`bamberg`/`레겐스부르크`/`regensburg`/`종로`/`종로구`/`서대문`/`서대문구`/`동작`/`동작구`/`영등포`/`영등포구`/`강동`/`강동구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `노리치 대성당`/`포츠담 상수시 궁전`/`바이마르 괴테 하우스`/`밤베르크 대성당`/`레겐스부르크 돌다리`/`종로 경복궁`/`서대문형무소역사관`/`동작 노량진수산시장`/`영등포 63빌딩`/`강동 암사동유적` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#42 일지·`.ai-context`·method |
| 건수 | **360 hub / 2500 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#43) | `ipswich`·`colchester`·`cheltenham`·`heidelberg`·`passau` · `gangseo`·`guro`·`geumcheon`·`nowon`·`dobong` |
| 제외 | `seocho` **EXISTS** · `stralsund`/`wismar` **EXISTS** · `icheon`/`yeoju`/`yangpyeong` **EXISTS** · `jung`/`seo` bare 모호 → 사용 금지 · 국내 #43은 구 단위(강서·구로·금천·노원·도봉) · EXISTS면 대체 |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#43 배치」 / commit 시 「#22~#42 커밋」 |

**서브 오케스트레이터 이관**: #42 후임 서브 성공(#41 tip 위 직렬·중첩 Task 없이 본인 완료) · #43도 후임 서브/세션에 인계.

## cityAttractionHubs — 입스위치·하이델베르크·파사우 + 강서·구로 등 (#43)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#42 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `ipswich`(alias **`입스위치`**) · `colchester` · `cheltenham`(alias **`첼튼엄`**/`첼트넘`) · `heidelberg`(alias **`하이델베르크`**) · `passau`
- 국내: `gangseo`(alias **`강서구`**/`서울 강서구` — 부산 강서 혼동 회피) · `guro`(alias **`구로구`**) · `geumcheon`(alias **`금천구`**) · `nowon`(alias **`노원구`**) · `dobong`(alias **`도봉구`**) · KR `temple`/`landmark`/`park`/`museum`/`neighborhood`/`viewpoint`/`market` only(`shrine` 없음) · 구명 prefix
- 총 **370 hub** · 명소 **2570** (360→370 / 2500→2570)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `입스위치`/`ipswich`/`콜체스터`/`colchester`/`첼튼엄`/`cheltenham`/`하이델베르크`/`heidelberg`/`파사우`/`passau`/`강서`/`강서구`/`서울 강서구`/`구로`/`구로구`/`금천`/`금천구`/`노원`/`노원구`/`도봉`/`도봉구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `입스위치 워터프론트`/`콜체스터 성`/`첼튼엄 피트빌 펌프룸`/`하이델베르크 성`/`파사우 슈테판 대성당`/`강서 김포공항`/`구로 고척스카이돔`/`금천 가산디지털단지`/`노원 불암산`/`도봉 도봉산` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#43 일지·`.ai-context`·method |
| 건수 | **370 hub / 2570 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#44) | `leicester`·`coventry`·`reading`·`freiburg`·`augsburg` · `yangcheon`·`eunpyeong`·`seongbuk`·`seongdong`·`gwangjin` |
| 제외 | `seocho`/`gwanak`/`yongsan`/`mapo`/`songpa`/`gangnam` **EXISTS** · `jung`/`seo` bare 모호 → 사용 금지 · 국내 #44는 구 단위(양천·은평·성북·성동·광진) · EXISTS면 대체(`jungnang`/`dongdaemun` 등) |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#44 배치」 / commit 시 「#22~#43 커밋」 |

**서브 오케스트레이터 이관**: #43 후임 서브 성공(#42 tip 위 직렬·중첩 Task 없이 본인 완료) · #44도 후임 서브/세션에 인계.

## cityAttractionHubs — 레스터·프라이부르크·아우크스부르크 + 양천·은평 등 (#44)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#43 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `leicester`(alias **`레스터`**) · `coventry`(alias **`코번트리`**/`코벤트리`) · `reading`(alias **`레딩`**/`리딩`) · `freiburg`(alias **`프라이부르크`**) · `augsburg`(alias **`아우크스부르크`**)
- 국내: `yangcheon`(alias **`양천구`**/`서울 양천구`) · `eunpyeong`(alias **`은평구`**) · `seongbuk`(alias **`성북구`**) · `seongdong`(alias **`성동구`**) · `gwangjin`(alias **`광진구`**) · KR `temple`/`landmark`/`park`/`museum`/`neighborhood`/`viewpoint`/`market` only(`shrine` 없음) · 구명 prefix
- 총 **380 hub** · 명소 **2640** (370→380 / 2570→2640)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `레스터`/`leicester`/`코번트리`/`coventry`/`코벤트리`/`레딩`/`reading`/`리딩`/`프라이부르크`/`freiburg`/`아우크스부르크`/`augsburg`/`양천`/`양천구`/`서울 양천구`/`은평`/`은평구`/`성북`/`성북구`/`성동`/`성동구`/`광진`/`광진구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `레스터 성`/`코번트리 대성당`/`레딩 수도원`/`프라이부르크 대성당`/`아우크스부르크 시청`/`양천 목동`/`은평 불광천`/`성북 북악스카이웨이`/`성동 서울숲`/`광진 어린이대공원` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#44 일지·`.ai-context`·method |
| 건수 | **380 hub / 2640 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#45) | `derby`·`mannheim`·`karlsruhe`·`ulm`·`erfurt` · `jungnang`·`dongdaemun`·`junggu`·`gangbuk`·`bupyeong` |
| 제외 | `seocho`/`jongno`/`seodaemun`/`yeongdeungpo` **EXISTS** · `jung`/`seo` bare 모호 → 사용 금지 · `junggu`는 alias **`중구`/`서울 중구`** 필수 · 서울 잔여 구는 중랑·동대문·중구·강북뿐 → 5번째는 `bupyeong`(인천 부평) · EXISTS면 대체(`busanjin`/`namdong` 등) |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#45 배치」 / commit 시 「#22~#44 커밋」 |

**서브 오케스트레이터 이관**: #44 후임 서브 성공(#43 tip 위 직렬·중첩 Task 없이 본인 완료) · #45도 후임 서브/세션에 인계.

## cityAttractionHubs — 더비·만하임·카를스루에 + 중랑·동대문 등 (#45)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#44 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `derby`(alias **`더비`**) · `mannheim`(alias **`만하임`**) · `karlsruhe`(alias **`카를스루에`**/`칼스루에`) · `ulm`(alias **`울름`**) · `erfurt`(alias **`에르푸르트`**)
- 국내: `jungnang`(alias **`중랑구`**/`서울 중랑구`) · `dongdaemun`(alias **`동대문구`**) · `junggu`(alias **`중구`/`서울 중구`** · bare `jung` 없음) · `gangbuk`(alias **`강북구`**) · `bupyeong`(alias **`부평구`**/`인천 부평구`) · KR `temple`/`landmark`/`park`/`museum`/`neighborhood`/`viewpoint`/`market` only(`shrine` 없음) · 구명 prefix · `동대문디자인플라자`(seoul EXISTS) 재사용 안 함
- 총 **390 hub** · 명소 **2710** (380→390 / 2640→2710)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `더비`/`derby`/`만하임`/`mannheim`/`카를스루에`/`karlsruhe`/`칼스루에`/`울름`/`ulm`/`에르푸르트`/`erfurt`/`중랑`/`중랑구`/`서울 중랑구`/`동대문`/`동대문구`/`서울 동대문구`/`중구`/`서울 중구`/`강북`/`강북구`/`서울 강북구`/`부평`/`부평구`/`인천 부평구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `더비 대성당`/`만하임 워터타워`/`카를스루에 궁전`/`울름 대성당`/`에르푸르트 크래머다리`/`중랑 용마폭포공원`/`동대문 흥인지문`/`중구 명동`/`강북 북서울꿈의숲`/`부평 지하상가` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#45 일지·`.ai-context`·method |
| 건수 | **390 hub / 2710 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#46) | `stuttgart`·`bonn`·`wiesbaden`·`mainz`·`magdeburg` · `busanjin`·`namdong`·`gyeyang`·`michuhol`·`dongnae` |
| 제외 | `seo`/`bukgu`/`namgu`/`donggu` bare 모호 → 사용 금지 · `nuremberg` EXISTS → `nurnberg` 중복 도시 스킵 · 서울 구 배치 소진 → 부산·인천 구 단위 · EXISTS면 대체(`geumjeong`/`yeonje`/`saha`/`chemnitz`/`saarbrucken`) |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#46 배치」 / commit 시 「#22~#45 커밋」 |

**서브 오케스트레이터 이관**: #45 후임 서브 성공(#44 tip 위 직렬·중첩 Task 없이 본인 완료) · #46도 후임 서브/세션에 인계.

## cityAttractionHubs — 슈투트가르트·본·비스바덴 + 부산진·남동 등 (#46)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#45 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `stuttgart`(alias **`슈투트가르트`**) · `bonn`(alias **`본`**) · `wiesbaden`(alias **`비스바덴`**) · `mainz`(alias **`마인츠`**) · `magdeburg`(alias **`마그데부르크`**)
- 국내: `busanjin`(alias **`부산진구`**/`부산 부산진구`) · `namdong`(alias **`남동구`**/`인천 남동구`) · `gyeyang`(alias **`계양구`**/`인천 계양구`) · `michuhol`(alias **`미추홀구`**/`인천 미추홀구`) · `dongnae`(alias **`동래구`**/`부산 동래구`) · KR `temple`/`landmark`/`park`/`museum`/`neighborhood`/`viewpoint`/`market` only(`shrine` 없음) · 구명 prefix · `용두산공원`/`월미도` bare 재사용 안 함
- 총 **400 hub** · 명소 **2780** (390→400 / 2710→2780)
- EXISTS 재확인: 배치 10 전부 free · 스킵 0
- hub 스모크: `슈투트가르트`/`stuttgart`/`본`/`bonn`/`비스바덴`/`wiesbaden`/`마인츠`/`mainz`/`마그데부르크`/`magdeburg`/`부산진`/`부산진구`/`부산 부산진구`/`남동`/`남동구`/`인천 남동구`/`계양`/`계양구`/`인천 계양구`/`미추홀`/`미추홀구`/`인천 미추홀구`/`동래`/`동래구`/`부산 동래구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `슈투트가르트 TV타워`/`본 뮌스터`/`비스바덴 쿠어하우스`/`마인츠 대성당`/`마그데부르크 녹색성채`/`부산진 서면`/`남동 소래포구`/`계양 계양산성`/`미추홀 자유공원`/`동래 동래온천` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **미커밋** 작업트리 · main 대비 hub JSON+#22~#46 일지·`.ai-context`·method |
| 건수 | **400 hub / 2780 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · **중첩 Task만 띄우고 tip 미append 금지** |
| 다음(#47) | `chemnitz`·`saarbrucken`·`kassel`·`luebeck`·`wuerzburg` · `geumjeong`·`yeonje`·`saha`·`sasang`·`daedeok` |
| 제외 | `seo`/`bukgu`/`namgu`/`donggu` bare 모호 → 사용 금지 · 부산 잔여 구=`geumjeong`/`yeonje`/`saha`/`sasang` · EXISTS면 대체(`muenster`/`paderborn`/`ulju`는 EXISTS·`bukgu_ulsan`/`namgu_ulsan`) |
| 제시어 | `오케스트레이터` + `명소` + `@plans/orchestrator-method.md` + `@plans/2026-07-22-project-log.md` · 「인수인계서대로 이어서」 / 「#47 배치」 / commit 시 「#22~#46 커밋」 |

**서브 오케스트레이터 이관**: #46 후임 서브 성공(#45 tip 위 직렬·중첩 Task 없이 본인 완료) · #47도 후임 서브/세션에 인계.

## cityAttractionHubs — 켐니츠·자를브뤼켄·카셀 + 금정·연제 등 (#47)

**상태**: ✅ tip append · audit/issues 0 · resolve 스모크 PASS · **미커밋** · **이 세션 오케스트레이터 이관**

- 한 배치 **10 hub × 7명소** (#46 tip 위) · 후임 오케스트레이터 **본인 런** 초안·직렬 append (중첩 Task 없음)
- 해외: `chemnitz`(alias **`켐니츠`**) · `saarbrucken`(alias **`자를브뤼켄`**) · `kassel`(alias **`카셀`**) · **`dortmund`(alias **`도르트문트`**) — `luebeck` 스킵**: tip에 `#38` `lubeck`(뤼베크, alias에 `luebeck` 포함) 이미 있음 · 동일 도시 중복 방지 · EXISTS 확인 후 `dortmund` 대체** · `wuerzburg`(alias **`뷔르츠부르크`**)
- 국내: `geumjeong`(alias **`금정구`**/`부산 금정구`) · `yeonje`(alias **`연제구`**/`부산 연제구`) · `saha`(alias **`사하구`**/`부산 사하구`) · `sasang`(alias **`사상구`**/`부산 사상구`) · `daedeok`(alias **`대덕구`**/`대전 대덕구`) · KR `temple`/`landmark`/`park`/`museum`/`neighborhood`/`viewpoint`/`beach`/`market` only(`shrine` 없음) · 구명 prefix · `감천문화마을`/`엑스포과학공원` bare 재사용 안 함(`사하`/`대덕` prefix)
- 총 **410 hub** · 명소 **2850** (400→410 / 2780→2850)
- EXISTS 재확인: 배치 10 전부 free · `luebeck`는 hubId free이나 도시 중복으로 미사용
- hub 스모크: `켐니츠`/`chemnitz`/`자를브뤼켄`/`saarbrucken`/`카셀`/`kassel`/`도르트문트`/`dortmund`/`뷔르츠부르크`/`wuerzburg`/`금정`/`금정구`/`부산 금정구`/`연제`/`연제구`/`부산 연제구`/`사하`/`사하구`/`부산 사하구`/`사상`/`사상구`/`부산 사상구`/`대덕`/`대덕구`/`대전 대덕구` + 회귀(`속초`/`파리`) · `shrine`=`신사`
- exact: `켐니츠 카를마르크스기념비`/`자를브뤼켄 성`/`카셀 헤르쿨레스`/`도르트문트 U타워`/`뷔르츠부르크 레지덴츠`/`금정 금정산성`/`연제 연산동`/`사하 다대포해수욕장`/`사상 삼락생태공원`/`대덕 엑스포과학공원` + 회귀(`낙산사`/`에펠탑`)

### 오케스트레이터 인수인계서 (다음 세션)

| 항목 | 값 |
|------|-----|
| tip 상태 | **커밋·push됨** (2026-07-23) · hub JSON+#22~#47 일지·`.ai-context`·method |
| 건수 | **410 hub / 2850 명소** · audit issues **0** |
| 금지 3 | append only · `shrine` 유지 · tip **병렬** 머지 금지 · 미합의 `releaseNotes` · Task만·tip 미append 금지 · **후임 본인 런/솔로 계주 금지** |
| 구성·방향 | 국내 210 / 해외 200 · **재개=해외 우선** · 방법 **v2**(워커2 재기동) — [`2026-07-23-project-log.md`](./2026-07-23-project-log.md) |
| 다음 세대 배치표 | 큐 [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md) **R48**: A=`chicago`·`miami`·`seattle`·`boston`·`las-vegas` / B=`honolulu`·`washington-dc`·`philadelphia`·`denver`·`atlanta` |
| 보류 | `muenster`…`bukgu_busan` · DE/UK 중소·KR 구 세분 · 큐 밖 임의 지명 |
| 제시어 | `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「R48부터 워커2 · 큐 순서」 |

**이관**: #47 완료·커밋됨 · 후임 메인=**워커2 필수** · 해외 우선 승인 후 재개.

## 오케스트레이터 방법 — 공식화 (2026-07-22)

**상태**: ✅ 문서·Rule·audit 스크립트

- SSOT: [`orchestrator-method.md`](./orchestrator-method.md) · Rule [`gateo-orchestrator.mdc`](../.cursor/rules/gateo-orchestrator.mdc) · always 트리거는 [`gateo-project-context.mdc`](../.cursor/rules/gateo-project-context.mdc)
- 게이트: `npm run audit:city-attraction-hubs` (**310** hub / **2150** 명소 · issues 0)
- 다음 세션: 제시어 **`오케스트레이터`** · 「인수인계서대로 이어서」
