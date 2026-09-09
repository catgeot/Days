# 2026-09-09 프로젝트 일지

직전: [`2026-09-08-project-log.md`](./2026-09-08-project-log.md)

## 팔경 contentId — P0-A05 siho alias (Cloud)

- **세션** `팔경contentId #P0-A05, siho alias`
- **브랜치** `cursor/palgyeong-cid` · tip `cc3fa3cc` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=siho --apply-unique` **4/21** unique_hit · **hub_mismatch 5** · **siho_wait 12** · members **571/876** (null **305**) · closed **379** · 429 없음
- **HIT** 금대지리·삽교평야·제암만세·남양성지 — LIVE 행만 lists 기입 · KEYWORD_ALIASES 9건
- **VERIFY** audit/smoke lists · smoke content-ids · smoke tour-content-id-match · build PASS
- **다음** P0-A06 siho alias (12) 또는 prefix ambiguous 2건

```
팔경contentId #P0-A06, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-A04 siho alias (Cloud)

- **세션** `팔경contentId #P0-A04, siho alias`
- **브랜치** `cursor/palgyeong-cid` · tip `2b7dc375` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=siho --apply-unique` **8/29** unique_hit · **21 siho_wait** · members **567/876** (null **309**) · closed **369** · 429 없음
- **HIT** 미륵불상·무릉반석·용추비경·해상분수·장자어화·월명무애·남양황라·서문시장 — LIVE 행만 lists 기입 · KEYWORD_ALIASES 8건 · type38 시장 허용
- **VERIFY** audit/smoke lists · smoke content-ids · smoke tour-content-id-match · build PASS
- **다음** P0-A05 siho alias (21) 또는 prefix ambiguous 2건

```
팔경contentId #P0-A05, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 세계행사 일정 #54c — 리스트 사진 Edge 캐시 필요 여부 (점검)

- **질문** 다음 사용자 첫 `/world-events` 로딩 — `event_hero_gallery` Edge 쓰기가 필요한가
- **LIVE DB** 허브 23건 **전부 행 있음** · 이미지 270장 **전부 Wikimedia** · Unsplash URL **0**
- **왜 느린가** 리스트는 Unsplash만 씀. 갤러리가 위키 6장+라 상세 Edge는 `fromCache`로 Unsplash를 **안 씀·안 씀**. 상세를 열어도 리스트 캐시가 안 생김. 클라 리스트는 SELECT만 · 결과는 `sessionStorage`(같은 탭만)
- **추정** 새 사용자 = DB 1회(위키라 미스) + Unsplash 검색 23건(동시 3). 프로브 1회 274ms → 검색만 ~2초대. 같은 탭 재방문은 sessionStorage
- **결론** 다음 사용자 첫 로딩을 빠르게 하려면 **공유 캐시(#55)가 필요**. 레이아웃(16:10)은 #54c 확정이라 URL 재작업 위험은 낮음. **지금 Edge 넣지 않음** — #54d는 PR #205 merge. #55는 시크릿 첫 진입이 거슬리면 별 PR
- **넣을 때** 위키 12장 테이블에 리스트 검색 결과를 섞지 말 것 · 리스트 전용 1장 또는 Unsplash 1장만 앞에 붙이는 작은 Edge

## 세계행사 일정 #54c — 리스트 사진 확대 Preview QA (사람)

- **세션** `세계행사 일정 #54c, 리스트 사진 확대 Preview QA`
- **브랜치** `cursor/world-events-wave3` · tip `417ce543` · PR [#205](https://github.com/catgeot/Days/pull/205)
- **사람 QA PASS** 카드 16:10 사진 · 이동 칩 없음 · 카드 탭 → 상세 · 지역 칩 전환 후 사진 유지
- **VERIFY** CI 2/2 · `smoke:world-events-hub` · `audit:world-events` · `build` PASS (에이전트)
- **다음** PR #205 merge → PROD `www.gateo.kr/world-events` 회귀

```
세계행사 일정 #54d, PR #205 merge · PROD QA
@plans/feature-handoff-index.md
@plans/2026-09-09-project-log.md
@plans/world-events-management.md
브랜치 cursor/world-events-wave3 · PR #205
금지: worldEvents.json 직편집 · UI 리디자인 · 허브에 플래너·숙소 칩 복구
작업: PR #205 merge → PROD 큰 썸네일·이동 칩 없음·카드 탭 상세·지역 칩 사진 유지
```

## 세계행사 일정 #54b — 리스트 카드 사진 확대 (Cloud)

- **세션** `세계행사 일정 #54b, 리스트 썸네일 Preview QA`
- **브랜치** `cursor/world-events-wave3` · tip `417ce543` · PR [#205](https://github.com/catgeot/Days/pull/205)
- **사람 QA** 3건 썸네일 표시 OK · 사진 크게 · 카드 이동 칩 제거(상세에 있음)
- **완료** 허브 카드 16:10 사진 · 플래너·숙소·여행지·공식 칩 제거 · 카드 전체가 행사 상세 · DB Unsplash 먼저 그린 뒤 없는 건 검색
- **로딩** 첫 진입은 Unsplash 검색이 느림 · `event_hero_gallery`는 읽기만(anon SELECT) · 리스트 결과를 DB에 쓰려면 Edge 필요 — 이번 턴 미착수
- **VERIFY** `smoke:world-events-hub` · `audit:world-events` · `vite build` PASS
- **Preview** `/qa/world-events` → 큰 썸네일·칩 없음 · **사람 QA**

```
세계행사 일정 #54c, 리스트 사진 확대 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-09-project-log.md
@plans/world-events-management.md
브랜치 cursor/world-events-wave3 · PR #205 · https://www.gateo.kr/qa/world-events
금지: worldEvents.json 직편집 · UI 리디자인 · 위키 시드를 리스트 사진으로 복구 · 허브에 플래너·숙소 칩 복구
작업: 카드 사진 16:10 · 이동 칩 없음 · 카드 탭 → 상세 · 지역 칩 전환 후 사진 유지
```

## 팔경 contentId — P0-A03 siho alias (Cloud)

- **세션** `팔경contentId #P0-A03, siho alias`
- **브랜치** `cursor/palgyeong-cid` · tip `ce464d0a` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=siho --apply-unique` **11/41** unique_hit · **29 siho_wait** · **hub_mismatch +1**(진천 평사낙안) · members **559/876** (null **317**) · closed **361** · 429 없음
- **HIT** 남산부석·서암석불·군산 평사낙안·삼도귀범·웅연조대·소사모종·개암고적·안면송림·신륵모종·양도낙안·이릉두견 — LIVE 행만 lists 기입
- **VERIFY** audit/smoke lists · smoke content-ids · build PASS
- **다음** P0-A04 siho alias (29) 또는 prefix ambiguous 3건

```
팔경contentId #P0-A04, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-C01 scenic 복사 (Cloud)

- **세션** `팔경contentId #P0-C01, scenic 복사`
- **브랜치** `cursor/palgyeong-cid` · tip `e78f0e5a` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `copy:korea-local-scenic-content-ids-from-scenic` **1/1** 잔여(임실9경 옥정호 2번째 동명 멤버) · scenic `126551` · 동명 멤버 `.find` 버그 수정 · members **548/876** (null **328**) · P0-C01 **소진**
- **VERIFY** audit/smoke lists · smoke content-ids PASS
- **다음** P0-A03 siho alias (41) 또는 prefix ambiguous 2건

```
팔경contentId #P0-A03, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

## 팔경 contentId — P0-A02 siho alias (Cloud)

- **세션** `팔경contentId #P0-A02, siho alias`
- **브랜치** `cursor/palgyeong-cid` · tip `f0019f88` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **완료** `--bucket=siho --apply-unique` **6/48** unique_hit · **41 siho_wait** · **1 hub_mismatch**(군산 명사십리) · members **547/876** (null **329**) · closed **350** · 429 없음
- **HIT** 강원감영·구형왕릉·강변사리·신두사구·예산사과·사계고택 — LIVE 행만 lists 기입
- **VERIFY** smoke lists · smoke content-ids PASS
- **다음** P0-C01 scenic 복사 또는 ambiguous 3건 수동 확인

```
팔경contentId #P0-C01, scenic 복사
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: 같은 hub+attractionName scenic contentId → 팔경 멤버+동명 hub → audit/smoke lists
```

## 세계행사 일정 #54b — 리스트 썸네일 3건 폴백 수정 (Cloud)

- **세션** `세계행사 일정 #54, 리스트 Unsplash Prod QA`
- **브랜치** `cursor/world-events-wave3` · tip `0f1fd382` · PR [#205](https://github.com/catgeot/Days/pull/205)
- **원인** glossary `searchQueryEn`만 시도 시 Unsplash 0건 — 뉘 블랑쉬·두바이 피트니스·로즈 퍼레이드 placeholder
- **완료** `buildWorldEventListPhotoQueries` 확장 폴백 · onPhotoError 캐시 삭제·재조회
- **VERIFY** smoke/audit/build PASS · Unsplash 23/23 extended query HIT
- **Preview** `/qa/world-events` → 3건 썸네일·지역 칩 유지 **사람 QA**

```
세계행사 일정 #54b, 리스트 썸네일 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-09-project-log.md
@plans/world-events-management.md
브랜치 cursor/world-events-wave3 · PR #205 · https://www.gateo.kr/qa/world-events
금지: worldEvents.json 직편집 · UI 리디자인 · 위키 시드를 리스트 사진으로 복구
작업: 뉘 블랑쉬·두바이 피트니스·로즈 퍼레이드 썸네일 · 지역 칩 전환 후 유지 확인
```

## 세계행사 일정 #54 — 리스트 Unsplash main 병합

- **세션** `세계행사 일정 #54, 리스트 Unsplash main 반영`
- **완료** PR [#204](https://github.com/catgeot/Days/pull/204) merge ✅ · main `2473463a`
- **PROD** `https://www.gateo.kr/world-events` — 카드 썸네일 Unsplash
- **VERIFY** audit · `smoke:world-events-hub` PASS
- **다음** #54b — 3건 썸네일 누락 수정

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
