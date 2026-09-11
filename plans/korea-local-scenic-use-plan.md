# 팔경 활용 — 검색·리스트 · Tour contentId

**상태**: A #2 push `6b666ad3` · PR [#209](https://github.com/catgeot/Days/pull/209) · **#186 main 병합** · **사람 Preview QA** · B 종료  
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
| P2 | 테마 선정 `contentId: null` **142**/871 (78 hub) — P0·P1 소진 후 | **P2 종료** null **51**/871 (충족 820/871, 94.1%) · 잔여 51건 terminal 종결 |

DB(`tourapi_attraction`) 먼저 · LIVE `searchKeyword`/`areaBased`는 잔여만 · 워커 **병렬 LIVE 금지** · **2026-09-07** Tour API 홈 **운영 계정 승인** · 쿼터 **~10만/일** · 429 → `blocked: quota` · 같은 날 재시도 금지. HIT → 멤버+hub attraction `contentId`. scenic 승격 금지.

**P0 잔여 (2026-09-07)**: 본명-only `--keyword-only` 동일 100건 재시도(L02·L03·L05)는 **로또·폐기**. 순서 **C01 scenic 복사 → S01 검색어·가드 → L07 확장 keyword → A01 시호 alias**. AI·웹은 검색어 후보만 · contentId 숫자는 API/DB 검증만. 상세 큐 「P0 잔여 전략」.

**S0**(메인 솔로): fill 스크립트(`--db-only`/`--keyword-only`/`--limit`/`--resume`) + 문경 1건 스모크. 그다음 F = 오케 §3.0.

---

## 9. 핸드오프

| | A | B |
|--|--|--|
| **브랜치** | `cursor/palgyeong-use-e744` | `cursor/palgyeong-cid` |
| **지금** | #14 push `91c3301d` · PR [#216](https://github.com/catgeot/Days/pull/216) · **사람 Preview QA** (하동 검색 십경·대표 그룹) | **main 병합 완료 ✅** · squash merge `53b21b00` · PR [#185](https://github.com/catgeot/Days/pull/185) |
| **index 행** | 팔경 활용 | 팔경 contentId (종료) → 명소 자체 큐레이션 |
| **금지** | JSON contentId 기입 · scenic 승격 · 축제 홈 파드 | UI · scenic 승격 · AI가 ID 기입 |

### 채팅명 복붙표 (`#N` 리셋 금지)

| #N | 채팅명 한 줄 | 갈래 | 상태 |
|----|--------------|------|------|
| 1 | `팔경 활용 #1, 검색·리스트` | A | **완료** · tip `e8da2987` |
| 2 | `팔경 활용 #2, 사람 Preview QA` | A 사람 | **완료** · PR #209 MERGED · 속초·삼척·원주·홍천 사진·상세 보강 및 main 병합 |
| 3 | `팔경 활용 #3, 누락 허브 본문 선별 및 팔경 전용 그룹 UI 준비` | A | **완료** · tip `16eb2aee` · PR [#210](https://github.com/catgeot/Days/pull/210) |
| 4 | `팔경 활용 #4, 사람 Preview QA` | A 사람 | **완료** · 사람 Preview QA PASS ✅ · PR #210 검토 및 병합 대기 |
| 5 | `팔경 활용 #5, PR #210 main 병합 및 후속 허브 오버레이 확장 검토` | A | **완료** · PR #210 main 병합 확인(`33776ccb`) 및 의성·무주 오버레이 확장 계획 수립 |
| 6 | `팔경 활용 #6, 의성·무주 결손 허브 런타임 오버레이 보강` | A | **완료** · tip `f1367c6f` · PR [#212](https://github.com/catgeot/Days/pull/212) |
| 7 | `팔경 활용 #7, 사람 Preview QA` | A 사람 | **완료** · 빙계 8행 동일 썸네일 피드백 → #8 |
| 8 | `팔경 활용 #8, 빙계 팔경 사진 다양화` | A | **완료** · tip `b0f0766e` · PR [#212](https://github.com/catgeot/Days/pull/212) merge ✅ `25ea5579` |
| 9 | `팔경 활용 #9, 사람 Preview QA` | A 사람 | **완료** · 빙계 사진 QA 후 #212 merge · 동일 「의성 팔경」 부제 피드백 → #10 |
| 10 | `팔경 활용 #10, 팔경 번호` | A | **완료** · PR [#213](https://github.com/catgeot/Days/pull/213) merge ✅ `d28b4733` |
| 11 | `팔경 활용 #11, 사람 Preview QA` | A 사람 | **완료** · #213 merge 후 #12 축제 인근 |
| 12 | `팔경 활용 #12, 축제 인근 썸네일·번호` | A | **완료** · tip `a5b683e1` · PR [#215](https://github.com/catgeot/Days/pull/215) merge ✅ `b929e7fd` |
| 13 | `팔경 활용 #13, 광양·하동 결손 오버레이` | A | **완료** · tip `e29213bb` · PR [#216](https://github.com/catgeot/Days/pull/216) · 광양 6·하동 7 · 검색 하동→십경 |
| 14 | `팔경 활용 #14, 하동 검색 그룹 묶기` | A | **완료** · tip `91c3301d` · PR [#216](https://github.com/catgeot/Days/pull/216) · 십경·대표 명소 소제목 반복 수정 |
| 15 | `팔경 활용 #15, 사람 Preview QA` | A 사람 | **열기 가능** · 검색 하동 십경 한 덩어리 · 광양 결손 6행 · 하동 결손 7행 |
| — | `팔경contentId #P2-MERGE, 양구수목원 자체큐레이션 및 PR #185 main 병합` | B | **완료** · PR #185 main squash merge `53b21b00` |
| — | `팔경contentId #P2-END, 잔여 51건 종결 및 main 병합 검토` | B | **완료** · P2 종결(94.1%) · PR #185 검토 |
| — | `팔경contentId #P2-L10, 잔여 null 분석 및 전략` | B | **완료** · tip `fb4c5513` 27/32 |
| — | `팔경contentId #P2-L9, hub-batch keyword` | B | **완료** · tip `fa6d58b8` 3/10 |
| — | `팔경contentId #P2-L8, hub-batch keyword` | B | **완료** · tip `699ac841` 0/20 |
| — | `팔경contentId #P2-L7, hub-batch keyword` | B | **완료** · tip `699ac841` 3/20 |
| — | `팔경contentId #P2-L6, hub-batch keyword` | B | **완료** · tip `b21da98a` 3/18 |
| — | `팔경contentId #P2-L5, hub-batch keyword` | B | **완료** · tip `90c2966d` 3/18 |
| — | `팔경contentId #P2-L4, hub-batch keyword` | B | **완료** · tip `19bd21ee` 11/13 |
| — | `팔경contentId #P2-L3, hub-batch keyword` | B | **완료** · tip `cf0482cd` 3/22 |
| — | `팔경contentId #P0 inv, 키워드 종결 소진` | B | **완료** · closed **394** open **0** |
| — | `팔경contentId #P0-P03, 칠선시류 ambiguous` | B | **완료** · tip `505733e2` 1/1 |
| — | `팔경contentId #P0-P02, 옥정호 ambiguous` | B | **완료** · tip `3392e61e` 1/1 |
| — | `팔경contentId #P0-A08, siho_wait` | B | **완료** · tip `be75b1f3` 0/6 |
| — | `팔경contentId #P0-P01, prefix ambiguous` | B | **완료** · tip `fb936d9c` 2/2 |
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
팔경 활용 #2, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #209 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드
작업: /korea/theme/scenic?hub=hongcheon 가리산·금학산 클릭 — 제목 정상 · 리스트/상세/써머리 Tour 사진
```

### §1.2 A #4 Preview QA 통과 및 #5 병합 완료

```
팔경 활용 #5, PR #210 main 병합 및 후속 허브 오버레이 확장 검토
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #210
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: PR #210 main 병합 확인 및 다음 결손 허브(무주 28건, 의성 8건 등) 런타임 오버레이 보강 계획 수립
```

### §1.2 A #6 오버레이 보강 완료

```
팔경 활용 #6, 의성·무주 결손 허브 런타임 오버레이 보강
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #212
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 의성 빙계팔경(8건) 및 무주 구천동33경(28건 결손) 순수 지자체 팔경 공공 공식 팩트 기반 런타임 오버레이(LOCAL_SCENIC_MEMBER_OVERLAYS) 보강
```

### §1.2 A #7 다음 제시어

```
팔경 활용 #7, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-10-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #212 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic?hub=uiseong 빙계팔경 8행 썸네일·상세 개요 · /korea/theme/scenic?hub=muju 구천동33경 결손 행(은구암·일사대 등) 사진·개요
```

### §1.2 A #9 다음 제시어

```
팔경 활용 #9, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #212 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic?hub=uiseong 빙계팔경 8행 썸네일이 서로 다른지 · 행을 열어 본문 갤러리가 경승(빙혈 입구·절벽·바위·서원·다리·석탑·봉우리·용소)에 맞는지
```

### §1.2 A #13 광양·하동 오버레이 (실행됨)

```
팔경 활용 #13, 광양·하동 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #216 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 광양9경 사진·개요 없는 6건(백운산 4대 계곡·자연휴양림·이순신대교·광양만 야경·옥룡사지 동백·읍수와 이팝나무)과 하동10경 7건(화개장터 십리벚꽃·금오산 일출·쌍계사 가을·형제봉 철쭉·청학동 삼성궁·하동포구·섬호정 섬진강)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=gwangyang · ?hub=hadong
```

### §1.2 A #14 하동 검색 그룹 묶기 (실행됨)

```
팔경 활용 #14, 하동 검색 그룹 묶기
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #216 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 명승 검색 하동에서 하동 십경과 지역 대표 명소가 섞여 소제목이 반복되지 않게 groupTitle 한 덩어리로 묶기
```

### §1.2 A #15 다음 제시어

```
팔경 활용 #15, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #216 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic 검색 하동 — 하동 십경 10행이 한 덩어리인지, 그 다음 지역 대표 명소인지 · 소제목이 반복되지 않는지 · ?hub=gwangyang 결손 6행·?hub=hadong 결손 7행 썸네일·개요 · 행마다 사진이 다른지
```


### §1.2 B 다음 (#P2-END) — P2 종결 및 PR #185 검토

```
팔경contentId #P2-END, 잔여 51건 종결 및 main 병합 검토
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · L3~L9 hub 본명 단순 재시도 · AI가 contentId 기입 · feature에 plans/** 커밋
작업: P2 scenic 820/871 충족(94.1%) · 잔여 51건 terminal 종결 확정 및 PR #185 검토
```

### §1.2 B #P2-L9

```
팔경contentId #P2-L9, hub-batch keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · L3/L4/L5/L6/L7/L8 hub 본명 재시도 · AI가 contentId 기입 · feature에 plans/** 커밋
작업: P2 scenic null 81 — --hubs=gwangyang,sancheong,yeongyang,pohang,mokpo,ulleung,gapyeong,gongju,jecheon,yanggu --keyword-only --limit=20
```

### §1.2 B #P2-L8

```
팔경contentId #P2-L8, hub-batch keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · L3/L4/L5/L6/L7 hub 본명 재시도 · AI가 contentId 기입 · feature에 plans/** 커밋
작업: P2 scenic null 81 — --hubs=sangju,gyeryong,mungyeong,yeongi,yesan,gokseong,hwasun,imsil,jangseong,yeonggwang,gimje,iksan,yeongam,cheongdo,gijang,uiseong,yecheon,chilgok,dokdo,gwangyang,sancheong,yeongyang,pohang,mokpo,ulleung,gapyeong,gongju,jecheon,yanggu --keyword-only --limit=20
```

### §1.2 B #P2-L7

```
팔경contentId #P2-L7, hub-batch keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · L3/L4/L5/L6 hub 본명 재시도 · AI가 contentId 기입 · feature에 plans/** 커밋
작업: P2 scenic null 84 — --hubs=sangju,gyeryong,mungyeong,bonghwa,hongseong,yeongi,yesan,gokseong,seocheon,hwasun,imsil,jangseong,yeonggwang,gimje,iksan,yeongam,cheongdo,gijang,uiseong,yecheon,chilgok,dokdo,gwangyang,sancheong,yeongyang,pohang,mokpo,ulleung,gapyeong,gongju,jecheon,yanggu --keyword-only --limit=20
```

### §1.2 B #P2-L5

```
팔경contentId #P2-L5, hub-batch keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · L3/L4 hub 본명 재시도 · AI가 contentId 기입 · feature에 plans/** 커밋
작업: P2 scenic null 90 — --hubs=pyeongchang,siheung,eumseong,yangsan,changwon,yeongcheon,goryeong,gyeongsan,yeongdeok --keyword-only --limit=20
```

### §1.2 B #P2-L4

```
팔경contentId #P2-L4, hub-batch keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · L3 hub 본명 재시도 · AI가 contentId 기입 · feature에 plans/** 커밋
작업: P2 scenic null 101 — --hubs=samcheok,hadong,buyeo,namwon,boseong,jeongeup,donghae --keyword-only --limit=20
```

### §1.2 B #P2-L3

```
팔경contentId #P2-L3, hub-batch keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: P2 scenic null 104 — --hubs=uiryeong,hanam,geochang,gunwi,gwangju,seongnam,danyang --keyword-only --limit=20
```

### §1.2 B #P0 inv

```
팔경contentId #P0 inv, 키워드 종결 소진
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: inventory 재집계 · P0 키워드 종결 closed 394 · 남은 null 297 갈래 분류 · 다음 R 제안
```

### §1.2 B #P0-P03

```
팔경contentId #P0-P03, 칠선시류 ambiguous
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: 함양 칠선시류 ambiguous — close JSON titles·주소 확인 → unique면 lists · 아니면 null
```

### §1.2 B #P0-P02

```
팔경contentId #P0-P02, 옥정호 ambiguous
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: 임실 옥정호 ambiguous — close JSON titles·주소 확인 → unique면 lists · 아니면 null
```

### §1.2 B #P0-P01

```
팔경contentId #P0-P01, prefix ambiguous
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
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
