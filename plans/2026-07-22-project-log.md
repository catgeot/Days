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

## cityAttractionHubs — 시드니·두바이 + 국내 6 (#9 예정 · 배치 8)

**상태**: 데이터 append · resolve 스모크 ✅ · PR 검수 대기

- **기반**: #8 tip · 한 배치 **8 hub × 7명소** (파이 확대: 4개 단위 지양)
- 해외: `sydney` · `dubai`
- 국내: `pyeongchang` · `yangyang` · `namhae` · `andong` · `boryeong`(alias **`대천`**) · `suncheon`
- 총 **40 hub** · 명소 **260** · shrine KIND_LABEL 유지 · 시드 intact
- 주의: 양양에 **낙산사 미포함**(속초 exact 선점 유지) · 남해 `이순신순국공원` name_en은 통영 `Yi Sun-sin Park`와 충돌 피함
- hub 스모크: `시드니`/`두바이`/`평창`/`양양`/`남해`/`안동`/`보령`/`대천`/`순천` + 회귀(오키나와·하카타·부산·nyc·속초·파리)
- exact: `시드니 오페라하우스`/`본디 비치` · `부르즈 할리파` · `월정사`/`서피비치` · `남해 독일마을`/`하회마을` · `대천해수욕장`/`순천만습지`/`낙안읍성`

### PR 머지 순서

| 순서 | PR | 비고 |
|------|-----|------|
| 1 | **#6** | 합본+후쿠오카·하노이. 머지 후 #4·#5 닫기 |
| 2 | **#7** | #6 위 1커밋 |
| 3 | **#8** | docs 핸드오프 (#7 위) |
| 4 | **본 배치(#9)** | #8 위 8 hub. 단독 머지 시 #6~#8 내용 포함 |
| — | #4·#5 | #6에 흡수 · 단독 머지 시 JSON 충돌 |

### 현재 hub 맵 (40)

| 구분 | hubId |
|------|-------|
| 시드 | `sokcho` · `paris` |
| 국내 | `seoul` · `busan` · `jeju` · `seogwipo` · `incheon` · `daegu` · `gwangju` · `daejeon` · `ulsan` · `yeosu` · `gyeongju` · `gangneung` · `jeonju` · `tongyeong` · `pohang` · `chuncheon` · **`pyeongchang`** · **`yangyang`** · **`namhae`** · **`andong`** · **`boryeong`** · **`suncheon`** |
| 해외 | `tokyo` · `osaka` · `kyoto` · `bangkok` · `taipei` · `singapore` · `hong-kong` · `rome` · `london` · `new-york` · `fukuoka` · `hanoi` · `okinawa` · `ho-chi-minh` · **`sydney`** · **`dubai`** |

- **제주**: `jeju`(제주시) / `seogwipo`(서귀포) **분리**. alias `제주`·`제주도` → 제주시. 성산·중문·천지연 등은 서귀포.
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
console.log(listCityAttractionHubs().length); // 40
const hubs = ['시드니','두바이','평창','양양','남해','안동','보령','대천','순천','오키나와','하카타','부산','nyc','속초'];
const exact = ['시드니 오페라하우스','부르즈 할리파','월정사','서피비치','하회마을','대천해수욕장','순천만습지','다자이후 텐만구','낙산사'];
for (const q of hubs) console.log('hub', q, !!resolveCityAttractionHub(q));
for (const q of exact) console.log('exact', q, !!resolveHubAttraction(q));
console.log('shrine', getKindLabel('shrine')); // 신사
"
```

### 에이전트 핸드오프 (명소-이어하기)

- **읽을 것 3**: 본 절「PR 머지 순서」·「스키마·수정 규칙」·「배치 8」표 (+ `.ai-context` 3절 Smart Search / 도시 허브)
- **금지 3**: `shrine` 라벨 삭제 · JSON 전면 rewrite(append만) · 미합의 `releaseNotes` · UI/Mapbox 동기화 무단
- **다음 작업 (사용자 선택)**:
  1. **머지**: #6 → #7 → #8 → 본 배치 · #4·#5 정리
  2. **다음 배치**(8~12 hub): 예) 멜버른·오클랜드·이스탄불 · 국내 **목포**·진주·거제 등 미등록 소도시
  3. 데스크톱 QA: 타이핑 드롭다운 · Enter 선택 카드 · `대천`→보령 · 모바일 키보드
  4. 릴리스 노트는 **합의 후**만
- **제시어**: `명소-이어하기` + `@plans/2026-07-22-project-log.md` · 「다음 8~12 hub 배치」 / 「#6~본배치 머지부터」
