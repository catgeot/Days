# 2026-08-09 프로젝트 일지

직전: [`2026-08-08-project-log.md`](./2026-08-08-project-log.md)

## 테마여행 #117, 검색 아이콘 포커스

**상태**: feature `cursor/scenic-search-focus-9792` · PR [#82](https://github.com/catgeot/Days/pull/82) · Preview QA 대기

- **한 일**: 모바일 검색 아이콘 → 입력창 focus(명승·축제) · 1차 setTimeout은 제스처 밖으로 실패 → **flushSync+동기 focus**로 수정
- **VERIFY**: `npm run build` · Playwright 좁은 폭 click→`document.activeElement` PASS
- **공유**: `https://www.gateo.kr/qa/scenic-search-focus`
- **Preview**: `https://days-git-cursor-scenic-search-focus-9792-catgeots-projects.vercel.app/korea/theme/scenic` · `/korea`
- **작업 로그**: 「검색 포커스 — flushSync 수정」
- **남은 일**: 사람 Preview QA(좁은 폭 · 아이콘 → 커서/키보드)
- **다음 채팅명**:

```
테마여행 #118, (다음 과제)
```

## 테마여행 #116, 「주남」검색 오탐

**상태**: feature `cursor/scenic-contentid-f876` · PR [#81](https://github.com/catgeot/Days/pull/81) · Preview QA 대기

- **증상**: 「주남」검색 시 주남저수지 미노출 · 「주남 저수지」는 OK
- **원인**: 2글자가 blurb「제주남쪽」·이름「광주남한」에 부분일치 → 권역이 제주/수도권으로 치우침
- **한 일**: `scenicSearch` 2글자=본명 선두·시군 주소 · `pickRegionFromSpotMatches` 최다 권역 · smoke 「주남」
- **VERIFY**: `smoke:korea-scenic-search` · `npm run build`
- **다음 채팅명**: (contentId 잔여는 아래 #116 절)

## 테마여행 #116, 잔여 contentId 보강

**상태**: feature `cursor/scenic-contentid-f876` · PR [#81](https://github.com/catgeot/Days/pull/81) · tip `19a386a4` · Preview QA 대기  
**참고**: #114 이후 잔여 null≈93 → alias·매칭 가드 보강 후 **18곳** 추가.

- **한 일**: `fill:korea-scenic-spot-content-ids` — KEYWORD_ALIASES·접미 ratio 2.6·`hubHints`(경남 고성)·캠핑장/허브꼬리/약한 일반명 가드 · contentId **18곳** 채움(627→645 · 잔여 null 75)
- **채움 예**: 퍼플섬 `578024` · 주남저수지 `126117` · 제황산공원 `126139` · 고성공룡박물관 `130540` · 나로우주센터 `751881` · 칠곡보 · 부항댐 · 성밖숲 · 위양지 · 작천정 · 원남저수지 · 금성산 · 금오랜드 · 만연산 · 평림댐 · 황룡강 · 불갑저수지 · 성주 가야산
- **오매칭 반려**: 능곡동→오이도 · 계룡산자연사→공주 한국자연사박물관 · 스타필드→하남 동사지 · 강진만(만)≠생태공원
- **MISS(유지 null)**: 킨텍스·스타필드·리조트·운문사(캠핑만)·미르섬(공주 동명)·백사장(태안) 등 Tour 미등재·타 지역 ≈75 · LIVE 429로 추가 keyword 중단
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-contentid-f876-catgeots-projects.vercel.app/korea/theme/scenic?hub=sinan&spot=purple-island` · `?hub=changwon&spot=changwon-junam-reservoir` · `?hub=goseongnam&spot=goseong-dinosaur-museum`
- **작업 로그**: 「잔여 contentId 18곳 추가 채움」
- **남은 일**: 사람 Preview QA · 잔여 null≈75(Tour 미등재·429 후속) · merge 후 `/qa/scenic-hub-fill`→PROD
- **다음 채팅명**:

```
테마여행 #117, 잔여 contentId 보강
```

## 테마여행 #114, 잔여 contentId 보강

**상태**: feature `cursor/scenic-contentid-f876` · PR [#80](https://github.com/catgeot/Days/pull/80) · tip `0b195021` · Preview QA 대기  
**참고**: 채팅명 #114(contentId). 같은 날 #114 양구 세션과 번호 겹침 · #108 핸드오프의 #109 슬롯 작업.

- **한 일**: `fill:korea-scenic-spot-content-ids` — areaBased 0건 → **searchKeyword 잔여 패스**·주석/(지역)/국립공원 정규화로 contentId **88곳** 채움(539→627 · 잔여 null 93) · 진도 시군구 1→21 · `--keyword-only` 플래그
- **채움 예**: 부석사 `127669` · 선운사 `147548` · 고창읍성 `126398` · 벽골제 · 우포늪 · 직지사 · 천사대교 · 대흥사 · 미륵사지 · 백양사 · 불갑사 · 소수서원 · 주왕산
- **MISS(유지 null)**: 킨텍스·스타필드·알펜시아/용평(본명 type12 부재)·로컬 공원·시장 등 Tour 미등재 ≈93
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-contentid-f876-catgeots-projects.vercel.app/korea/theme/scenic?hub=yeongju&spot=buseoksa` · `?hub=gochang&spot=seonunsa` · `?hub=changnyeong&spot=upo-wetland-changnyeong`
- **작업 로그**: 「searchKeyword로 선정 contentId 88곳 채움」
- **남은 일**: 사람 Preview QA · 잔여 null≈93(Tour 본명 부재·상업시설) · merge 후 `/qa/scenic-hub-fill`→PROD
- **다음 채팅명**:

```
테마여행 #116, 잔여 contentId 보강
```

## 테마여행 #114, 내주변 양구 관내 누락

**상태**: feature `cursor/scenic-nearby-yanggu-7658` · PR [#79](https://github.com/catgeot/Days/pull/79) · tip `73c0ef44` · Preview QA 대기

- **증상**: 양구 「내 주변」관광지에서 관내 제외된 것처럼 인제 등이 먼저 노출
- **원인**: bbox 후보 806건인데 `limit 500`만 가져와 거리순 전에 관내 누락
- **한 일**: `fetchKoreaTourAttractionsNear` range 페이지네이션(페이지 1000·상한 3000) · smoke LIVE 양구 관내 · `/qa/scenic-nearby` Preview 재연결
- **VERIFY**: `smoke:korea-scenic-nearby` (LIVE 양구 양구향교 0.2km) · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-nearby`
- **Preview**: `https://days-git-cursor-scenic-nearby-yanggu-7658-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「내 주변 관광지 — bbox 페이지네이션」
- **남은 일**: 사람 Preview QA (양구 위치 → 관광지 최근접이 관내)
- **다음 채팅명**:

```
테마여행 #115, 내주변 양구 QA
```

## 테마여행 #113, 세권 칩 메인 반영 전 점검

**상태**: feature `cursor/scenic-mid-cluster-67a8` · PR [#78](https://github.com/catgeot/Days/pull/78) · tip `54c6b4ed` · **기술 GO · 사람 Preview 확인 후 merge**

- **한 일**: main 대비 충돌 없음(#110 포함 tip) · SSOT 8시도 hub 배타·전수 cover · 기본값(#110 연장) · Preview/로컬 UI 5항 QA
- **VERIFY PASS**: `audit:korea-scenic-clusters` · `smoke:korea-scenic-clusters` · `smoke:korea-scenic-categories` · `smoke:korea-scenic-search` · `smoke:korea-theme-cross-links` · `smoke:korea-scenic-spots` · `npm run build`
- **UI QA**: 서울 기본·세권 없음 → 경기 북부33·hub7 → 동부·하남/가평 → 강원 영서·홍천 → 명승/관광지 세권 없음
- **공유**: `https://www.gateo.kr/qa/scenic-mid-cluster`
- **Preview**: `https://days-git-cursor-scenic-mid-cluster-67a8-catgeots-projects.vercel.app/korea/theme/scenic`
- **잔여(비차단)**: PR 본문 세권 개수 표기는 결합 라벨(백제·내륙 등)과 문구 어긋남 · 플랜 §2.2「합의 대기」헤더 stale · generate `generatedAt`만 재생성 drift
- **남은 일**: 사람 Preview OK → PR #78 merge → `/qa/scenic-mid-cluster` PROD 전환
- **다음 채팅명**:

```
테마여행 #114, 세권 칩 main 병합
```

## 테마여행 #112, 세권 칩 SSOT·UI

**상태**: feature `cursor/scenic-mid-cluster-67a8` · PR [#78](https://github.com/catgeot/Days/pull/78) · ✅ #113 점검

- **한 일**: 세권표 합의분 SSOT·generate/audit · 명소 파드 `ccluster` 칩·기본값·hub 경로 시드 · QA `/qa/scenic-mid-cluster`
- **VERIFY**: `audit/smoke:korea-scenic-clusters` · `smoke:korea-scenic-categories` · `smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-mid-cluster`
- **Preview**: `https://days-git-cursor-scenic-mid-cluster-67a8-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「명소 세권(경기 동서남북 등) 칩」
- **남은 일**: ✅ #113 점검 · 사람 Preview 후 merge

## 테마여행 #111, 명소 중분류 체계

**상태**: feature `cursor/scenic-mid-cluster-67a8` · PR [#78](https://github.com/catgeot/Days/pull/78) · 표 합의 → #112 구현

- **한 일**: 세권 계층 · 경기 동서남북 · 타 시도 실제 분류 제안표 합의
- **다음**: #112 SSOT·UI

## 테마여행 #110, 분류칩 기본 중소수

**상태**: feature `cursor/scenic-default-chip-6098` · PR [#77](https://github.com/catgeot/Days/pull/77) · tip `af587a5d` · Preview QA 대기

- **한 일**: 명승 홈 기본값을 권역 전체(수도권 179) 대신 **첫 시도 중분류(서울)** 로 · 목록이 길면 소분류(~10건) · 명소·명승·관광지 파드 공통 · 같은 칩 재클릭으로 권역 전체 해제 방지
- **VERIFY**: `smoke:korea-scenic-categories` · `smoke:korea-scenic-search` · `smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-default-chip`
- **Preview**: `https://days-git-cursor-scenic-default-chip-6098-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「기본값=첫 중·소분류(~10건)」
- **남은 일**: 사람 Preview QA (진입 시 서울·짧은 목록 · 강원→양양 · 관광지 종목 소분류)
- **다음 채팅명**:

```
테마여행 #111, 분류칩 기본값 QA
```

## 명승 분류칩 파드 분리

**상태**: `main` tip `8eb63843` · `origin/main` push ✅ · 세션 종료

- **증상**: 명소·명승·관광지 분류칩이 `?region=`/`?area=`·`hub` locality로 서로 승계됨
- **한 일**: 파드별 `cregion/carea`·`hregion/harea`·`tregion/tarea` · hub는 명소만 · 관광지에 권역·시도 칩 · 레거시 region/area 시드 후 제거 · `scenicHomePathForHubId` 갱신
- **VERIFY**: `smoke:korea-scenic-search` · `smoke:korea-theme-cross-links` · categories/nearby/heritage/spots/place-cluster · `npm run build`
- **QA**: `/korea/theme/scenic` → 명소 강원 선택 시 명승·관광지 칩 유지 · hub 진입 시 명승에 「○○ 명승」뱃지 없음

## 테마여행 #108, main 병합·전반 점검

**상태**: PR [#75](https://github.com/catgeot/Days/pull/75) **MERGED** · tip `887957da` · `origin/main` push ✅

- **판단**: 시·군 빈 hub 큐 **소진**(#104) · 기능/폴백(#105–#106) 포함 · 잔여는 Tour **contentId null ≈181**(일일 쿼터·본명 부재) 데이터만
- **한 일**: main과 충돌 해소(일지·작업로그 · 네이버 #76 포함) · VERIFY PASS · main fast-forward push · `/qa/scenic-hub-fill`→PROD
- **VERIFY**: `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **남은 일**: Tour 한도 해제 후 `fill:korea-scenic-spot-content-ids` 잔여 · 박물관 썸네일 · 폴리시/릴리스 · 사람 전반 QA
- **다음 채팅명**:

```
테마여행 #109, 잔여 contentId 보강
```

## 홈 PC 레이아웃 정리 (main · push ✅)

**상태**: `main` tip `0fd834f` · `origin/main` push 완료 (세션 종료)

- **한 일**: (1) 투톱·테마 카테고리 겹침 → PC 레일 `top-[14.5rem] justify-start` (2) 나라칩·LOGIN/LOGBOOK → 가용 높이 `calc(100dvh-14.5rem-6.5rem)` (3) 「↑/↓ 더보기」제거 (4) Windows `CloudPreviewWorkLog.jsx` 명시 import
- **커밋**: `1edfc07` · `15690f8` · `794e188` · `0fd834f`
- **QA**: PROD/로컬 PC 홈 — 테마 펼침·중동/오세아니아 · LOGIN/LOGBOOK

## 테마여행 #89, 네이버 검색 쿼리

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `e79b5a1a` · Preview 사람 QA 대기

- **한 일**: 네이버 쿼리 분기 — **맛집만 지역+상호** · 관광지·명소·명승·레포츠·문화는 **고유명만**
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「명소는 고유명 · 맛집만 지역+상호」
- **남은 일**: 사람 Preview QA (명소 vs 맛집 검색 결과 비교) · ✅ hub 보강은 별도 #83–#107 → main(#108)
- **다음 채팅명**: (hub 보강 큐는 #104 소진 · contentId는 #109)

## 테마여행 #88, 네이버 링크 확장

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `14c86f3b` · ✅ 쿼리 분기는 #89

- **한 일**: 맛집뿐 아니라 **명승·관광지·레포츠·문화** 상세에도 동일 위치(개요 아래·주소 위) 「네이버 상세정보 보기」 노출
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「레포츠·관광지·문화에도 네이버 칩」

## 테마여행 #87, 네이버 버튼 위치

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `92a6fdfe` · ✅ 확장은 #88

- **한 일**: 네이버 칩을 **개요 아래 · 주소 위**로 이동 (주소·문의·영업시간 흐름 유지)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「개요 아래·주소 위로 이동」

## 테마여행 #86, 네이버 문구·위치

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `963c9cbd` · ✅ 위치 재조정은 #87

- **한 일**: 문구 「네이버 상세정보 보기」 · 상세 본문에서 **전화 바로 아래**로 이동
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「네이버 상세정보 보기 · 전화 아래」

## 테마여행 #85, 네이버 버튼 컴팩트

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `b63883b0` · ✅ 문구·위치는 #86

- **한 일**: 네이버 이동 버튼을 한 줄 칩으로 축소 (보조문구·섹션 라벨 제거)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「네이버로 이동 버튼 축소」

## 테마여행 #84, 네이버 이동 버튼

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `3582e24e` · ✅ 컴팩트 조정은 #85

- **한 일**: 맛집 상세 네이버 링크를 「N · 네이버로 이동 · 새 탭에서 네이버 검색」 CTA 버튼으로 교체 (초록 톤·외부이동 아이콘)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「네이버로 이동 CTA 버튼」

## 테마여행 #83, 맛집 네이버 링크

**상태**: feature `cursor/scenic-food-naver-link-b366` · PR [#76](https://github.com/catgeot/Days/pull/76) · tip `475fdebb` · Preview 사람 QA 대기

- **한 일**: 명승·축제 연계 맛집 상세(`ThemeSpotDetailModal`) 본문에 지역+상호 네이버 검색 링크 「네이버에서 보기」 추가 (TourAPI에 place id 없어 검색 연결)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-food-naver`
- **Preview**: `https://days-git-cursor-scenic-food-naver-link-b366-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「맛집 상세 → 네이버에서 보기」
- **남은 일**: ✅ #84 버튼 직관화

## 테마여행 #107, 잔여 contentId 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `b8d98cb4` · ✅ #108 main 병합

- **한 일**: `fill:korea-scenic-spot-content-ids` — searchKeyword 429 회피 · areaBasedList(시·군)+DB 엄격 매칭으로 contentId **10곳** 채움(529→539 · 잔여 null 181) · 창원 시군구 6→16 · 연기/군위 색인 · 알펜시아 스키장 오매칭 제외
- **채움 예**: 평창올림픽기념관 `2733036` · 의왕 레일파크 `2388712` · 화순 적벽(물염적벽) `128991` · 무주덕유산리조트 `126718` · 논산 백제군사박물관 · 장수승마장 · 장흥 토요시장 · 거창박물관 · 클레이아크김해 · 청송 객주문학관
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build` · (nearby LIVE는 Tour timeout — 환경 한도)
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=pyeongchang&spot=pyeongchang-olympic-plaza` · `?hub=uiwang&spot=uiwang-rail-park` · `?hub=hwasun&spot=hwasun-jeokbyeok`
- **작업 로그**: 「areaBased·DB로 선정 contentId 10곳 채움」
- **남은 일**: ✅ #108 main 병합 · 잔여 null≈181은 후속
- **다음 채팅명**: `테마여행 #108, main 병합·전반 점검` → 완료(위 #108 절)

## 테마여행 #106, Preview QA 반영

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `1166719c` · ✅ #107 contentId 보강

- **원인**: #105 SSOT `overview`는 채워졌으나 `ScenicPage.toModalSpot`이 `overview`를 모달에 안 넘겨 킨텍스가 「Tour 상세 없음」만 표시
- **한 일**: `toModalSpot`에 `overview` 전달 · curated 경로 이미지 정규화 · TourAPI 부재 안내 문장 사용자 본문에서 제거
- **VERIFY**: `npm run build` · 로컬 HTTPS 킨텍스 모달(개요·썸네일·Tour 없음 문구 제거)
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=goyang&spot=kintex-goyang` · `?hub=gapyeong&spot=garden-of-morning-calm`
- **작업 로그**: 「킨텍스 overview 모달 전달 수정」
- **남은 일**: ✅ #107 잔여 contentId
- **다음 채팅명**: `테마여행 #107, 잔여 contentId 보강` → 완료(위 #107 절)

## 테마여행 #105, 선정 contentId 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `e075d138` · ✅ #106 overview 전달 수정

- **원인**: (1) 아침고요 등 — TourAPI `locationBasedList` 일일 한도(429)로 주변 맛집·레포츠·문화 실패 · contentId `126668`은 정상 (2) 킨텍스 — Tour type12/14 본체 없음 → contentId null · 「Tour 상세 없음」
- **한 일**: hub→시군구 SSOT(`koreaSigunguByHub`) · 주변 API `areaBasedList` 폴백 · Tour 부재 191곳 GATEO `overview` · 킨텍스 본문 보강 · 모달 curated overview
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-nearby-restaurants` · `smoke:korea-nearby-leisure-culture` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=goyang&spot=kintex-goyang` · `?hub=gapyeong&spot=garden-of-morning-calm`
- **작업 로그**: 「주변 areaBased 폴백 · Tour 부재 overview」
- **남은 일**: ✅ #106 overview 모달 전달

## 테마여행 #104, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `daddc40a` · ✅ #105 주변 폴백·overview

- **한 일**: 큐 잔여 경상 — 영덕4·영양4 **전수** GATEO 선정 · Tour contentId 2/8 · 썸네일 683/720 · 경북 시도 색인 · Tour LIVE 429 → DB·related 폴백 · **시·군 빈 hub 큐 소진(0)** · smoke `rounds=0` 허용
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=yeongdeok` · `?hub=yeongyang`
- **작업 로그**: 「영덕·영양 GATEO 선정 전수 · 큐 소진」
- **남은 일**: ✅ #105 주변 폴백·overview
- **다음 채팅명**: `테마여행 #105, 선정 contentId 보강` → 완료(위 #105 절)

## 테마여행 #103, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `966b5304` · ✅ #104 영덕·영양 · 큐 소진

- **한 일**: 큐 R01 전라·경상 — 광양4·경산4·산청4·성주4·의령4 **전수** GATEO 선정 · Tour contentId 3/20 · 썸네일 675/712 · 전남·경북·경남 시도 색인 · Tour LIVE 429 → DB·related 폴백 · 큐 잔여 2
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=gwangyang` · `?hub=gyeongsan` · `?hub=sancheong` · `?hub=seongju` · `?hub=uiryeong`
- **작업 로그**: 「광양·경산·산청·성주·의령 GATEO 선정 전수」
- **남은 일**: ✅ #104 영덕·영양 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #104, 빈 hub 명소 보강` → 완료(위 #104 절)

## 테마여행 #102, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `5458f663` · ✅ #103 광양·경산·산청·성주·의령

- **한 일**: 큐 R01 경상 — 청송4·칠곡4·독도4·김천4·고령4 **전수** GATEO 선정 · Tour contentId 7/20 · 썸네일 655/692 · 경북 시도 색인(독도 포함) · Tour LIVE 공백·429 → locationBasedList·DB·related 폴백 · 큐 잔여 7
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=cheongsong` · `?hub=chilgok` · `?hub=dokdo` · `?hub=gimcheon` · `?hub=goryeong`
- **작업 로그**: 「청송·칠곡·독도·김천·고령 GATEO 선정 전수」
- **남은 일**: ✅ #103 광양·경산·산청·성주·의령 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #103, 빈 hub 명소 보강` → 완료(위 #103 절)

## 테마여행 #101, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `030fd568` · ✅ #102 청송·칠곡·독도·김천·고령

- **한 일**: 큐 R01 경상 — 의성5·예천5·영천5·영주5·창녕4 **전수** GATEO 선정 · Tour contentId 9/24 · 썸네일 635/672 · 경북·경남 시도 색인 · Tour LIVE 429 → locationBasedList·DB·related 폴백 · 큐 잔여 12
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=uiseong` · `?hub=yecheon` · `?hub=yeongcheon` · `?hub=yeongju` · `?hub=changnyeong`
- **작업 로그**: 「의성·예천·영천·영주·창녕 GATEO 선정 전수」
- **남은 일**: ✅ #102 청송·칠곡·독도·김천·고령 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #102, 빈 hub 명소 보강` → 완료(위 #102 절)

## 테마여행 #100, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `64cb54e6` · ✅ #101 의성·예천·영천·영주·창녕

- **한 일**: 큐 R01 경상 — 고성5·구미5·함안5·밀양5·사천5 **전수** GATEO 선정 · Tour contentId 12/25 · 썸네일 611/648 · 경남·경북 시도 색인 · Tour LIVE 429 → locationBasedList·DB·related 폴백 · 큐 잔여 17
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=goseongnam` · `?hub=gumi` · `?hub=haman` · `?hub=miryang` · `?hub=sacheon`
- **작업 로그**: 「고성·구미·함안·밀양·사천 GATEO 선정 전수」
- **남은 일**: ✅ #101 의성·예천·영천·영주·창녕 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #101, 빈 hub 명소 보강` → 완료(위 #101 절)

## 테마여행 #99, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `721a49e9` · ✅ #100 고성·구미·함안·밀양·사천

- **한 일**: 큐 R01 경상 — 양산6·창원5·청도5·달성5·기장5 **전수** GATEO 선정 · Tour contentId 12/26 · 썸네일 586/623 · 경남·경북·대구·부산 시도 색인 · Tour LIVE 429 → locationBasedList·DB·related 폴백 · 큐 잔여 22
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=yangsan` · `?hub=changwon` · `?hub=cheongdo` · `?hub=dalseong` · `?hub=gijang`
- **작업 로그**: 「양산·창원·청도·달성·기장 GATEO 선정 전수」
- **남은 일**: ✅ #100 고성·구미·함안·밀양·사천 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #100, 빈 hub 명소 보강` → 완료(위 #100 절)

## 테마여행 #98, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `9b906121` · ✅ #99 양산·창원·청도·달성·기장

- **한 일**: 큐 R01 전라 잔여+경상 — 영암4·거창7·울주7·김해6·군위6 **전수** GATEO 선정 · Tour contentId 9/30 · 썸네일 560/597 · 전남·경남·경북·울산 시도 색인 · Tour LIVE 429 → locationBasedList·DB·related 폴백 · 큐 잔여 27
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=yeongam` · `?hub=geochang` · `?hub=ulju` · `?hub=gimhae` · `?hub=gunwi`
- **작업 로그**: 「영암·거창·울주·김해·군위 GATEO 선정 전수」
- **다음 채팅명**: `테마여행 #99, 빈 hub 명소 보강` → 완료(위 #99 절)

## 테마여행 #97, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `d7d9c21b` · ✅ #98 영암·거창·울주·김해·군위

- **한 일**: 큐 R01 전라 — 해남4·함평4·익산4·무안4·무주4 **전수** GATEO 선정 · Tour contentId 13/20 · 썸네일 549/567 · 전북·전남 시도 색인 · Tour LIVE 429 → locationBasedList·DB·related 폴백 · 큐 잔여 32
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=haenam` · `?hub=hampyeong` · `?hub=iksan` · `?hub=muan` · `?hub=muju`
- **작업 로그**: 「해남·함평·익산·무안·무주 GATEO 선정 전수」
- **다음 채팅명**: `테마여행 #98, 빈 hub 명소 보강` → 완료(위 #98 절)

## 테마여행 #96, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `f6103bec` · ✅ #97 해남·함평·익산·무안·무주

- **한 일**: 큐 R01 전라 — 나주5·신안5·순창5·영광5·김제4 **전수** GATEO 선정 · Tour contentId 12/24 · 썸네일 529/547 · 전북·전남 시도 색인 · Tour LIVE 검색 공백 → DB·related 폴백 · 큐 잔여 37
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=naju` · `?hub=sinan` · `?hub=sunchang` · `?hub=yeonggwang` · `?hub=gimje`
- **작업 로그**: 「나주·신안·순창·영광·김제 GATEO 선정 전수」
- **남은 일**: ✅ #97 해남·함평·익산·무안·무주 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #97, 빈 hub 명소 보강` → 완료(위 #97 절)

## 테마여행 #95, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `1ef6b753` · ✅ #96 나주·신안·순창·영광·김제

- **한 일**: 큐 R01 전라 — 화순5·임실5·장흥5·장성5·진도5 **전수** GATEO 선정 · Tour contentId 14/25 · 썸네일 505/523 · 전북·전남 시도 색인 · Tour LIVE 429 → DB·related 폴백 · 큐 잔여 42
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=hwasun` · `?hub=imsil` · `?hub=jangheung` · `?hub=jangseong` · `?hub=jindo`
- **작업 로그**: 「화순·임실·장흥·장성·진도 GATEO 선정 전수」
- **남은 일**: ✅ #96 나주·신안·순창·영광·김제 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #96, 빈 hub 명소 보강` → 완료(위 #96 절)

## 테마여행 #94, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `3c298c4c` · ✅ #95 화순·임실·장흥·장성·진도

- **한 일**: 큐 R01 워커A — 서천6·강진5·고창5·고흥5·함양5 **전수** GATEO 선정 · Tour contentId 11/26 · 썸네일 480/498 · 충남·전북·전남·경남 시도 색인 · Tour LIVE 429 → DB·related 폴백 · 큐 잔여 47
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=seocheon` · `?hub=gangjin` · `?hub=gochang` · `?hub=goheung` · `?hub=hamyang`
- **작업 로그**: 「서천·강진·고창·고흥·함양 GATEO 선정 전수」
- **남은 일**: ✅ #95 화순·임실·장흥·장성·진도 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #95, 빈 hub 명소 보강` → 완료(위 #95 절)

## 테마여행 #93, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `a585811b` · ✅ #94 서천·강진·고창·고흥·함양

- **한 일**: 큐 R01 잔여+전라 R02 앞 — 연기4·예산4·완주7·곡성6·장수6 **전수** GATEO 선정 · Tour contentId 19/27 · 썸네일 454/472 · 세종·충남·전북·전남 시도 색인 · 큐 잔여 52
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=yeongi` · `?hub=yesan` · `?hub=wanju` · `?hub=gokseong` · `?hub=jangsu`
- **작업 로그**: 「연기·예산·완주·곡성·장수 GATEO 선정 전수」
- **남은 일**: ✅ #94 서천·강진·고창·고흥·함양 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #94, 빈 hub 명소 보강` → 완료(위 #94 절)

## 테마여행 #92, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `b43f9d2b` · Preview 사람 QA 대기

- **한 일**: 큐 R01 충청 잔여 — 음성4·금산4·홍성4·논산4·옥천4 **전수** GATEO 선정 · Tour contentId 12/20 · 썸네일 427/445 · 충북·충남 시도 색인 · 큐 잔여 57
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=eumseong` · `?hub=geumsan` · `?hub=hongseong` · `?hub=nonsan` · `?hub=okcheon`
- **작업 로그**: 「음성·금산·홍성·논산·옥천 GATEO 선정 전수」
- **남은 일**: ✅ #93 연기·예산·완주·곡성·장수 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #93, 빈 hub 명소 보강` → 완료(위 #93 절)

## 테마여행 #91, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `342077a4` · Preview 사람 QA 대기

- **한 일**: 큐 R01 — 상주6·계룡5·문경5·영동5·봉화4 **전수** GATEO 선정 · Tour contentId 20/25 · 썸네일 415/425 · 경북·충북·충남 시도 색인 · 큐 잔여 62
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=sangju` · `?hub=gyeryong` · `?hub=mungyeong` · `?hub=yeongdong` · `?hub=bonghwa`
- **작업 로그**: 「상주·계룡·문경·영동·봉화 GATEO 선정 전수」
- **남은 일**: ✅ #92 음성·금산·홍성·논산·옥천 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #92, 빈 hub 명소 보강` → 완료(위 #92 절)

## 테마여행 #90, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `19a2a3ea` · Preview 사람 QA 대기

- **한 일**: 큐 R01 충청 — 서산6·보은5·청양5·당진5·괴산5 **전수** GATEO 선정 · Tour contentId 24/26 · 썸네일 395/400 · 충북·충남 시도 색인 · 큐 잔여 67
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=seosan` · `?hub=boeun` · `?hub=cheongyang` · `?hub=dangjin` · `?hub=goesan`
- **작업 로그**: 「서산·보은·청양·당진·괴산 GATEO 선정 전수」
- **남은 일**: ✅ #91 상주·계룡·문경·영동·봉화 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #91, 빈 hub 명소 보강` → 완료(위 #91 절)

## 테마여행 #89, 빈 hub 명소 보강

**상태**: feature `cursor/scenic-yangyang-b772` · PR [#75](https://github.com/catgeot/Days/pull/75) · tip `fe3478f1` · Preview 사람 QA 대기

- **한 일**: 큐 R01 잔여+R02 앞 — 횡성4·화천4·충주6·증평6·세종6 **전수** GATEO 선정 · Tour contentId 24/26 · 썸네일 371/374 · 강원·충북·세종(area 8) 시도 색인 · 큐 잔여 72
- **VERIFY**: `audit:korea-scenic-spots` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `smoke:korea-area-codes` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-yangyang-b772-catgeots-projects.vercel.app/korea/theme/scenic?hub=hoengseong` · `?hub=hwacheon` · `?hub=chungju` · `?hub=jeungpyeong` · `?hub=sejong`
- **작업 로그**: 「횡성·화천·충주·증평·세종 GATEO 선정 전수」
- **남은 일**: ✅ #90 서산·보은·청양·당진·괴산 전수 · 사람 Preview QA
- **다음 채팅명**: `테마여행 #90, 빈 hub 명소 보강` → 완료(위 #90 절)
