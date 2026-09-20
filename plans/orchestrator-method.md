# 오케스트레이터 (gateo 공식 작업 방식)

**상태**: ✅ 공식 · 2026-09-07 (**v2.4.1** — 메인 장수 · 워커는 파일+요약 · 워커 커밋 금지 · Cloud **2회 하드캡 아님**)
**역할**: 다배치·동일 SSOT를 **지휘자 1 + 워커 N(기본 2)** 로 돌리며 tip을 깨지 않고 확장.  
**제시어**(최초·복구용): `오케스트레이터` · 주제 붙임 예) `오케스트레이터` + `명소` / `명소-오케스트레이터`

Cloud에서 **메인은 이관하지 않고 R가 남는 한 워커만 다시 띄운다.** 워커는 초안을 파일에 두고 **요약만** 반환한다. 커밋·푸시는 지휘자가 직렬로 한다. 워커에게 맡기면 같은 tip을 동시에 밀어 git이 깨진다.

**한 세대** = 지휘자가 워커 N을 띄워 초안 병렬 → 지휘자가 tip **직렬** 머지 → VERIFY → §3.4 커밋(Cloud는 feature push·PR).  
세대가 끝나면 지휘권은 **워커를 띄울 수 있는 깊이**의 후임에게 넘긴다. Cloud에서 중첩 Task 후임은 워커를 못 띄우므로 **같은 지휘자가 워커만 재기동**한다. **2세대는 상한이 아니다**(§1.4 · §3.0).

커밋 게이트(VERIFY PASS)는 v2.3과 같다(§3.4).

---

## 1. 역할

| 역할 | 하는 일 | 금지 |
|------|---------|------|
| **지휘자**(오케스트레이터) | 다음 R 배치표 · **워커 N 기동**(기본 2, §3.5) · `tmp/orchestrator/` 조각을 **파일로** 직렬 append · VERIFY(audit **issues 줄만**) · **§3.4 커밋·push** · 컨텍스트가 찰 때까지 워커 재기동 | 워커 JSON을 채팅에 붙여 Read · tip 병렬 머지 · 워커 없이 **본인 런**(기본) · **`origin/main` 코드 push** · **VERIFY FAIL 커밋** · Cloud **중첩 후임** · 남은 R **전부** 한 번에 기동 |
| **워커** | 배정 1배치 초안을 **`tmp/orchestrator/` 파일**에 기록 + **5줄 요약**만 반환 | tip 직접 append · **commit/PR/push** · JSON 전문을 부모 채팅에 붙임 · SSOT 전면 rewrite · 다른 워커 tip · 이관서 · 자기 아래 Task |
| **후임 지휘자** | 메인 컨텍스트·런이 끝났을 때만. 새 Cloud 런 또는 Desktop 컨트롤러의 다음 L1 | 솔로 계주 · Cloud 중첩 Task 후임 |

지휘자가 워커를 띄운다. 워커가 지휘자가 되지 않는다.

### 1.1 승격·이관 (고정)

- Cursor 채팅 UI의 「메인」과 **역할명 지휘자**는 별개다. 초안 **워커**는 지휘자로 자동 승격되지 않는다.
- **이관 = 지휘권 이양**. 사람 제시어를 기다리지 않는다. 후임은 **반드시 워커 N을 띄울 수 있는 깊이**여야 한다.
- **Cloud (실사용 한도 = 메인 → L1만)**  
  이 Cloud 런의 **메인이 지휘자**. 워커 = L1 Task.  
  컨텍스트 여유 → **같은 지휘자가 워커 N만 재기동**(연장).  
  런·컨텍스트 고갈 → 일지 §4.1 + 복구 제시어로 **새 Cloud 런**(같은 고정 feature 브랜치).  
  **금지**: 지휘자(이미 메인 또는 L1)가 후임 지휘자를 중첩 Task로 띄우고, 그 후임에게 워커 기동을 맡기는 것. 후임은 L2가 되어 워커를 못 띄운다(§1.3). 2026-09-04 contentId `StepContext`가 이 패턴.
- **Desktop/IDE (메인 → L1 → L2)**  
  사람 채팅 = **컨트롤러**(장수). 지휘자 = L1 Task. 워커 = L2.  
  세대 끝 → 지휘자가 컨트롤러에 요약 반환 → **컨트롤러가** 다음 지휘자 L1을 띄움.  
  **금지**: 지휘자(L1)가 후임 지휘자를 직접 띄움 — 후임이 L2가 되어 워커(L3) 불가.
- **같은 지휘자 연장**: 후임 없이 워커 N만 재기동. 사람 제시어 불필요. Cloud의 **기본·장수** 경로. **라운드 2회에서 멈추지 않는다.**
- **사람이 제시어를 넣는 경우(한정)**: (a) 최초 착수 (b) §3.3 E·사용자 중단 후 재개 (c) Cloud 런 사망·파이프 단절 복구.  
  **금지**: 세대 VERIFY 후 「제시어 대기」만 하고 멈추기 · 「1~2회 했으니 세션 종료」.
- **본인 런 예외**(한시): 워커 실패 후 **1회 재시도**도 실패했고, 사용자가 중단하지 않았을 때만. 일지에 `본인 런 예외: 사유` 1줄.

### 1.2 퇴화 패턴 (재발 방지)

| 퇴화 패턴 | 왜 안 되나 | 대신 |
|-----------|------------|------|
| 후임이 **본인 런**만 반복 | 워커 병렬 처리량 소멸 | 후임 지휘자 = 워커 N 필수 |
| **배치마다** 이관 | 이관서·토큰 낭비, 세대 미완성 | **세대**(워커 N 머지+VERIFY) 끝난 뒤 · Cloud는 연장 우선 |
| Task만 띄우고 **tip 미append** | tip 정체·유령 작업 | 지휘자가 직렬 머지까지 완료 |
| Cloud **중첩 후임 Task** | 후임이 워커를 못 띄움 · StepContext | 같은 지휘자 워커 재기동 또는 새 Cloud 런 |
| VERIFY 후 **사람 제시어만** 남기고 정지 | 자동 오케 단절 | 연장 또는 §4.2 (플랫폼별) |
| Cloud에서 **1~2회를 하드캡**으로 읽고 정지 | 예전 수십 세대가 끊김 | 같은 메인 워커 재기동. 2회는 Desktop 권장일 뿐(§1.4) |
| 워커 결과를 **JSON 전문으로 부모에 반환** | 메인 컨텍스트가 워커만큼 참 · 장수 실패 | `tmp/orchestrator/` 파일 + 5줄 요약만 |
| 끝난 워커가 **각자 커밋·push** | 같은 tip 병렬 git 충돌 · VERIFY 우회 | 지휘자가 직렬 머지 후 §3.4 |
| 남은 R를 **한 번에 전부** 기동 | 동시 git/머지 불가 · 토큰 폭주 · LIVE 쿼터 | in-flight = 지금 R의 N만. 끝나면 다음 R |
| 채우기 쉬운 후보만 연속 (KR 구·DE/UK 중소) | 검색 가치↓ | 주제 §5 우선순위표 따름 |

### 1.3 플랫폼 한도 (워커 수 · 중첩 · 토큰)

출처: [Cursor Subagents](https://cursor.com/docs/subagents.md) · 스태프(중첩·Cloud 깊이, 2026-08).

| | 확인 | 오케에서 |
|--|------|----------|
| **동시 워커 수** | 공식 숫자 캡 **없음**. 한 메시지에 Task 여러 개 = 병렬. IDE에서 ~40 동시 → 연결 끊김 **보고**(비공식) | **기본 2**. 큐에 ⬜ 배치가 있고 tip 직렬 머지가 유지되면 **N 증가 허용**. Cloud 권장 **2–4**(머지 복잡도·LIVE 쿼터). 놀고 있는 워커를 늘리지 않음 |
| **중첩** | IDE/CLI: **메인 → L1 → L2**. L2는 더 못 띄움. **Cloud: 메인 → L1만** (더 깊은 중첩 아직 없음) | Cloud 지휘자 = 그 런의 메인. 워커만 L1. 지휘자 체인 중첩 **금지** |
| **토큰** | 워커 **정액 아님**. 각 서브에이전트 **자기 컨텍스트** 합. 비슷한 일을 하는 5병렬 ≈ 대략 5배(공식 안내) | **같은 작업량**을 N등분하면 초안 토큰 ≈ 1워커 + N×프롬프트 오버헤드. 작업을 N배 주면 토큰 N배. 벽시계는 병렬만큼 단축. 머지·VERIFY는 지휘자 1명 직렬 |
| **Foreground / Background** | Foreground = 부모 턴이 끝날 때까지 블록. Background = 즉시 반환. Cloud는 부모 턴 종료 후 결과 전달이 **문서화되지 않음** | 워커는 **Foreground**(또는 완료 수신 후 머지). 백그라운드만 띄우고 턴 종료 **금지** |

**LIVE**(팔경 contentId 등): 워커 **병렬 LIVE 금지** — N과 무관. DB-only R만 병렬.

### 1.4 예전 다세대 vs 지금 (2회에서 멈추는 이유)

**예전(v2.1 · 2026-07 정착지 R01–R63)**: 후임 오케스트레이터 Task 체인. Desktop은 메인→L1(지휘자)→L2(워커)라서 **컨트롤러가 지휘자를 계속 교체**할 수 있었다. 한 지휘자는 보통 2R 후 이관했고, **체인 전체가 수십 세대**를 이었다. Task가 없을 때는 같은 메인이 2~3R을 본인 런 예외로 돌렸다.

**지금 Cloud**: 중첩이 **메인→L1만**. 후임 지휘자를 Task로 띄우면 그 후임은 워커(L2)를 못 띄운다(2026-09-04 contentId `StepContext`). v2.4가 중첩 후임을 금지한 이유. 예전의 「후임 체인 = 장수」는 Cloud에서 **죽은 경로**다.

**연속 방안**: 후임 Task가 아니라 **같은 메인이 워커만 재기동**. 한 런에서 R를 3회 이상 돌려도 된다(실운: 팔경 contentId R11–R13). 정지는 큐 소진 · §3.3 E · 429 · 런/컨텍스트 **실제 고갈**뿐. 「1~2회」는 Desktop 컨트롤러 교체 권장이지 Cloud 하드캡이 아니다.

---

## 2. 언제 쓰는가

**적합**
- 같은 파일에 **append만** 하는 대량 SSOT (예: [`cityAttractionHubs.json`](../src/pages/Home/data/cityAttractionHubs.json))
- 배치가 많고 세션을 사람이 매번 새로 열기 부담일 때
- 초안 조사는 병렬 가능, 파일 반영은 충돌 나기 쉬울 때

**비적합**
- 단일 버그픽스·UI 한 화면
- 서로 다른 파일을 독립 PR로 나누는 일반 feature (기존 PR 흐름 유지)

---

## 3. 운영 루프

### 3.0 세대 루프 (필수 · 후임 지휘자 포함)

```
지휘자(메인) 장수 — 이관하지 않음
    ↓
다음 ⬜ R만 배치표 확정 (남은 R 전부 기동 금지)
    ↓
워커 N 기동 (기본 2 · Foreground · tip 미터치)
    ↓
워커: `tmp/orchestrator/Rxx-A.json` 기록 · 부모에는 요약 5줄만
    ↓
지휘자: 파일로 직렬 append (JSON 전문 Read 금지) → VERIFY(issues 줄) → §3.4 커밋·push · tmp 삭제
    ↓
메인 컨텍스트 여유 & ⬜ R 남음? → 워커 N 재기동 (같은 메인)
아니면 → §4.2 (Cloud=새 런 복구 제시어)
```

**같은 지휘자 연속 (하드캡 없음)**  
- **Cloud**: 같은 메인이 워커 N을 **큐가 빌 때까지** 재기동한다. **2회는 상한이 아니다.** 정지는 큐 소진 · §3.3 E · 429 · 런/컨텍스트 **실제 고갈**(대략 80%+)뿐. 워커는 파일+요약만(§3.6).  
- **Desktop**: 1~2회 후 컨트롤러가 다음 지휘자 L1을 띄운다(메인 컨텍스트 절약). 이 숫자를 Cloud에 적용하지 않는다.  
- **배치 1개 끝나자마자 이관 금지**(솔로 계주 방지).  
- 큐가 비거나 §3.3 E일 때만 **사람 보고 후 정지**.  
- 자동 오케 중 **매 R을 세션 종료(docs-on-main)로 취급하지 않음**. main 문서는 I주기·런 종료·§3.3 E·사람 채팅이 실제로 끝날 때.

### 3.4 Git · 커밋 · PR (검증 게이트 · v2.3)

전역 게이트(`.ai-context` **1.5.1**)와 동일: **요청 여부가 아니라 VERIFY(검증) PASS**가 커밋 조건이다.  
의도 — 스모크/테스트 없이 깨진 tip·로직을 커밋·푸시하던 사고를 막는 것. VERIFY PASS면 사용자 요청 없이 커밋해도 된다.

| 환경 | VERIFY PASS 후 | 시점 | 금지 |
|------|----------------|------|------|
| **공통(로컬·Cloud)** | **필수 커밋** — feature 브랜치 · **한글** 메시지 | **매 라운드 VERIFY PASS 직후(권장)** · 최소한 **이관(§4.2)·턴 종료·체인 종료·사람 보고 전(필수)** | VERIFY FAIL/미검증 tip 커밋 · 워커가 commit/PR · `main` 직접 push · force-push to main |
| **Cursor Cloud** | 위 + **push** → **PR 없으면 `gh pr create`**, 있으면 같은 PR에 push | 커밋 직후(턴/이관 전) | 동일 |
| **로컬/데스크톱** | 커밋 필수 · push/PR은 핸드오프·사람 요청·원격 공유 필요할 때 | 동일 | 동일 |

**절차 (지휘자만)**

1. VERIFY PASS 확인 (issues 0 + 스모크 PASS). FAIL이면 §3.3 — **커밋·PR·이관 금지**.  
2. 변경분: tip SSOT · 큐 ✅ · 일지 이관/라운드 줄(+ 필요 시 계획 md 1줄). Secrets·`.env`·키 **스테이징 금지**.  
3. feature 브랜치 확인 (`cursor/…` 등). `main`이면 **새 브랜치 생성 후** 작업·커밋.  
4. `git commit` (한글 제목).  
5. **Cloud**(또는 원격 공유 시): `git push -u origin HEAD` → PR 없으면 `gh pr create` · 있으면 **기존 PR에 push만**(체인 동안 PR 1개).  
6. 일지·이관 절에 **커밋 SHA · 브랜치 · (있으면) PR URL** 기록 후 §4.2 (Cloud는 연장 우선).

**「턴」정의**: 지휘자 1명의 세대 구간 — 워커 N 초안 → 직렬 머지 → VERIFY → §3.4 커밋(+ Cloud PR) → 연장 또는 이관/보고.  
워커 초안 완료만으로 커밋하지 않는다.

### 3.1 감사 게이트 (공통) · 무결성

합본(직렬 append) **직후마다**(라운드/턴 단위) 최소 확인:

- 키 중복 0 (`hubId` 등)
- 표기 normalize 충돌 0 (명소명 등)
- 필수 필드·enum·좌표
- 도메인 resolve/스모크 (해당 SSOT 런타임)

**명소 hub**: `npm run audit:city-attraction-hubs` (+ resolve 스모크 — 해당 R hub/exact + 회귀 `속초`/`파리`/`낙산사`/`에펠탑`).

**무결성 모델**: 매 라운드 VERIFY(audit issues **0** + 스모크 PASS)를 통과한 tip만 「정상 tip」이다.  
스모크를 돌린다는 것만으로 자동 보장되지 **않는다** — **issues > 0이거나 스모크 FAIL이면 §3.3으로 tip을 정상 상태로 되돌린 뒤** 다음 라운드로 간다. VERIFY 전에 이관·커밋·다음 R 착수 금지.

### 3.2 병렬 vs 직렬

| 단계 | 병렬? |
|------|-------|
| 워커 N 초안 | ✅ **필수** (기본 2 · §3.5) |
| 단일 tip SSOT append / 머지 | ❌ 지휘자 **직렬만** (A 반영 후 B …) |
| 감사 VERIFY | 지휘자, 라운드당 1회 이상 |
| LIVE API | ❌ 워커 병렬 금지 (메인 직렬 또는 워커 1) |

### 3.5 워커 수 N

**기본 N = 2** (큐 표 A/B · 직렬 머지 단순 · 실운 검증됨).

N을 늘려도 되는 조건 (모두):

1. 큐에 **열린 배치가 N개** 있음 (빈 워커 금지)  
2. 초안만 병렬 · tip append는 지휘자가 **A→B→C… 직렬**  
3. 해당 주제 **LIVE 병렬 금지**를 어기지 않음  
4. 플랫폼이 그 턴에 Task N개를 받음 (공식 캡 없음 · Cloud는 2–4부터)

토큰은 **워커 머리수가 아니라 각 워커가 실제로 읽기·쓰기한 양**에 가깝다. 10 hub를 워커 2×5로 나누나 워커 5×2로 나누나 초안 합은 비슷하고, 프롬프트 오버헤드만 N에 비례한다. 벽시계 처리량은 병렬만큼 올라간다. 같은 배치를 복제해 워커만 늘리면 토큰만 늘고 결과는 같다.

N>2로 올렸으면 일지에 `워커 N={n}` 1줄. 실패(기동 거부·StepContext)면 N=2로 되돌리고 한 번만 재시도.

### 3.6 메인 장수 · 얇은 반환 (최대한 길게)

**목표**: 메인은 디스패처로 남고, 조사 토큰은 워커 컨텍스트에서 소모. 지휘권 이양보다 **같은 메인이 R를 계속 소화**하는 쪽이 Cloud에서 더 길다.

| 하고 싶은 것 | 되는가 | 이유 |
|--------------|--------|------|
| 메인을 R 완료까지 유지 · 이관 안 함 | ✅ Cloud 기본 | v2.4 연장과 같음. 한도는 메인 컨텍스트·런 시간 |
| 다음 R마다 그 R에 맞는 워커 N 기동 | ✅ | R11이면 A3+B3=2. **지금 ⬜ R의 슬롯만** |
| 남은 R를 한 번에 다 띄움 | ❌ | 같은 tip을 N×R이 동시에 못 씀. 토큰 폭주 |
| 워커만 차고 메인은 안 참 | **조건부** | 워커가 JSON을 채팅에 반환하면 메인도 그만큼 참. **파일+5줄 요약**일 때만 메인이 얇음 |
| 끝난 워커가 커밋·push | ❌ (병렬) | `cityAttractionHubs.json` 등 **파일 1개**. 동시 commit → 충돌·VERIFY 우회 |
| 워커 1명만 띄워 그 워커가 커밋 | 가능하나 비권장 | 메인은 더 얇아질 수 있으나 처리량 1×. 기본은 워커 2 초안 + 지휘자 1회 커밋 |

**워커 반환 (고정)**

```
파일: tmp/orchestrator/R{nn}-{A|B}.json  (gitignore `tmp/` · 머지 후 삭제 · 커밋 금지)
채팅: R번호 · 슬롯 · 건수 · skip/EXISTS · 스모크 쿼리 3개 · 주의 1줄
금지: JSON 배열 본문을 부모 메시지에 붙이기
```

**지휘자 커밋**: 조각을 파일에서 직렬 append → `audit` 출력은 issues **0인지 한 줄**만 사용(로그 전문을 채팅에 상주시키지 않음) → §3.4. 워커 프롬프트에 commit/push를 넣지 않음.

**메인이 실제로 차는 것**(줄여도 남음): 워커 기동 프롬프트, 5줄 요약 누적, audit 한 줄, 커밋 SHA. 이게 ~50%면 그때만 새 Cloud 런(§4.2). 큐가 비거나 §3.3 E면 사람 보고.

### 3.3 문제 조치 (필수)

#### A. audit `issues > 0` 또는 스모크 FAIL

1. **다음 라운드·이관·commit 금지.**  
2. 원인 분류: (a) 방금 append한 hub/명소만 · (b) tip 전체에 영향.  
3. **조치 우선순위**  
   | 상황 | 조치 |
   |------|------|
   | 방금 R에서 넣은 hub/명소가 원인 | 해당 hub(또는 충돌 명소) **부분 제거**(append 롤백) → audit·스모크 재VERIFY |
   | A만 넣고 B 넣기 전 FAIL | **A분도 제거**해 R 시작 전 tip으로 복귀(기본). 원인 명확·A분 audit 단독 PASS면 A 유지+B만 재작업은 **예외**(일지 1줄) |
   | 원인 불명·제거 후에도 FAIL | tip을 **직전 VERIFY 성공 시점**으로 복귀(`git checkout -- <SSOT>` 등) · **사람에게 보고** 후 대기 |
4. 복구 후 audit **0**·스모크 PASS 확인. 큐 해당 R은 ✅가 아니라 **재시도/스킵** 표기(§3.3 D).

#### B. 워커A 성공 · 워커B 실패 (초안 단계)

| 단계 | 조치 |
|------|------|
| tip에 **아직 아무것도 append 전** | A 초안은 메인 버퍼에만 보관. B **1회 재시도**. 재실패 시 B 배정 5개를 예비로 1:1 대체해 워커 재기동 **또는** A5만 머지+VERIFY 후 R의 B5는 다음 턴(큐에 `B 잔여` 표기). |
| **A만 tip에 append된 상태**에서 B 초안 실패 | B 재시도 1회 → 실패 시 A분 VERIFY. PASS면 A 유지·B는 예비 대체/다음 턴. FAIL이면 §3.3 A로 A분 롤백. |
| **기본 원칙** | 「한쪽만 머지」는 **VERIFY PASS한 쪽만** 허용. FAIL 조각은 tip에 남기지 않음. |

#### C. 사용자 중단 직후 체크리스트

에이전트(또는 재개 세션)가 **즉시**:

1. `npm run audit:city-attraction-hubs` → issues **0**인가?  
2. tip 건수 = 일지/큐 기대와 맞는가? (부분 append 의심 시 마지막 hubId 확인)  
3. `_batch*` / `tmp/orchestrator/` / 미머지 초안 파일 잔여 삭제  
4. 큐: 진행 중 R이 ✅인지 ⬜인지 — **미VERIFY면 ⬜ 유지** · 부분 반영 hub는 제거 또는 완료로 정리  
5. 결과 요약 후: 정상 → 큐 다음 R · 비정상 → §3.3 A · 불명이면 **사람에게 물음**(§3.3 E)

#### D. 같은 hub 재작업 / 스킵

| 기준 | 조치 |
|------|------|
| tip에 `hubId` **이미 있음**(EXISTS) | **스킵** · 큐 예비로 1:1 대체 · 큐·일지 1줄 |
| 초안만 실패·tip 미반영 | **재시도 1회** → 실패 시 예비 대체 또는 스킵 |
| append 후 audit/스모크 FAIL로 제거함 | 같은 R에서 **예비로 교체 재시도 1회** · 또 실패하면 해당 hub **스킵**하고 R 잔여만 VERIFY |
| 시드·보호 대상 (`sokcho`/`paris` 등) | **재작업·덮어쓰기 금지** |
| 명소명 normalize 전역 충돌 | 접두/개명으로 1회 보정 → 불가 시 그 명소만 제외 또는 hub 스킵 |

#### E. 멈추고 사람에게 물을 때

다음이면 **추가 라운드 금지** · 일지 2~5줄 + 채팅으로 보고:

- tip 롤백 후에도 audit ≠ 0  
- 시드/대량 데이터 의심 손상  
- 큐·스키마·KIND(`shrine` 등) 규칙을 바꿔야 해결 가능할 때  
- `releaseNotes`·UI 변경이 필요할 때  
- 사용자 중단 직후 상태가 §3.3 C로도 판단 안 될 때  
- 동일 hub/유형 FAIL이 **2회 연속**

**사람에게 묻지 않고 진행 가능**: EXISTS 스킵·예비 1:1·명소 접두 보정·워커 1회 재시도·VERIFY PASS한 A-only 머지(B 잔여 표기) · **§3.4 커밋**(VERIFY PASS 후 · Cloud는 push·PR).

---

## 4. 컨텍스트 — 지휘권 이양

**Desktop 이관 트리거**: 대화가 대략 **절반**을 넘었거나 세대 1~2회 뒤 → 컨트롤러가 다음 지휘자 L1.  
**Cloud**: 이 숫자(50%·1~2회)를 이관·세션 종료 트리거로 **쓰지 않는다**. 같은 지휘자 연장. 런이 실제로 끝나기 직전에만 §4.1 복구 제시어.

### 4.1 일지 이관 절 (남길 것)

1. **tip 건수** · tip SHA/**커밋**(§3.4 후 **필수**) · **브랜치·PR URL**(Cloud·원격 시) · **워커 N**  
2. **다음 세대 배치표 N개**(워커별 hubId/listId) — 후임이 바로 워커를 띄울 수 있게  
3. **우선순위/제외** 3줄  
4. **금지 3** · 스키마 1줄  
5. **복구용 제시어** (§6) — Cloud 런 사망·새 채팅 복구용. **정상 연장의 트리거가 아님**

### 4.2 지휘권 이양 (플랫폼별)

1. VERIFY PASS · §3.4 커밋 완료(+ Cloud면 PR) · §4.1을 일지에 쓴 직후.

2. **Cloud**  
   - 큐가 남았으면 후임 Task **없이** 워커 N 재기동. **2회 후 정지 금지.**  
   - 런 종료/컨텍스트 실제 고갈 → 복구 제시어를 일지에 남긴다. **중첩 Task 후임 기동 금지**.  
   - 새 지휘자 = **새 Cloud 런**(같은 고정 feature 브랜치). `environment: cloud` 형제로 띄우면 브랜치가 갈라져 Preview·고정 브랜치 규칙과 충돌하므로 **쓰지 않음**.

3. **Desktop**  
   컨트롤러(사람 채팅)가 Task로 **후임 지휘자 1명(L1)** 기동. 후임이 워커 N(L2)을 띄운다.  
   현 지휘자(L1)는 후임을 직접 띄우지 않는다.

4. 후임 프롬프트 최소 골격:

```
역할: 후임 지휘자(오케스트레이터). §3.0 즉시 수행. 워커 N을 당신이 직접 기동.
읽기: plans/orchestrator-method.md §1·§1.3·§3.0·§3.3·§3.4·§3.5·§4 · 큐 다음 ⬜ · 일지 이관 절만.
배치표: (Rn A…) (Rn B…) …
브랜치/PR: (고정 feature + PR URL)
할 일: 워커 N(기본 2) Foreground → tip 직렬 A→B → VERIFY → §3.4 → 여유 있으면 워커 재기동.
금지: 사람 제시어 대기 · 솔로 계주 · tip 병렬 · 본인 런(기본) · Cloud 중첩 후임 · 워커 로그 전체 Read · tip JSON 전문 스캔 · main 직접 push · VERIFY FAIL tip 커밋.
```

5. 이전 워커 로그 전체 Read 금지 · tip JSON 전문 스캔 금지.  
6. **금지**: 워커를 `run_in_background`로 띄운 뒤 **초안 수신·머지·VERIFY 전에 턴을 종료**.  
7. **파이프 단절 복구**: tip 건수·`tmp/orchestrator/` 확인 뒤 같은 지휘자가 워커 N 루프 재개(사람 제시어 불필요). 중첩 후임을 더 넣지 않음.

---

## 5. 명소 SSOT 적용 (1호 사례)

| 항목 | 값 |
|------|-----|
| SSOT | `src/pages/Home/data/cityAttractionHubs.json` |
| resolver | `src/pages/Home/lib/cityAttractionHubs.js` |
| 워커당 배치 | **8~12 hub** (관례 10) · **라운드당 워커 2** → 보통 20 hub/라운드 |
| 규칙 | append only · `shrine` KIND 유지 · 시드 `sokcho`/`paris` 덮어쓰기 금지 · 명소명 전역 unique |
| audit | `npm run audit:city-attraction-hubs` |
| 상태(2026-07-23) | **630 hub / 4390 명소** · R48–R69 ✅ · **큐 소진** |

상세 배치 이력: [`2026-07-22-project-log.md`](./2026-07-22-project-log.md) · 방향: [`2026-07-23-project-log.md`](./2026-07-23-project-log.md).

### 5.1 사전 배치 큐 (필수 · 임의 지명 금지)

**SSOT 큐**: [`city-attraction-hub-queue.md`](./city-attraction-hub-queue.md)

| 규칙 | 값 |
|------|-----|
| 라운드 | **10 hub** = 워커A **5** + 워커B **5** |
| 지명 선택 | 큐 **순서만** (에이전트 임의 선택 금지) |
| EXISTS 시 | 큐 하단 **예비**에서 1:1 대체 후 큐·일지 1줄 |
| 한 세션 | 메인은 컨텍스트가 찰 때까지 **워커 재기동**(§3.6). 이관은 런 한계일 때만 |

| 우선 | 대상 |
|------|------|
| ✅ | 큐에 있는 **해외** hubId |
| ⬇ | DE/UK **중소도시** 연속 추가 |
| ❌ | 국내 **구·군 세분** · 큐 밖의 임의 지명 |

### 5.2 커버리지 요약

큐가 비기 전까지 §5.1만 따른다.

**워커 프롬프트 최소 골격**

```
역할: cityAttractionHubs 워커. 배정 hubId 목록만 초안 (1배치).
출력: `tmp/orchestrator/R{nn}-A.json`(또는 B) + 요약 5줄. JSON 본문은 부모 채팅에 붙이지 않음.
금지: tip append, commit/PR/push, JSON 전면 rewrite, shrine 제거, releaseNotes, UI 변경, 이관서 작성.
스키마: hubId,name,name_en,country,country_en,lat,lng,aliases[],attractions[{name,name_en,kind,lat,lng,mapboxId|null}]
kind: beach|market|temple|shrine|viewpoint|landmark|museum|neighborhood|park
좌표: Mapbox(또는 Nominatim) 지명 매칭 시 그 feature만 · hub 중심 추정 금지 · KR km 허용 금지 · §5.4
```

**오케스트레이터 체크 (라운드)**

1. 큐에서 다음 R의 워커A5·B5 확정 → 워커 2 병렬  
2. 조각 수신 → tip **직렬** append (A→B)  
3. `audit:city-attraction-hubs` + 스모크 = VERIFY · 큐 R ✅  
4. 여유 있으면 **큐 다음 R** 반복(상한 내) · 아니면 이관서에 **다음 R번호 2개**

### 5.3 Mapbox 정착지 SSOT (2호 사례)

| 항목 | 값 |
|------|-----|
| SSOT | `src/pages/Home/data/mapboxSettlementPlaces.json` |
| resolver | `src/pages/Home/lib/mapboxSettlementPlaces.js` |
| 큐 | [`mapbox-settlement-queue.md`](./mapbox-settlement-queue.md) · 계획 [`mapbox-settlement-plan.md`](./mapbox-settlement-plan.md) |
| 라운드 | **최대 10 hub** = 워커A **5** + 워커B **5** |
| 개수 | **목표 3 · 최대 5 · 최소 2** · &lt;2면 hub **스킵** (억지 금지) |
| 규칙 | hub당 **1행** · `place`\|`city`\|`locality` only · POI 금지 · 시드 `sokcho`/`paris` 덮어쓰기 금지 · 1차 `mapboxId` null OK |
| audit | `npm run audit:mapbox-settlement-places` |
| smoke | `npm run smoke:mapbox-settlement-places` (+ R exact) |
| 상태(Phase 0) | 시드 2 hub · R01–R63 ⬜ |

**워커 프롬프트 최소 골격**

```
역할: mapboxSettlementPlaces 워커. 배정 hubId만. hub당 1행.
출력: `tmp/orchestrator/` 조각 파일 + 요약 5줄. JSON 본문은 부모 채팅에 붙이지 않음.
금지: tip append, commit/PR/push, hubId 분할, POI/명소, hub 밖 지명, mapboxId 필수화, UI/releaseNotes.
개수: 목표3 · 최대5 · 최소2 · 미달 스킵
스키마: hubId, settlements[2..5] of {placeId,name,name_en,featureType,lat,lng,mapboxId|null,aliases}
featureType: place|city|locality
```

**오케스트레이터 체크 (라운드)** — §5.1과 동일 루프 · 게이트만 `audit:mapbox-settlement-places` + `smoke:mapbox-settlement-places`.

### 5.4 명소 좌표 수리 (Mapbox/Nominatim 스냅)

| 항목 | 값 |
|------|-----|
| SSOT | `cityAttractionHubs.json` **필드 패치**(append 아님) |
| 게이트 | `npm run audit:city-attraction-hubs` · `npm run audit:city-attraction-coords` · `npm run verify:city-attraction-coords` |
| 등급 | **NAMED** = 지명/POI 매칭 → feature 좌표 + `mapboxId`(있으면) · tip과 **>50m** = SNAP |
| | **AREA** = beach/park/neighborhood · KR soft 300m / hard 800m |
| | **NO_HIT** = drop · rename · 주소 수동 — **추정 유지 금지** |
| KR | km급 허용 오차 **금지** · hub 중심 추정 **금지** |
| 폴백 | Mapbox Search Box KR POI가 비면 **Nominatim** (캐시 `scripts/.cache/`) |
| P0 | `yanggu` · `chuncheon` · `hanam` · `jindo` (사람 재현) |

**워커 프롬프트 최소 골격 (좌표 수리)**

```
역할: cityAttractionHubs 좌표 수리 워커. 배정 hub의 SNAP/NO_HIT만.
출력: `tmp/orchestrator/` 패치 파일 + 요약 5줄.
금지: tip 직접 append, commit/PR/push, hub 중심 추정, 시드 덮어쓰기, UI/releaseNotes.
NAMED: Mapbox(또는 verify 큐 suggested) 좌표 그대로 · mapboxId 가능하면 필수.
KR: >50m면 반드시 snap. NO_HIT는 drop/rename만.
```

**오케스트레이터 체크**

1. `verify:city-attraction-coords -- --hubs=…` 또는 전수 큐  
2. 워커2 패치 조각 → tip **직렬** 필드 패치  
3. audit hubs + audit coords(--soft-only OK mid-repair) + smoke 재현 exact  
4. §4.2 이관

제시어: `오케스트레이터` + `명소좌표수리`

### 5.5 국내 명소 TourAPI 좌표 (KR mapy/mapx)

| 항목 | 값 |
|------|-----|
| SSOT | `cityAttractionHubs.json` **필드 패치** · **KR만** |
| 계획 | [`city-attraction-tourapi-coord-plan.md`](./city-attraction-tourapi-coord-plan.md) |
| 소스 | TourAPI `mapy`/`mapx` · Edge `tourapi-proxy` 또는 `TOUR_API_SERVICE_KEY` |
| 등급 | **HIT**만 snap · AMBIG/MISS/FAR 스킵·큐 |
| 분리 | `tourapi-content-id-overrides` = 갤러리 slug — **좌표 혼용 금지** |
| P0 | 김유정 `127933` 회귀 금지 · 양구·덕풍·진도타워 |
| G0 | 메인만 — 스크립트+스모크 |
| G1+ | 워커2 초안 → tip 직렬 · VERIFY · **§3.4 커밋**(Cloud는 push·PR) · §4.2 |

**권장 환경**: Cursor Cloud (Secrets + 장시간 LIVE). 매 세대 VERIFY PASS 후 §3.4.

제시어: `오케스트레이터` + `TourAPI-명소좌표` · 계획 §6 복붙 블록.

### 5.6 지자체 팔경·구경 → KR hub append (3호 확장)

| 항목 | 값 |
|------|-----|
| 계획 | [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md) |
| 큐 | [`korea-local-scenic-lists-queue.md`](./korea-local-scenic-lists-queue.md) |
| SSOT | `koreaLocalScenicLists.json` + `cityAttractionHubs.json` **멤버 append·aliases** |
| 단위 | **시·군·구**만 · 광역 팔경 1차 금지 |
| 라운드 | 워커A **3** + 워커B **3** = **6 리스트** |
| 정책 | 기존 명소 **유지** · 없는 멤버만 append · **UI·scenic 자동승격 금지** |
| 출처 | 지자체 공식 URL 필수 · 없으면 skip |
| audit | `audit:korea-local-scenic-lists` + `audit:city-attraction-hubs` |
| 파일럿 | P0 3건(홍천·양구·인제) → **I 무결성** → F · **3R마다 I** |
| 정지 | §3.3 + 플랜 §6.2 (FAIL 2회·출처 대량 부재·시드 손상) |
| **사람 QA** | **F 라운드 생략** · I# 일지 2~3줄 · PR merge 전 spot-check 선택 (플랜 §4.3·§6.0) |
| **자동 진행** | VERIFY PASS → **같은 지휘자가 다음 ⬜ R 워커 재기동** · 사람 제시어 대기 **금지** · Cloud 중첩 후임 금지 · 단절 방지 [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md) **§4.5** |

**워커 프롬프트 최소 골격**

```
역할: koreaLocalScenicLists 워커. 배정 listId/hubId만.
출력: `tmp/orchestrator/` 조각 파일 + sourceUrl + 요약 5줄. JSON 본문은 부모 채팅에 붙이지 않음.
금지: tip 직접 append, commit/PR/push, 기존 명소 삭제/교체, scenic 승격, UI, 광역 팔경, 출처 없는 verified.
좌표: 지명 매칭만 · hub 중심 추정 금지 · NO_HIT=pending_coord.
```

**오케스트레이터 체크** — §5.1과 동일 루프 · 게이트만 위 audit 쌍 + 검색 exact 스모크 · **F는 Preview QA 없음**.

제시어(최초·복구): `오케스트레이터` + `지자체팔경` · 큐 다음 ⬜ · 「§5.6 · 워커2 · VERIFY→다음R 자동 · 3R마다 I# · §3.3·§3.4·§4.2」

**수집 1차 종료** (2026-09-04). 새 채팅에서 `지자체팔경` F를 재개하지 않음. contentId·검색 UI는 **§5.7**.

### 5.7 팔경·명소 Tour contentId (쿼터)

| 항목 | 값 |
|------|-----|
| 계획 | [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) |
| 큐 | [`korea-local-scenic-contentid-queue.md`](./korea-local-scenic-contentid-queue.md) |
| SSOT | `koreaLocalScenicLists.json` 멤버 `contentId` + 동명 hub attraction 복사 |
| 우선 | **P0 팔경 멤버** · P1 hub 잔여 · P2 테마 잔여는 P0 전 금지 |
| 소스 | **DB 먼저** `tourapi_attraction` · 팔경 멤버는 **scenic 동일명 ID 복사(C01)** 우선 · LIVE 잔여는 `strategyQueries`(시군 접두·수식어 제거) · 유일·같은 시군만 `close --apply-unique` |
| 라운드 | 워커A **3 listId** + 워커B **3** · **DB-only R** 병렬 OK · P0 잔여는 **C01→S01→L07→A01→K**(큐) |
| LIVE | 메인 직렬(또는 워커 1) · **워커 병렬 LIVE 금지** · **본명-only 동일 cohort 재시도 금지** · `--limit=100` 로또 금지 |
| 429 | 즉시 정지 · 큐 `blocked: quota` · 같은 날 재시도 금지 |
| 정책 | scenic 승격 · UI · 수집 append **금지** · **AI 지식으로 contentId 숫자 기입 금지**(검색어 후보만) |
| S0 | 메인 솔로 — 스크립트+문경 DB 스모크 후 F |
| 브랜치 | `cursor/palgyeong-cid` · UI 브랜치와 동시 세션 OK · 수집 `cursor/palgyeong` 금지 |
| 정지 | §3.3 + 429 + 동일 멤버 FAIL 2회 + Secrets 없음(DB-only만) |

**워커 프롬프트 최소 골격**

```
역할: 팔경 contentId 워커. 배정 listId만.
DB-only R: 초안을 tmp/orchestrator/ 파일에 기록. 부모에는 요약 5줄만.
LIVE R: 메인만 · searchKeyword 금지(워커).
금지: tip append, commit/PR/push, JSON 본문을 부모에 붙임, UI, scenic 승격, 429 이후 추가 호출, P1/P2 월권.
```

제시어: `오케스트레이터` + `팔경contentId` · 큐 다음 ⬜ · 플랜 §9 복붙 블록. Cloud는 같은 메인 워커 재기동 · **2회 정지 금지**.

---

## 6. 제시어 (복붙 · 최초·복구용)

정상 세대 연속은 **같은 지휘자 연장**(워커 N 재기동)이 담당한다. Cloud 중첩 후임 체인은 쓰지 않는다. 아래는 사람이 넣는 경우만.

| 용도 | 문장 |
|------|------|
| 일반 시작 | `오케스트레이터` + `@plans/orchestrator-method.md` · 「메인 장수 · 워커 N(기본 2) · 파일+요약 · 워커 커밋 금지 · §3.6」 |
| 명소 재개/복구 | `오케스트레이터` + `명소` + `@plans/city-attraction-hub-queue.md` · 「큐 다음 R · 워커2 · §3.3·§3.4·§4.2」 |
| 명소 좌표 수리 | `오케스트레이터` + `명소좌표수리` · 「§5.4 · verify 큐 · P0 또는 전수 SNAP · §3.4」 |
| 국내 명소 TourAPI 좌표 | `오케스트레이터` + `TourAPI-명소좌표` + [`city-attraction-tourapi-coord-plan.md`](./city-attraction-tourapi-coord-plan.md) **§6** · Cloud · 「G0→G1+ · KR HIT만 · §3.4」 |
| 지자체 팔경·구경 | `오케스트레이터` + `지자체팔경` — **수집 종료. 재개 금지.** 활용은 아래 팔경contentId |
| 팔경 Tour contentId | `오케스트레이터` + `팔경contentId` + [`korea-local-scenic-contentid-queue.md`](./korea-local-scenic-contentid-queue.md) · 브랜치 **`cursor/palgyeong-cid`** · 「§5.7 · P0 잔여 **K04 other apply-unique** · 본명 keyword 로또 금지 · 워커 병렬 LIVE 금지 · 429 정지 · UI 금지 · AI가 ID 기입 금지 · §3.6」 |
| 정착지 재개/복구 | `오케스트레이터` + `맵박스정착지` + `@plans/mapbox-settlement-queue.md` · 「큐 다음 R · 워커2 · 목표3/최대5/최소2 · §3.3·§3.4·§4.2」 |
| 파이프 단절 복구 | `오케스트레이터` · 「같은 지휘자 워커 N 재기동 · Cloud 중첩 후임 넣지 말 것 · §3.4」 |

---

## 7. 문서 위치

| 문서 | 담는 것 |
|------|---------|
| **본 파일** | 방법론 SSOT (**공식 v2.4.1**) |
| [`.cursor/rules/gateo-orchestrator.mdc`](../.cursor/rules/gateo-orchestrator.mdc) | 세션 트리거·짧은 강제 규칙 |
| [`orchestrator-3tier-draft.md`](./orchestrator-3tier-draft.md) | 3단 검토안 · **v2.4가 Cloud는 플랫(지휘자=메인+워커 L1), Desktop은 컨트롤러+지휘자L1+워커L2 로 흡수** |
| [`.ai-context.md`](../.ai-context.md) | 스냅샷 1줄 + 링크 |
| [`AGENTS.md`](../AGENTS.md) | 클라우드·로컬 공통 한 줄 |
| 일지 | 라운드 VERIFY·건수·다음 배치표·복구 제시어만 |
