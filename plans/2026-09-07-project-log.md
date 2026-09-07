# 2026-09-07 프로젝트 일지

직전: [`2026-09-06-project-log.md`](./2026-09-06-project-log.md)

## 팔경 contentId — 다음 세션 핸드오프 (#P0-L02)

- **채팅명** `팔경contentId #P0-L02, 멤버 keyword`
- **브랜치** `cursor/palgyeong-cid` · tip `4c141c27` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **스냅샷** P0 멤버 **400/876** (null **476**) · P2 테마 null **104**/871 · 429 없음
- **완료** P2-L2 areaBased+keyword **0/104** · P0-L keyword **109/584** (hub 72)
- **시작** `checkout cursor/palgyeong-cid` → `merge origin/main` → `npm run audit:docs-handoff-sync`
- **1순위** `node scripts/fill-korea-local-scenic-content-ids.mjs --keyword-only` (`--limit=100` OK)
- **읽기 3** index 팔경 contentId 행 · 큐 「다음 세션」절 · method §5.7
- **금지 3** UI · scenic 승격 · 워커 병렬 LIVE

```
팔경contentId #P0-L02, 멤버 keyword
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
@plans/orchestrator-method.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 같은 날 재시도 · feature에 plans/** 커밋
작업: P0-L02 — fill-korea-local-scenic-content-ids --keyword-only (null 476) → audit/smoke lists
```

## 팔경 contentId — P2-L2 + P0-L ✅

- **세션** `팔경contentId #P2-L2, 잔여 LIVE`
- **브랜치** `cursor/palgyeong-cid` · tip `4c141c27` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P2-L2** areaBased+keyword 전수 **0/104** — 리조트·시장·상업 등 MISS 유지
- **P0-L** keyword **109/584** — members 292→**400/876** · hub 72 동기
- **VERIFY** audit/smoke scenic + lists + content-ids PASS
- **다음** P0-L02 멤버 keyword 잔여 476

## 팔경 contentId — P2-L LIVE keyword 38건 ✅

- **세션** Tour API **운영 승인**(쿼터 ~10만/일) · P2 keyword-only 전수 1회
- **브랜치** `cursor/palgyeong-cid` · tip `768b1635` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **채움** 38/142 — 환선굴·청평사·아바이마을·쌍계사(하동)·월악산국립공원·부여박물관 등
- **null** 142→**104** · 429 없음
- **VERIFY** audit/smoke scenic PASS
- **다음** #P2-L2 areaBased+keyword · P0-L 멤버 keyword — 핸드오프 절 상단

## 팔경 contentId — S0-P2·P2 DB-only F·P2-L01 ✅

- **세션** `팔경contentId #S0-P2, 파서→P2-R01` · 같은 지휘자 연장
- **브랜치** `cursor/palgyeong-cid` · tip `3c67e133` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **S0-P2** `nullIdsFromOverrides` → `KOREA_SCENIC_SPOTS_OVERRIDES` import · dry-run targets=142
- **P2-R01–R13** DB-only 전 라운드 **유효 0건** · 월악산→약초마을 1건은 overrides 오탐 제외(롤백)
- **P2-L01** `--keyword-only --limit=20` **0/20** · 429 없음 · null **142** 유지
- **VERIFY** audit/smoke scenic PASS(채움 없음 · tip 동일)
- **다음** P2-L02+ 메인 직렬 keyword-only(≤20/세션)

```
오케스트레이터 팔경contentId
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · 같은 날 429 재시도
작업: P2-L02+ — fill-korea-scenic-spot-content-ids --keyword-only --limit=20
```

## 써머리 닫기 #1, Android Chrome 고스트 클릭

- **세션** `써머리 닫기 #1, Android Chrome 고스트 클릭`
- **브랜치** `cursor/summary-close-1030` · tip `f1e040b4` · PR [#202](https://github.com/catgeot/Days/pull/202)
- **원인**: 써머리 X가 `pointerdown`에서 카드를 벗기면 Android Chrome 고스트 클릭이 Mapbox로 뚫림 → 다른 여행지 써머리
- **수정**: 닫기 직후 `suppressOverlayClick` 500ms · 지구본 capture 클릭 차단 · X 비주얼 유지
- **VERIFY** `smoke:summary-close-guard` · `vite build` PASS
- **Preview** `/qa/summary-close` → git Preview `/`
- **다음** 사람 Android Chrome QA — 써머리 X → 닫힘 · 다른 카드 즉시 오픈 없음

```
써머리 닫기 #2, Android Chrome QA
@plans/feature-handoff-index.md
@plans/2026-09-07-project-log.md
브랜치 cursor/summary-close-1030 · PR #202 · Preview /qa/summary-close
금지: UI 리디자인 · 써머리 X pointerdown 닫기 제거 · feature에 plans/** 커밋
작업: Android Chrome에서 지구본 써머리 X → 카드만 닫힘 · 다른 여행지 써머리가 바로 안 열림
```

## 팔경 contentId — P2 큐 초안 (문서만)

- **세션** 계획 반영 · overrides `contentId: null` **142**/871 · **78** hub · P2-R01–R13 DB-only · P2-L LIVE 패턴
- **착수 게이트 S0-P2**: `fill-korea-scenic-spot-content-ids` `nullIdsFromOverrides` 파서 — dry-run `targets=0` 확인됨 · F 전 메인 솔로 수정
- **다음** P2-R01 A `samcheok`·`hapcheon`·`hadong` / B `uiryeong`·`sokcho`·`buyeo` · 큐 [`korea-local-scenic-contentid-queue.md`](./korea-local-scenic-contentid-queue.md)

## 팔경 contentId — P1-R10 hub DB-only ✅ · P1 F 소진

- **세션** `오케스트레이터 팔경contentId` · 로컬 메인 장수 · 워커A→B dry-run+apply · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `a248e546` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R10** 7/25 · A 4/15 · B 3/10 · hub+P1 누적 **68** · **P1 F 소진**
- **채움** 천안 각원사·병천순대거리 · 대전 한밭수목원·뿌리공원 · 담양호 · 고흥 유자공원 · 금산 보석사
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS
- **다음** P2-R01 DB-only — S0-P2 파서 수정 후 착수

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · 같은 날 429 재시도 · 워커 커밋 · Cloud 중첩 후임
작업: P2-R01 DB-only — S0-P2 파서 확인 후 워커A(samcheok·hapcheon·hadong)+B(uiryeong·sokcho·buyeo)
```

## 팔경 contentId — P1-R09 hub DB-only ✅

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커A→B Foreground · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `0ab99f56` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R09** 8/27 · A 5/12 · B 3/15 · hub+P1 누적 **61**
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS
- **다음 P1-R10** A `cheonan`·`daegu`·`daejeon` / B `damyang`·`geumsan`·`goheung`

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P2 월권 · 워커 커밋 · Cloud 중첩 후임 · 남은 R 전부 기동
작업: P1-R10 DB-only — 메인 장수. 워커A3+B3 파일+요약 → 직렬 머지 VERIFY 커밋 → 큐 남으면 워커 재기동
```

## 팔경 contentId — P1-R08 hub DB-only ✅

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커A→B Foreground · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `8ea8bdd6` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R08** 5/24 · A 1/12 · B 4/12 · hub+P1 누적 **53** (함양 개평한옥마을 · 여수 3 · 광양 백운산)
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS
- **다음 P1-R09** A `ansan`·`anseong`·`anyang` / B `boseong`·`buan`·`buyeo`

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P2 월권 · 워커 커밋 · Cloud 중첩 후임 · 남은 R 전부 기동
작업: P1-R09 DB-only — 메인 장수. 워커A3+B3 파일+요약 → 직렬 머지 VERIFY 커밋 → 큐 남으면 워커 재기동
```

## 팔경 contentId — P1-R06·R07 hub DB-only ✅

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커A→B Foreground ×2세대 · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `7c0d040a` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R06** 4/37 (`ec615db9`) · A 2/19 · B 2/18 · **P1-R07** 5/23 (`7c0d040a`) · A 2/11 · B 3/12 · hub+P1 누적 **48**
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS (매 R)
- **다음 P1-R08** A `hamyang`·`gimhae`·`yangsan` / B `miryang`·`yeosu`·`gwangyang`

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P2 월권 · 워커 커밋 · Cloud 중첩 후임 · 남은 R 전부 기동
작업: P1-R08 DB-only — 메인 장수. 워커A3+B3 파일+요약 → 직렬 머지 VERIFY 커밋 → 큐 남으면 워커 재기동
```

## 팔경 contentId — P1-R05 hub DB-only ✅

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커A→B Foreground · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `3648d7b1` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R05** 6/51 (`3648d7b1`) · 워커A 1/29 · 워커B 5/22 · hub+P1 누적 **39**
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS
- **다음 P1-R06** A `changnyeong`·`yeongdeok`·`uiseong` / B `tongyeong`·`hadong`·`hapcheon`

## 팔경 contentId — P1-R04 hub DB-only ✅

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커A→B Foreground · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `8d609d90` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R04** 6/38 (`8d609d90`) · 워커A 3/18 · 워커B 3/20 · hub+P1 누적 **33**
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS
- **다음 P1-R05** A `sacheon`·`uiryeong`·`geoje` / B `ganghwa`·`geochang`·`haman`

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P2 월권 · 워커 커밋 · Cloud 중첩 후임 · 남은 R 전부 기동
작업: P1-R05 DB-only — 메인 장수. 워커A3+B3 파일+요약 → 직렬 머지 VERIFY 커밋 → 큐 남으면 워커 재기동
```

## 오케스트레이터 v2.4 — 지휘자+워커 N · Cloud 중첩 금지

- **문서만** (`main` docs-only). 코드·UI 없음
- **한 세대** = 지휘자 1이 워커 N(기본 2)을 띄움 → 직렬 머지 → VERIFY → §3.4
- **워커 수**: 공식 동시 캡 없음. 토큰은 워커 정액이 아니라 각 워커 작업량(+N 프롬프트 오버헤드). Cloud 권장 2–4. LIVE 병렬은 기존처럼 금지
- **Cloud 한도**: 메인→L1만. 중첩 후임에게 워커를 맡기면 실패(2026-09-04 StepContext). 연속 = **같은 지휘자가 워커 재기동** 또는 새 Cloud 런(같은 고정 브랜치)
- **Desktop**: 컨트롤러가 다음 지휘자 L1 · 지휘자가 워커 L2
- SSOT: [`orchestrator-method.md`](./orchestrator-method.md) v2.4 · Rule `gateo-orchestrator.mdc`

## 오케스트레이터 v2.4.1 — 메인 장수 · 워커 커밋 금지

- 메인은 이관하지 않고 컨텍스트가 찰 때까지 **다음 R 워커만** 재기동
- 워커는 `tmp/orchestrator/` 파일 + 5줄 요약. JSON을 메인 채팅에 붙이면 메인도 참
- 끝난 워커에게 커밋·push를 맡기지 않음 — 같은 tip 병렬 git 충돌. 커밋은 지휘자 직렬
- 남은 R 전부 동시 기동 금지. in-flight = 지금 R의 N

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P2 월권 · 워커 커밋 · Cloud 중첩 후임 · 남은 R 전부 기동
작업: P1-R02 DB-only — 메인 장수. 워커A3+B3 파일+요약 → 메인 직렬 머지 VERIFY 커밋 → 큐 남으면 워커 재기동
```

## 팔경 contentId — R11–R13 DB-only ✅ · 같은 지휘자 3세대

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커 Foreground · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `5276a853` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **R11** 17/53 (`9862b617`) · **R12** 24/76 (`9d9a7276`) · **R13** 28/62 (`5276a853`) · 누적 **240**/876
- **VERIFY** audit issues 0 · smoke lists + content-ids PASS (매 R)
- **세대**: 같은 메인이 워커만 재기동 — **2회 하드캡이 아님**을 실운 확인. 원인·방안은 method **v2.4.1 §1.4**
- **다음 R14** A `gyeryong-gugyeong`·`geumsan-sipgyeong`·`uijeongbu-palgyeong` / B `yeoju-palgyeong`·`icheon-gugyeong`·`gwangju-gi-palgyeong`

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P1/P2 월권 · Cloud 중첩 후임 Task
작업: R14 DB-only — 지휘자(Cloud 메인)가 워커A3+B3 Foreground 기동 → 직렬 머지 VERIFY → 큐 남으면 워커 재기동(2회 하드캡 아님)
```

## 팔경 contentId — R14–R16 DB-only ✅ · P0 F 소진 · 같은 지휘자 3세대

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커 Foreground · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `d8556c2e` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **R14** 15/52 (`e088c22b`) · **R15** 20/51 (`1e297c87`) · **R16** 17/40 (`d8556c2e`) · 누적 **292**/876
- **VERIFY** audit issues 0 · smoke lists + content-ids PASS (매 R)
- **P0 F 라운드 소진** (R01–R16). 다음 **P1** hub `attractions[]` 잔여

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/korea-local-scenic-use-plan.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P2 월권
작업: P1-R02 DB-only — 지휘자=Cloud 메인 · 워커A(yanggu·inje·wonju)+B(donghae·sokcho·yangyang) Foreground → 직렬 머지 VERIFY. 중첩 후임 Task 금지.
```

## 팔경 contentId — P1-R02·R03 hub DB-only ✅

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커A→B Foreground · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `fc4e85d0` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R02** 9/63 (`2e4bac58`) · **P1-R03** 9/50 (`fc4e85d0`) · hub+P1 누적 **27**
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS (매 R)
- **다음 P1-R04** A `danyang`·`jecheon`·`okcheon` / B `jeungpyeong`·`mungyeong`·`yecheon`

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P2 월권 · 워커 커밋 · Cloud 중첩 후임 · 남은 R 전부 기동
작업: P1-R04 DB-only — 메인 장수. 워커A3+B3 파일+요약 → 직렬 머지 VERIFY 커밋 → 큐 남으면 워커 재기동
```

## 팔경 contentId — P1-R01 hub DB-only ✅

- **세션** `오케스트레이터 팔경contentId` · 지휘자=Cloud 메인 · 워커A→B Foreground 직렬 · 중첩 후임 없음
- **브랜치** `cursor/palgyeong-cid` · tip `0725230f` · PR [#185](https://github.com/catgeot/Days/pull/185)
- **P1-R01** 9/83 hub attraction (`yeongdong`·`gyeongju`·`jincheon` + `pohang`·`samcheok`·`hongcheon`) · `fill-korea-hub-attraction-content-ids.mjs` 신규
- **VERIFY** audit issues 0 · smoke lists + content-ids · build PASS
- **다음 P1-R02** A `yanggu`·`inje`·`wonju` / B `donghae`·`sokcho`·`yangyang`

## 오케스트레이터 v2.4.1 — Cloud 2회는 하드캡 아님

- **문서만** (`main` docs-only)
- 예전 수십 세대 = Desktop/후임 Task 체인(v2.1 · 정착지 R01–R63). Cloud는 L2가 없어 그 체인이 죽음(2026-09-04 StepContext)
- 「1~2회」는 Desktop 컨트롤러 교체 권장이었는데 에이전트가 Cloud 정지로 읽음
- **방안**: 같은 메인이 워커 재기동. 정지는 큐 소진·429·§3.3 E·런 실제 고갈뿐
