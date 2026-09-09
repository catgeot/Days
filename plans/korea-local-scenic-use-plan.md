# 팔경 활용 — 검색·리스트 · Tour contentId

**상태**: A #1 push `e8da2987` · PR [#186](https://github.com/catgeot/Days/pull/186) · B R01–R02 ✅ · **A/B 동시 세션 OK**  
**수집 플랜**(열지 않음): [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md) — 오케 재개 금지  
**SSOT**: [`koreaLocalScenicLists.json`](../src/pages/Home/data/koreaLocalScenicLists.json) (lists **94** · members **876**)

| 갈래 | 채팅명 | 브랜치 | Tour LIVE |
|------|--------|--------|-----------|
| **A UX/UI** | `팔경 활용 #{N}, …` | `cursor/palgyeong-use-e744` | **없음** |
| **B contentId 오케** | `오케스트레이터 팔경contentId` | `cursor/palgyeong-cid` | DB 먼저 · LIVE 잔여 · **Tour API 운영 승인(쿼터 ~10만/일)** · 429면 그날 정지 |

수집 `cursor/palgyeong` **재사용 금지**. 같은 브랜치에 A+B 동시 push **금지**.

---

## 0. 결정

| # | 결정 |
|---|------|
| 1 | 표시 제목 `{시군명} {종류}` — `문경 팔경`. SSOT `title`(문경8경) 유지 |
| 2 | 홈 「문경」→ 소제목 **문경 팔경** + 멤버 → 여행지·지명. 팔경↔일반 명소 중복 금지 |
| 3 | 명소 페이지: **별도 파드 아님**. 선정 명소 **같은 `ul` 상단**에 N경 소제목 |
| 4 | 축제: **홈 파트 아님**. 상세 본문 인근 관광지 목록 **내부**만 소제목 그룹 |
| 5 | `contentId` 없으면 이름만 · 빈 Tour 모달 금지. id 채워지면 같은 행에서 본문 |
| 6 | scenic 승격 · 광역 팔경 · 칩 리디자인 · 수집 오케 재개 **금지** |
| 7 | A/B **동시 OK** · 브랜치·index 행·파일 소유 분리 · main docs 전 `git pull origin main` |

홈 클릭 = 기존 `/place` 핀. 상세 본문 = 명소/축제 상세. `contentId`는 선택 필드 — A는 빈 값으로 UI 완성 가능.

### 파일 소유 (동시 세션)

**A** (`cursor/palgyeong-use-e744`): `koreaLocalScenicLists.js`(조회만) · 검색·ScenicPage·FestivalDetailSheet·ThemeSpotDetailModal · 검색 스모크. **JSON·fill 금지.**

**B** (`cursor/palgyeong-cid`): 팔경/hub JSON `contentId` · fill 스크립트 · audit id 허용 · contentid-큐. **JSX/검색 UI 금지.**

index **행 2개**. A는 본 플랜 §9 A 블록만 · B는 큐·method §5.7만. 일지는 절을 나눠 append.

---

## 1. 에이전트 시작 (3분 · 전반 생략)

첫 메시지에 세션 표기 또는 `@plans/feature-handoff-index.md`가 있으면:

1. [`.ai-context.md`](../.ai-context.md) **1절·3절만**
2. index **해당 갈래 행만** + 일지 핸드오프 1절  
   - A: 본 플랜 **§9 A만**  
   - B: 큐 **다음 ⬜ 1블록** + [`orchestrator-method.md`](./orchestrator-method.md) **§3.0·§3.3·§5.7만** (본 플랜 본문 생략)
3. **자기 브랜치만** checkout (없으면 main에서 생성) → `merge origin/main` → `audit:docs-handoff-sync`
4. docs-only `origin/main` 전 **`git pull origin main`** (상대 갈래 docs와 충돌 방지)

**Read 금지**: `.ai-context` 5절 · `travelSpots.js` 전체 · 팔경/hub JSON **전문**(B fill 대상 단건 제외) · scenic overrides · 수집 플랜 본문 · 닫힌 일지 · 광역 grep.

---

## 2. 갈래 A — UX/UI (LIVE 없음)

| 단계 | 파일 | 할 일 |
|------|------|--------|
| A1 | [`koreaLocalScenicLists.js`](../src/pages/Home/lib/koreaLocalScenicLists.js) | `listsForHub` · `matchLocalScenicListsForQuery` · `localScenicListDisplayTitle` |
| A2 | [`searchSuggestions.js`](../src/pages/Home/lib/searchSuggestions.js) · [`SearchSuggestionList.jsx`](../src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx) · [`useHomeHandlers.js`](../src/pages/Home/hooks/useHomeHandlers.js) | hub exact이어도 팔경 소제목 **앞**. 리스트 alias는 hub 흡수보다 우선. `groupTitle`. 전체 상한 여유(예: 24) |
| A3 | [`ScenicPage.jsx`](../src/pages/KoreaTheme/ScenicPage.jsx) curated `ul` | 같은 리스트 선두에 N경 멤버 + 소제목. `ScenicListRow`. `contentId` 있을 때만 Tour 모달 |
| A4 | [`FestivalDetailSheet.jsx`](../src/pages/Korea/FestivalDetailSheet.jsx) · [`ThemeSpotDetailModal.jsx`](../src/pages/KoreaTheme/ThemeSpotDetailModal.jsx) | 기존 `nearAttractions` **내부만** 상단 그룹 · 새 파트 금지 |

**A 금지**: `koreaLocalScenicLists.json` · `cityAttractionHubs.json` · fill · LIVE Tour.

**VERIFY A**: 스모크 `문경` → 소제목 `문경 팔경` + 멤버 + 여행지 `문경`. `속초`/`낙산사` 회귀. 별도 파드 없음. `build`.

---

## 3. 갈래 B — contentId 오케 (쿼터)

method **§5.7** · 큐 [`korea-local-scenic-contentid-queue.md`](./korea-local-scenic-contentid-queue.md) · 브랜치 **`cursor/palgyeong-cid`**

| 순위 | 대상 |
|------|------|
| **P0** | 팔경 멤버 (~876) — 이번 목표 |
| P1 | hub attractions 잔여 |
| P2 | 테마 선정 `contentId: null` **142**/871 (78 hub) — P0·P1 소진 후 | **P2-R01–R13** DB-only · P2-L LIVE |

DB(`tourapi_attraction`) 먼저 · LIVE `searchKeyword`/`areaBased`는 잔여만 · 워커 **병렬 LIVE 금지** · **2026-09-07** Tour API 홈 **운영 계정 승인** · 쿼터 **~10만/일** · 429 → `blocked: quota` · 같은 날 재시도 금지. HIT → 멤버+hub attraction `contentId`. scenic 승격 금지.

**P0 잔여 (2026-09-07)**: 본명-only `--keyword-only` 동일 100건 재시도(L02·L03·L05)는 **로또·폐기**. 순서 **C01 scenic 복사 → S01 검색어·가드 → L07 확장 keyword → A01 시호 alias**. AI·웹은 검색어 후보만 · contentId 숫자는 API/DB 검증만. 상세 큐 「P0 잔여 전략」.

**S0**(메인 솔로): fill 스크립트(`--db-only`/`--keyword-only`/`--limit`/`--resume`) + 문경 1건 스모크. 그다음 F = 오케 §3.0.

---

## 9. 핸드오프

| | A | B |
|--|--|--|
| **브랜치** | `cursor/palgyeong-use-e744` | `cursor/palgyeong-cid` |
| **지금** | #1 push `e8da2987` · PR [#186](https://github.com/catgeot/Days/pull/186) · **#2 Preview QA** | P0-A07 ✅ siho 2/8 · members **577/876** · tip `0287f117` · **다음 P0-P01** prefix ambiguous (2) |
| **index 행** | 팔경 활용 | 팔경 contentId |
| **금지** | JSON contentId 기입 · scenic 승격 · 축제 홈 파드 | UI · scenic 승격 · 워커 병렬 LIVE · 본명-only keyword 재시도 · AI가 ID 기입 |

### 채팅명 복붙표 (`#N` 리셋 금지)

| #N | 채팅명 한 줄 | 갈래 | 상태 |
|----|--------------|------|------|
| 1 | `팔경 활용 #1, 검색·리스트` | A | **완료** · tip `e8da2987` |
| 2 | `팔경 활용 #2, Preview QA` | A 사람 | **다음** |
| — | `팔경contentId #P0-P01, prefix ambiguous` | B | **다음** |
| — | `팔경contentId #P0-A07, siho alias` | B | **완료** · tip `0287f117` 2/8 |
| — | `팔경contentId #P0-A06, siho alias` | B | **완료** · tip `e3acbf8d` 4/12 |
| — | `팔경contentId #P0-A05, siho alias` | B | **완료** · tip `cc3fa3cc` 4/21 |
| — | `팔경contentId #P0-A04, siho alias` | B | **완료** · tip `2b7dc375` 8/29 |
| — | `팔경contentId #P0-A03, siho alias` | B | **완료** · tip `ce464d0a` 11/41 |
| — | `팔경contentId #P0-C01, scenic 복사` | B | **완료** · tip `e78f0e5a` 60/62 소진 |
| — | `팔경contentId #P0-A02, siho alias` | B | **완료** · tip `f0019f88` 6/48 |
| — | `팔경contentId #P0-K12, short 종결` | B | **완료** · tip `a5131b5a` 0/1 ambiguous |
| — | `팔경contentId #P0-K11, prefix 잔여` | B | **완료** · tip `c12f063a` 0/2 ambiguous |
| — | `팔경contentId #P0-K10, prefix 종결` | B | **완료** · tip `1388e038` 5/22 |
| — | `팔경contentId #P0-K09, short 종결` | B | **완료** · tip `77fe74bb` 8/21 |
| — | `팔경contentId #P0-K07, short 종결` | B | **완료** · tip `c3360044` 8/40 |
| — | `팔경contentId #P0-K06, prefix 종결` | B | **완료** · tip `03881a1c` 3/40 |
| — | `팔경contentId #P0-K05, short 종결` | B | **완료** · tip `65fd2b8d` 8/40 |
| — | `팔경contentId #P0-K04, other 종결` | B | **완료** · tip `77e90417` 5/41 |
| — | `팔경contentId #P0-K03, poetic 종결` | B | **완료** · tip `4dcee055` 4/23 |
| — | `팔경contentId #P0-K02, prefix 종결` | B | **완료** · tip `5f3a2916` 4/40 |
| — | `팔경contentId #P0-K01, 키워드 종결` | B | **완료** · tip `bf6e9882` 10/40 |
| — | `팔경contentId #P0-L07+++, 확장 keyword` | B | **폐기** (같은 100명 로또) |
| — | `팔경contentId #P0-L07++, 확장 keyword` | B | **완료** · tip `c914703c` 2/100 |
| — | `팔경contentId #P0-L07+, 확장 keyword` | B | **완료** · tip `851fda40` 2/100 |
| — | `팔경contentId #P0-A01, 시호 alias` | B | **완료** · tip `dc608b4b` 8/16 |
| — | `팔경contentId #P0-L07, 확장 keyword` | B | **완료** · tip `6212fab3` 11/100 |
| — | `팔경contentId #P0-L04/#P0-L06` | B | **폐기** (본명 keyword 로또) |
| — | `지자체 팔경 #…` | 수집 종료 | **열지 않음** |

### §1.2 A #1

```
팔경 활용 #1, 검색·리스트
@plans/feature-handoff-index.md
@plans/2026-09-04-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드
작업: 탐색창 문경 팔경 소제목 · 명소 같은 ul 상단 N경 · 축제 본문 인근 그룹 · Tour LIVE 없음
```

### §1.2 A #2 Preview QA

```
팔경 활용 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-04-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #186 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드
작업: 홈 검색 문경 · /korea/theme/scenic 문경 hub · 축제 상세 인근 목록 소제목
```

### §1.2 B 다음 (#P0-P01) — 1순위

```
팔경contentId #P0-P01, prefix ambiguous
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: prefix ambiguous 2건 제목·주소 확인 → unique면 lists 기입 · 종결을 close JSON에 기록
```

### §1.2 B #P0-A07

```
팔경contentId #P0-A07, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-A06

```
팔경contentId #P0-A06, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-A05

```
팔경contentId #P0-A05, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-A04

```
팔경contentId #P0-A03, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-S01

```
팔경contentId #P0-S01, 검색어·가드
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 본명-only keyword 재시도 · feature에 plans/** 커밋
작업: fill keyword=memberQueries · scoreHit 괄호 가드(지자체만) · hub lat/lng 폴백 → audit/smoke lists
```

### §1.2 B #P0-L07

```
팔경contentId #P0-L07, 확장 keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 같은 날 재시도 · 본명-only 재시도 · feature에 plans/** 커밋
작업: P0-S01 이후 fill --keyword-only --limit=100 (memberQueries) → audit/smoke lists
```

### §1.2 B #P0-A02

```
팔경contentId #P0-A02, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K12

```
팔경contentId #P0-K12, short 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K11

```
팔경contentId #P0-K11, prefix 잔여
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=prefix --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K10

```
팔경contentId #P0-K10, prefix 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=prefix --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K09

```
팔경contentId #P0-K09, short 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K08

```
팔경contentId #P0-K08, prefix 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=prefix --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K07

```
팔경contentId #P0-K07, short 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K06

```
팔경contentId #P0-K06, prefix 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=prefix --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K05

```
팔경contentId #P0-K05, short 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K04

```
팔경contentId #P0-K04, other 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=other --apply-unique · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K03

```
팔경contentId #P0-K03, poetic 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=poetic --apply-unique · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-K01

```
팔경contentId #P0-K01, 키워드 종결
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: --bucket=short --apply-unique --limit=40 · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

### §1.2 B #P0-L07+++

```
팔경contentId #P0-L07+++, 확장 keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: 잔여 null --keyword-only --limit=100 (memberQueries) · gunsan 등 시호 alias 2차는 합의 후
```

### §1.2 B #P0-L07++

```
팔경contentId #P0-L07++, 확장 keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: 잔여 null --keyword-only --limit=100 (memberQueries) · gunsan 등 시호 alias 2차는 합의 후
```

### §1.2 B #P0-L07+

```
팔경contentId #P0-A01, 시호 alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · AI가 contentId 숫자 기입 · feature에 plans/** 커밋
작업: L07 MISS 시호·별칭만 웹/공식명 후보 → KEYWORD_ALIASES → LIVE 검증. Tour 미등재는 null 유지
```

### §1.2 B 429 다음날

```
오케스트레이터 팔경contentId
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid
금지: 같은 날 429 재시도 · 워커 병렬 LIVE · UI
작업: 큐 blocked:quota 다음 ⬜ · DB-only 잔여 먼저 · LIVE는 한도 내만
```
