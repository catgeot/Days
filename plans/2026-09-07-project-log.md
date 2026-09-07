# 2026-09-07 프로젝트 일지

직전: [`2026-09-06-project-log.md`](./2026-09-06-project-log.md)

## 오케스트레이터 v2.4 — 지휘자+워커 N · Cloud 중첩 금지

- **문서만** (`main` docs-only). 코드·UI 없음
- **한 세대** = 지휘자 1이 워커 N(기본 2)을 띄움 → 직렬 머지 → VERIFY → §3.4
- **워커 수**: 공식 동시 캡 없음. 토큰은 워커 정액이 아니라 각 워커 작업량(+N 프롬프트 오버헤드). Cloud 권장 2–4. LIVE 병렬은 기존처럼 금지
- **Cloud 한도**: 메인→L1만. 중첩 후임에게 워커를 맡기면 실패(2026-09-04 StepContext). 연속 = **같은 지휘자가 워커 재기동** 또는 새 Cloud 런(같은 고정 브랜치)
- **Desktop**: 컨트롤러가 다음 지휘자 L1 · 지휘자가 워커 L2
- SSOT: [`orchestrator-method.md`](./orchestrator-method.md) v2.4 · Rule `gateo-orchestrator.mdc`

**팔경 contentId** 다음(복구·재개):

```
오케스트레이터 팔경contentId
@plans/orchestrator-method.md
@plans/korea-local-scenic-contentid-queue.md
@plans/feature-handoff-index.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 재호출 · P1/P2 월권 · Cloud 중첩 후임 Task
작업: R11 DB-only — 지휘자(Cloud 메인)가 워커A3+B3 Foreground 기동 → 직렬 머지 VERIFY → 여유 있으면 R12 워커 재기동
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

## 오케스트레이터 v2.4.1 — Cloud 2회는 하드캡 아님

- **문서만** (`main` docs-only)
- 예전 수십 세대 = Desktop/후임 Task 체인(v2.1 · 정착지 R01–R63). Cloud는 L2가 없어 그 체인이 죽음(2026-09-04 StepContext)
- 「1~2회」는 Desktop 컨트롤러 교체 권장이었는데 에이전트가 Cloud 정지로 읽음
- **방안**: 같은 메인이 워커 재기동. 정지는 큐 소진·429·§3.3 E·런 실제 고갈뿐
