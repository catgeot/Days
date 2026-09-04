# 열린 feature — main 핸드오프 인덱스

**역할**: `main`에서 새 Cloud 세션을 열어도 **브랜치·PR·다음 제시어**를 즉시 찾을 수 있게 하는 SSOT.  
**규칙**: [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§1.2** · **§6** · [`AGENTS.md`](../AGENTS.md) Cloud 핸드오프.

| | |
|--|--|
| **에이전트 (시작)** | 사용자 첫 메시지에 **채팅명 형식**(`{주제} #{N}, …`) 또는 **`@plans/feature-handoff-index.md`** 가 있으면 **본 파일 해당 행만** Read → 표의 **다음 제시어**·브랜치 checkout. `.ai-context` 전문·코드베이스 광역 grep **생략**. |
| **에이전트 (종료)** | feature 세션 종료 시 **해당 주제 행 갱신** + 주제 플랜 **§9** + 최신 일지 2~5줄 + **§1.2 다음 제시어 블록** 복붙. |
| **main 동기화** | 위 3파일은 **`main` + `origin/main` 반영 필수** (§1.5.4). feature **종료 시** `merge origin/main` + `audit:docs-handoff-sync` PASS. **feature에 `plans/**` 커밋 금지**. **Plan 아티팩트만 갱신하고 main push 생략 금지** — [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) §1.3. 절차: [`docs-on-main-workflow.md`](./docs-on-main-workflow.md) §충돌 방지.
| **주제 종료** | PR 병합 후 해당 행 **삭제** 또는 `active: false` + 병합 SHA 기록. |

---

## 활성 목록

### 팔경 활용 — 검색·리스트 (A)

| | |
|--|--|
| **상태** | **문서 SSOT** · UI 미착수 · B와 **동시 OK** |
| **브랜치** | `cursor/palgyeong-use-e744` (없으면 main에서 생성) |
| **플랜** | [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) **§9 A** |
| **일지** | [`2026-09-04-project-log.md`](./2026-09-04-project-log.md) |
| **소유** | js/jsx · 검색 스모크 · **JSON·fill 금지** |
| **금지** | JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 `plans/**` 커밋 |

**다음 제시어**:

```
팔경 활용 #1, 검색·리스트
@plans/feature-handoff-index.md
@plans/2026-09-04-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드
작업: 탐색창 문경 팔경 소제목 · 명소 같은 ul 상단 N경 · 축제 본문 인근 그룹 · Tour LIVE 없음
```

---

### 팔경 contentId — 오케 (B)

| | |
|--|--|
| **상태** | **S0 대기** · A와 **동시 OK** |
| **브랜치** | `cursor/palgyeong-cid` (없으면 main에서 생성 · 수집 `cursor/palgyeong` 금지) |
| **플랜** | [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) **§3·§9 B** · method **§5.7** |
| **큐** | [`korea-local-scenic-contentid-queue.md`](./korea-local-scenic-contentid-queue.md) — S0 ⬜ |
| **일지** | [`2026-09-04-project-log.md`](./2026-09-04-project-log.md) |
| **소유** | JSON `contentId` · fill · audit · **UI 금지** |
| **금지** | JSX · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · feature에 `plans/**` 커밋 |

**다음 제시어**:

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P1/P2 월권
작업: S0 스크립트+문경 DB-only → 큐 다음 ⬜ P0 · VERIFY → 다음 R 또는 Task 이관
```

---

### 지구본 홈 헤더 (Chrome 주소창 가림) — 종료 · 병합 안 함

| | |
|--|--|
| **상태** | **#12 종료** · 헤더 여백 유지 · PR [#181](https://github.com/catgeot/Days/pull/181) **닫음(미병합)** |
| **배포** | `https://www.gateo.kr/` — PR #175 모바일 `[로고+EN \| 검색]` · `p-4`(16px) **그대로** |
| **한계** | iOS Chrome 완전 종료 후 재실행 때 헤더가 주소창에 가릴 수 있음. 56px overlay 재시도 금지 |
| **일지** | [`2026-09-03-project-log.md`](./2026-09-03-project-log.md) |

**다음 제시어 없음** (주제 종료). 새 채팅에서 이 헤더 overlay를 다시 열지 않음.

---

### 홈 지구본 지명 (첫 로딩)

| | |
|--|--|
| **상태** | **#4 사람 PROD QA** · main `cf63192c` · PR [#182](https://github.com/catgeot/Days/pull/182) merge ✅ |
| **브랜치** | `cursor/globe-labels-ddce` · merge `cf63192c` |
| **일지** | [`2026-09-03-project-log.md`](./2026-09-03-project-log.md) |
| **PROD** | `https://www.gateo.kr/` |
| **VERIFY** | `smoke:globe-label-first-reveal` · `smoke:place-label-slug` · `vite build` |

**게이트**: 사파리 `www.gateo.kr` 첫 진입 — EN 없이 대륙·대양 지명 · 자전 · EN↔KO

**다음 제시어** (#4 사람 PROD QA):

```
홈 지구본 지명 #4, 사파리 PROD QA
@plans/feature-handoff-index.md
@plans/2026-09-03-project-log.md
PROD https://www.gateo.kr/
금지: UI 리디자인 · HomeGlobeMapbox 광역 리팩터 · 코드를 origin/main에 임의 push
작업: 사파리에서 www.gateo.kr 첫 진입(EN 없이) 지명 · 완전 종료 후 재실행 2~3회 · 자전 · EN↔KO
```

---

### 홈 축제칩 (써머리 펼침) — main 병합 ✅

| | |
|--|--|
| **상태** | **#4 merge ✅** · main `7f0f46ca` · PR [#177](https://github.com/catgeot/Days/pull/177) |
| **일지** | [`2026-09-02-project-log.md`](./2026-09-02-project-log.md) |
| **PROD** | `https://www.gateo.kr/` — 모바일 지명 탭 후 접힘 · PC 접힌 칩 라벨 전부 |

**게이트**: 사람 Preview QA PASS · `/qa/home-chip` 종료(PROD `/`) · 작업 로그 `active: false`

---

### 홈 검색바 히트 (EN 토글·검색 겹침) — main 병합 ✅

| | |
|--|--|
| **상태** | **#3 merge ✅** · main `9824bfb8` · PR [#175](https://github.com/catgeot/Days/pull/175) |
| **일지** | [`2026-09-02-project-log.md`](./2026-09-02-project-log.md) |
| **PROD** | `https://www.gateo.kr/` — 모바일 검색·EN 토글 각각 클릭 |

**게이트**: 사람 Preview QA PASS · `/qa/search-hit` 종료(PROD `/`) · 작업 로그 `active: false`

---

### 홈 locale 토글 (EN/KO) — main 병합 ✅

| | |
|--|--|
| **상태** | **#9 merge ✅** · main `a6a5ede7` · PR [#176](https://github.com/catgeot/Days/pull/176) (#174+#176) |
| **일지** | [`2026-09-01-project-log.md`](./2026-09-01-project-log.md) · [`2026-09-02-project-log.md`](./2026-09-02-project-log.md) |
| **잔여** | 검색바 히트 PR #175 merge `9824bfb8` ✅ |

---

### 세계 행사·축제 일정 연동

| | |
|--|--|
| **상태** | **#51 QA 피드백** · tip `ea03ce2b` · 사람 Preview 대기 |
| **브랜치** | `cursor/world-events-wave3` · tip `ea03ce2b` |
| **PR** | [#166](https://github.com/catgeot/Days/pull/166) |
| **main** | docs sync — Wave3 사람 Preview QA |
| **플랜** | [`world-events-detail-ux-plan.md`](./world-events-detail-ux-plan.md) **F-0.5 D5-b-3** · **F-0.6** · §9 |
| **Q&A** | [`world-events-qa-index.md`](./world-events-qa-index.md) (Q15 추가) |
| **운영** | [`world-events-management.md`](./world-events-management.md) §6.1·§6.1.1·§8.1 |
| **샘플** | [`world-events-sample-log.md`](./world-events-sample-log.md) |
| **일지** | [`2026-08-27-project-log.md`](./2026-08-27-project-log.md) |
| **PROD QA** | §6.1.1 6건 공식 pill — 에이전트 PASS · 사람 모바일 탭 1줄씩 |
| **Preview** | `/qa/world-events` → `/world-events/rome-carnevale-2027` · `?region=europe` |
| **VERIFY** | `generate:world-events` · `audit:world-events` · `smoke:world-events` · `smoke:world-events-detail` · `build` |

**게이트**: Wave3 **4/4 D5-b 에이전트 PASS ✅** · **#52** 사람 Preview QA

**다음 제시어** (#52 사람 Preview QA):

```
세계행사 일정 #52, Wave3 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-08-27-project-log.md
@plans/world-events-management.md
브랜치 cursor/world-events-wave3 · PR #166 · https://www.gateo.kr/qa/world-events
금지: worldEvents.json 직편집 · UI 리디자인 · Wave1 KO 본문 일괄 En 번역
작업: Wave3 4건 모바일 Preview — paris·los-angeles·london·rome · OK 시 PR #166 merge
```

---

### 축제 로드 — `/korea` 킬러 맵

| | |
|--|--|
| **상태** | **#3-a 진입 QA** · 벨트 스크롤 수정 · 사람 Preview → **#4 leg UI** |
| **브랜치** | `cursor/korea-festival-proxy` · tip `0708af9b` |
| **PR** | [#170](https://github.com/catgeot/Days/pull/170) |
| **플랜** | [`korea-festival-road-plan.md`](./korea-festival-road-plan.md) §9 · [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) S5 벨트 |
| **일지** | [`2026-09-01-project-log.md`](./2026-09-01-project-log.md) |
| **Preview** | `/qa/korea` → `/korea` · **로드** 칩·카드·선택 |
| **순번** | 로드 트랙 **#0~** · 미완 이어하기 **#Na** ([`korea-festival-road-plan.md`](./korea-festival-road-plan.md)) |
| **VERIFY** | `generate:korea-festival-belts` · `audit:korea-festival-belts` · `smoke:korea-festival-belts` · `build` |

**게이트**: #3 belt 진입 smoke·build PASS ✅ · #6·#8 = 사람 Preview QA.

**다음 제시어 (#4 leg UI)**:

```
축제 로드 #4, leg UI
@plans/feature-handoff-index.md
@plans/2026-09-01-project-log.md
@plans/korea-festival-road-plan.md
브랜치 cursor/korea-festival-proxy · PR #170 · Preview /qa/korea
금지: 지도(#5) 착수 · plans/ feature 커밋 · corridor 부활 · 한 세션 leg UI+지도
작업: FestivalBeltLegList · connector · 빈 leg · belt 모드 리스트 전환
```

---

### AI 큐레이션 — 지도·무니 핸드오프

| | |
|--|--|
| **상태** | **main 병합** PR #130 (PC 핸드오프) · PROD 배포 후 **모바일 QA** |
| **main** | PR #130 merge 후 SHA 확인 |
| **플랜** | [`blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) |
| **일지** | [`2026-08-17-project-log.md`](./2026-08-17-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/blog/curation?debug=curation` — 모바일 「전체 지도」·「무니에게 묻기」 |
| **VERIFY** | `smoke-curation-place-bridge` · `npm run build` |

**다음 제시어**:

```
AI 큐레이션 #10, 모바일 PROD QA
@plans/feature-handoff-index.md
@plans/2026-08-17-project-log.md
www.gateo.kr/blog/curation?debug=curation · iPhone/Android 전체지도·무니
```

---

### 검색노출 (한·영 SEO)

| | |
|--|--|
| **상태** | **#24 RSS·canonical 재점검 PASS** · 에이전트 세션표 **완료** · 잔여 = 사람 GSC baseline · `/en/` prefix(합의 후) |
| **브랜치** | **`main`** |
| **플랜** | [`en-seo-followup-plan.md`](./en-seo-followup-plan.md) §9 |
| **일지** | [`2026-08-25-project-log.md`](./2026-08-25-project-log.md) |
| **제출 URL** | Sitemap `https://www.gateo.kr/sitemap.xml` (1133 URL) · RSS KO `https://www.gateo.kr/rss.xml` · RSS EN `https://www.gateo.kr/rss-en.xml` · `robots.txt`에 sitemap 선언됨 |
| **에이전트 VERIFY** | `smoke:rss-canonical` · `smoke:gsc-baseline` · `smoke:gsc-baseline-prod` · `audit:place-seo-en` · `build` |
| **사람** | GSC·네이버 서치어드바이저 sitemap/RSS 제출 · GSC 173건 baseline CSV(로컬 only) |

**다음 제시어** (백로그·합의 후):

```
검색노출 #25, /en/ URL prefix (합의 후)
@plans/feature-handoff-index.md
@plans/en-seo-followup-plan.md
/en/ prefix 합의 · i18n-en-plan 2차 URL과 동기
```

---

### 해안·해양 탐색
| **상태** | **main 병합 완료** (2026-08-16) · PROD 배포 후 QA |
| **main** | `14cc78ef` — PR #122 병합 + 뷰 폴링 제거 |
| **플랜** | [`coast-sea-explore-plan.md`](./coast-sea-explore-plan.md) §9 |
| **일지** | [`2026-08-16-project-log.md`](./2026-08-16-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/` — 모바일 대양 4 + 해역 리스트 연속 탭 |
| **VERIFY** | `smoke-sea-basin-rail` · `build` |

**다음 제시어**:

```
해안 해양 탐색 #17, PROD QA
@plans/feature-handoff-index.md
@plans/2026-08-16-project-log.md
main · www.gateo.kr 모바일 대양·해역 연속 탭
```

---

### 영문화 (English UI) — 2차 확장

| | |
|--|--|
| **상태** | **main 병합** PR #149 · PROD 배포 후 QA |
| **main** | `452c4c25` |
| **플랜** | [`i18n-en-plan.md`](./i18n-en-plan.md) §9 |
| **일지** | [`2026-08-24-project-log.md`](./2026-08-24-project-log.md) |
| **PROD QA** | `https://www.gateo.kr/place/yap/planner?lang=en` — 배너·MICRONESIA 권역 EN |
| **VERIFY** | `audit:airports` · `audit:i18n` · `build` |

**#45 완료**: 플래너 bannerNote·bookingNote·권역 notesEn — PR #149 merge

**다음 제시어 (#46)**:

```
영문화 #46, PROD QA — 플래너 banner EN
@plans/feature-handoff-index.md
@plans/2026-08-24-project-log.md
@plans/i18n-en-plan.md
main · www.gateo.kr/place/yap/planner?lang=en
금지: GT 일괄 백필
```

---

### 지자체 팔경·구경 → 도시 명소 — 1차 종료 · main 병합 ✅

| | |
|--|--|
| **상태** | **#N merge ✅ · 주제 종료** · main `55194e80` · PR [#184](https://github.com/catgeot/Days/pull/184) |
| **브랜치** | `cursor/palgyeong` · merge `55194e80` |
| **PR** | [#172](https://github.com/catgeot/Days/pull/172) · [#183](https://github.com/catgeot/Days/pull/183) · [#184](https://github.com/catgeot/Days/pull/184) merged |
| **플랜** | [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md) **§9** |
| **큐** | [`korea-local-scenic-lists-queue.md`](./korea-local-scenic-lists-queue.md) — **1차 소진** |
| **일지** | [`2026-09-04-project-log.md`](./2026-09-04-project-log.md) |
| **PROD** | lists **94** · members **876** · I#12 ✅ |
| **잔여(선택)** | `pending_coord` **424**/876 — 좌표 보강은 **새 합의** 전 착수 금지 |
| **VERIFY** | `audit:korea-local-scenic-lists` · `audit:city-attraction-hubs` · `smoke:korea-local-scenic-lists` · `build` PASS |

**다음 제시어 없음** (수집 종료). `오케스트레이터 지자체팔경`을 다시 열지 않음. 검색·contentId는 **팔경 활용** 행.


## 행 추가 템플릿 (새 Cloud feature)

```markdown
### {주제}

| | |
|--|--|
| **상태** | … |
| **브랜치** | `cursor/…` |
| **tip** | `{sha}` |
| **플랜** | [`…-plan.md`](./…-plan.md) §9 |
| **일지** | [`YYYY-MM-DD-project-log.md`](./…) |
| **Preview** | `https://…-git-…vercel.app/…` |
| **VERIFY** | `npm run …` |

**다음 제시어** (7행 · `작업:` 포함 · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) §1.2·§1.3):

\`\`\`
{주제} #{N}, {단계}
@plans/feature-handoff-index.md
@plans/YYYY-MM-DD-project-log.md
@plans/{주제}-plan.md
브랜치 cursor/… · PR #… · Preview/QA
금지: … · feature에 plans 커밋
작업: …
\`\`\`

**docs-on-main**: 핸드오프 3종은 **`main` push 필수** — feature에 `plans/**` 커밋 금지.
```
