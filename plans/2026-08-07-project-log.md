# 2026-08-07 프로젝트 일지

직전: [`2026-08-06-project-log.md`](./2026-08-06-project-log.md)

## 테마여행 #62, 명소홈 개선 — 헤더·검색 모달

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · Preview QA 대기

- **요청**: 명소 홈 헤더 「축제」「명승」제거 · 검색 결과를 모달로 · 닫기는 모달 닫기 UX
- **한 일**: 헤더 칩 제거(`onlyWhenBack`으로 자기「명승」링크 숨김) · 검색 활성 시 본문을 dialog 모달로 · 배경/X/Escape 닫기 · 상세는 검색 모달 위(`z-50`)
- **VERIFY**: `npm run smoke:korea-scenic-search` · `smoke:korea-scenic-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「헤더 칩 정리 · 검색 결과 모달」
- **QA**: 헤더에 축제·명승 없음 · 검색 → 모달 · X/배경/Escape로 목록 복귀

### 테마여행 · 에이전트 핸드오프 → `#63`

| | |
|--|--|
| **세션 표기** | `테마여행 #63, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #62 검색 모달 ③ #61 cat1 자동 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #63, Preview QA 반영
```

## 테마여행 #61, 검색 관광지 0건 — 종목 자동 전환

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `33889759` · Preview QA 대기

- **증상**: 「경포」검색 → 명소 2·명승 1·**관광지 0**
- **원인**: TourAPI에 경포 매칭 2건(강원·**인문 A02**) 있으나 기본 종목 **자연(A01)** 유지 → 리스트 0 · 단일 종목이면 칩도 숨김
- **한 일**: 검색 중 현재 cat1 건수 0이면 결과 있는 첫 종목으로 자동 전환
- **VERIFY**: `npm run smoke:korea-scenic-search` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「검색 관광지 — 0건 종목 자동 전환」
- **QA**: 「경포」→ 관광지 경포호수광장·호린파크 등 · 진짜 매칭 없으면 0건 유지

### 테마여행 · 에이전트 핸드오프 → `#62` (완료 → 위 #62 절)

## 테마여행 #60, 검색 기능 개선 — 결과 창 닫기

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `25a47cf0` · Preview QA 대기

- **요청**: 검색 닫기가 X로 변한 돋보기 클릭 → **결과 창 닫기**로 직관화
- **한 일**: 검색 활성 시 헤더·본문 「닫기」로 결과 해제 · 모바일 돋보기는 검색창 열기/수정만(결과 닫기 아님) · Escape는 검색창만 닫음
- **VERIFY**: `npm run smoke:korea-scenic-search` · `smoke:korea-scenic-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「검색 결과 닫기(결과 창)」
- **QA**: 검색 → 헤더/배너 「닫기」로 목록 복귀 · 돋보기로 검색어 수정 가능

## 테마여행 #59, 검색 기능 테스트 — 분류 칩 분해

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `c491cb60` · Preview QA 대기

- **요청**: 검색 후 긴 리스트 → 분류 칩별로 확인 · 0건 칩 숨김
- **한 일**: 검색 중에도 권역·시도·종목 칩 유지 · 칩이 검색을 지우지 않음 · 검색 풀∩칩 필터 · TourAPI `searchQuery`+cat/region · **섹션별 0건·단일 분류 칩 숨김**(「고성」명소 0·명승 강원 1권역만)
- **VERIFY**: `npm run smoke:korea-scenic-search` · `smoke:korea-scenic-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「검색 0건·단일 분류 칩 숨김」
- **QA**: 「고성」→ 명소 칩 없음 · 명승 2건·불필요 칩 없음 · 「경복궁」은 칩으로 분해

## 테마여행 #58, 검색 기능 도입

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `d45c6b1d` · Preview QA 대기

- **요청**: 명소 홈에 검색 기능
- **한 일**: `/korea/theme/scenic` 헤더 검색(축제와 동일 UX) · GATEO 선정·국가유산 명승 클라이언트 필터 · TourAPI DB `title`/`addr1` ilike 전국 검색 · `smoke:korea-scenic-search`
- **VERIFY**: `npm run smoke:korea-scenic-search` · `smoke:korea-scenic-nearby` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「명소 홈 검색」
- **QA**: 「경복궁」「경포」검색 · 지우기·칩 복귀 · 모바일 돋보기

### 테마여행 · 에이전트 핸드오프 → `#59` (완료 → 위 #59 절)

| | |
|--|--|
| **세션 표기** | `테마여행 #59, 검색 기능 테스트` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |

## 테마여행 #57, 같은 도시 — 정보 있는 추천만

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `611865bf` · Preview QA 대기

- **요청**: 연결처보다 「왜 추천됐는지」·정보 없으면 목록에 올리지 말 것
- **한 일**: sameHub는 **curated 명승** 또는 **Tour contentId** 있을 때만 노출 · contentId 없는 hub 명소(계족산 황톳길 등) 제외 · 장동산림욕장 오매핑 제거 · 신중앙시장(대전 중앙시장 id)은 유지
- **VERIFY**: `npm run smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「같은 도시 명소 — 상세 있는 곳만 추천」
- **QA**: 유성온천 「같은 도시 명소」에 계족산 없음 · 한밭·엑스포·신중앙(정보 있는 항목)만

## 테마여행 #57, 같은 도시 Tour contentId

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `41e1ec00` · **정책 변경(위 절): 빈 상세는 비추천**

- **증상**: 계족산 황톳길 본문 「Tour 상세 없음」
- **원인**: hub 명소에 Tour `contentId` 미매핑 → LIVE detail 조회 불가
- **한 일**(철회 일부): 장동산림욕장 별칭 매핑은 제거 · 신중앙시장 id는 유지 · 이후 「정보 있는 추천만」으로 정리
- **VERIFY**: `npm run smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`

## 테마여행 #57, 같은 도시 명소 → 명승 전용

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `15289334` · **후속 contentId(위 절)**

- **증상**: 한밭수목원만 정상 · 엑스포/계족산/신중앙시장 클릭 시 명소 홈
- **원인**: `/korea/theme/regions|top10`이 명승으로 리다이렉트되며 `spot` query 소실
- **한 일**: sameHub는 **명승 `?spot=`** 또는 **중첩 모달** · regions/top10 deep-link 금지
- **VERIFY**: `npm run smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: Preview 우측 「같은 도시 명소 → 명승 spot/중첩 모달」
- **QA**: 유성온천 → 한밭(명승) · 엑스포 · 계족산·신중앙(중첩 모달)

## 테마여행 #57, 같은 도시 명소 deep-link

**상태**: feature `cursor/korea-theme` · PR [#58](https://github.com/catgeot/Days/pull/58) · tip `fb7b47d9` · **후속 수정(위 절)**

- **증상**: 유성온천 본문 「같은 도시 명소」클릭 시 명소 홈으로 복귀
- **원인**: regions-only 멤버십이 `/korea/theme/scenic` bare로 폴백 → 이후 regions URL도 리다이렉트로 동일 증상
- **한 일**(1차): `sameHubMembershipDeepPath` · 모달 `row.deepPath` — **regions 경로 포함(오판)**
- **VERIFY**: `npm run smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`

### 테마여행 · 에이전트 핸드오프 → `#58`

| | |
|--|--|
| **세션 표기** | `테마여행 #58, Preview QA 반영` |
| **브랜치** | `cursor/korea-theme` (고정) |
| **PR** | [#58](https://github.com/catgeot/Days/pull/58) |
| **읽을 것 3** | ① 본 절 ② #57 sameHub ③ 플랜 §2.5 |
| **금지 3** | 축제 지도 리팩터 · top10/regions 탑레벨 부활 · UI 임의 리디자인 |
| **후보** | Preview QA · S9 |
| **공유/Preview** | `https://www.gateo.kr/qa/korea-theme` · git Preview `/korea/theme/scenic` |

**다음 채팅명 (복붙)**:

```
테마여행 #58, Preview QA 반영
```

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
