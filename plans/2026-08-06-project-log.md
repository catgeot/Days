# 2026-08-06 프로젝트 일지

직전: [`2026-08-05-project-log.md`](./2026-08-05-project-log.md)

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

### 테마여행 · 에이전트 핸드오프 → `#41`

| | |
|--|--|
| **세션 표기** | `테마여행 #41, 폴리시·릴리스` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② 플랜 §1.0·§1.6·S9 ③ #40 산출 |
| **금지 3** | 축제 지도·칩 리팩터 · top10/regions 탑레벨 부활 · 합의 전 releaseNotes · UI 임의 리디자인 |
| **후보** | S9 폴리시·릴리스(사람 Preview QA 후) · 축제 회귀 점검 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #41, 폴리시·릴리스
```

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
