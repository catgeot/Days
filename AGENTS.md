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
- 사용자 승인 없는 「완료」 단정 · UI 임의 대규모 변경
- 릴리스 노트 잦은 제안 — **새 기능·중대 업데이트만** (`.ai-context` **1.7**)
- 복붙 Core Rules 부활 금지(구조 제안→승인→전체 코드) · 주석 **희소**(`.ai-context` **4.0**/**4.2**) · 사람에게는 동작·QA
- **오류 루프**: 동일 FAIL **2회** 후 추측 패치 중단·보고 · 요청 밖 확장 금지 (`.ai-context` **4.1**)

## 커밋·푸시 (검증 게이트)

의도: 스모크/테스트 없이 깨진 로직을 커밋·푸시하던 것을 막기 위함.  
**요청 여부가 아니라 검증·이상 없음**이 게이트다 (`.ai-context` **1.5.1**). 「요청 시에만 commit」보다 **게이트 우선**(로직·SSOT).

- 관련 audit/스모크/테스트 **PASS** · 알려진 깨짐 없음 → **커밋 OK**(한글 메시지 · 사용자 요청 불필요) — **로직·SSOT·버그픽스**
- **디자인·소소한 UI**: 로컬 조율은 커밋 보류 가능 · **Cloud feature 브랜치**는 아래 Cloud 절(Vercel Preview) 우선
- 동일 게이트 통과 후 feature 브랜치 **push OK** · Cloud 오케스트레이터는 **§3.4**(PR까지)
- **금지**: 검증 생략 · FAIL tip/코드 커밋·푸시 · 사람 승인 없는 `main` 직접 push · force-push to main

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
```

## Cursor Cloud specific instructions

클라우드 VM은 Ubuntu. Windows PowerShell 전용 구문·로컬 `.env.local` 가정 금지.

### Feature 브랜치 · Vercel Preview (사람 QA 경로)

사람이 Cloud 작업을 **확인하는 기본 경로**는 로컬 미리보기가 아니라 **해당 feature 브랜치의 Vercel Preview**(예: 축제 브랜치 배포 URL → `/korea`)다.

| | 규칙 |
|--|------|
| **세션 종료** | 관련 검증·빌드 오류 **없음** → **한글 커밋 + `git push`** (사람 「커밋해」 대기 금지) |
| **디자인·UI 조율** | Cloud feature 브랜치에서는 **커밋 보류하지 않음**. Preview에 올라가야 사람이 본다. |
| **「완료」** | push ≠ PROD 완료. 사람 Preview QA OK 전 **완료 단정·main 병합 금지** |
| **시작 브랜치** | 제시어/PR에 브랜치가 있으면 **그 브랜치로 checkout** 후 작업. `main`만 떠 있으면 fetch 후 feature로 이동 |

**금지**: 오류/FAIL 상태로 push · force-push to main · 사람 승인 없이 `main` 원격 push · Preview 없이 「로컬에서만 보고 끝」으로 Cloud UI 세션 종료

### 브랜치·병합

- 짧은 수정은 `main` 직행 가능(`.ai-context` **1.5.2**). 대형·장기·Cloud UI 조율·사람이 명시한 경우 **feature + PR**.
- **`main`에 에이전트가 임의 push하지 말 것** — feature push → Vercel Preview → 사람 QA → 병합.
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

작업이 Preview·QA로 끝나면 일지에 **브랜치·SHA·PR·Vercel에서 볼 경로**(예: `/korea`)·**남은 일**을 명시한다.
