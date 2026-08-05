# 2026-08-05 프로젝트 일지

직전: [`2026-08-04-project-log.md`](./2026-08-04-project-log.md)

## 테마여행 #35, 페이지 최적화

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **한 일**: 명승 권역 칩「전체」제거(기본 수도권) · 전국 관광지 TourAPI 종목 대분류(자연·인문)·소분류 칩 · **권역 대분류→시도 소분류 승계**(`?area=`) · 선정 명승 hub→area 필터 · `smoke:korea-scenic-categories`
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 탑레벨 부활 없음 · releaseNotes 미작성
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「권역 대분류 → 시도 소분류 승계」
- **QA**: 수도권→서울 시 목록 축소 · 권역 밖 area 거부 · 종목 필터도 동일 권역·시도 유지 · `?region=제주` 딥링크

### 테마여행 · 에이전트 핸드오프 → `#36`

| | |
|--|--|
| **세션 표기** | `테마여행 #36, 폴리시·릴리스` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② 플랜 §1.0·§1.6·S9 ③ #35 산출 |
| **금지 3** | 축제 지도·칩 리팩터 · top10/regions 탑레벨 부활 · 합의 전 releaseNotes · UI 임의 리디자인 |
| **후보** | S9 폴리시·릴리스(사람 Preview QA 후) · 축제 회귀 점검 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #36, 폴리시·릴리스
```

## 테마여행 #34, 투톱 크로스 네비

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `ffdb3f0e` · Preview QA 대기

- **한 일**: 축제 헤더「명승」상시 칩 · 축제 상세 숙소·투어·패키지(`resolveFestivalThemeCrossLinks`) · `/top10|regions|packages` → scenic 리다이렉트 · 모달 레거시 멤버십 딥링크 숨김 · `/qa/korea-theme`→scenic · 작업 로그 #34
- **금지 준수**: 축제 지도·칩 리팩터 없음 · top10/regions 콘텐츠 확장 없음 · 가짜 패키지 카드 없음 · releaseNotes 미작성
- **VERIFY**: `smoke:korea-theme-nav-back` · `smoke:korea-theme-cross-links` · `smoke:korea-festival-nearby` · `smoke:korea-nearby-restaurants` · `smoke:korea-nearby-leisure-culture` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「축제↔명승 상호 네비 · 상세 크로스 정합」
- **QA**: `/korea`↔명승 칩 왕복 · 제주 등 축제 상세 숙소/패키지 · `/korea/theme/packages` 리다이렉트

## 테마여행 #33, 페이지 정리

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `420fe9f8` · Preview QA 대기

- **한 일**: 플랜 §1.0을 **축제·명승 투톱**으로 재잠금 · 제품명「한국의 명승」 · 10대·방방곡곡·패키지(·코스) 타일 `enabled:false` · 홈/랜딩/명승 헤더·복귀 카피 정리 · 작업 로그 #33
- **방향**: 상세에서 주변·맛집·레포츠·문화·패키지 매칭·숙소·투어 크로스 · 길을 잃지 않는 네비(#34)
- **금지 준수**: 축제 지도·칩 리팩터 없음 · 제거 모듈 코드 강제 삭제 없음 · releaseNotes 미작성
- **VERIFY**: `audit:korea-theme-modules` · `smoke:korea-theme-cross-links` · `smoke:korea-theme-nav-back` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「축제·명승 투톱 · 탑레벨 정리」

## 테마여행 #32, MRT 상품지

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `69d67e50` · Preview QA 대기

- **한 일**: LIVE `api3…/products/search`로 국내 목적지 확인 → `KOREA_THEME_PACKAGE_KEYS` 확장(제주·여수·울릉도·강원·순천·홍도·백령·홈) · hub→패키지 CTA 매핑 · 경주(상주 오탐)·부산 제외 · `probe:mrt-korea-packages` · packages 카피
- **금지 준수**: 가짜 상품 카드 없음 · 축제 지도·칩 미터치 · top10/regions 미확장 · 맛집/레포츠/문화/코스 전량 DB 없음
- **VERIFY**: `MRT_PACKAGE_LIVE=1 npm run smoke:mrt-package` · `smoke:korea-theme-cross-links` · `npm run probe:mrt-korea-packages` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/packages`
- **작업 로그**: Preview 우측 「MRT 상품 있는 여행지 큐레이션」
- **QA**: `/korea/theme/packages` 목적지 CTA·mylink · 여수/울릉 등 명승 상세 패키지 버튼 · 경주 상세에 패키지 CTA 없음

### 테마여행 · 에이전트 핸드오프 → `#33`

| | |
|--|--|
| **세션 표기** | `테마여행 #33, …` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #32 산출 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도·칩 리팩터 · 맛집/레포츠/문화/코스 전량 DB · top10/regions 확장 · `q=부산`/`q=경주` CTA |
| **후보** | S9 폴리시·릴리스 · Edge tourapi-proxy intro 재배포 · 상품지 LIVE 재검증 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/packages` |

**다음 채팅명 (복붙)**:

```
테마여행 #33, 폴리시·릴리스
```

## 테마여행 #31, 코스↔축제

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `ead46f99` · Preview QA 대기

- **한 일**: `fetchNearbyTourCourses`(type25 areaBased+거리) · `fetchNearbyFestivals`(festivalWindow 캐시) · 축제 상세「인근 여행코스」+`CourseDetailModal` · 코스 상세「인근 축제」·`/korea?festival=` · `/courses?course=` · `smoke:korea-course-festival`
- **금지 준수**: 축제 지도·칩 미터치 · 코스/축제 전량 DB 없음 · top10/regions 미확장 · locationBasedList type25 비의존(실측 0건)
- **VERIFY**: `smoke:korea-course-festival` · `smoke:korea-theme-courses` · `smoke:korea-festival-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「코스↔축제 양방향 연결」
- **QA**: `/korea` 축제 상세 → 「인근 여행코스」·모달·더보기 · `/korea/theme/courses` 코스 상세 → 「인근 축제」·딥링크

### 테마여행 · 에이전트 핸드오프 → `#32`

| | |
|--|--|
| **세션 표기** | `테마여행 #32, …` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #31 산출 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도·칩 리팩터 · 맛집/레포츠/문화/코스 전량 DB · top10/regions 확장 |
| **후보** | MRT 상품지 큐레이션 · Edge tourapi-proxy intro 재배포 · S9 폴리시 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea` |

**다음 채팅명 (복붙)**:

```
테마여행 #32, MRT 상품지
```

## 테마여행 #30, 레포츠·문화 주변

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `29926846` · Preview QA 대기

- **한 일**: `fetchNearbyTourLeports`(28) · `fetchNearbyTourCulture`(14) · 축제 상세·`ThemeSpotDetailModal` 「주변 레포츠」「주변 문화」 · 레포츠/문화 상세는 hub 대신 DB 「주변 관광지」 크로스 · proxy intro 필드 · `smoke:korea-nearby-leisure-culture`
- **금지 준수**: 축제 지도·칩 미터치 · 맛집/레포츠/문화 전량 DB 없음 · top10/regions 미확장
- **VERIFY**: `smoke:korea-nearby-leisure-culture`(LIVE 28·14 OK) · `smoke:korea-nearby-restaurants` · `smoke:korea-festival-nearby` · `npm run build`
- **Edge**: intro 필드 normalize 반영 시 `npx supabase functions deploy tourapi-proxy --no-verify-jwt` (목록 locationBased는 기존 배포로 LIVE 확인됨)
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「축제·명소 주변 레포츠·문화(API)」
- **QA**: `/korea` 축제 상세 → 「주변 레포츠」「주변 문화」 · 클릭→상세 · 상세에서 「주변 관광지」 · 명승 모달에도 동일

### 테마여행 · 에이전트 핸드오프 → `#31`

| | |
|--|--|
| **세션 표기** | `테마여행 #31, …` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #30 산출 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도·칩 리팩터 · 맛집/레포츠/문화 전량 DB · top10/regions 확장 |
| **후보** | 코스↔축제 · MRT 상품지 큐레이션 · Edge tourapi-proxy 재배포(intro) |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea` |

**다음 채팅명 (복붙)**:

```
테마여행 #31, 코스↔축제
```

## 테마여행 #29, 축제 본문 인근 여행지

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `1470d0e8` · Preview QA 대기

- **이슈**: #28에서 hub→장소카드 대신 「인근 명승지」로 바꿨다고 했으나 Preview에 안 보임
- **원인**: (1) tip `d39d03c4` Vercel Preview 미배포 · (2) 축제 아이템에 `areaCode`가 비어 `scenicRegion` null → 섹션 미표시
- **수정**: `detectSidoCode(addr1)` 폴백 · smoke에 영월→강원 회귀 · 작업 로그 #29
- **VERIFY**: `smoke:korea-festival-nearby` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **QA**: `/korea` 축제 상세 → 「인근 명승지」(GATEO) · 「○○ 명승지 더보기」→ `/korea/theme/scenic?region=` · hub 칩/장소카드 없음

## 테마여행 #28, 맛집 주변 API

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `42a3082b` · Preview QA 대기

- **한 일**: `tourapi-proxy` `locationBasedList`(+메모리 TTL) · `fetchNearbyTourRestaurants`(type39) · 축제 상세·`ThemeSpotDetailModal` 「주변 맛집」 · 맛집 intro 필드 · `smoke:korea-nearby-restaurants` · Edge deploy 완료
- **크로스**: 맛집 본문에서 hub「인근 여행지」제거 · DB 「주변 관광지」목록으로 맛집↔관광지 교차
- **축제 인근**: hub→장소카드 제거 · 권역 GATEO 명승 목록 + `/korea/theme/scenic?region=` 더보기
- **금지 준수**: 맛집 전량 DB 없음 · 축제 지도·칩 미터치 · top10/regions 미확장
- **VERIFY**: `smoke:korea-nearby-restaurants` · `smoke:korea-festival-nearby` · `smoke:tourapi` · `npm run build`
- **QA 추가**: 축제 → 「인근 명승지」목록·더보기 → 명승 페이지 · 맛집 상세 「주변 관광지」
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「축제·명소 주변 맛집(API)」
- **QA**: `/korea` 축제 상세 → 「주변 맛집」 · 명승 상세 모달에도 동일 · 클릭→맛집 상세
- **다음**: 레포츠/문화 · 코스↔축제 · MRT 상품지 (#29 후보)

### 테마여행 · 에이전트 핸드오프 → `#29`

| | |
|--|--|
| **세션 표기** | `테마여행 #29, …` (사람/플랜이 정한 단계) |
| **브랜치** | `cursor/korea-theme` (고정 · 새 브랜치 금지) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② 플랜 **§1.0** · #28 산출 ③ locationBased / 축제 nearby 패턴 |
| **금지 3** | 축제 지도·칩 리팩터 · 맛집 전량 DB · top10/regions 확장 |
| **후보** | 레포츠(28)/문화(14) 주변 · 코스↔축제 · MRT 상품지 큐레이션 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea` |

**다음 채팅명 (복붙)**:

```
테마여행 #29, 레포츠·문화 주변
```

## 테마여행 #26, 축제 주변 관광지

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **한 일**: 축제 상세(안내 탭)에 `fetchNearbyTourAttractions`(반경 8km) 목록 · 클릭→`ThemeSpotDetailModal`(z-50) · 지도·칩 미터치 · `smoke:korea-festival-nearby`
- **선별**: `koreaTourAttractionNearbyFilter` — 화장실·일반 교회/성당 제외 · 성지·문화재·성공회·제일교회 등 명소 표기만 유지
- **지역 표기**: `formatTourAttractionLocality` — 권역(강원) 대신 시·군·읍·면·동·리 (예: 영월군 영월읍 방절리)
- **홈페이지 라벨**: 상세 모달에서 긴 URL 대신 `국가유산청` 등 짧은 표기 (href 유지)
- **VERIFY**: `smoke:korea-festival-nearby` · `smoke:korea-theme-spot-modal` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「주변 목록 지역을 읍·면·동·리로」
- **QA**: `/korea` 영월 축제 → 「주변 관광지」부제가 영월군 ○○면/읍/리 · 교회·화장실 없음
- **다음**: ✅ #28 맛집 API 주변 · 레포츠/문화 · 코스↔축제 · MRT 상품지 (#29 후보) · 선별 규칙 추가 요청 시 필터만 확장

### 테마여행 · 에이전트 핸드오프 → `#28` (완료 · 위 #28 절 참고)

사람이 `#28`로 런칭함(핸드오프 초안 `#27` 건너뜀).

## 테마여행 #23, 국내여행지 DB

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `f291e698` (기능 `3d4f251d`) · Preview QA 대기

- **한 일**: `tourapi_attraction` 마이그레이션 · `sync:tourapi-attractions`(시도 17·목록만) active=**7294** · `/scenic` GATEO 레일+DB 목록·페이지네이션 · `fetchNearbyTourAttractions` 훅 · Edge normalize cat/modifiedtime
- **VERIFY**: `TOURAPI_ATTRACTION_MIN_ACTIVE=5000 npm run smoke:tourapi-attractions` · scenic/spot-modal/nav-back · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「type12 Supabase·scenic DB 목록」
- **QA**: `/korea/theme/scenic` — 전국 관광지 건수·권역 필터·상세 모달 · GATEO 선정 레일 유지
- **다음**: #26 축제 상세에 주변 관광지 UI 연결(지도 리팩터 금지)

### 테마여행 · 에이전트 핸드오프 → `#26 축제 주변 관광지`

| | |
|--|--|
| **세션 표기** | `테마여행 #26, 축제 주변 관광지` |
| **브랜치** | `cursor/korea-theme` (고정 · 새 브랜치 금지) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 핸드오프 ② 플랜 **§1.0 · §3.5** · S13 산출 ③ `fetchNearbyTourAttractions` / scenic DB 패턴 |
| **금지 3** | `/korea` 축제 지도·칩 리팩터 · 맛집 type39 전량 DB · top10/regions 신규 확장 · curated JSON 7천 시드 |
| **이번 목표** | 축제 상세(또는 카드)에 DB 주변 관광지 목록 연결 · 클릭→scenic/모달 또는 contentId 상세 · 기존 축제 UX 유지 |
| **VERIFY** | nearby smoke · scenic 회귀 · build · push |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea`·`/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #26, 축제 주변 관광지
```

**다음 채팅 첫 메시지 (복붙)**:

```
테마여행 #26, 축제 주변 관광지
@plans/2026-08-05-project-log.md 「테마여행 · 에이전트 핸드오프」
브랜치 cursor/korea-theme 고정. tourapi_attraction nearby 훅을 축제 상세에 연결.
축제 지도·칩 리팩터 금지. 맛집 전량 DB 금지. smoke·build 후 push.
```

## 테마여행 #25, 제품 흐름 재잠금

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · 플랜 ✅ · 구현=#23 Preview QA

- **본선**: type12 → Supabase · **주1회** sync · `/scenic` 명승 · 축제 **주변 관광지** · 맛집 **API만** · MRT **상품 있는 여행지** 큐레이션
- **연동**: 맛집·레포츠·문화·축제 → 명승 · 코스는 축제·주변·맛집과 유지·강화
- **보류**: 10대 절경 · 방방곡곡 (코드 유지 · 확장 중지)
- **SSOT**: `korea-theme-travel-plan.md` **§1.0 · §3.5 · S13**
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme`
- **작업 로그**: Preview 우측 「명승 본선·DB·보류 모듈 플랜」

## 테마여행 #22, 명승지 위치 정보

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · 리서치 ✅ · 제품은 #25로 승격

- **LIVE**: TourAPI type12 전국 ≈**7,294** · 목록 `mapx`/`mapy` · 신규 드묾·수정 다수
- **스크립트**: `node scripts/probe-tourapi-scenic-counts.mjs`
- **다음**: #25 제품 흐름 → #23 DB 구현

## 테마여행 #21, 테마간 이동 개선

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `84e3aeae` · Preview QA 대기

- **한 일**: 크로스 레일 이동 시 `themeNavBack` 스택 push · 모듈 헤더 「이전」+ 이전 상태 표기 · top10/scenic/regions `?spot=` 모달 복원 · placeReturnTo 쿼리 허용 · 축제 `from=theme`도 직전 상세로 · `smoke:korea-theme-nav-back`
- **VERIFY**: `npm run smoke:korea-theme-nav-back` · `smoke:korea-theme-spot-modal` · `smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/top10`
- **QA**: top10 보성녹차밭 모달 → 축제/명승/코스 → 「이전」또는 ← 보성녹차밭 · 10대 절경 → 모달 복원
- **다음**: 명승 TourAPI 리서치(#22) → 전량 구현(#23) · 폴리시(#24)

```
테마여행 #22, 명승지 위치 정보
```

## 테마여행 #20, 본문 가독성 개선

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · SHA `49f2d2db` · Preview QA 대기

- **한 일**: `ThemeSpotDetailModal` `DetailRow` 좌우 2열 → 소제목 아래 본문 세로 배치 · 행 간격 `space-y-4` · 작업로그 #20
- **VERIFY**: `npm run smoke:korea-theme-spot-modal` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/top10`
- **QA**: top10 한라산 등 모달 — 개요·주소·이용 시간이 소제목 아래 전체 폭으로 읽히는지
- **다음**: 테마간 이동 개선(#21)

```
테마여행 #21, 테마간 이동 개선
```
