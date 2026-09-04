# 팔경 활용 — 검색·리스트 · Tour contentId

**상태**: 문서 착수 2026-09-04 · 코드 **미착수** · 수집 주제는 **종료 유지**  
**주제 표기**: `팔경 활용 #{N}, {단계}`  
**고정 브랜치**: `cursor/palgyeong-use-e744` (수집 `cursor/palgyeong` **재사용 금지**)  
**SSOT**: [`koreaLocalScenicLists.json`](../src/pages/Home/data/koreaLocalScenicLists.json) (lists **94** · members **876**)  
**수집 플랜**(열지 않음): [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md) — 오케 재개 금지

두 갈래. 브랜치 1개 · 세션만 다름.

| 갈래 | 채팅명 | Tour LIVE |
|------|--------|-----------|
| **A UX/UI** | `팔경 활용 #{N}, …` | **없음** |
| **B contentId 오케** | `오케스트레이터 팔경contentId` | DB 먼저 · LIVE 잔여만 · **429면 그날 정지** |

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

홈 클릭 = 기존 `/place` 핀. 상세 본문 = 명소/축제 상세.

---

## 1. 에이전트 시작 (3분 · 전반 생략)

첫 메시지에 세션 표기 또는 `@plans/feature-handoff-index.md`가 있으면:

1. [`.ai-context.md`](../.ai-context.md) **1절·3절만**
2. [`feature-handoff-index.md`](./feature-handoff-index.md) **「팔경 활용」행** + 일지 핸드오프 1절 + **본 플랜 §9만**  
   B면 큐 **다음 ⬜ 1블록** + [`orchestrator-method.md`](./orchestrator-method.md) **§3.0·§3.3·§5.7만**
3. `checkout cursor/palgyeong-use-e744` → `merge origin/main` → `audit:docs-handoff-sync`

**Read 금지**: `.ai-context` 5절 · `travelSpots.js` 전체 · 팔경/hub JSON **전문** · scenic overrides · 수집 플랜 본문 · 닫힌 일지 · 광역 grep. 대상 hub는 `mungyeong` 등 **단건**.

---

## 2. 갈래 A — UX/UI (LIVE 없음)

| 단계 | 파일 | 할 일 |
|------|------|--------|
| A1 | [`koreaLocalScenicLists.js`](../src/pages/Home/lib/koreaLocalScenicLists.js) | `listsForHub` · `matchLocalScenicListsForQuery` · `localScenicListDisplayTitle` |
| A2 | [`searchSuggestions.js`](../src/pages/Home/lib/searchSuggestions.js) · [`SearchSuggestionList.jsx`](../src/pages/Home/components/SearchDiscovery/SearchSuggestionList.jsx) · [`useHomeHandlers.js`](../src/pages/Home/hooks/useHomeHandlers.js) | hub exact이어도 팔경 소제목 **앞**. 리스트 alias는 hub 흡수보다 우선. `groupTitle`. 전체 상한 여유(예: 24) |
| A3 | [`ScenicPage.jsx`](../src/pages/KoreaTheme/ScenicPage.jsx) curated `ul` | 같은 리스트 선두에 N경 멤버 + 소제목. `ScenicListRow`. `contentId` 있을 때만 Tour 모달 |
| A4 | [`FestivalDetailSheet.jsx`](../src/pages/Korea/FestivalDetailSheet.jsx) · [`ThemeSpotDetailModal.jsx`](../src/pages/KoreaTheme/ThemeSpotDetailModal.jsx) | 기존 `nearAttractions` **내부만** 상단 그룹 · 새 파트 금지 |

**VERIFY A**: 스모크 `문경` → 소제목 `문경 팔경` + 멤버 + 여행지 `문경`. `속초`/`낙산사` 회귀. 별도 파드 없음. `build`.

---

## 3. 갈래 B — contentId 오케 (쿼터)

method **§5.7** · 큐 [`korea-local-scenic-contentid-queue.md`](./korea-local-scenic-contentid-queue.md)

| 순위 | 대상 |
|------|------|
| **P0** | 팔경 멤버 (~876) — 이번 목표 |
| P1 | hub attractions 잔여 |
| P2 | 테마 선정 잔여(~75) — P0 소진 전 금지 |

DB(`tourapi_attraction`) 먼저 · LIVE `searchKeyword`는 잔여만 · 워커 **병렬 LIVE 금지** · 429 → `blocked: quota` · 같은 날 재시도 금지. HIT → 멤버+hub attraction `contentId`. scenic 승격 금지.

**S0**(메인 솔로): fill 스크립트(`--db-only`/`--keyword-only`/`--limit`/`--resume`) + 문경 1건 스모크. 그다음 F = 오케 §3.0.

---

## 9. 핸드오프

| | |
|--|--|
| **운영** | 문서 SSOT `origin/main` · 코드 미착수 |
| **지금** | 플랜·index·큐 골격 · 다음 = **A #1** |
| **브랜치** | `cursor/palgyeong-use-e744` (없으면 main에서 생성) |
| **금지** | scenic 승격 · 축제 홈 파드 · 칩 리디자인 · 수집 오케 · feature에 `plans/**` 커밋 |
| **VERIFY** | A: 검색 스모크+`build` · B: audit `contentId` 허용 · 429는 정지 PASS |

### 채팅명 복붙표 (`#N` 리셋 금지)

| #N | 채팅명 한 줄 | 갈래 | 상태 |
|----|--------------|------|------|
| 1 | `팔경 활용 #1, 검색·리스트` | A | **다음 착수** |
| 2 | `팔경 활용 #2, Preview QA` | A 사람 | #1 push 후 |
| 3 | `오케스트레이터 팔경contentId` | B P0 | S0 이후 |
| — | `지자체 팔경 #…` | 수집 종료 | **열지 않음** |

### §1.2 다음 제시어 (#1 착수)

```
팔경 활용 #1, 검색·리스트
@plans/feature-handoff-index.md
@plans/2026-09-04-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744
금지: scenic 승격 · 축제 홈 파드 · 칩 리디자인
작업: 탐색창 문경 팔경 소제목 · 명소 같은 ul 상단 N경 · 축제 본문 인근 그룹 · Tour LIVE 없음
```

**#2 Preview QA**

```
팔경 활용 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-04-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744
금지: scenic 승격 · 축제 홈 파드 · 칩 리디자인
작업: 홈 검색 문경 · /korea/theme/scenic 문경 hub · 축제 상세 인근 목록 소제목
```

**B 최초·복구**

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-use-e744
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P1/P2 월권
작업: 큐 다음 ⬜ P0 · DB-only 우선 · VERIFY → 다음 R 또는 Task 이관
```

**B 429 다음날**

```
오케스트레이터 팔경contentId
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-use-e744
금지: 같은 날 429 재시도 · 워커 병렬 LIVE · UI
작업: 큐 blocked:quota 다음 ⬜ · DB-only 잔여 먼저 · LIVE는 한도 내만
```
