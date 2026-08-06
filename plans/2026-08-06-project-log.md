# 2026-08-06 프로젝트 일지

직전: [`2026-08-05-project-log.md`](./2026-08-05-project-log.md)

## 테마여행 #46, 국가유산 명승 목록

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `e27ff84a` · Preview QA 대기

- **요청**: TourAPI가 아니라 네이버/국가유산청 OpenAPI **명승**으로 지역 목록 보강
- **소스**: `SearchKindOpenapiList/Dt` · `ccbaKdcd=15` · 키 불필요 · 브라우저 직접 호출 불가 → `npm run sync:cha-scenic`
- **수량**: 현행(해제 제외) **141** · 권역 강원26·전라46·경상37·충청13·수도권10·제주9
- **한 일**: `koreaHeritageScenic.json` · lib · ScenicPage「국가유산 명승」· 모달 CHA 상세 · 권역 칩=명승 건수 · Tour type12는 보조 목록으로 유지
- **네이버 「전체 29」**: 필터/내주변 등 UI 조각일 수 있음 · 공식 API 전국 현행은 141
- **금지 준수**: 축제 지도 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성
- **VERIFY**: `smoke:korea-heritage-scenic` · `smoke:korea-theme-spot-modal` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「국가유산청 지정 명승 141곳 연결」
- **QA**: 권역 칩 숫자=명승 · GATEO 아래「국가유산 명승」· 항목 상세 개요/사진/국가유산청 링크 · Tour 관광지는 그 아래

### 테마여행 · 에이전트 핸드오프 → `#47`

| | |
|--|--|
| **세션 표기** | `테마여행 #47, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② `sync:cha-scenic` / `koreaHeritageScenic` ③ 플랜 문화재→국가유산 절 |
| **금지 3** | curated에 type12 7천 시드 · 축제 지도 리팩터 · 합의 전 releaseNotes · UI 임의 리디자인 |
| **후보** | Preview QA · CHA 이미지 갤러리 · Tour 목록 축소/숨김 · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #47, Preview QA 반영
```

## 테마여행 #45, 인근 여행지 hub 명승 홈

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `73f47f55` · Preview QA 대기

- **요청**: 명승 본문 인근 여행지 클릭 시 해당 도시 명승 홈으로 가야 하는데, 이전 진입(같은 시도) 명승 홈으로 연결됨
- **원인**: `scenicHomePathForHubId`가 시도(area)까지만 붙여 보령·공주·태안이 동일 URL
- **한 일**: path에 `hub=` · ScenicPage 시·군 필터(선정+DB addr) · 목록 제목·칩·작업 로그
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성 · UI 임의 리디자인 없음
- **VERIFY**: `smoke:korea-theme-cross-links` · `smoke:korea-scenic-categories` · `smoke:korea-theme-spot-modal` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「인근 여행지를 시·군 명승 홈으로」
- **QA**: 명승 상세→인근 보령 vs 공주가 서로 다른 목록 · 「보령 명승」칩·시·군 필터 해제

### 테마여행 · 에이전트 핸드오프 → `#46`

| | |
|--|--|
| **세션 표기** | `테마여행 #46, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #45 hub 명승 홈 ③ 플랜 §1.0·S9 |
| **금지 3** | 축제 지도·칩 리팩터 · top10/regions 탑레벨 부활 · 합의 전 releaseNotes · UI 임의 리디자인 |
| **후보** | Preview QA 피드백 · S9 폴리시·릴리스 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #46, Preview QA 반영
```

## 테마여행 #44, 무니에게 묻기

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `8bd6efca` · Preview QA 대기

- **요청**: 「무니에게 묻기」클릭 시 지구본 홈을 거치지 말고 채팅이 바로 뜨고, 닫으면 이전 명승 상세로 복귀
- **원인**: 테마 라우트가 Home 밖이라 `navigate('/')` + `openMooni` state로 ChatModal을 열었고, 닫기 시 `returnTo` 미연결
- **한 일**: `MooniBoundChatHost` — 현재 라우트에서 ChatModal · `ThemeSpotDetailModal`은 상세를 닫지 않고 오버레이 · Esc/닫기→상세 유지 · 작업 로그
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성 · UI 임의 리디자인 없음
- **VERIFY**: `smoke:korea-theme-spot-modal` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「무니 채팅을 명승 상세에서 바로 열기」
- **QA**: 명승 상세→무니에게 묻기→채팅 즉시 · 지구본 깜빡임 없음 · 닫기→같은 상세

### 테마여행 · 에이전트 핸드오프 → `#45`

| | |
|--|--|
| **세션 표기** | `테마여행 #45, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #44 무니 in-place ③ 플랜 §1.0·S9 |
| **금지 3** | 축제 지도·칩 리팩터 · top10/regions 탑레벨 부활 · 합의 전 releaseNotes · UI 임의 리디자인 |
| **후보** | Preview QA 피드백 · S9 폴리시·릴리스 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #45, Preview QA 반영
```

## 테마여행 #43, 명승 사진 복구·스와이프

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `465cf906` · Preview QA 대기

- **요청**: #42 오해 정정 — 명승 본문 Tour 사진은 유지 · 오탐은 장소카드 갤러리 이유 · 사진 리스트 클릭 시 쓸어 넘기기
- **한 일**: 본문 사진 그리드 복구 · 대표/리스트→확대보기 · 좌우 스와이프·화살표·핀치(축제 #3 패턴) · 작업 로그
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성
- **VERIFY**: `smoke:korea-theme-spot-modal` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「명승 본문 사진 복구·쓸어 넘기기」
- **QA**: 명승 상세에 사진 그리드 · 탭→확대보기 스와이프 · 장소 카드 CTA 없음 · 무니·유튜브 유지

## 테마여행 #42, 명승 인근 여행지

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `40a72bf8` · Preview QA 대기

- **요청**: 인근 여행지(보령·공주·태안)→장소 카드 대신 해당 지역 명승지 홈 · 본문 장소 카드 링크를 무니·유튜브로 대체(본문 Tour 사진은 #43에서 복구)
- **한 일**: `scenicHomePathForHubId` · nearbyHubs→scenic 홈 · 「장소 카드 보기」제거 · 「무니에게 묻기」·유튜브 모달 · 작업 로그
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성 · UI 임의 리디자인 없음
- **VERIFY**: `smoke:korea-theme-cross-links` · `smoke:korea-theme-spot-modal` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「인근 여행지→명승 홈 · 무니·유튜브」
- **QA**: 명승 상세→인근 보령 등→충청/충남 명승 홈 · 장소 카드 CTA 없음 · 무니·유튜브 모달

## 테마여행 #41, 목록 시도·도시 표기

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `4fa8d08e` · Preview QA 대기

- **요청**: 목록 우측이 「수도권 서울」「강원 강원」「전라 전북」처럼 권역·시도라 직관적이지 않음 → 「강원 춘천」「경북 경주」
- **한 일**: `formatScenicSpotPlaceLabel` — 시도+도시(주소 시군/hub) · 서울=도시 중복 시 한 번 · curated hub 시도 폴백 · smoke · 작업 로그
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성
- **VERIFY**: `smoke:korea-scenic-place-label` · `smoke:korea-scenic-categories` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「명승 목록을 시도·도시로 표기」
- **QA**: 남이섬→강원 춘천 · 석굴암→경북 경주 · DB 목록도 시도+도시 · 「수도권 · 서울」형태 없음

### 테마여행 · 에이전트 핸드오프 → `#42`

| | |
|--|--|
| **세션 표기** | `테마여행 #42, 폴리시·릴리스` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② 플랜 §1.0·§1.6·S9 ③ #41 산출 |
| **금지 3** | 축제 지도·칩 리팩터 · top10/regions 탑레벨 부활 · 합의 전 releaseNotes · UI 임의 리디자인 |
| **후보** | S9 폴리시·릴리스(사람 Preview QA 후) · 축제 회귀 점검 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #42, 폴리시·릴리스
```

## 테마여행 #40, 숙소·투어 지역 검색

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `a7fa172a` · Preview QA 대기

- **요청**: 주변 관광지 상세 숙소·투어 CTA가 관광지명(예: 생명건강 과학원)으로 검색되어 상품이 안 나옴 → 지역 검색으로
- **한 일**: `addr1`/`locality`→시·군 추출(`extractTourAttractionSigungu`) · `buildThemeSpotLocation` parentCity 우선 · 모달/목록에 addr·locality 전달 · 작업 로그
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성 · UI 임의 리디자인 없음
- **VERIFY**: `smoke:korea-theme-cross-links` · `smoke:korea-festival-nearby` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「숙소·투어 링크를 지역명으로」
- **QA**: 명승→주변 관광지→「숙소 · 춘천」처럼 시·군 · MRT에 해당 지역 숙소/투어

## 테마여행 #39, 페이지 최적화

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `5d18b8e9` · Preview QA 대기

- **한 일**: 최상단 권역·시도 칩 수량을 종목 필터 없는 **지역 전체**로 고정 · 종목(대·소분류) 칩만 필터 수량 유지 · smoke 의미 갱신
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성
- **VERIFY**: `smoke:korea-scenic-categories` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「권역·시도 칩에 지역 전체 수량」
- **QA**: 자연↔인문 전환 시 권역/시도 칩 숫자 불변 · 종목 칩만 변함 · 강원 칩 ≈ 강원 전체

## 테마여행 #38, 페이지 최적화

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `e78def51` · Preview QA 대기

- **한 일**: 명승 DB 목록 정렬을 **대표 이미지 우선 → 수정일 내림차순**(동률 제목순)으로 변경 · 페이지네이션은 이미지 버킷→무이미지 버킷 이어붙임 · smoke 보강
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성
- **VERIFY**: `smoke:korea-scenic-categories` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「관광지 목록 · 이미지 우선·수정일순」
- **QA**: 강원 등 목록 상단이 사진 있는 최근 수정 관광지인지 · 페이지 넘겨도 이미지 없는 항목이 뒤로만 오는지

### 테마여행 · 에이전트 핸드오프 → `#39`

| | |
|--|--|
| **세션 표기** | `테마여행 #39, 폴리시·릴리스` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② 플랜 §1.0·§1.6·S9 ③ #38 산출 |
| **금지 3** | 축제 지도·칩 리팩터 · top10/regions 탑레벨 부활 · 합의 전 releaseNotes · UI 임의 리디자인 |
| **후보** | S9 폴리시·릴리스(사람 Preview QA 후) · 축제 회귀 점검 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #39, 폴리시·릴리스
```

## 테마여행 #37, 페이지 최적화

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `1932e013` (기능 `0edd6348`) · Preview QA 대기

- **한 일**: 명승 DB 목록 제목을 상단 권역·시도에 맞춤(`강원도 관광지` 등) · 옆 수량은 종목 필터 없는 **지역 전체** 건수 · `scenicDbCatalogHeading` · smoke 보강
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성
- **VERIFY**: `smoke:korea-scenic-categories` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「지역 대분류에 맞춘 관광지 명칭·전체 수량」
- **QA**: 강원→「강원도 관광지」+전체 N곳(≈732) · 제주→제주도 · 수도권→수도권 · 서울→서울특별시 · 종목 칩은 목록만 좁힘
