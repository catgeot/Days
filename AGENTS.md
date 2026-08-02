# gateo.kr — Agent instructions

로컬·클라우드 에이전트 공통. 세부 SSOT는 [`.ai-context.md`](.ai-context.md).

## 시작 전 (필수)

1. [`.cursor/rules/gateo-project-context.mdc`](.cursor/rules/gateo-project-context.mdc) 규칙을 따른다.
2. 루트 [`.ai-context.md`](.ai-context.md)를 **Read**한다 (사용자가 `@`로 안 붙여도).
3. 작업 주제면 최신 일지(`plans/YYYY-MM-DD-project-log.md`)와 해당 운영 가이드만 추가로 읽는다.
4. **`오케스트레이터`** 제시어(다배치 SSOT) → [`plans/orchestrator-method.md`](plans/orchestrator-method.md) **v2.3**(VERIFY PASS 후 §3.4 커밋 · Cloud는 push·PR · 후임 Task 이양) · Rule [`gateo-orchestrator.mdc`](.cursor/rules/gateo-orchestrator.mdc).

## 금지 (요약)

- `travelSpots.js` 전체 스캔 → `travelSpots-list.json`
- `travelSpotAirports.json` / `travelSpotFerries.json` spots 직접 수정 → overrides → `generate:*`
- 브라우저에 MRT/`VITE_` 비밀키 노출
- **검증 없이** git commit/push · FAIL·미확인 상태로 커밋 · `main` 강제 push
- 사용자 승인 없는 「완료」 단정 · **UI 임의 변경** (기능 작업 중 기존 버튼·레이아웃·톤 교체 포함 · `.ai-context` **§4.1 5**)
- 릴리스 노트 잦은 제안 — **새 기능·중대 업데이트만** (`.ai-context` **1.7**)
- 복붙 Core Rules 부활 금지(구조 제안→승인→전체 코드) · 주석 **희소**(`.ai-context` **4.0**/**4.2**) · 사람에게는 동작·QA
- **오류 루프**: 동일 FAIL **2회** 후 추측 패치 중단·보고 · 요청 밖 확장 금지 (`.ai-context` **4.1**)

## 커밋·푸시 (검증 게이트)

의도(둘): (1) 스모크 없이 깨진 로직 커밋·푸시 방지 · (2) **로컬**에서 색·폰트 등 UI 미세 조율마다 커밋이 쌓이는 것 방지.  
**요청 여부가 아니라 검증·이상 없음**이 게이트다 (`.ai-context` **1.5.1**). 「요청 시에만 commit」보다 **게이트 우선**(로직·SSOT).

- 관련 audit/스모크/테스트 **PASS** · 알려진 깨짐 없음 → **커밋 OK**(한글 메시지 · 사용자 요청 불필요) — **로직·SSOT·버그픽스** (**기존 비주얼 유지**한 채 연결·동작만)
- **디자인·소소한 UI · 로컬**: 사람 조율 승인 후 working tree에서 이어감 · 조율 중 **커밋 보류** → 사람 QA 확정 후 **1회(또는 소수)** 커밋. 「커밋 보류」≠ 리디자인 허가 (`.ai-context` **§4.1 5** / **1.5.1**)
- **디자인·소소한 UI · Cloud feature**: 아래 Cloud 절 — Preview 로드를 위해 **매 턴 커밋·push**(로컬 커밋 보류를 적용하지 않음)
- **브랜치**: 짧은 수정은 **`main` 직행** · 대형/장기/충돌 위험·Cloud UI는 feature(+PR). 상세 `.ai-context` **1.5.2**
- Cloud 오케스트레이터는 **§3.4**(커밋·push·PR)
- **금지**: 검증 생략 · FAIL tip/코드 커밋·푸시 · **로컬** 미확정 UI 수시 커밋 · UI 임의 변경 · 사람 승인 없는 `main` 원격 push · force-push to main


## 검증 커맨드 (자주 씀)

```bash
npm install
node scripts/smoke-mrt-stay-queries.mjs
# LIVE Edge (Secrets에 anon 있을 때)
MRT_STAY_SMOKE_LIVE=1 node scripts/smoke-mrt-stay-queries.mjs
npm run audit:airports   # 공항 SSOT 작업 시
npm run audit:city-attraction-hubs   # 도시 명소 hub SSOT (오케스트레이터 게이트)
npm run audit:mapbox-settlement-places  # 정착지 SSOT (맵박스정착지 오케스트레이터)
npm run smoke:mapbox-settlement-places
npm run smoke:place-label-slug   # 지구본 라벨 slug/name_en · 무니 역사 L2 오탐
```

## Cursor Cloud specific instructions

클라우드 VM은 Ubuntu. Windows PowerShell 전용 구문·로컬 `.env.local` 가정 금지.

운영 가이드(상세): [`plans/cloud-preview-continuity.md`](plans/cloud-preview-continuity.md)

### 세션 표기 · 고정 Preview · 작업 로그 (전 주제)

같은 주제를 여러 Cloud 세션에 나눠 할 때, **사람이 한눈에 추적**할 수 있어야 한다. (예: 축제 페이지)

| | 규칙 |
|--|------|
| **세션·채팅 표기** | 형식 **`{주제} #{N}, {단계}`** — 예: `축제 페이지 #1, mvp 제작`. 주제는 고정 · `#N`은 세션 순번 · 단계는 이번 목표. **첫 응답·턴 종료·일지·PR 제목**에 동일 표기. Cursor UI 채팅명을 못 바꾸면 본문에 반복하고, 런칭 시 사람도 같은 형식을 쓴다. |
| **고정 브랜치** | 주제당 feature **한 번** 생성 → main 병합까지 **재사용**. 세션마다 새 `cursor/…-xxxx`·새 PR **금지**. **새 주제 브랜치명는 짧게** (`cursor/puzzle`, `cursor/korea`) — 길면 git Preview 호스트가 더 길어짐. Mapbox에 이미 등록된 고정 브랜치는 **이름 변경 금지**(사람이 도메인·토큰 이관할 때만). |
| **동일 Preview URL** | 기술 QA·Mapbox = **git Preview URL** (`…-git-<branch-slug>-….vercel.app`). 배포 해시 URL **금지**. |
| **짧은 공유 링크 (테스터)** | 사람에게는 **`https://www.gateo.kr/qa/<slug>`** 를 우선 안내 (예: `/qa/puzzle` → 퍼즐 Preview). SSOT [`cloudQaShareLinks.js`](src/shared/cloudPreview/cloudQaShareLinks.js) + [`vercel.json`](vercel.json) `redirects` 동기화. 목록 페이지 `/qa`. 주제 종료 시 항목 `active: false` 또는 destination을 PROD path로 변경. |
| **Preview 작업 로그** | Preview/로컬 화면 **우측** 「작업 로그」패널. 세션마다 로그 append · `qaShareSlug` 있으면 공유 링크 표시. PROD에는 안 보임. |
| **턴 종료 링크** | 요약에 **세션 표기 + 짧은 `/qa/…` 링크(있으면) + git Preview URL + 이번 적용 1줄** 필수. Preview 링크 없이 「로컬만」으로 세션 종료 **금지**. |

### Feature 브랜치 · Vercel Preview (사람 QA 경로)

사람이 Cloud 작업을 **확인하는 기본 경로**는 로컬 미리보기가 아니라 **해당 feature 브랜치의 Vercel Preview**(예: 축제 브랜치 git Preview → `/korea`)다.  
**push가 없으면 Preview가 갱신되지 않아 테스트 페이지를 로드할 수 없다** → Cloud feature에서는 로컬의 「UI 커밋 보류」를 **적용하지 않음**.

| | 규칙 |
|--|------|
| **매 턴** | 작업분 반영 후 **최소 검증**(아래) PASS · 오류 없음 → **한글 커밋 + `git push`**(사람 「커밋해」 대기 금지) → 위 **턴 종료 링크**. 턴을 커밋 없이 끝내지 않음 |
| **디자인·UI 조율** | 색·폰트·배치 조율이라도 **매 턴 커밋·push**. Preview에 올라가야 사람이 본다 |
| **PR** | feature면 **PR 없으면 `gh pr create`** · 있으면 같은 PR에 push(오케 §3.4와 동일 · 비오케 Cloud UI도) |
| **「완료」** | push ≠ PROD 완료. 사람 Preview QA OK 전 **완료 단정·main 병합 금지** |
| **시작 브랜치** | 제시어/PR·열린 feature·일지의 고정 브랜치가 있으면 **그 브랜치로 checkout**. UI·Preview 필요한데 open feature 없고 `main`만 떠 있으면 **짧은 feature 생성 후** 작업(아래 고정 브랜치) |

**최소 검증 (Cloud · push 전)**: 해당 도메인 audit/smoke가 있으면 그것 · 없으면 `npm run build`(또는 Vite 빌드 오류 없음) 1회. FAIL이면 push 금지.

**금지**: 오류/FAIL 상태로 push · force-push to main · 사람 승인 없이 `main` 원격 push · 커밋·push 없이 「로컬에서만 보고 끝」으로 Cloud UI 턴/세션 종료 · 세션마다 새 Preview 호스트 부여

### 고정 브랜치 · Mapbox Preview URL (전 주제)

Vercel은 **배포 해시 URL**(푸시마다 변경)과 **브랜치 git Preview URL**(브랜치명이 같으면 유지)이 있다. Mapbox 토큰 URL 제한은 **wildcard 불가**·PC에서만 등록하기 쉬우므로, **세션마다 새 `cursor/…-xxxx` 브랜치를 만들면 Preview 호스트가 바뀌어 QA가 막힌다.** 퍼즐·축제·기타 **모든 Cloud feature**에 동일.

| | 규칙 |
|--|------|
| **이어하기** | 같은 주제·열린 PR·일지/제시어에 브랜치가 있으면 **무조건 그 브랜치 checkout → 커밋 → 같은 브랜치에 push**. 새 랜덤 브랜치·새 PR **금지** |
| **새 주제만** | 기존 open feature가 없을 때만 **짧은** `cursor/<주제>` (또는 플랫폼 접미사 포함 최소형) **한 번** 생성. 이후 세션은 그 이름을 **고정**으로 재사용 |
| **Mapbox 등록 (1회)** | `https://<project>-git-<branch-slug>-<team>.vercel.app` 형태만. 예: `days-git-cursor-geography-puzzle-plan-62e0-catgeots-projects.vercel.app` |
| **등록 금지** | `https://days-<hash>-catgeots-projects.vercel.app` (배포마다 변경) |
| **테스터 공유** | 긴 git URL 대신 **`www.gateo.kr/qa/<slug>`**. (선택·사람) Vercel에서 `puzzle.gateo.kr` 같은 **브랜치 커스텀 도메인**을 붙이면 더 짧아짐 — Mapbox에도 그 호스트 1회 등록 |
| **핸드오프** | 일지에 **세션 표기 + 고정 브랜치 + `/qa/…` + git Preview URL + QA 경로**를 남김 |

플랫폼이 세션용 브랜치 접미사를 제안해도, **이어하기·Mapbox QA 중이면 기존 고정 브랜치가 우선**이다. 실수로 새 브랜치를 만들었으면 tip을 고정 브랜치에 fast-forward/push 하고 Mapbox·사람은 고정 URL만 안내.

### Cloud에서 브랜치 선택

| 작업 종류 | 브랜치 · push |
|-----------|----------------|
| 짧은 SSOT·버그픽스·문서 | **`main` 커밋 OK** · `main` **원격 push는 사람 요청 시만** |
| UI 조율 · Preview QA · 대형/장기 · Cloud 오케 tip | **feature** · **매 턴 커밋·push** · PR(없으면 생성) |

### 브랜치·병합

- **기본(로컬)**: 버그픽스·SSOT·소소한 UI는 **`main`에서 작업·커밋**. 사람 요청 시 `main` push OK (`.ai-context` **1.5.2**).
- **브랜치·PR**: 새 페이지·대형 기능·장시간·충돌 위험·Cloud 오케·Cloud UI Preview·사람이 명시한 경우. **열린 feature가 있으면 그 브랜치를 재사용**(위 고정 브랜치).
- **금지**: force-push to main · 사람 승인 없이 에이전트가 임의로 `main` push · **같은 주제로 세션마다 새 Preview 브랜치 남발**. feature는 Preview → 사람 QA → 병합.

- Edge(`supabase functions deploy …`)는 코드 수정과 별개. Secrets·로그인 없으면 **배포는 보류**하고 일지/핸드오프에 명령만 남긴다.

### 오케스트레이터 · 커밋·PR

다배치 SSOT 오케스트레이터([`orchestrator-method.md`](plans/orchestrator-method.md) **§3.4**):

1. 워커2 → tip 직렬 머지 → VERIFY PASS  
2. **커밋**(한글) — 로컬·Cloud 공통 · 턴/이관 전  
3. **Cloud**: push → PR 생성(없으면) 또는 기존 PR에 push · 일지에 SHA·PR URL  
4. 후임 Task 이관  

VERIFY FAIL tip은 커밋하지 않는다. 워커는 commit/PR 금지.

### Secrets (대시보드에 등록 권장)

| 이름 | 용도 |
|------|------|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Edge LIVE 스모크·클라 빌드 |
| Supabase access token (CLI) | `npx supabase functions deploy` (필요 시만) |

`.env`를 스냅샷에 구워 넣지 말 것 — **Secrets** 탭 사용.

### 핸드오프

작업이 Preview·QA로 끝나면 일지에 **세션 표기 · 브랜치 · SHA · PR · `/qa/…` 공유 링크 · git Preview URL · QA path** · **작업 로그 제목** · **남은 일**을 명시한다.
