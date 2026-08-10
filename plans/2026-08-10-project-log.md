# 2026-08-10 프로젝트 일지

직전: [`2026-08-09-project-log.md`](./2026-08-09-project-log.md)

## 클라우드 쿼터 — hub-fill vs UI · 저비용 규칙 (메모)

**맥락**: 명승 Cloud 작업으로 Pro+/API/온디멘드 소진 점검. 본체=단기간 고용량 · 배수=모바일 세션 분할+매턴 build/push. 샘플 세션은 medium waste(루프/브라우저 폭주 아님).

### 세션당 대략 비용 배수 (로컬 동일 작업 ≈1× 기준)

| 유형 | Cloud 배수(대략) | 이유 |
|------|------------------|------|
| **UI 1기능** (지도·즐겨찾기·칩) | **2–4×** | 콜드스타트·매턴 build/push · 컨텍스트 상태창 없음 |
| **hub-fill 1라운드** (4–5 hub · 전수) | **4–8×** | 위 + draft/generate/fill/audit/smoke · audit OK 덤프 |
| **hub-fill 컨베이어** (10분마다 새 런) | **8–15×+** | 고정비×N · 피크 `#77`–`#104` 패턴 |
| **contentId LIVE 잔여** | **5–10×** | Tour 429·오매칭 재조회 |

※ 절대 달러/요청수 아님. transcript·런 빈도·검증 파이프라인 대비 **상대 배수**.

### hub 채움 저비용 운영 (초안)

1. **대량 SSOT는 로컬 우선** — draft→generate→fill→audit를 한 채팅에서 여러 라운드. Cloud는 Preview가 필요한 UI만.
2. **Cloud를 쓸 때**: 새 런 남발 금지 · **고정 브랜치 1개**에 **한 에이전트 = 2–3 라운드**(10–15 hub)까지 묶기.
3. **VERIFY 한 번**: 라운드마다 전 audit 덤프 금지 · 배치 끝 1회(`audit`/`smoke:hub-fill`/`build`) · 가능하면 요약/quiet.
4. **정책 확정 후 가동** — `per-hub` 상한·빈 hub 재팽창 금지 등 모호하면 1라운드만 시험 후 확대(#79·#131 재작업 방지).
5. **사람 QA 단위**: tip push는 라운드 묶음 후 1회 · 허브마다 Preview 대기는 비용만 증가.

### 한 세션 작업량 가이드 (Cloud · 상태창 없음)

로컬은 컨텍스트 상태창으로 잔여를 보지만 Cloud는 **없음** → **미리 상한을 채팅명/프롬프트에 고정**하고, 상한 도달 시 핸드오프(다음 채팅명)로 끊는다.

| 작업 | 권장 상한 / 세션 | 끊는 신호 |
|------|------------------|-----------|
| hub-fill (빈·소량) | **10–15 hub** (라운드 2–3) 또는 spots **+40~80** | Tour 429 연속 · contentId 수작업 >15분 · 교정 이슈 발생 |
| contentId 잔여 | **alias/가드 소폭 + 자동 채움 1패스** (목표 +20~50) | LIVE 429로 keyword 중단되면 null 남기고 종료 |
| UI 기능 | **수직 슬라이스 1개**(동작+smoke+Preview) | 디자인 조율 2턴 넘기면 사람 QA로 넘김 |
| 버그픽스 | **증상 1개** | 동일 FAIL 2회 → 중단·보고 |

**프롬프트에 넣을 한 줄 예**: `이번 세션만 hub 12곳(라운드 2)·VERIFY 끝 1회·상한 도달 시 #N+1 핸드오프. 새 런/범위 확장 금지.`

## 테마여행 #139, 양구백자박물관 등록

**상태**: feature `cursor/yanggu-arboretum-7807` · PR [#97](https://github.com/catgeot/Days/pull/97) · tip `d4458e75` · Preview QA 대기  
**세션**: `테마여행 #139, 양구백자박물관 등록`

- **한 일**: **양구백자박물관** hub attractions + GATEO scenic **+1**(870→871) · contentId `731454` · detailImage 썸네일 · Tour LIVE 있음·`tourapi_attraction` DB sync 누락
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · 검색 exact · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-yanggu-arboretum-7807-catgeots-projects.vercel.app/korea/theme/scenic?hub=yanggu`
- **작업 로그**: 「양구백자박물관 hub·GATEO 선정 등록」
- **남은 일**: 사람 Preview QA · (제품) 홈 검색≠Tour DB 전량 — 큐레이션 앵커만 SSOT, 전국은 scenic DB 검색
- **다음 채팅명**:

```
테마여행 #140, 소량 hub 보강
```

## 테마여행 #138, 양구수목원 등록

**상태**: feature `cursor/yanggu-arboretum-7807` · PR [#97](https://github.com/catgeot/Days/pull/97) · tip `745cf636` · Preview QA 대기  
**세션**: `테마여행 #138, 양구수목원 등록`

- **한 일**: 검색 누락 **양구 수목원**(공식명·옛 양구자연생태공원) — `cityAttractionHubs` yanggu attractions append · GATEO scenic **+1**(869→870) · TourAPI contentId **미등재**(null·overview)
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · 검색 exact(`양구 수목원`/`양구수목원`) · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-yanggu-arboretum-7807-catgeots-projects.vercel.app/korea/theme/scenic?hub=yanggu`
- **작업 로그**: 「양구 수목원 hub·GATEO 선정 등록」
- **남은 일**: 사람 Preview QA(검색·양구 hub 목록)
- **다음 채팅명**:

```
테마여행 #139, 소량 hub 보강
```

## 테마여행 #137, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · PR [#96](https://github.com/catgeot/Days/pull/96) · tip `c4cb181d` · Preview QA 대기  
**세션**: `테마여행 #137, 소량 hub 보강`

- **한 일**: curated **1** hub 소량 보강 — 제천·진주·완도·진안 `cityAttractionHubs` **기존 attractions 미등재만** GATEO 선정 **15곳** append(854→869) · attractions 억지 추가 없음 · contentId DB/수동 6곳(송계계곡·진양호동물원·용담호·운일암반일암·은수사 등 · 잔여 null 7 · 월악산 약초마을 오탐 제외 · keyword 429)
- **규칙**: #131 교정 유지 — 빈 hub 졸업지 재팽창 금지 · 미등재 draft만
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=jecheon` · `?hub=jinju` · `?hub=wando` · `?hub=jinan`
- **작업 로그**: 「제천·진주·완도·진안 미등재 명소 draft」
- **남은 일**: 사람 Preview QA · curated **1** 미등재 큐 **소진** · 다음 curated **2–3** 미등재(거제·안동·대전·파주 등) · Tour 미등재·429 contentId
- **다음 채팅명**:

```
테마여행 #138, 소량 hub 보강
```

## 테마여행 #136, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · PR [#96](https://github.com/catgeot/Days/pull/96) · tip `c17af102` · Preview QA 대기  
**세션**: `테마여행 #136, 소량 hub 보강`

- **한 일**: curated **1** hub 소량 보강 — 보령·단양·군산·구례 `cityAttractionHubs` **기존 attractions 미등재만** GATEO 선정 **15곳** append(839→854) · 보령 hub 중복명 「무창포해수욕장」(신비의바닷길) 스킵 · attractions 억지 추가 없음 · contentId DB 3곳(온달관광지·경암동철길마을·구례수목원 · 잔여 null 6 · keyword 429)
- **규칙**: #131 교정 유지 — 빈 hub 졸업지 재팽창 금지 · 미등재 draft만
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=boryeong` · `?hub=danyang` · `?hub=gunsan` · `?hub=gurye`
- **작업 로그**: 「보령·단양·군산·구례 미등재 명소 draft」
- **남은 일**: ✅ #137 제천·진주·완도·진안 미등재 draft
- **다음 채팅명**:

```
테마여행 #137, 소량 hub 보강
```

## 테마여행 #135, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · PR [#96](https://github.com/catgeot/Days/pull/96) · tip `a9fbac7a` · Preview QA 대기  
**세션**: `테마여행 #135, 소량 hub 보강`

- **한 일**: curated **1** hub 소량 보강 — 청주·광주·정읍·성남 `cityAttractionHubs` **기존 attractions 미등재만** GATEO 선정 **20곳** append(819→839) · attractions 억지 추가 없음 · contentId DB 4곳(잔여 null 12 · keyword 429)
- **규칙**: #131 교정 유지 — 빈 hub 졸업지 재팽창 금지 · 미등재 draft만
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=cheongju` · `?hub=gwangju` · `?hub=jeongeup` · `?hub=seongnam`
- **작업 로그**: 「청주·광주·정읍·성남 미등재 명소 draft」
- **남은 일**: ✅ #136 보령·단양·군산·구례 미등재 draft
- **다음 채팅명**:

```
테마여행 #136, 소량 hub 보강
```

## 테마여행 #134, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · PR [#96](https://github.com/catgeot/Days/pull/96) · tip `4b94f30a` · Preview QA 대기  
**세션**: `테마여행 #134, 소량 hub 보강`

- **한 일**: curated **1** hub 소량 보강 — 보성·부안·남원·하동 `cityAttractionHubs` **기존 attractions 미등재만** GATEO 선정 **20곳** append(799→819) · attractions 억지 추가 없음 · contentId DB/AREA 6곳(잔여 null 14 · keyword 429)
- **규칙**: #131 교정 유지 — 빈 hub 졸업지 재팽창 금지 · 미등재 draft만
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=boseong` · `?hub=buan` · `?hub=namwon` · `?hub=hadong`
- **작업 로그**: 「보성·부안·남원·하동 미등재 명소 draft」
- **남은 일**: ✅ #135 청주·광주·정읍·성남 미등재 draft
- **다음 채팅명**:

```
테마여행 #135, 소량 hub 보강
```

## 테마여행 #133, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · PR [#96](https://github.com/catgeot/Days/pull/96) · tip `17c7cc66` · Preview QA 대기  
**세션**: `테마여행 #133, 소량 hub 보강`

- **한 일**: curated **1** hub 소량 보강 — 공주·합천·태안·부여 `cityAttractionHubs` **기존 attractions 미등재만** GATEO 선정 **22곳** append(777→799) · attractions 억지 추가 없음 · contentId DB 2곳(황매산·낙화암 · 잔여 null 10 · keyword 429)
- **규칙**: #131 교정 유지 — 빈 hub 졸업지 재팽창 금지 · 미등재 draft만
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=gongju` · `?hub=hapcheon` · `?hub=taean` · `?hub=buyeo`
- **작업 로그**: 「공주·합천·태안·부여 미등재 명소 draft」
- **남은 일**: ✅ #134 보성·부안·남원·하동 미등재 draft
- **다음 채팅명**:

```
테마여행 #134, 소량 hub 보강
```

## 테마여행 #132, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · PR [#96](https://github.com/catgeot/Days/pull/96) · tip `e79aea3d` · Preview QA 대기  
**세션**: `테마여행 #132, 소량 hub 보강`

- **한 일**: curated **1** hub 소량 보강 — 포항·목포·울릉·가평 `cityAttractionHubs` **기존 attractions 미등재만** GATEO 선정 **23곳** append(754→777) · attractions 억지 추가 없음 · contentId DB/수동 일부(잔여 null 4 · keyword 429)
- **규칙**: #131 교정 유지 — 빈 hub 졸업지 재팽창 금지 · 미등재 draft만
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=pohang` · `?hub=mokpo` · `?hub=ulleung` · `?hub=gapyeong`
- **작업 로그**: 「포항·목포·울릉·가평 미등재 명소 draft」
- **남은 일**: ✅ #133 공주·합천·태안·부여 미등재 draft
- **다음 채팅명**:

```
테마여행 #133, 소량 hub 보강
```

## 테마여행 #131, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · 교정 PR [#96](https://github.com/catgeot/Days/pull/96) · (#95 MERGED 후 범위 교정) · Preview QA 대기  
**세션**: `테마여행 #131, 소량 hub 보강`

- **한 일**: **교정** — 소량 hub = 빈 hub 큐 **제외**(이미 curated>0)만. 빈 hub 졸업지(원주·횡성·화천 #87·#89) 재팽창·명소 억지 추가 **되돌림**(main 772→754). 강릉은 기존 hub attractions 미등재 **오죽헌·주문진항**만 유지
- **규칙**: 빈 hub 보강 대상 재작업 금지 · attractions를 무리하게 늘리지 않음(품질)
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=gangneung`
- **작업 로그**: 「소량 hub 범위 교정 · 강릉 미등재 2곳만」
- **남은 일**: ✅ #132 포항·목포·울릉·가평 미등재 draft
- **다음 채팅명**:

```
테마여행 #132, 소량 hub 보강
```

## 테마여행 #130, 소량 hub 보강

**상태**: feature `cursor/scenic-thin-hubs-beea` · PR [#95](https://github.com/catgeot/Days/pull/95) · Preview QA 대기  
**세션**: `테마여행 #130, 소량 hub 보강`

- **한 일**: 빈 hub 큐 소진 후 **소량 hub** 보강 — 춘천·속초·동해·삼척 `cityAttractionHubs` 명소 추가 + GATEO 선정 **32곳** append(720→752) · contentId 일부 채움 · `/qa/scenic-hub-fill` Preview 재연결 · fill `--hubs=`
- **VERIFY**: `audit:city-attraction-hubs` · `audit`/`smoke:korea-scenic-spots` · `smoke:korea-scenic-hub-fill` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hub-fill`
- **Preview**: `https://days-git-cursor-scenic-thin-hubs-beea-catgeots-projects.vercel.app/korea/theme/scenic?hub=chuncheon` · `?hub=sokcho` · `?hub=donghae` · `?hub=samcheok`
- **작업 로그**: 「춘천·속초·동해·삼척 소량 hub 명소 보강」
- **남은 일**: ✅ #131 강릉·원주·횡성·화천 이어감
- **다음 채팅명**:

```
테마여행 #131, 소량 hub 보강
```

## 테마여행 #129, 상태바 세권

**상태**: PR [#94](https://github.com/catgeot/Days/pull/94) **MERGED** · `origin/main` `98e6b46e` · `/qa/scenic-map`→PROD

- **한 일**: 지도 상태바 **세권(4권역) 크럼 누락** 수정 · 강원 「강원」중복 제거 · **main 병합** · `/qa/scenic-map`→PROD (#128 칩 분포도 main에 포함)
- **VERIFY**: `npm run smoke:korea-scenic-map` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 「상태바 세권 크럼 main 병합」
- **남은 일**: (선택) PROD QA
- **다음 채팅명**:

```
테마여행 #130, (다음 과제)
```

## 테마여행 #128, 지도 칩 분포

**상태**: PR [#93](https://github.com/catgeot/Days/pull/93) **MERGED** · `origin/main` `9f0d4596` · `/qa/scenic-map`→PROD

- **한 일**: 명승홈 지도 hub 소량 핀 숫자 뭉치 완화 · **main 병합**(#93)
- **VERIFY**: `npm run smoke:korea-scenic-map` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 「명승 지도 — 숫자 뭉치↓ · 윤곽 핀」
- **남은 일**: —
- **다음 채팅명**:

```
테마여행 #129, 상태바 세권
```

## 브랜드 SEO #2, 축제·명승 허브

**상태**: PR [#92](https://github.com/catgeot/Days/pull/92) **MERGED** · `origin/main` `f8726f7b` · `/qa/korea-seo`→PROD

- **한 일**: 홈 크롤러에 축제/명승 링크 · Helmet 타이틀 구분(축제·랜딩·명승) · `robots` Allow `/korea` · sitemap `www`+korea lastmod/priority · `generate-sitemap.cjs` korea 허브 동기화 · **main 병합** · `/qa/korea-seo`→PROD
- **VERIFY**: `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/korea-seo`
- **PROD**: `https://www.gateo.kr/korea` · `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 「축제·명승 SEO 허브 main 병합」
- **남은 일**: (권장) Search Console 사이트맵 재제출 · 재크롤 대기
- **다음 채팅명**:

```
브랜드 SEO #3, (다음 과제)
```

## 테마여행 #127, 리스트 크게

**상태**: feature `cursor/scenic-list-large-a55c` · PR [#91](https://github.com/catgeot/Days/pull/91) · tip `65f0601b` · `/qa/scenic-list`

- **한 일**: 명승홈 리스트 「크게」토글을 축제홈처럼 **지도 버튼 왼쪽**에 배치 · 행·썸네일 확대
- **VERIFY**: `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/scenic-list`
- **Preview**: `https://days-git-cursor-scenic-list-large-a55c-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「명승 홈 리스트 「크게」·지도 옆」
- **남은 일**: 사람 Preview QA · main 병합
- **다음 채팅명**:

```
테마여행 #128, (다음 과제)
```

## 브랜드 SEO #1, Days→GATEO

**상태**: PR [#90](https://github.com/catgeot/Days/pull/90) **MERGED** · `origin/main` · `/qa/brand`→PROD

- **한 일**: Helmet `siteName` Days → GATEO · author/About/약관/로고·갤러리·e2e 정합 · **main 병합**
- **VERIFY**: `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/brand`
- **PROD**: `https://www.gateo.kr/`
- **작업 로그**: 「검색·문서 타이틀 Days → GATEO」
- **남은 일**: (선택) 검색엔진 재크롤
- **다음 채팅명**:

```
브랜드 SEO #2, 축제·명승 허브
```

## 테마여행 #126, 명승·관광지 지도 드릴다운

**상태**: feature `cursor/scenic-map-drill-f70d` · PR [#89](https://github.com/catgeot/Days/pull/89) · `/qa/scenic-map`

- **한 일**: 명승·관광지 지도를 명소와 같이 **목록 선택 칩 무시 · 대분류(권역)부터 드릴다운** — 명승 권역→시도→경관→핀 · 관광지 권역→시도→종목 대·중·소→핀 · 닫을 때 URL 동기화 · smoke 확장
- **VERIFY**: `npm run smoke:korea-scenic-map` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **Preview**: `https://days-git-cursor-scenic-map-drill-f70d-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「명승·관광지 지도 대→중→소 드릴다운」
- **남은 일**: 사람 Preview QA · 내 주변 GPS 지도 연동(선택)
- **다음 채팅명**:

```
테마여행 #127, (다음 과제)
```

## 테마여행 #125, 상태바 안내 문구 제거

**상태**: PR [#88](https://github.com/catgeot/Days/pull/88) **MERGED** · `origin/main` `ae6a6473` · `/qa/scenic-map`→PROD

- **한 일**: 지도 경로 바 하단 안내 문구(「칩을 눌러 좁히세요」등) **제거** · **main 병합**
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 「상태바 안내 문구 제거 main 병합」
- **남은 일**: (선택) 명승·관광지 지도 드릴다운 · 내 주변 GPS 지도 연동 · 사람 PROD QA
- **다음 채팅명**:

```
테마여행 #126, (다음 과제)
```



## 테마여행 #124, 상태바 검정 텍스트

**상태**: PR [#87](https://github.com/catgeot/Days/pull/87) **MERGED** · `origin/main` `a9925099` · → #125 안내 문구 제거

- **한 일**: 지도 상단 경로 바 — 밝은 패널 + **검정(stone-900)** 텍스트
- **작업 로그**: 「상태바 텍스트 검정」


## 테마여행 #123, 경로 바 톤 맞춤

**상태**: PR [#86](https://github.com/catgeot/Days/pull/86) **MERGED** · `origin/main` `37acc4c4` · → #124 검정 텍스트

- **한 일**: 경로 바를 지도 글래스·칩 톤에 맞춤 — 과장된 호박 면/흰 칩 제거 · 「상위」는 연한 호박 글로우 · 현재 단계만 은은히 강조 · 시인성 유지 · **main 병합**(#122 시인성 포함)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 「경로 바 시인성·톤 main 병합」
- **남은 일**: (선택) 명승·관광지 지도 드릴다운 · 내 주변 GPS 지도 연동 · 사람 PROD QA
- **다음 채팅명**:

```
테마여행 #124, (다음 과제)
```

## 테마여행 #122, 경로 바 시인성

**상태**: PR [#86](https://github.com/catgeot/Days/pull/86) **MERGED** · → #123과 함께 main

- **한 일**: 지도 드릴다운 상단 「상위」·경로 바 시인성 — 이후 #123에서 톤 완화
- **작업 로그**: 「지도 상위·경로 바 시인성」


## 테마여행 #121, 지도 드릴다운 칩

**상태**: PR [#85](https://github.com/catgeot/Days/pull/85) **MERGED** · `origin/main` `de54fbe0` · → #122 시인성

- **한 일**: 명소 지도를 **대(권역)→중(시도·세권)→소(여행지 hub)** 지도 위 칩 드릴다운으로 재설계 · hub 도달 시에만 핀 · 목록 URL 기본칩과 분리된 `curatedMapDrill` · 닫을 때 URL 동기화 · smoke 확장 · **main 병합**
- **VERIFY**: `npm run smoke:korea-scenic-map` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 「지도 드릴다운 main 병합」
- **남은 일**: (선택) 명승·관광지 지도에도 동일 드릴다운 · 내 주변 GPS 지도 연동 · 사람 PROD QA
- **다음 채팅명**:

```
테마여행 #122, (다음 과제)
```

## 테마여행 #120, 접이·파드별 지도

**상태**: feature `cursor/scenic-map-a086` · PR [#84](https://github.com/catgeot/Days/pull/84) · → #121에서 지도 드릴다운으로 이음

- **한 일**: 명소·명승·관광지 **접이식 파드**(기본 명소 펼침·명승/관광지 접힘·**다중 펼침 허용**) · 파드별 **명소/지도·명승/지도·관광지/지도** 전환(해당 목록 핀만) · 전역 「지도」제거 · 검색·내주변 시 세 파드 자동 펼침
- **VERIFY**: `npm run smoke:korea-scenic-map` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **Preview**: `https://days-git-cursor-scenic-map-a086-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「파드 접이 + 명소/명승/관광지 지도」

## 테마여행 #119, 명승 홈 지도

**상태**: feature `cursor/scenic-map-a086` · PR [#84](https://github.com/catgeot/Days/pull/84) · → #120에서 파드별 지도로 이음

- **한 일**: 명승 홈 목록↔지도 초안 · `KoreaScenicMap` · 핀·클러스터 · smoke `korea-scenic-map`
- **공유**: `https://www.gateo.kr/qa/scenic-map`
