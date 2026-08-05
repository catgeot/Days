# 2026-08-05 프로젝트 일지

직전: [`2026-08-04-project-log.md`](./2026-08-04-project-log.md)

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
