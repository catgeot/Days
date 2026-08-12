# 2026-08-12 프로젝트 일지

직전: [`2026-08-11-project-log.md`](./2026-08-11-project-log.md)

## 로그북 #9, 취향 재설정·헤더 뒤로가기

**상태**: `main` 반영 · PR [#113](https://github.com/catgeot/Days/pull/113) · tip `66417519`  
**세션**: `로그북 #9, 취향 재설정·헤더 뒤로가기` → main 병합

- **한 일**: 본문 하단 「취향 다시 설정」만(indigo 칩) · 본문 낙원 탐색 제거 · 기후·특별함 설문 보강 · 「위로」버튼 · **main 병합** · `/qa/logbook-curation` → PROD
- **VERIFY**: `npm run smoke:curation-history` · `npm run build`
- **PROD**: `https://www.gateo.kr/blog/curation`
- **작업 로그**: 로그북 Preview 종료(`logbook-curation` active:false)
- **다음 채팅명**:

```
로그북 #10, PROD QA
```

## 로그북 큐레이션 · main 반영

**상태**: `main` 반영 · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `19715fbc`  
**세션**: `로그북 #8, 탐색 시 메인 포커스` → main 병합

- **한 일**: #2~#8 큐레이션 IA·취향·탐색 포커스 feature를 main에 병합 · `/qa/logbook-curation` → PROD `/blog/curation`
- **PROD**: `https://www.gateo.kr/blog/curation`
- **작업 로그**: 로그북 Preview 종료(`logbook-curation`/`logbook-cta` active:false)

## 로그북 #8, 탐색 시 메인 포커스

**상태**: `main` 반영 · PR [#108](https://github.com/catgeot/Days/pull/108)  
**세션**: `로그북 #8, 탐색 시 메인 포커스`

- **증상**: 「다른 낙원 탐색」을 하단에서 누르면 클릭 위치에 머물고, 상단 스피너·결과가 안 보임
- **한 일**: 메인 스테이지 ref · 탐색 시작/로딩/결과 시 `scrollIntoView` · **main 병합**
- **VERIFY**: `npm run build`
- **PROD**: `https://www.gateo.kr/blog/curation`

## 로그북 #7, 취향에 최근 검색·방문

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `6dec3fd6` · Preview QA 대기  
**세션**: `로그북 #7, 취향에 최근 검색·방문`

- **한 일**: `gateo_recent_search_keywords` · `gateo_recent_visited_destinations`를 큐레이션 프롬프트에 추가(각 최대 10) · 있으면 설문 스킵
- **VERIFY**: `npm run smoke:curation-history` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「최근 검색·방문 목적지를 취향 프롬프트에」
- **다음 채팅명**:

```
로그북 #8, 최근 검색·방문 취향 QA
```

## 로그북 #6, 취향 삭제·설문·본문 CTA

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `35decb4a` · Preview QA 대기  
**세션**: `로그북 #6, 취향 삭제·설문·본문 CTA`

### 취향 분석 조사 (선행)

| 입력 | 실제 쓰임 |
|------|-----------|
| 로그인 `reports.location` (최대 10) | 프롬프트에 지명 나열만 |
| 로그인 `saved_trips.destination` 북마크 | 지명 나열만 |
| `gateo_curation_history` | **긍정 취향 아님** · 재추천 제외 목록만 |
| 비로그인·기록 없음 | 「취향 없음」→ 일반 숨은 낙원 |

- 구조화 취향(분위기·기후·활동) 추출 없음 · LLM이 지명 나열을 해석하는 수준
- 목록만 지우면 제외 목록에서 빠져 **같은 곳이 다시 나올 수 있었음** → 거절 SSOT 필요

### 한 일

- 모든 본문 하단 「다른 낙원 탐색」
- 목록 휴지 → history 삭제 + `gateo_curation_rejected` · 프롬프트에 유사 취향 회피
- 기록·북마크·설문 없으면 분위기 칩 설문(바다·섬 등) → local `gateo_curation_taste_survey`

### VERIFY / 링크

- **VERIFY**: `npm run smoke:curation-history` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「본문 탐색 CTA · 목록 삭제→거절 · 취향 설문」
- **다음 채팅명**:

```
로그북 #7, 취향 삭제·설문 QA
```

## 로그북 #5, 큐레이션 닫기 버튼 위치

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `3f4a3e59` · Preview QA 대기  
**세션**: `로그북 #5, 큐레이션 닫기 버튼 위치`

- **요청**: 닫기(×)가 제목란에 있어 지명 생략 → 사진 우측 상단·시인성 개선
- **한 일**: 스택 본문 ×를 이미지 영역 `top-right` 반투명 원형으로 이동
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「닫기 버튼 → 사진 우측 상단」
- **다음 채팅명**:

```
로그북 #6, 큐레이션 닫기 버튼 QA
```

## 로그북 #4, 큐레이션 목록 본문 스택

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `fc137722` · Preview QA 대기  
**세션**: `로그북 #4, 큐레이션 목록 본문 스택`

- **요청**: 나의 큐레이션 클릭 시 메인을 바꾸지 않고 본문을 쌓기
- **한 일**: 목록 토글 → 행 아래 본문 패널 스택 · 메인 건은 중복 비활성 · `CurationResultPanel` 분리
- **VERIFY**: `npm run smoke:curation-history` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「목록 클릭 시 본문 쌓기」
- **남은 일**: 사람 Preview QA(목록 클릭→본문 스택 · 다시 클릭/× 닫기)
- **다음 채팅명**:

```
로그북 #5, 큐레이션 목록 스택 QA
```

## 로그북 #3, 큐레이션 페이지 QA

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `79be0f3b` · Preview QA 대기  
**세션**: `로그북 #3, 큐레이션 페이지 QA`

- **증상**: 나의 목록(라자암팟·소코트라)이 있는데도 「낙원 탐색 시작」박스가 메인으로 보임
- **원인**: session `gateo_curation_data`가 비면 status=idle → 실행 박스 표시 (history는 local만 있음)
- **한 일**: `resolveActiveCurationPanel` — session 없으면 history[0] 본문 복원 · 실행 박스는 이력 없을 때만 메인 · `smoke:curation-history`
- **VERIFY**: `npm run smoke:curation-history` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「마지막 실행 본문 복원 · 없을 때만 실행 박스」
- **남은 일**: 사람 Preview QA(라자암팟 본문→목록 · 빈 이력 시 실행 박스 메인)
- **다음 채팅명**:

```
로그북 #4, 큐레이션 페이지 QA
```

## 로그북 #2, 큐레이션 페이지

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `463a11cf` · Preview QA 대기  
**세션**: `로그북 #2, 큐레이션 페이지`

- **요청**: 최근 실행 본문 메인 · 그 아래 나의 큐레이션 세로 목록 · 하단 여유 · 별표·비로그인 안내
- **한 일**: `CurationHub` IA(본문→목록) · `page-scroll-end-pad` · 별표 즐겨찾기 + 로그인 안내 · `/qa/logbook-curation`
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「최근 실행 본문 메인 · 목록은 하단」
- **남은 일**: → #3 QA에서 본문 복원 수정

## 규칙, 브라우저 QA=사람만

**상태**: feature `cursor/human-qa-only-c0c9` · PR [#112](https://github.com/catgeot/Days/pull/112) · tip `3f623949` · docs-only  
**세션**: `규칙, 브라우저 QA=사람만`

- **한 일**: 에이전트 `computerUse`/브라우저 대행 QA **기본 금지**를 alwaysApply·`.ai-context` §1.6·§4.1 13·`AGENTS`·`cloud-preview-continuity`에 고정. 검증=audit/smoke/build → Preview 핸드오프.
- **남은 일**: PR #112 merge → main

## 축제·명승 검색 #4, 닫기 버튼 수정

**상태**: feature `cursor/korea-recent-search-972e` · PR [#111](https://github.com/catgeot/Days/pull/111) · Preview QA 대기  
**세션**: `축제·명승 검색 #4, 닫기 버튼 수정`

- **증상**: 칩·바탕으로는 검색바가 닫히는데 모바일 X(닫기)는 동작 안 함
- **원인**: 바깥 pointerdown dismiss가 X 클릭보다 먼저 searchOpen을 false → click이 다시 열기로 처리
- **한 일**: mobileSearchToggleRef 예외 · 명승 X는 searchActive일 때 closeSearch
- **VERIFY**: `npm run smoke:korea-recent-searches` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-recent-search`
- **Preview**: `https://days-git-cursor-korea-recent-search-972e-catgeots-projects.vercel.app/korea`
- **작업 로그**: 「모바일 검색 닫기(X) 버튼 복구」
- **남은 일**: 사람 Preview QA
- **다음 채팅명**:

```
축제·명승 검색 #5, 검색 UX QA
```

## 축제·명승 검색 #3, 검색바 스킵 닫기

**상태**: feature `cursor/korea-recent-search-972e` · PR [#111](https://github.com/catgeot/Days/pull/111) · 후속 #4  
**세션**: `축제·명승 검색 #3, 검색바 스킵 닫기`

- **요청**: 칩·빈 영역으로 최근 목록만이 아니라 모바일 검색바까지 스킵 닫기
- **한 일**: `dismissSearchUi` — searchOpen+suggest+draft 닫기 · 검색 UI 밖 pointerdown(최근 없어도) · 확정 검색어는 유지
- **VERIFY**: `npm run smoke:korea-recent-searches` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-recent-search`
- **Preview**: `https://days-git-cursor-korea-recent-search-972e-catgeots-projects.vercel.app/korea`
- **작업 로그**: 「모바일 검색바 · 칩·빈 영역으로 스킵 닫기」

## 축제·명승 검색 #2, 최근 검색어 닫기

**상태**: feature `cursor/korea-recent-search-972e` · PR [#111](https://github.com/catgeot/Days/pull/111) · 후속 #3  
**세션**: `축제·명승 검색 #2, 최근 검색어 닫기`

- **요청**: 최근 검색 목록이 X 전까지 안 닫힘 → 칩·빈 영역 클릭으로 닫기
- **한 일**: 바깥 pointerdown dismiss · 모바일 `searchOpen` 고정 해제 · 대분류 칩 열 때 목록 닫기
- **VERIFY**: `npm run smoke:korea-recent-searches` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/korea-recent-search`
- **Preview**: `https://days-git-cursor-korea-recent-search-972e-catgeots-projects.vercel.app/korea`
- **작업 로그**: 「최근 검색 목록 · 바깥 클릭·칩으로 닫기」

## 축제·명승 검색 #1, 최근 검색어

**상태**: feature `cursor/korea-recent-search-972e` · PR [#111](https://github.com/catgeot/Days/pull/111) · tip `5878f515` · 후속 #2  
**세션**: `축제·명승 검색 #1, 최근 검색어`

- **요청**: 축제홈·명승홈 검색을 반복할 때 매번 같은 텍스트를 다시 치지 않게
- **한 일**: localStorage 최근 검색어(축제/명승 키 분리) · 검색창 포커스/활성 시 목록 · 입력 중 부분 일치 필터 · 항목 삭제·전체 지우기
- **VERIFY**: `npm run smoke:korea-recent-searches` · `npm run build` · 로컬 UI 스모크(축제·명승 드롭다운)
- **공유**: `https://www.gateo.kr/qa/korea-recent-search`
- **Preview**: `https://days-git-cursor-korea-recent-search-972e-catgeots-projects.vercel.app/korea` · 명승 `/korea/theme/scenic`
- **작업 로그**: 「축제홈·명승홈 최근 검색어」

## 명승 검색 #1, 화엄사 0건

**상태**: `main` 반영 · PR [#110](https://github.com/catgeot/Days/pull/110) · 사람 QA OK
**세션**: `명승 검색 #1, 화엄사 0건`

- **증상**: 「화엄사」검색 0건 · 관광지 파드에 사찰 없음 · (후속) 선정·명승은 나오는데 관광지만 「이 종목 0건」
- **원인**: (1) draft 검색+권역 시드 (2) CHA ctcd52 전북 오매핑 (3) TourAPI areacode/cat 공백 → areaBased sync 누락 (4) 검색 확정 시 tregion이 수도권 유지 + 명소 매칭 있으면 관광지 권역 자동전환 skip
- **한 일**: 검색 UX · ctcd52→전남 · DB upsert 127923 · curated 백필·추론 · 관광지 권역 매칭 우선 · main 병합
- **VERIFY**: smoke:korea-scenic-search · build · 사람 Preview QA OK
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 종료(`active: false`) · `/qa/scenic-hwaeomsa` → PROD
- **남은 일**: curated 잔여 백필(429)은 별도 세션

## 로그북 #1, 공개피드 CTA

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#107](https://github.com/catgeot/Days/pull/107) · tip `95abbb3b` · Preview QA 대기  
**세션**: `로그북 #1, 공개피드 CTA`

- **증상**: 공개 피드(`/p/:id`) 하단 「나만의 기록 남기기」→ `/auth/login`
- **한 일**: `PublicViewer` CTA → `/blog`(로그북 홈) · `/qa/logbook-cta`
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-cta`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog`
- **작업 로그**: 「공개 피드 「나만의 기록 남기기」→ 로그북 홈」
- **남은 일**: 사람 Preview QA(공개 기록 하단 CTA → `/blog`)

## 지구본 홈 #4, 아이투타키 투어 오탐

**상태**: feature `cursor/aitutaki-gyg-tour-b09e` · PR [#106](https://github.com/catgeot/Days/pull/106) · tip `61c07bd3` · Preview QA 대기  
**세션**: `지구본 홈 #4, 아이투타키 투어 오탐`

- **증상**: 써머리「투어 찾기」아이투타키 → GYG bare `Aitutaki`가 아유타야(·일본 혼입)로 오탐
- **원인**: GYG 아이투타키 재고 없음 · fuzzy가 Ayutthaya로 붙음
- **한 일**: `GYG_ACTIVITIES_Q_BY_SLUG.aitutaki` → `Rarotonga, Cook Islands` · City id `2689` · `smoke:gyg-activities-query` · `/qa/aitutaki-tour`
- **VERIFY**: `npm run smoke:gyg-activities-query` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/aitutaki-tour`
- **Preview**: `https://days-git-cursor-aitutaki-gyg-tour-b09e-catgeots-projects.vercel.app/`
- **작업 로그**: 「아이투타키 투어 찾기 → 아유타야 오탐 보정」
- **남은 일**: 사람 Preview QA(아이투타키→투어 찾기 · 아유타야/일본 없음 · 쿡 제도 투어)
- **다음 채팅명**:

```
지구본 홈 #5, 아이투타키 투어 QA
```
