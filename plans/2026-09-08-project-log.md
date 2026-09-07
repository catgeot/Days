# 2026-09-08 프로젝트 일지

직전: [`2026-09-07-project-log.md`](./2026-09-07-project-log.md)

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
- **Preview** `/qa/globe-frame-zoom` → git Preview `/`
- **다음** 사람 Preview QA

```
지구본 프레임 줌 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-08-project-log.md
브랜치 cursor/globe-frame-zoom-7106 · PR #203 · Preview /qa/globe-frame-zoom
금지: UI 리디자인 · /place 본문 핀치 제거 · feature에 plans/** 커밋
작업: 홈에서 로고·검색·지구본 밖 여백 핀치해도 페이지 확대 없음 · 확대됐다면 우주 버튼으로 복귀 · 파리 갤러리 핀치 유지
```
