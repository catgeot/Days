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
- **디자인·소소한 UI**(카피·색·간격·배치·시인성 등): 조율 중 **커밋 보류** → **사람 QA 확정 후** 커밋
- 동일 게이트 통과 후 feature 브랜치 **push OK** · Cloud 오케스트레이터는 **§3.4**(PR까지)
- **금지**: 검증 생략 · FAIL tip/코드 커밋·푸시 · 미확정 디자인 수시 커밋 · `main` 직접 push

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

### 개발 서버 실행 (Ubuntu)

- `package.json`의 `dev`/`dev:http`는 **Windows cmd 전용**(`set BROWSER=chrome&&`)이라 Ubuntu에서 그대로 쓰면 env가 안 먹는다. VM에서는 vite를 직접 실행:
  - HTTP(권장, 자체서명 인증서 경고 회피): `DEV_SSL=0 npx vite --no-open --host 0.0.0.0 --port 5173`
  - HTTPS(기본, `basic-ssl`): `npx vite --no-open --host` — 브라우저가 self-signed 경고 표시.
- `vite.config.js`: `strictPort: true`(5173 점유 시 실패)·`open: true`(헤드리스에서는 `--no-open` 권장).
- 초기 홈 지구본은 `react-globe.gl`(three.js)라 **Mapbox 없이도 렌더**된다. Mapbox는 여행지 확대(place locator map)에서만 필요.

### Mapbox 토큰

- `VITE_MAPBOX_TOKEN`은 Secrets에 등록됨(place 확대 지도 QA 가능). 없으면 지구본 확대/place 지도가 `HomeGlobeMapbox.jsx`에서 fatal. **주의**: dev 서버는 기동 시 env를 읽으므로 Secret 추가 후에는 vite를 **재시작**해야 반영됨.
- `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`는 없으면 `src/shared/api/supabase.js`가 import 시 throw → 앱 자체가 안 뜸(현재 Secrets에 등록됨).

### 브랜치·병합

- 기본: `main`에서 feature 브랜치로 작업 후 PR 또는 사용자 승인 후 병합.
- **`main`에 직접 push하지 말 것** — 데스크톱에서 검토·병합이 기본.
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

작업이 배포·QA로 끝나면 일지에 **남은 일**(재배포·LIVE·main 병합)을 명시한다. 데스크톱 세션이 이어서 완료한다.
