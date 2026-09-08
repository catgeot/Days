# 2026-09-08 프로젝트 일지

직전: [`2026-09-07-project-log.md`](./2026-09-07-project-log.md)

## 팔경 contentId — P0-K01 키워드 종결 (Cloud)

- **세션** `팔경contentId #P0-K01, 키워드 종결`
- **브랜치** `cursor/palgyeong-cid` · tip `bf6e9882` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=short --apply-unique --limit=40` **10/40** unique_hit · 22 tour_missing · 8 hub_mismatch · members **492/876** (null **384**) · 429 없음
- **HIT** 대승폭포·죽서루·척주동해비·준경묘·영원산성·용추폭포·오색주전골·울산바위·어라연·사인암 (LIVE 행만)
- **VERIFY** audit/smoke lists · smoke content-ids PASS
- **다음** P0-K02 `--bucket=prefix --apply-unique --limit=40`

```
팔경contentId #P0-K02, prefix 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=prefix --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-K01 키워드 종결 준비 (Cloud)

- **세션** 준비 · 브랜치 `cursor/palgyeong-cid` · tip `2265f248` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **스크립트** `close:korea-local-scenic-content-ids` · inventory null **394** (siho 48 · poetic 23 · prefix 142 · short 140 · other 41)
- **dry-run** short 8건 apply 없음 · **4 HIT** (죽서루 125799 등) · 3 tour_missing · 1 hub_mismatch(대청봉)
- **폐기** P0-L07+++ 같은 100명 keyword 로또
- **다음** P0-K01 `--bucket=short --apply-unique --limit=40`

```
팔경contentId #P0-K01, 키워드 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-L07++ 확장 keyword (Cloud)

- **세션** `팔경contentId #P0-L07++, 확장 keyword`
- **브랜치** `cursor/palgyeong-cid` · tip `c914703c` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--keyword-only --limit=100` (memberQueries) **2/100** LIVE · members **482/876** (null **394**) · 429 없음
- **채움** 영천 보현산댐 짚와이어(2606234) · 운주산승마자연휴양림(1839066)
- **VERIFY** audit/smoke lists · smoke content-ids PASS
- **다음** P0-L07+++ `--keyword-only --limit=100` · gunsan 등 시호 alias 2차는 합의 후

```
팔경contentId #P0-L07+++, 확장 keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: 잔여 null --keyword-only --limit=100 (memberQueries) · gunsan 등 시호 alias 2차는 합의 후
```

## 팔경 contentId — P0-L07+ 확장 keyword (Cloud)

- **세션** `팔경contentId #P0-L07+, 확장 keyword`
- **브랜치** `cursor/palgyeong-cid` · tip `851fda40` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--keyword-only --limit=100` (memberQueries) **2/100** LIVE · members **480/876** (null **396**) · 429 없음
- **채움** 영덕 삼사해상공원(126143) · 세종대왕자태실(2733119)
- **VERIFY** audit/smoke lists · smoke content-ids · smoke tour-content-id-match · build PASS
- **다음** P0-L07++ `--keyword-only --limit=100`

```
팔경contentId #P0-L07++, 확장 keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: 잔여 null --keyword-only --limit=100 (memberQueries) · gunsan 등 시호 alias 2차는 합의 후
```

## 팔경 contentId — P0-A01 시호 alias (#P0-A01)

- **브랜치** `cursor/palgyeong-cid` · tip `dc608b4b` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** L07 cohort 시호 16건 중 **8/16** LIVE · members **478/876** (null **398**) · 429 없음
- **KEYWORD_ALIASES** 진천 2 + 경주 6 (jincheon.go.kr · gyeongju.go.kr 공식명)
- **채움** 두타모종→영수사 · 농암모설→진천 농다리 · 문천도사→월정교 · 계림황엽·압지부평·백율송순·금장낙안·불국영지
- **null 유지** 평사낙안·우담제월·금계완사·상산모운·어은계석·적대청람 · 남산부석·나원백탑 (Tour 미등재)
- **VERIFY** audit/smoke lists · smoke content-ids · smoke tour-content-id-match PASS
- **다음** P0-L07+ `--keyword-only --limit=100`

```
팔경contentId #P0-L07+, 확장 keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: 잔여 null --keyword-only --limit=100 (memberQueries) · gunsan 등 시호 alias 2차는 합의 후
```

## 지구본 프레임 줌 #1, 페이지 줌 복귀

- **세션** `지구본 프레임 줌 #1, 페이지 줌 복귀`
- **브랜치** `cursor/globe-frame-zoom-7106` · tip `ca80c118` · PR [#203](https://github.com/catgeot/Days/pull/203)
- **원인**: 지구본 밖 기본 프레임 핀치 → 브라우저 페이지 줌 → 지구본이 화면을 채우면 축소할 프레임이 없음
- **수정**: 홈·탐색만 페이지 줌 잠금 · 확대 배율 자동 리셋 · 우주 버튼도 리셋 · `/place` 본문 핀치 유지
- **VERIFY** `smoke:globe-page-zoom-lock` · `vite build` PASS
- **병합** PR [#203](https://github.com/catgeot/Days/pull/203) → main `386412ac`
- **PROD** `https://www.gateo.kr/`
- **다음 제시어 없음** (주제 종료)

```
(종료) 지구본 프레임 줌 — main 병합 ✅
PROD https://www.gateo.kr/
확인: 홈에서 로고·검색·지구본 밖 여백 핀치해도 페이지 확대 없음 · 확대됐다면 우주 버튼으로 복귀 · 파리 갤러리 핀치 유지
```
