# gateo.kr — Agent instructions

로컬·클라우드 에이전트 공통. 세부 SSOT는 [`.ai-context.md`](.ai-context.md).

## 시작 전 (필수)

1. [`.cursor/rules/gateo-project-context.mdc`](.cursor/rules/gateo-project-context.mdc) 규칙을 따른다.
2. 루트 [`.ai-context.md`](.ai-context.md)를 **Read**한다 (사용자가 `@`로 안 붙여도).
3. 작업 주제면 최신 일지(`plans/YYYY-MM-DD-project-log.md`)와 해당 운영 가이드만 추가로 읽는다.

## 금지 (요약)

- `travelSpots.js` 전체 스캔 → `travelSpots-list.json`
- `travelSpotAirports.json` / `travelSpotFerries.json` spots 직접 수정 → overrides → `generate:*`
- 브라우저에 MRT/`VITE_` 비밀키 노출
- 사용자 요청 없는 git commit · `main` 강제 push
- 사용자 승인 없는 「완료」 단정 · UI 임의 대규모 변경

## 검증 커맨드 (자주 씀)

```bash
npm install
node scripts/smoke-mrt-stay-queries.mjs
# LIVE Edge (Secrets에 anon 있을 때)
MRT_STAY_SMOKE_LIVE=1 node scripts/smoke-mrt-stay-queries.mjs
npm run audit:airports   # 공항 SSOT 작업 시
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

- `VITE_MAPBOX_TOKEN`은 현재 Secrets에 없음. 없으면 지구본 확대/place 지도가 `HomeGlobeMapbox.jsx`에서 fatal. 지도 확대 QA가 필요하면 Secrets에 추가해야 함.
- `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY`는 없으면 `src/shared/api/supabase.js`가 import 시 throw → 앱 자체가 안 뜸(현재 Secrets에 등록됨).

### 브랜치·병합

- 기본: `main`에서 feature 브랜치로 작업 후 PR 또는 사용자 승인 후 병합.
- **`main`에 직접 push하지 말 것** — 데스크톱에서 검토·병합이 기본.
- Edge(`supabase functions deploy …`)는 코드 수정과 별개. Secrets·로그인 없으면 **배포는 보류**하고 일지/핸드오프에 명령만 남긴다.

### Secrets (대시보드에 등록 권장)

| 이름 | 용도 |
|------|------|
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Edge LIVE 스모크·클라 빌드 |
| Supabase access token (CLI) | `npx supabase functions deploy` (필요 시만) |

`.env`를 스냅샷에 구워 넣지 말 것 — **Secrets** 탭 사용.

### 핸드오프

작업이 배포·QA로 끝나면 일지에 **남은 일**(재배포·LIVE·main 병합)을 명시한다. 데스크톱 세션이 이어서 완료한다.
