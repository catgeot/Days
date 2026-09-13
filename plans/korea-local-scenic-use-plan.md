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

**A 다음 제시어 (2026-09-12~)**: 사람은 **같은 턴**에서 Preview QA. 에이전트는 `팔경 활용 #N, 사람 Preview QA`를 **다음 세션으로 넘기지 않음**. 오버레이 종료 시 다음 제시어 = **다음 결손 허브**. 사람 피드백이 있으면 그때만 수정 세션을 연다. **전 주제 동일** — [`AGENTS.md`](../AGENTS.md) Cloud **같은 세션 QA**.

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
| **지금** | **#41** tip `1a2f148b` · PR [#245](https://github.com/catgeot/Days/pull/245) · 영덕9경 4 · **#42 문경 결손 오버레이** | **main 병합 완료 ✅** · squash merge `53b21b00` · PR [#185](https://github.com/catgeot/Days/pull/185) |
| **index 행** | 팔경 활용 | 팔경 contentId (종료) → 명소 자체 큐레이션 |
| **금지** | JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · **다음 세션을 Preview QA로 넘기기** | UI · scenic 승격 · AI가 ID 기입 |

**A 다음 제시어**: 사람은 같은 턴 Preview QA. 다음 채팅 = **다음 결손 허브**. `사람 Preview QA` 세션 생략. 피드백이 있으면 그때만 수정 세션. 전 주제: [`AGENTS.md`](../AGENTS.md) Cloud **같은 세션 QA**. 다음 허브 **문경8경 4**.

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
| 14 | `팔경 활용 #14, 하동 검색 그룹 묶기` | A | **완료** · PR [#216](https://github.com/catgeot/Days/pull/216) merge ✅ `210d8a56` |
| 15 | `팔경 활용 #15, 영동 결손 오버레이` | A | **완료** · tip `4b354407` · 한천 7·양산 6 |
| 16 | `팔경 활용 #16, 사람 Preview QA 피드백 반영` | A | **완료** · tip `64e018c8` · 한천 검색 8행 주입 · 양산 12경 내원사계곡·황산공원 오버레이 |
| 17 | `팔경 활용 #17, 한천 공식명·지구본 검색` | A | **완료** · tip `61c72ba3` · PR [#217](https://github.com/catgeot/Days/pull/217) · 한천팔경 공식명 · 지구본 한천 검색 |
| 18 | `팔경 활용 #18, 한천 행 부제 공식명` | A | **완료** · tip `900d77af` · PR [#217](https://github.com/catgeot/Days/pull/217) merge ✅ `d24e0bd1` |
| 19 | `팔경 활용 #19, 함안·사천 결손 오버레이` | A | **완료** · tip `13d69f11` · PR [#219](https://github.com/catgeot/Days/pull/219) merge ✅ `985bf7b7` · 함안 7·사천 6 |
| 20 | `팔경 활용 #20, 사람 Preview QA` | A 사람 | **완료** · 함안·사천 Preview QA PASS ✅ |
| 21 | `팔경 활용 #21, 이천 결손 오버레이` | A | **완료** · tip `7903a22c` · PR [#220](https://github.com/catgeot/Days/pull/220) · 이천 6 |
| 22 | `팔경 활용 #22, 창녕 결손 오버레이` | A | **완료** · tip `ddd01ca0` · PR [#221](https://github.com/catgeot/Days/pull/221) · 창녕 6 |
| 23 | `팔경 활용 #23, 창녕 검색 버그픽스` | A | **완료** · tip `251cd352` · PR [#221](https://github.com/catgeot/Days/pull/221) · 창령 오탐·관광지 빈 문구 |
| 24 | `팔경 활용 #24, 창령→창녕 별칭` | A | **완료** · tip `e601302f` · PR [#221](https://github.com/catgeot/Days/pull/221) · 창령·창령군 |
| 25 | `팔경 활용 #25, 진주 결손 오버레이` | A | **완료** · tip `7f537719` · PR [#222](https://github.com/catgeot/Days/pull/222) · 진주 6 |
| 26 | `팔경 활용 #26, 상산(진천) 결손 오버레이` | A | **완료** · tip `29c7bb3a` · PR [#225](https://github.com/catgeot/Days/pull/225) · 상산 6 |
| 27 | `팔경 활용 #27, 구례 결손 오버레이` | A | **완료** · tip `fbc921de` · PR [#226](https://github.com/catgeot/Days/pull/226) · 구례 5 · GATEO 선정 구례 수목원 공식 사진 |
| 28 | `팔경 활용 #28, 강진 결손 오버레이` | A | **완료** · tip `6391db8d` · PR [#226](https://github.com/catgeot/Days/pull/226) merge ✅ · 강진 5 · 12경 제목·청자단지(#228) |
| 29 | `팔경 활용 #29, 군산 결손 오버레이` | A | **완료** · tip `ba1a57e2` · PR [#229](https://github.com/catgeot/Days/pull/229) · 선유8경 5 |
| 30 | `팔경 활용 #30, 금산 결손 오버레이` | A | **완료** · tip `f6c7a3f2` · PR [#231](https://github.com/catgeot/Days/pull/231) · 금산 5 |
| 31 | `팔경 활용 #31, 금산 은행나무·썸네일` | A | **완료** · tip `6b5aaeae` · PR [#231](https://github.com/catgeot/Days/pull/231) · 요광리 은행나무 사진 · 서대산·진악산 빈 썸네일 |
| 32 | `팔경 활용 #32, 남해 결손 오버레이` | A | **완료** · tip `2dbb33e9` · PR [#232](https://github.com/catgeot/Days/pull/232) merge ✅ · 남해12경 5 · 그룹명 남해 12경 |
| 33 | `팔경 활용 #33, 포항 결손 오버레이` | A | **완료** · tip `578498bb` · PR [#235](https://github.com/catgeot/Days/pull/235) merge ✅ · 포항12경 5 |
| 34 | `팔경 활용 #34, 안양 결손 오버레이` | A | **완료** · tip `23ed5d76` · PR [#236](https://github.com/catgeot/Days/pull/236) · 안양9경 4 |
| 35 | `팔경 활용 #35, 증평 결손 오버레이` | A | **완료** · tip `f9f4528c` · PR [#237](https://github.com/catgeot/Days/pull/237) · 증평구경 4 |
| 36 | `팔경 활용 #36, 계룡 결손 오버레이` | A | **완료** · tip `6ebd84b2` · PR [#238](https://github.com/catgeot/Days/pull/238) · 계룡9경 4 |
| 37 | `팔경 활용 #37, 논산 결손 오버레이` | A | **완료** · tip `e3b1711a` · PR [#240](https://github.com/catgeot/Days/pull/240) · 논산11경 4 · 관광지 검색 빈 썸네일 3 |
| 38 | `팔경 활용 #38, 천안 결손 오버레이` | A | **완료** · tip `86066c69` · PR [#243](https://github.com/catgeot/Days/pull/243) · 천안8경 4 |
| 39 | `팔경 활용 #39, 담양 결손 오버레이` | A | **완료** · tip `1c2fa1c2` · PR [#245](https://github.com/catgeot/Days/pull/244) · 담양10경 4 |
| 40 | `팔경 활용 #40, 밀양 결손 오버레이` | A | **완료** · tip `bd5827d2` · PR [#245](https://github.com/catgeot/Days/pull/245) · 밀양8경 4 |
| 41 | `팔경 활용 #41, 영덕 결손 오버레이` | A | **완료** · tip `1a2f148b` · PR [#245](https://github.com/catgeot/Days/pull/245) · 영덕9경 4 |
| 42 | `팔경 활용 #42, 문경 결손 오버레이` | A | **열기 가능** · 문경8경 4 · Preview QA는 사람 병행(세션 생략) |
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

### §1.2 A #15 영동 결손 오버레이 (실행됨)

```
팔경 활용 #15, 영동 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 영동 한천팔경 사진·개요 없는 7건(화헌악·용연대·산양벽·청학굴·법존암·사군봉·냉천정)과 양산팔경 6건(비봉산·봉황대·함벽정·여의정·자풍서당·용암)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=yeongdong
```

### §1.2 A #16 다음 제시어 (실행됨)

```
팔경 활용 #16, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-11-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: /korea/theme/scenic?hub=yeongdong 한천팔경 결손 7행·양산팔경 결손 6행 썸네일·개요 · 행마다 사진이 다른지
```

### §1.2 A #17 한천 공식명·지구본 검색 (실행됨)

```
팔경 활용 #17, 한천 공식명·지구본 검색
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #217 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 한천 검색 그룹명을 공식 한천팔경으로 · 지구본 홈 「한천」에 한천팔경 행 주입
```

### §1.2 A #18 한천 행 부제 공식명 (실행됨)

```
팔경 활용 #18, 한천 행 부제 공식명
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #217 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 한천팔경 행 부제를 영동 N경에서 한천 N경으로
```

### §1.2 A #19 함안·사천 결손 오버레이 (실행됨)

```
팔경 활용 #19, 함안·사천 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · PR #219 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 함안9경 사진·개요 없는 7건(말이산고분군·악양의 꽃길과 노을·무진정의 사계·연꽃테마파크의 아라홍련·장춘사의 산사풍경·합강정과 반구정의 해돋이·대평늪의 늪지식물)과 사천9경 6건(삼천포대교와 사천바다케이블카·남일대 코끼리바위·선진리성 벚꽃·봉명산 다솔사·비토섬 갯벌·용두공원과 청룡사 겹벚꽃)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=haman · ?hub=sacheon
```

### §1.2 A #20 사람 Preview QA (실행됨)

```
팔경 활용 #20, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: Preview /korea/theme/scenic?hub=haman · ?hub=sacheon 결손 행 썸네일·개요·행마다 다른 사진
```

### §1.2 A #21 이천 결손 오버레이 (실행됨)

```
팔경 활용 #21, 이천 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 이천9경 사진·개요 없는 6건(노성산 말머리바위·도드람산 삼봉·반룡송·사기막골도예촌·설봉산 삼형제 바위·애련정)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=icheon
```

### §1.2 A #22 창녕 결손 오버레이 (실행됨)

```
팔경 활용 #22, 창녕 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 창녕구경 사진·개요 없는 6건(우포늪과 따오기·화왕산 억새와 진달래·낙동강유채축제와 남지개비리·만옥정공원과 신라진흥왕척경비, 술정리동삼층석탑·교동과 송현동고분군·3·1민속문화제와 영산만년교)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=changnyeong
```

### §1.2 A #23 창녕 검색 버그픽스 (실행됨)

```
팔경 활용 #23, 창녕 검색 버그픽스
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 창령 검색이 창녕구경을 넣지 않게. 창녕 관광지는 분류칩 건수와 목록이 맞고 빈 문구가 칩과 함께 뜨지 않게.
```

### §1.2 A #24 창령→창녕 별칭 (실행됨)

```
팔경 활용 #24, 창령→창녕 별칭
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 창령·창령군을 창녕 허브 별칭으로 연결. 명승 홈 검색 시 팔경·명소·명승·관광지가 창녕과 같게.
```

### §1.2 A #25 진주 결손 오버레이 (실행됨)

```
팔경 활용 #25, 진주 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 진주8경 사진·개요 없는 6건(남강 의암·뒤벼리·새벼리·망진산 봉수대·비봉산의 봄·월아산 해돋이)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=jinju
```

### §1.2 A #26 상산(진천) 결손 오버레이 (실행됨)

```
팔경 활용 #26, 상산(진천) 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 상산팔경 사진·개요 없는 6건(평사낙안·우담제월·금계완사·상산모운·어은계석·적대청람)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=jincheon
```

### §1.2 A #27 구례 결손 오버레이 (실행됨)

```
팔경 활용 #27, 구례 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 구례10경 사진·개요 없는 5건(노고단 운해·반야봉 낙조·피아골 단풍·산동 산수유꽃·노고단 설경)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=gurye
```

### §1.2 A #28 강진 결손 오버레이 (실행됨)

```
팔경 활용 #28, 강진 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 강진12경 사진·개요 없는 5건(월출산·가학산·백야김좌진기념관·남도별미식문화박물관·강진청자박물관)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=gangjin
```

### §1.2 A #29 군산 결손 오버레이 (실행됨)

```
팔경 활용 #29, 군산 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 선유8경 사진·개요 없는 5건(선유낙조·명사십리·망주폭포·월영단풍·무산십이봉)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=gunsan
```

### §1.2 A #30 금산 결손 오버레이 (실행됨)

```
팔경 활용 #30, 금산 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-12-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 금산10경 사진·개요 없는 5건(산림문화 힐링명소·금산인삼 세계농업유산·인삼·약령시장·월영산 원골·태조태실 요광은행나무)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=geumsan
```

### §1.2 A #32 남해 결손 오버레이 (실행됨)

```
팔경 활용 #32, 남해 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 남해12경 사진·개요 없는 5건(남해 금산과 보리암·창선교와 남해지족해협 죽방렴·서포 김만중 선생 유허와 노도·남해 물건리 방조어부림과 물미해안·창선-삼천포대교)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=namhae
```

### §1.2 A #33 포항 결손 오버레이 (실행됨)

```
팔경 활용 #33, 포항 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 포항12경 사진·개요 없는 5건(호미곶 일출·내연산 12폭포·운제산 오어사 사계·영일대 포스코 야경·철길숲 불의 정원)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=pohang
```

### §1.2 A #34 안양 결손 오버레이 (실행됨)

```
팔경 활용 #34, 안양 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 안양9경 사진·개요 없는 4건(망해암일몰·수리산성지·평촌1번가 문화의거리·만안교)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=anyang
```

### §1.2 A #35 증평 결손 오버레이 (실행됨)

```
팔경 활용 #35, 증평 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 증평구경 사진·개요 없는 4건(좌구산 천문대·삼기저수지 등잔길·추성산성·연병호 항일역사공원)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=jeungpyeong
```

### §1.2 A #36 계룡 결손 오버레이 (실행됨)

```
팔경 활용 #36, 계룡 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 계룡9경 사진·개요 없는 4건(향적산 국사봉·숫용추·암용추·계룡대 통일탑)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=gyeryong
```

### §1.2 A #37 논산 결손 오버레이 (실행됨)

```
팔경 활용 #37, 논산 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 논산11경 사진·개요 없는 4건(대둔산 수락계곡·강경포구와 근대역사거리·노성산성과 명재고택·종학당과 한국유교문화진흥원)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=nonsan
```

### §1.2 A #37 논산 검색 빈 썸네일 (실행됨)

```
팔경 활용 #37, 논산 검색 빈 썸네일
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 「논산」 관광지 검색에서 썸네일 없는 양촌자연휴양림·강경역사관·노강서원(논산)을 LOCAL_SCENIC_TOUR_THUMB_BY_CONTENT_ID로 보강. Preview /korea/theme/scenic 검색 논산
```

### §1.2 A #38 천안 결손 오버레이 (실행됨)

```
팔경 활용 #38, 천안 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 천안8경 사진·개요 없는 4건(유관순열사사적지·태조산 왕건길과 청동대좌불·아라리오조각광장·봉선홍경사갈기비)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=cheonan
```

### §1.2 A #42 문경 결손 오버레이 (다음)

```
팔경 활용 #42, 문경 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 문경8경 사진·개요 없는 4건(새재계곡·쌍용계곡·운달계곡·봉암사백운대)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=mungyeong
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
