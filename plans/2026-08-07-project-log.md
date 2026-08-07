# 2026-08-07 프로젝트 일지

직전: [`2026-08-06-project-log.md`](./2026-08-06-project-log.md)

## 테마여행 #56, 명승 목록 썸네일

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `a8b42d40` · Preview QA 대기

- **증상**: 국가유산 명승 목록에 썸네일이 비는 항목이 많음
- **원인**: SSOT `imageUrl`은 141/141 있으나 KHS 원본이 평균 ~1.4MB·최대 15MB → 목록 로드 실패/지연
- **한 일**: `thumbUrl` SSOT(TourAPI firstimage 우선 · 경량 KHS · 갤러리 최소본) **141/141** · 목록이 `thumbUrl` 우선·`onError` 폴백 · `sync:cha-scenic`이 thumbs 맵 유지
- **VERIFY**: `npm run smoke:korea-heritage-scenic` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「명승 목록 가벼운 썸네일 141/141」
- **QA**: 명승 목록 썸네일 · 상세 모달 KHS 갤러리 회귀

## 테마여행 #56, 명소 썸네일 SSOT

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `adf34494` · Preview QA 대기

- **증상**: GATEO 선정 명소 목록에 썸네일 없는 항목이 많음
- **원인**: `tourapi_attraction`에 curated contentId **29/97**만 존재(이미지 26) — 런타임 DB 조회로는 대부분 miss
- **한 일**: `fill:korea-scenic-spot-images` (DB→detailCommon/detailImage→관련 contentId) · `korea-scenic-spot-images.json` · generate `imageUrl` **97/97** · 공산성 contentId `125949` 정정 · smoke≥85%
- **VERIFY**: `npm run smoke:korea-scenic-spots` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「선정 명소 대표 사진 SSOT 97/97」
- **QA**: 선정 명소 목록 썸네일 전 항목 · 명승/관광지 회귀

## 테마여행 #56, QA 단축링크 검은 화면

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `dad8c9d1` · **main 핫픽스 배포됨** (`2ba026f7`)

- **증상**: `www.gateo.kr/qa/korea-theme` → 주소는 gateo.kr 유지 · 검은 화면
- **원인**: PROD(`main`) `vercel.json`에 `/qa/korea-theme` 없음 → SPA rewrite → `/qa/:slug` 라우트 없음 → `index.css` 검정 배경만
- **한 일**: `/qa/:slug` 클라이언트 폴백(`QaShareRedirect`) · SSOT·vercel에 korea-theme(+dokdo 유지) · **main에 redirect 커밋·push**
- **VERIFY**: `curl -sI https://www.gateo.kr/qa/korea-theme` → **307** Preview
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **참고**: Preview에 Vercel SSO가 켜져 있으면 리다이렉트 후에도 로그인 화면이 날 수 있음(별건)

## 테마여행 #56, 명소 · 리스트 대표 사진

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `cd55c0bf` · Preview QA 대기

- **요청**: 명소·명승·관광지 리스트에 대표 사진 포함 → 후속 메모리 캐시 → **후속 SSOT bake(위 절)**
- **한 일**: `ScenicListRow` 썸네일 · 명승 `imageUrl`/`galleryUrls` · 관광지 `firstImage` · 선정 명소 contentId→`first_image` 일괄 조회 · **세션 메모리 캐시**(hit 재호출 없음·동기 peek) · 작업 로그
- **VERIFY**: `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「선정 명소 썸네일 메모리 캐시」
- **QA**: `/korea/theme/scenic` — 세 목록 사진 · 수도권↔강원 전환 시 이미 본 명소 썸네일 즉시 유지(네트워크 재호출 없음)

### 테마여행 · 에이전트 핸드오프 → `#57`

| | |
|--|--|
| **세션 표기** | `테마여행 #57, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #56 리스트 사진 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #57, Preview QA 반영
```

## 테마여행 #55, 분류칩 가로 스크롤

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `5b4be43f` · Preview QA 대기

- **요청**: 명소·명승·관광지 대·중·소 분류칩이 길어질 때 줄바꿈 대신 한 행 가로 스크롤 · 커스텀 스크롤바 항시 시인
- **한 일**: `FilterChipRow` — 한 행 가로 스크롤 · OS 바 숨김 · **넘침 시 커스텀 트랙·썸 항시** · 좌·우 페이드(더 있음 표시) · 작업 로그
- **후속**: 스크롤할 때만 보이던 OS 오버레이 바 → 커스텀 바로 교체 · 바 높이 `h-2`→`h-1.5`→`h-1`
- **VERIFY**: `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「분류칩 스크롤바·좌우 페이드 항시」
- **QA**: 넘치는 칩 행에서 스크롤바(트랙·썸)가 스크롤 안 해도 보이는지 · 우측/좌측 페이드로 더 있음이 보이는지

### 테마여행 · 에이전트 핸드오프 → `#56`

| | |
|--|--|
| **세션 표기** | `테마여행 #56, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #55 가로 스크롤 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #56, Preview QA 반영
```

## 테마여행 #54, 강원 소분류칩 복구

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `793c4117` · Preview QA 대기

- **요청**: 수정 후 강원 소분류칩 사라짐
- **한 일**: 시도 중분류가 1개인 권역(강원·제주)은 시도 선택 없이도 여행지 hub 소분류 표시 · smoke·작업로그
- **VERIFY**: `smoke:korea-scenic-spots` · `smoke:korea-heritage-scenic` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **QA**: 강원 → 강릉·속초·춘천 등 · 제주 → 서귀포·제주시 · 수도권은 시도 선택 후에만 여행지 칩

## 테마여행 #54, 분류칩 0건·동일라벨 정리

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `a1c28948` · Preview QA 대기

- **요청**: 중·소칩 수량 0 숨김 · 중·소 동일 라벨 불필요
- **한 일**: 명소/명승/TourAPI 칩에서 count=0 제외 · 명소 여행지 칩은 시도 선택 후·시도명과 다른 라벨만 · 상위와 같은 라벨 소분류 숨김 · smoke·작업로그
- **VERIFY**: `smoke:korea-heritage-scenic` · `smoke:korea-scenic-spots` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「0건 칩·중소수 동일 라벨 숨김」
- **QA**: 수도권 명소 — 세종 등 0건 시도 없음 · 서울 선택 시 서울 여행지 칩 없음 · 관광지 종목 0건 cat3 없음

### 테마여행 · 에이전트 핸드오프 → `#55`

| | |
|--|--|
| **세션 표기** | `테마여행 #55, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #54 칩 정리 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #55, Preview QA 반영
```

## 테마여행 #54, 명소·명승 분류 최적화

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `978bee36` · Preview QA 대기

- **요청**: 명소 상단이 명승 칩 → 명승 칩은 명승 리스트로 · 명소 칩 신설 · 둘 다 중·소 세분
- **한 일**: 페이지 상단 권역 칩 제거 · GATEO 명소=권역→시도→여행지 · 국가유산 명승=권역→시도→경관유형(`?hcat=`) · 건수는 각 섹션 SSOT · smoke·작업로그
- **VERIFY**: `smoke:korea-heritage-scenic` · `smoke:korea-scenic-spots` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「명소·명승 섹션별 대·중·소 분류칩」
- **QA**: `/korea/theme/scenic` → 명소 권역/시도/여행지 · 명승 권역/시도/자연·문화·역사문화 · 관광지 TourAPI 칩 유지

## 테마여행 #53, TourAPI 소분류 칩 세분화

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `d4ee30ed` · Preview QA 대기

- **요청**: 관광지 종목 칩이 광범위해 목록 확인이 어려움 → 소중분류를 더 세분
- **한 일**: TourAPI `cat3` SSOT·필터·칩 — 중분류(자연관광지 등) 선택 시 산·해수욕장·사찰·공원 등 소분류 칩 · `?cat3=` · 칩 건수 · `smoke:korea-scenic-categories` · 작업로그
- **VERIFY**: `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「관광지 중분류 아래 소분류(산·사찰 등) 칩」
- **QA**: `/korea/theme/scenic` → 자연→자연관광지→해수욕장/산 · 인문→역사관광지→사찰 · 목록·건수 축소

## 테마여행 #52, 명소 분류 최적화

**상태**: feature `cursor/korea-theme` · **상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `5b4be43f` · Preview QA 대기

- **요청**: 대분류 클릭 시 같은 경주 명소가 흩어짐 → 동일 권역 뭉침 · (후속) TourAPI 분류는 기존 유지
- **한 일**: `sortScenicSpotsByPlaceCluster` — 선정·유산 목록 시도→시·군 뭉침 · DB `area_code`+`addr1` 정렬 · TourAPI cat1/cat2 칩·필터는 기존 방식 유지 · `smoke:korea-scenic-place-cluster` · 작업로그
- **VERIFY**: `smoke:korea-scenic-place-cluster` · `smoke:korea-scenic-place-label` · `smoke:korea-scenic-categories` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「동일 지역 뭉침 · TourAPI 분류 유지」
- **QA**: `/korea/theme/scenic?region=경상` → 경주 선정 명소 연속 · 시도 칩(경북·경남) · 종목 소분류(자연관광지 등) 그대로

### 테마여행 · 에이전트 핸드오프 → `#53`

| | |
|--|--|
| **세션 표기** | `테마여행 #53, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #52 분류 최적화 ③ 플랜 §1.0 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #53, Preview QA 반영
```

## 테마여행 #51, 인근 명소 거리순

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `5a0d1336` · Preview QA 대기

- **요청**: 인근 명소를 축제장에서 가까운 순으로 정렬해 일정 감각이 나게
- **한 일**: `FestivalDetailSheet` — `festivalLngLat` + `rankSpotsByDistance` · km 배지 · 좌표 없으면 기존 order · smoke #51 보강 · 작업로그
- **VERIFY**: `npm run smoke:korea-scenic-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「인근 명소를 축제장 가까운 순으로」
- **QA**: `/korea` 축제 상세 → 인근 명소가 가까운 순 · km 배지 · 좌표 없는 축제는 예전 순서

## 테마여행 #50, 인근 명승지 라벨 정리

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `5a0d1336` · Preview QA 대기

- **요청**: 축제홈 본문 「인근 명승지」라벨인데 목록은 GATEO 선정 명소
- **한 일**: `FestivalDetailSheet` 섹션·aria·더보기·모달 eyebrow를 「인근 명소」/「○○ 명소 더보기」로 정합 · 작업로그 #50
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea`
- **작업 로그**: Preview 우측 「축제 상세 인근 라벨을 명소로」
- **QA**: `/korea` 축제 상세 → 「인근 명소」·목록·「○○ 명소 더보기」·항목 상세 eyebrow
