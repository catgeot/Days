# Cloud 이어하기 · Preview 연속성

**SSOT 요약**: [`AGENTS.md`](../AGENTS.md) Cloud 절. 사람 QA 경로 = **고정 feature 브랜치의 Vercel git Preview URL**.

## 왜

세션마다 새 브랜치·새 Preview 호스트·임의 채팅명이 생기면, 사람이 「지금 무슨 작업인지 · 어디까지인지 · 어디를 열어 볼지」를 추적할 수 없다. (국내축제 Cloud 중단 원인의 일부.)

## 규칙 (에이전트)

### 1. 세션·채팅 표기

형식: **`{주제} #{N}, {단계}`**  
예: `축제 페이지 #1, mvp 제작` · `축제 페이지 #2, 상세 시트` · `테마여행 #2, 셸 라우트`

| | |
|--|--|
| **주제** | 프로젝트 전체에서 고정 (예: 축제 페이지 · 테마여행) |
| **#N** | 같은 주제의 Cloud 세션 순번 (일지·SSOT에서 +1) |
| **단계** | 이번 세션 목표 — **짧고 복붙 가능**(쉼표 뒤 · 공백 허용 · 불필요한 `S1`/`mvp` 접두 남발 지양) |

에이전트는 **첫 응답·턴 종료·일지 핸드오프·PR 제목**에 이 표기를 쓴다. Cursor UI 채팅명을 바꿀 수 없으면, 사람이 런칭 시 같은 형식으로 두고 에이전트는 본문에 반복한다.

### 1.1 채팅명 자동 반영 · 제시어 제안 (필수)

Cloud/Cursor에서 **새 채팅을 만들 때** 사람이 제목·첫 프롬프트에 붙여넣으면 채팅명이 맞게 잡히도록, 에이전트는 아래를 **항상** 지킨다.

| | 규칙 |
|--|------|
| **한 줄 = 채팅명** | 제안 채팅명은 **코드펜스 안에 그 한 줄만** 둔다. 앞뒤 설명·불릿·굵게·따옴표를 같은 펜스에 넣지 않는다. |
| **첫 메시지 1행** | 세션 **제시어(첫 메시지) 블록의 맨 윗줄** = 채팅명과 **문자 단위로 동일**. 그다음 `@플랜`·범위·금지. |
| **플랜에 복붙표** | 다세션 Cloud 주제 플랜에는 **채팅명 복붙표**( `#N` · 채팅명 한 줄 · 상태)를 둔다. 예: [`korea-theme-travel-plan.md`](./korea-theme-travel-plan.md) 상단. |
| **턴/세션 종료** | 핸드오프에 **다음 채팅명**을 코드펜스 한 줄로 제안한다. (아래 §4·§5) |
| **순번** | 같은 주제에서 세션마다 `#1`로 리셋 **금지**. 일지·플랜표의 다음 `#N`을 쓴다. |
| **금지** | `국내축제-S2-UI` 같은 옛 슬러그만 채팅명으로 제안 · 채팅명과 제시어 1행이 서로 다름 · 긴 문단을 채팅명으로 제안 |

**채팅명만 제안할 때 (복붙용)**

````markdown
다음 채팅명:

```
테마여행 #2, 셸 라우트
```
````

**새 세션 제시어 블록 (채팅명 = 1행)**

````markdown
```
테마여행 #2, 셸 라우트
@plans/korea-theme-travel-plan.md S1만
브랜치 cursor/korea-theme. …
```
````

사람은 (1) 위 한 줄을 **채팅 제목**에 붙이거나 (2) Cloud 런칭 프롬프트/첫 메시지로 붙여 채팅명이 반영되게 한다.

### 2. 고정 브랜치 · 동일 Preview URL

- 주제당 feature 브랜치 **한 번** 생성 → 완료( main 병합)까지 **재사용**.
- **새 브랜치명은 짧게** (`cursor/puzzle`, `cursor/korea`). 길면 Preview 호스트가 읽기 어려워짐.
- 기술 URL(Mapbox·디버그)은 **git Preview URL** (`…-git-<branch-slug>-….vercel.app`). 배포 해시 URL 금지.
- 세션마다 `cursor/…-xxxx` 신규 생성 **금지**.

### 2.1 짧은 공유 링크 (테스터·게임 QA)

Vercel git URL은 길어서 테스트 인원에게 부적합하다. **사람에게는 짧은 링크를 준다.**

| | |
|--|--|
| **형식** | `https://www.gateo.kr/qa/<slug>` |
| **예** | `https://www.gateo.kr/qa/puzzle` → 퍼즐 Preview `/play/geo` |
| **목록** | `https://www.gateo.kr/qa` |
| **SSOT** | [`cloudQaShareLinks.js`](../src/shared/cloudPreview/cloudQaShareLinks.js) + [`vercel.json`](../vercel.json) `redirects` **둘 다** 갱신 |
| **선택 (사람)** | Vercel에 `puzzle.gateo.kr` 등 **브랜치 도메인** 연결 + Mapbox URL 허용 1회 — 더 짧고 직관적 |

주제 끝나면: slug `active: false` 또는 destination을 PROD 경로(`https://www.gateo.kr/play/geo`)로 바꾼다.

### 3. Preview 우측 「작업 로그」

| 파일 | 역할 |
|------|------|
| [`cloudPreviewWorkLog.js`](../src/shared/cloudPreview/cloudPreviewWorkLog.js) | 프로젝트 메타 + 로그 항목 SSOT |
| [`CloudPreviewWorkLog.jsx`](../src/shared/cloudPreview/CloudPreviewWorkLog.jsx) | Preview/로컬만 표시되는 우측 패널 |

세션에서 Preview에 올릴 변경이 있으면:

1. `cloudPreviewProject`의 `sessionNo` / `sessionPhase` / `previewPath` 갱신
2. `cloudPreviewWorkLog` **맨 앞**에 `{ id, session, title, detail, at }` append
3. 커밋·push 후 사람 QA

PROD(`gateo.kr`)에는 표시되지 않는다. 주제 종료·main 병합 시 `active: false` (또는 로그 비움).

### 4. 턴 종료 필수

요약 맨 위 또는 QA 블록에:

```
세션: 퍼즐 게임 #3, 접경 틈
공유: https://www.gateo.kr/qa/puzzle
Preview: https://…-git-…vercel.app/play/geo
이번 적용: (작업 로그 제목 1줄)
```

짧은 `/qa/…`가 있으면 **공유 링크를 먼저**. 둘 다 없이 「로컬에서만 확인」으로 끝내지 않는다.

이 주제의 **다음 Cloud 세션**이 있으면, 같은 요약에 **다음 채팅명**을 §1.1 형식(코드펜스 한 줄)으로 붙인다.

### 5. 세션 종료 · 다음 채팅명 핸드오프

일지·채팅 말미에 최소 포함:

1. **다음 채팅명** — §1.1처럼 코드펜스 **한 줄만** (사람이 새 채팅 제목/런칭에 복붙)
2. **다음 제시어** — 그 채팅명을 1행으로 하는 제시어 블록(또는 플랜 해당 절 링크)
3. 고정 브랜치 · `/qa/…` · git Preview · 남은 일

플랜에 복붙표가 있으면 표의 다음 `#N`과 **일치**시킨다. 표가 없으면 일지 최신 `#N`+1과 단계 한 줄로 새로 제안하고 일지·플랜에 기록한다.
