# 2026-09-09 프로젝트 일지

직전: [`2026-09-08-project-log.md`](./2026-09-08-project-log.md)

## 세계행사 일정 #54 — 리스트 Unsplash main 병합

- **세션** `세계행사 일정 #54, 리스트 Unsplash main 반영`
- **완료** PR [#204](https://github.com/catgeot/Days/pull/204) merge ✅ · main `2473463a`
- **PROD** `https://www.gateo.kr/world-events` — 카드 썸네일 Unsplash
- **VERIFY** audit · `smoke:world-events-hub` PASS
- **다음 제시어 없음** (이 슬라이스 종료)

## 팔경 contentId — P0-K12 short 종결 (Cloud)

- **세션** `팔경contentId #P0-K12, short 종결`
- **브랜치** `cursor/palgyeong-cid` · tip `a5131b5a` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=short --apply-unique --limit=40` **0/1** unique_hit · **1 ambiguous** · members **541/876** (null **335**) · short **소진**(옥정호 ambiguous 2후보) · prefix ambiguous **2** · siho **48** · 429 없음
- **ambiguous** 임실 옥정호(`126551`·`3082705`) — close JSON 기록 · lists 변경 없음 · apply 후 `inventory` 재실행 금지(ambiguous→open 덮어씀)
- **VERIFY** audit/smoke lists · smoke content-ids PASS
- **다음** P0-A02 `--bucket=siho` (48건) 또는 ambiguous 3건 수동 확인

```
팔경contentId #P0-A02, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-K11 prefix 잔여 (Cloud)

- **세션** `팔경contentId #P0-K11, prefix 잔여`
- **브랜치** `cursor/palgyeong-cid` · tip `c12f063a` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=prefix --apply-unique --limit=40` **0/2** unique_hit · **2 ambiguous** · members **541/876** (null **335**) · prefix **소진**(잔여 ambiguous 2) · short open **1** · siho **48** · 429 없음
- **ambiguous** 인천 소래포구(3후보) · 대전 식장산(2후보) — close JSON 기록 · lists 변경 없음
- **VERIFY** audit/smoke lists · smoke content-ids PASS
- **다음** P0-K12 `--bucket=short --apply-unique --limit=40` (임실 옥정호 1건) 또는 P0-A02 siho

```
팔경contentId #P0-K12, short 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-K10 prefix 종결 (Cloud)

- **세션** `팔경contentId #P0-K10, prefix 종결`
- **브랜치** `cursor/palgyeong-cid` · tip `1388e038` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=prefix --apply-unique --limit=40` **5/22** unique_hit · 15 tour_missing · 2 ambiguous · members **541/876** (null **335**) · prefix open **2** · short **1** · siho **48** · closed **343** · 429 없음
- **HIT** 안산 탄도바닷길(2615559) · 인천 신시모도(2024639) · 대전 구봉산(127683) · 보문산(3080289) · 울산 강동몽돌해변(128199) (LIVE 행만)
- **VERIFY** audit/smoke lists · smoke content-ids · build PASS
- **다음** P0-K11 `--bucket=prefix --apply-unique --limit=40` (prefix 잔여 2) 또는 short ambiguous 1건

```
팔경contentId #P0-K11, prefix 잔여
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=prefix --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-K09 short 종결 (Cloud)

- **세션** `팔경contentId #P0-K09, short 종결`
- **브랜치** `cursor/palgyeong-cid` · tip `77fe74bb` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=short --apply-unique --limit=40` **8/21** unique_hit · 12 tour_missing · 1 ambiguous · members **536/876** (null **340**) · short open **1** · closed **323** · 429 없음
- **HIT** 의정부 망월사(127029) · 미술도서관(2705299) · 음악도서관(2841316) · 이천 산수유마을(127978) · 화성 융건릉(3456908) · 강화 연미정(129610) · 전등사(125534) · 대구 동성로(2599899) (LIVE 행만)
- **VERIFY** audit/smoke lists · smoke content-ids PASS
- **다음** P0-K10 `--bucket=prefix --apply-unique --limit=40`

```
팔경contentId #P0-K10, prefix 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=prefix --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-K08 prefix 종결 (Cloud)

- **세션** `팔경contentId #P0-K08, prefix 종결`
- **브랜치** `cursor/palgyeong-cid` · tip `0c14512e` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=prefix --apply-unique --limit=40` **4/40** unique_hit · 36 tour_missing · members **528/876** (null **348**) · prefix open **22** · closed **303** · 429 없음
- **HIT** 화순 연둔리 숲정이(3014431) · 장흥 126타워(2514004) · 정읍 김명관 고택(231907) · 서산 한우목장(3575172) (LIVE 행만)
- **VERIFY** audit/smoke lists · smoke content-ids PASS
- **다음** P0-K09 `--bucket=short --apply-unique --limit=40`

```
팔경contentId #P0-K09, short 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```
