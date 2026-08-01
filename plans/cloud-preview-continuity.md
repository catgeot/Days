# Cloud 이어하기 · Preview 연속성

**SSOT 요약**: [`AGENTS.md`](../AGENTS.md) Cloud 절. 사람 QA 경로 = **고정 feature 브랜치의 Vercel git Preview URL**.

## 왜

세션마다 새 브랜치·새 Preview 호스트·임의 채팅명이 생기면, 사람이 「지금 무슨 작업인지 · 어디까지인지 · 어디를 열어 볼지」를 추적할 수 없다. (국내축제 Cloud 중단 원인의 일부.)

## 규칙 (에이전트)

### 1. 세션·채팅 표기

형식: **`{주제} #{N}, {단계}`**  
예: `축제 페이지 #1, mvp 제작` · `축제 페이지 #2, 상세 시트`

| | |
|--|--|
| **주제** | 프로젝트 전체에서 고정 (예: 축제 페이지) |
| **#N** | 같은 주제의 Cloud 세션 순번 (일지·SSOT에서 +1) |
| **단계** | 이번 세션 목표 한 줄 |

에이전트는 **첫 응답·턴 종료·일지 핸드오프·PR 제목**에 이 표기를 쓴다. Cursor UI 채팅명을 바꿀 수 없으면, 사람이 런칭 시 같은 형식으로 두고 에이전트는 본문에 반복한다.

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
