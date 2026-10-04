# gemini-proxy 남용 방지 계획 (G1) — 계획만, 적용하지 않음

- 작성: 2026-10-03 21:5x KST, Gateo 사이트 관리 (executor). **이 문서를 쓰는 동안 prod 쓰기 0건, gemini-proxy 호출 0건.** prod에는 Management API GET, analytics 로그 조회, `read_only: true` SELECT 1건(이름 충돌 확인)만 보냈다.
- 근거: `qa/app/in-app-map-mooni-review-2026-10-03.md` C안, 배포본 `deployed/v14/`, repo `catgeot/Days` origin/main `ca6e6b11`, 로그 `logs/SUMMARY.md`
- 묶음: **10/5 번들, A6 범위**(Cos 전달: 이미 승인된 A6에 포함). 단, §3의 ⚠ 두 줄(신규 DB 객체, 시크릿 설정)은 실행 전에 Cos/대표에게 한 줄 확인을 권한다(RUNBOOK §1의 3v와 같은 처리).
- 형식: `gallery-remove-2026-10-03/deep-plan/youtube-D1-D4.md`(문제 → 변경안 → PASS)와 `RUNBOOK.md`(게이트·스모크·롤백)를 따른다.

## 0. 확인한 사실 (읽기 전용)
| 항목 | 결과 | 근거 |
|---|---|---|
| 배포본 verify_jwt | **false** (v14, ACTIVE). repo `config.toml:411-417`은 `verify_jwt = true`라서 repo와 배포가 다르다. 15개 함수 모두 false. | `api/gemini-proxy.json`, `api/functions.json` |
| 배포본 소스 | `index.ts` `f3d811a18c86`, `deno.json` `776494746017`, `_shared/geminiModels.ts` `1947872d447e` — origin/main과 **바이트 단위 동일**. API `ezbr_sha256` `4803d7555ce7` | `deployed/v14/` |
| 모델 | 클라이언트가 `modelId`를 보낸다. 허용 목록 3개(`gemini-3.1-flash-lite`, `gemini-3.5-flash`, `gemini-3.1-pro-preview`) + 별칭. **가장 비싼 pro-preview도 anon으로 선택 가능.** 503/404면 flash-lite로 1회 재시도. | `index.ts:20-31,50-66`, `geminiModels.ts` |
| 프롬프트 | 클라이언트가 만든 `parts` 배열을 **검사 없이 그대로** `contents[0].parts`로 넘긴다. 개수·길이·`inlineData`(이미지 등) 제한 없음. 시스템 프롬프트도 클라이언트가 만든다. | `index.ts:20-48`, `apiClient.js:16-50` |
| 출력 상한 | `generationConfig` 없음 → `maxOutputTokens`·`thinking` 설정 없음(모델 기본값) | `index.ts:40-48` |
| Origin/CORS | `Access-Control-Allow-Origin: *`, Origin 검사 없음 | `index.ts:9-12` |
| 속도 제한 | 없음 | — |
| 오류 | 모든 실패가 500 + `error.message`. Gemini 오류 본문을 그대로 클라이언트에 돌려준다. | `index.ts:68-90` |
| 앱 | `/workspace/gateo-app-preview/top5`(`4c4960db`)는 gemini-proxy를 **부르지 않는다**(`rg` 0건). 스킴 `gateo`, 번들 ID 없음. | 앱 리뷰 문서 C안 |
| 7일 호출량 | Gemini 호출 194회(function_logs) / HTTP POST 173건, 전부 200. 하루 1–47건. 실사용자 추정 34, QA 추정 78, CI ping 50, 크롤러 11. **남용 징후 없음.** | `logs/SUMMARY.md` |

### 클라이언트 호출 지점 (origin/main `ca6e6b11`)
모두 `apiClient.fetchProxyGemini(_, history, systemInstruction, userText, images, modelId)` → `{ modelId, parts:[{text: system + "[이전 대화 내역]" + JSON(history) + "사용자 질문: " + userText}, ...inlineData] }`.
| # | 위치 | 기능 | 모델 | 보내는 것 |
|---|---|---|---|---|
| 1 | `src/pages/Home/components/ChatModal.jsx:893` | MOONi 채팅(홈·장소 바인딩) | FAST, 플래너/예약/복잡 의도면 QUALITY (`mooniChatModel.js`) | `getSystemPrompt(persona, dest, {chip/cta/tripSession 힌트})` + 이전 대화 전체 + 사용자 입력 |
| 2 | `src/components/PlaceCard/hooks/usePlaceChat.js:40` | 장소 카드 채팅 | 위와 같음 | 호출부가 준 `currentSystemPrompt` + 대화 + 입력 |
| 3 | `src/pages/Home/lib/placeChatIntro.js:304` | MOONi 장소 인트로(자동 생성 후 `place_chat_intro`에 저장) | QUALITY | 인트로 시스템 프롬프트 + `introUser`(장소명) |
| 4 | `src/pages/Home/hooks/useHomeHandlers.js:1550` | 검색창 오타 교정·감정 검색 | FAST | 검색어가 들어간 JSON 지시 프롬프트 |
| 5 | `src/components/PlaceCard/modals/ReviewEditorModal.jsx:283` | 리뷰 초안 | QUALITY | 장소명·별점·작성 중 메모 |
| 6 | `src/pages/DailyReport/hooks/useLogbookAI.js:64` | 로그북 에세이/SNS 변환 | 기본값 QUALITY | 메모·날짜·장소 + **사진 base64(inlineData)** |
| 7 | `src/pages/DailyReport/hooks/useLogbookAI.js:286` | 큐레이션 추천 | 기본값 QUALITY | `getCurationPrompt(기록·저장·제외·취향·최근 검색)`, userText "" |
| 8 | `scripts/smoke-health.mjs:168-200` (CI 6시간마다) | 헬스 ping | FAST + QUALITY 각 1 | `parts:[{text:'ping'}]`, Origin 없음 |

## 1. 판정
- **실제 구멍이다.** 공개 anon 키(번들·앱 `.env`에 있음)만 있으면 누구나 GATEO 비용으로 pro-preview까지 포함한 Gemini를 임의 프롬프트·임의 이미지·무제한 출력으로 부를 수 있다. verify_jwt가 꺼져 있어 키 없이도 된다. 속도 제한이 없어 스크립트 하나로 비용이 무한히 쌓인다.
- **심각도: 높음, 다만 오늘 밤 긴급 핫픽스는 아님.** 7일 로그에 남용 흔적이 없고(4xx 0, 비브라우저 미상 클라이언트 0, pro 0, 버스트 없음) 호출량이 하루 수십 건이다. 10/5 번들(A6)에서 고친다.
- 그 전까지 코드 없이 할 수 있는 완화(대표 콘솔 권한 필요, 이번 작업에서 하지 않음): Google AI Studio/Cloud에서 Gemini 키의 **예산 알림·일 할당량 상한** 설정. 현재 설정은 **미확인**.

## G1. gemini-proxy 작업(task) 계약 + 출처·속도·출력 제한 (배포 + DB 승인)
**문제**: §0 표. 요약하면 (1) 인증 없음, (2) 모델·프롬프트·이미지를 클라이언트가 정함, (3) 출력 상한 없음, (4) 속도·예산 상한 없음, (5) 크롤러와 CI ping이 실비용을 씀, (6) 오류 본문 노출.

**변경안**
1. **verify_jwt = true** (`config.toml`은 이미 true. 배포 때 `--no-verify-jwt`를 붙이지 않는다). `functions.invoke`가 anon JWT를 자동으로 붙이므로 프런트 변경 없음. 효과는 "키 없는 호출 차단"까지이고 anon 키가 공개라서 실질 방어는 아래 2–6이다.
   - ⚠ verify_jwt=true에서 브라우저 CORS preflight(OPTIONS, Authorization 없음)가 게이트웨이를 통과하는지는 **미확인**. §4.3 스모크 S0에서 확인하고, 401이면 멈추고 보고한다. `--no-verify-jwt`로 다시 배포하지 않는다. `config.toml`의 `verify_jwt = true`를 유지한다.
2. **Origin 허용 목록** (env `GEMINI_PROXY_ALLOWED_ORIGINS`, 정규식 env `GEMINI_PROXY_ALLOWED_ORIGIN_RE`)
   - 기본값: `https://www.gateo.kr`, `https://gateo.kr`
   - Preview: `^https://days-(git-[a-z0-9-]+|[a-z0-9]+)-catgeots-projects\.vercel\.app$` (repo에 기록된 preview 호스트 형식. 예 `days-git-cursor-korea-theme-catgeots-projects.vercel.app`)
   - 로컬 개발: `GEMINI_PROXY_ALLOW_LOCALHOST=1`일 때만 `http://localhost:5173`(Vite 기본 포트), `http://127.0.0.1:5173`. **prod 시크릿에는 넣지 않는다.**
   - 앱: 지금은 호출하지 않으므로 허용하지 않는다. 네이티브 `fetch`는 Origin이 없어 이 검사로는 앱을 구분할 수 없다. 앱 MOONi(C안)는 별도 결정 때 `app_mooni` 작업과 기기 단위 한도로 따로 연다.
   - **Origin 없음 또는 목록 밖 → 403 `origin_not_allowed`**, Gemini·DB 호출 0. 예외는 헤더 `x-gateo-health`가 `GEMINI_HEALTH_TOKEN`과 일치하는 `health_ping`뿐. anon 키만으로는 Origin을 건너뛰지 않는다.
   - CORS 응답은 요청 Origin이 목록에 있을 때만 그 값을 돌려주고 `Vary: Origin`. `Access-Control-Allow-Methods: POST, OPTIONS`.
   - Origin은 비브라우저가 위조할 수 있다. 브라우저 남용(다른 사이트에 심기)을 막는 장치이고, 비용 상한은 4·5가 맡는다.
3. **크롤러 차단**: UA가 `/bot|spider|crawler|externalagent|facebookexternalhit|Bytespider|GPTBot|ClaudeBot|PerplexityBot|AhrefsBot|SemrushBot/i`이면 403 `bot_blocked`(Gemini 0). HeadlessChrome은 QA가 쓰므로 막지 않는다(env `GEMINI_PROXY_BLOCK_HEADLESS=1`로만 켬). 7일 크롤러 호출 11건이 0이 된다.
4. **서버 고정 프롬프트 + 모델 허용 목록 (작업 계약)**
   - 요청: `POST { task, params }`. 클라이언트는 **`modelId`·`parts`·시스템 프롬프트를 보내지 않는다.** 서버가 작업별 템플릿(`_shared/gemini/templates.ts`)으로 프롬프트를 만들고 모델을 정한다.
   - 템플릿 텍스트는 지금 클라이언트 SSOT(`src/i18n/mooniPromptBundles.js`, `src/pages/Home/lib/prompts.js`, `curationPrompt.js`, `mooniChipPrompts.js`, `useHomeHandlers.js:1490-1540`)를 **같은 글자로** 옮긴다. 클라이언트에 남는 것은 "사실 추출"(어떤 칩·예약 프로필·여행 세션 사실인지)뿐이고, 문장 조립은 서버가 한다. 기존 `geminiModels.js ↔ _shared/geminiModels.ts` 미러처럼 미러 검사 스크립트를 둔다.

   | task | 모델(서버 고정) | params (전부 길이 상한, 형식 검사) | maxOutputTokens | 비고 |
   |---|---|---|---|---|
   | `mooni_chat` | `tier:'fast'`→flash-lite, `'quality'`→3.5-flash | `locale(ko\|en)`, `persona(enum 5)`, `placeName?≤80`, `placeBound:bool`, `chipId?(enum)`, `facts?{ssot 필드 화이트리스트, 각 ≤200}`, `tripSession?{화이트리스트, 각 ≤80}`, `cta?(enum)`, `history≤12턴 {role:user\|model, text≤2000}`(총 12,000자 넘으면 오래된 것부터 자름), `userText 1–1000` | fast 1536 / quality 2048 | tier는 클라이언트 `resolveMooniChatModel` 결과. quality는 따로 한도(G1-5) |
   | `place_intro` | 3.5-flash | `locale`, `placeName 1–80`(줄바꿈·`{}`·`[]` 금지) | 512 | 결과는 지금처럼 클라이언트가 저장 |
   | `search_intent` | flash-lite | `mode(typo\|mood\|facility)`, `query 1–100` | 512 | JSON 응답 |
   | `review_draft` | 3.5-flash | `placeName≤80`, `rating 1–5`, `draft≤2000` | 768 | |
   | `logbook_polish` | 3.5-flash | `mode(essay\|sns)`, `date≤20`, `location≤80`, `memo≤4000`, `images≤4 {mimeType: image/jpeg\|png\|webp, data base64 ≤1.5MB}` | 2048 | 로그인 필요 여부 확인 후 `authenticated` 전용 권장(**미확인**) |
   | `curation` | 3.5-flash | `locale`, `reports/saved/exclude/rejected/recentSearches/recentVisited ≤20개씩 각 ≤80`, `tasteTags ≤12 (id 형식)` | 1024 | |
   | `health_ping` | flash-lite만 | 없음(서버 고정 문자열 `ping`) | 16 | `x-gateo-health`가 맞을 때만 Origin 예외·예산 제외. 하루 4회. 헤더가 없으면 일반 요청 |
   - **pro-preview(`GEMINI_WRITE`)는 어떤 작업에도 쓰지 않는다.** 서버 허용 목록 = flash-lite, 3.5-flash.
   - 공통 `generationConfig`: `maxOutputTokens`(표), `candidateCount: 1`. 지금은 temperature를 보내지 않으므로 G1에서도 보내지 않는다(답변 성향 변화 방지).
   - ⚠ 3.x 모델의 thinking 토큰이 `maxOutputTokens` 안에 포함되는지, 상한이 낮을 때 빈 답이 나오는지는 **미확인**. G1은 thinking 설정을 바꾸지 않고, 배포 후 스모크에서 `usageMetadata`(thoughtsTokenCount)와 `finishReason`을 기록해 판단한다. `finishReason=MAX_TOKENS`면 받은 텍스트를 `truncated:true`로 돌려주고 **재시도하지 않는다.**
   - 본문 상한: 이미지 없는 작업 64KB, `logbook_polish` 7MB. 넘으면 413.
   - 남는 위험: `userText`·`memo`·`draft`는 자유 텍스트라 MOONi 페르소나 안에서 다른 질문을 할 수는 있다. 그러나 시스템 프롬프트·모델·출력 길이·횟수가 고정되므로 범용 LLM API로 쓰는 가치가 사라진다.
5. **속도 제한 + 일 토큰 예산** (신규 테이블, §2 SQL)
   - 키: IP = `sha256(GEMINI_PROXY_IP_SALT + client_ip)` 앞 16자(원문 IP는 저장하지 않음). 사용자 = JWT `sub`(role=authenticated일 때).
   - 클라이언트 IP 헤더: Supabase 게이트웨이(Kong)가 연결 주소로 **덮어쓰는 값은 `x-real-ip`**. 그것을 우선한다. `x-forwarded-for`의 첫 값은 클라이언트가 붙일 수 있다. 스테이징에서 게이트웨이가 실제로 덮어쓰는지 **확인 전(pending)**.
   - `GEMINI_PROXY_IP_SALT`가 없으면 **503 `busy`**. 솔트 없이 해시하지 않는다.
   - 순서대로 검사하고 처음 넘는 버킷에서 멈춘다(뒤의 전역 버킷은 늘리지 않음 → IP 하나가 전역 예산을 태우지 못함). 테스트 G1-global-not-burned.

   | 버킷 | 초안 상한 | 근거 |
   |---|---|---|
   | IP 분 | 4 | QA: 관측 최대에 맞춤. 시크릿으로 조정 |
   | IP 시간 | 20 | |
   | IP 일 | 40 | |
   | 사용자 일 (authenticated) | 40 | |
   | 작업 전역 일 | mooni_chat 1200(그중 quality 400) · place_intro 300 · search_intent 400 · review_draft 150 · logbook_polish 100 · curation 150 · health_ping 4 | health_ping은 토큰이 맞을 때만 |
   | 전역 시간 / 일 | 60 / 300 | 7일 194회, 하루 최대 47. 평균의 5배(140)보다 큼 |
   | 일 토큰 예산(UTC, prompt+output) | env `GEMINI_DAILY_TOKEN_BUDGET` 기본 1,500,000 | 28×8000×5=1,120,000보다 큼. 호출 전 추정치를 원자적으로 선점 |
   - 모든 값은 env로 덮어쓸 수 있게 한다(`GEMINI_PROXY_LIMITS` JSON). 배포 없이 `supabase secrets set`으로 조정.
   - 초과 → 429 `rate_limited` + `Retry-After` 헤더 + `retryAfter`(초). 예산 초과 → 429 `budget`.
   - **속도 RPC 오류 시**: isolate 메모리 한도(IP당 분 3, isolate 전역 분 20)로만 통과. 넘으면 503 `busy`.
   - **토큰 예산**: 호출 전에 `gemini_proxy_reserve_usage`로 `입력 추정 + maxOutputTokens`를 원자적으로 선점하고, 성공 후 `gemini_proxy_reconcile_usage`로 실제 usageMetadata에 맞춘다. 타임아웃·폴백은 선점을 남긴다(성공이 아니면 깎지 않음). 예산 RPC가 실패하면 **503으로 닫는다**. 이 두 함수는 승인된 `20261006114000`과 분리된 `20261006121000`이며 적용 전 승인이 필요하다. `20261006120000`은 #378 `edge_rate_limit_cost`가 이미 쓴다. `gemini_proxy_record_usage`는 음수 조정이 없어 정산에 재사용할 수 없다.
   - Google Cloud 할당량과 결제 알림을 콘솔에 둔다. 앱 예산과 별개다.
6. **오류 응답 (MOONi가 부드럽게 처리)** — 모두 `{ success:false, error:<code>, retryAfter? }`. Gemini 오류 본문은 클라이언트에 보내지 않고 로그에만 남긴다.

   | 상태 | error | 언제 | 클라이언트 표시(`geminiProxyError.js`) |
   |---|---|---|---|
   | 400 | `bad_request` / `unknown_task` | 형식·enum·길이 위반 | GENERIC «AI 서버와의 통신에 실패했습니다…» |
   | 401 | (게이트웨이) | JWT 없음 | CONFIG(기존) |
   | 403 | `origin_not_allowed` / `bot_blocked` / `login_required` | G1-2·G1-3·G1-4 | GENERIC (실사용자에게는 나오지 않아야 함) |
   | 413 | `too_large` | 본문·이미지 상한 | 신규 TOO_LARGE «내용이 너무 길어요. 조금 줄여서 다시 보내 주세요.» |
   | 429 | `rate_limited` | G1-5 버킷 | 신규 RATE_LIMITED «질문이 잠시 몰렸어요. {n}초 뒤에 다시 물어봐 주세요.» (n = retryAfter, 60 넘으면 «잠시 후») |
   | 429 | `budget` / `quota` | 일 예산 / Gemini 429 RESOURCE_EXHAUSTED | QUOTA(기존) «AI 사용량 한도에 도달했습니다…» |
   | 503 | `busy` | Gemini 503·타임아웃(25초), 폴백도 실패, RPC 장애 시 메모리 한도 초과 | BUSY(기존) |
   | 502 | `upstream_error` | 그 밖의 Gemini 4xx/5xx | GENERIC |
   - 기존 동작 유지: MOONi·장소 채팅은 오류를 `role:'error'` 말풍선으로 보여 준다(`ChatModal.jsx:954-956`, `usePlaceChat.js:73-79`). 인트로 실패는 세션 동안 같은 키를 다시 부르지 않는다(`placeChatIntro.js:311,348-351`). **클라이언트 자동 재시도는 넣지 않는다.**
   - 성공: `{ success:true, text, modelUsed, finishReason, truncated }`. 클라이언트는 `text`만 쓴다.
7. **이행 기간 (구 번들 호환)**: 배포 직후 브라우저에 남은 구 번들은 `{modelId, parts}`를 보낸다. env `GEMINI_PROXY_LEGACY=on`인 동안만 구 형식(`task` 없이 `parts`가 있는 본문)을 받되 같은 Origin·크롤러·속도 제한·출력 상한(2048)을 적용한다. **legacy 경로에서만** pro(`GEMINI_WRITE`)는 3.5-flash로 바꾼다. `parts`는 `text`와 허용 이미지 `inlineData`만(fileData 등은 400). ≤5, 텍스트 합 ≤24,000자, 이미지 ≤4. 본문은 로그북과 같은 **7 MiB(7340032바이트)** 까지. task 키 `legacy`, 전역 일 600. 프런트 배포 + 72시간 뒤 로그의 `legacy` 호출이 ~0이면 `GEMINI_PROXY_LEGACY=off`(시크릿만 바꿈).
8. **로그**: 호출마다 `console.log` JSON 1줄 `{fn:'gemini-proxy', task, model, status, error?, ipHash8, uidSet:bool, ms, promptTokens, outputTokens, thoughts, finishReason, legacy:bool}`. 프롬프트·답변 본문은 남기지 않는다.

**PASS** (로컬 모의 fetch로 Gemini 호출 수를 센다)
- Origin 없음(health_ping 제외)·목록 밖·크롤러 UA → 403, Gemini 0회, admit RPC 0회
- `modelId`·`parts`를 보내도 `task` 형식에서는 무시된다. 어떤 입력으로도 pro-preview URL이 만들어지지 않는다.
- 모든 Gemini 요청 본문에 작업별 `maxOutputTokens`가 있다.
- 상한 초과 → 429 + Retry-After, Gemini 0회. 예산 초과 → 429 budget.
- RPC 오류 → 메모리 한도 안에서만 통과, 넘으면 503.
- Gemini 429 → 429 `quota`, 503 → flash-lite 1회 폴백 후 실패 시 503 `busy`. 응답에 Gemini 오류 원문 없음.
- 골든 테스트: 픽스처 N개(홈 MOONi, 장소 바인딩+칩 3종, 플래너, 여행 세션, en 로캘, 인트로, 검색 typo/mood, 리뷰, 로그북 essay/sns, 큐레이션)에서 **서버 템플릿 출력 == 현재 클라이언트 빌더 출력(바이트 동일)**. 답변 품질 회귀를 막는 핵심 검사.
- 구 형식: LEGACY=on이면 제한 적용 후 200, off면 400.
- 실사용 흐름(홈 MOONi, 장소 채팅, 인트로, 검색 교정, 리뷰 초안, 로그북, 큐레이션, smoke-health)이 preview에서 정상(이 단계의 실호출은 PR 점검 담당이 소량만).

## 2. DB (신규 객체만) — stage 3g
- `sql/20261006114000_gemini_proxy_rate_limits.sql` (`aee8c52ff33e`)
  - `gemini_proxy_rate_limits(bucket, window_start, count)`, `gemini_proxy_usage_daily(day, task, model, calls, prompt_tokens, output_tokens)`
  - `gemini_proxy_admit(p_checks jsonb, p_token_budget bigint)`, `gemini_proxy_record_usage(...)` — SECURITY DEFINER, `search_path=''`, service_role 전용, RLS on·정책 없음
  - 기존 테이블·함수·정책은 건드리지 않는다. prod에 같은 이름 객체 없음(`api/prod_name_check.json`, read_only SELECT).
  - 3v의 `edge_rate_limits`와 **분리**했다. 둘 중 하나만 롤백할 수 있게 하기 위해서다.
- 롤백 `sql/rollback/20261006114000_gemini_proxy_rate_limits_rollback.sql` (`406e94033cd0`) — 새로 만든 4개만 drop. **엣지 롤백(§4.4) 뒤에만** 실행.
- 로컬 검증(PG 17, 박스 전용, 기존 하네스의 supabase_shim 사용): `sql/tests/local_test.sh` → `sql/tests/local_test_result_2026-10-03.txt` **15/15 PASS** (RLS·권한, IP 한도, 전역 미소진, retry_after, 사용량 누적, 예산, 잘못된 인자, anon 거부, 40개 동시 호출 중 정확히 25개 통과, 롤백 후 fingerprint 동일, 재적용).

## 3. 승인 메모
- A6 범위(Cos 전달)로 진행한다. 다만 아래 두 가지는 A6 원문(gallery-moderate·fetch-place-videos 배포)에 없던 항목이라 실행 전 한 줄 확인을 권한다.
  - ⚠ DB stage 3g(신규 테이블 2 + 함수 2)
  - ⚠ prod 시크릿 추가: `GEMINI_PROXY_IP_SALT`(신규 난수), `GEMINI_PROXY_ALLOWED_ORIGINS`, `GEMINI_PROXY_LEGACY`, (선택) `GEMINI_PROXY_LIMITS`, `GEMINI_DAILY_TOKEN_BUDGET`. 기존 `GEMINI_API_KEY`는 그대로.
- 범위 밖(이번에 점검하지 않음): Gemini를 쓰는 다른 함수 `explain-event-term`, `generate-place-magazine`, `update-event-travel-guide`, `update-place-wiki`도 배포본 verify_jwt=false다. 각 함수의 자체 인증·상한은 확인하지 않았다(**미확인**). 별도 점검 권장.

## 4. 배포 (10/5 번들, 우리가 직접. 클라우드 에이전트는 배포하지 않는다)
RUNBOOK 공통 절차(백업 → 사전 확인 → 롤백 준비 → 1회 실행 → 상태 확인 → 스모크 → 이상 시 롤백·중단 → 한 줄 기록)를 그대로 따른다.

| 단계 | 내용 | 게이트 | 롤백 | 가장 이른 창 (KST) |
|---|---|---|---|---|
| 3g | DB `20261006114000_…` 후, 승인 시에만 `20261006121000_…`(토큰 선점. `20261006120000`은 #378) | 로컬 PASS | 각 rollback. 선점 함수만 먼저 내려도 됨 | 엣지보다 먼저 |
| E3 | `gemini-proxy` 배포 (LEGACY=on, verify_jwt=true) | 3g live, PR 머지, 시크릿 | §4.4 | 프런트보다 먼저 |
| P | 헬스 핑 PR 머지 (하루 1회 워크플로. 2시간 스모크와 분리) | E3 live, `GEMINI_HEALTH_TOKEN` | 워크플로 비활성 | E3 다음 |
| S | 기존 smoke-health (Gemini 실핑 아님) | P | | P 다음 |
| FG | 프런트(호출부 → task 계약) | E3 스모크 PASS | Vercel 이전 배포 | E3 다음. **프런트를 엣지보다 먼저 올리면 AI 기능 7곳(mooni_chat 2곳, place_intro, search_intent, review_draft, logbook_polish, curation)이 500** |
| LG | `GEMINI_PROXY_LEGACY=off` | FG + 72시간, `legacy:true` 로그 ~0 | `GEMINI_PROXY_LEGACY=on` | FG + 72시간 |

### 4.1 사전 백업 (배포 직전 다시)
```bash
R=phdjnbfitvmrguqzverm; B=/workspace/gateo-ops/qa/gemini-proxy-2026-10-03/deployed/pre-E3-$(date +%Y%m%d-%H%M)
mkdir -p $B && cd $B && supabase functions download gemini-proxy --project-ref $R --use-api
sha256sum supabase/functions/gemini-proxy/index.ts supabase/functions/_shared/geminiModels.ts supabase/functions/gemini-proxy/deno.json
# 기대: f3d811a18c86… / 1947872d447e… / 776494746017… (= deployed/v14). 다르면 멈추고 보고(누가 그 사이 배포함)
curl -s -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" https://api.supabase.com/v1/projects/$R/functions/gemini-proxy \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['version'],d['verify_jwt'],d['ezbr_sha256'][:12])"   # 기대: 14 False 4803d7555ce7
```

### 4.2 배포 명령 (E3)
```bash
cd /workspace/days-src && git fetch origin && git checkout --detach origin/main   # G1 머지 커밋 확인
supabase secrets set --project-ref phdjnbfitvmrguqzverm \
  GEMINI_PROXY_ALLOWED_ORIGINS="https://www.gateo.kr,https://gateo.kr" \
  GEMINI_PROXY_ALLOWED_ORIGIN_RE='^https://days-(git-[a-z0-9-]+|[a-z0-9]+)-catgeots-projects\.vercel\.app$' \
  GEMINI_PROXY_LEGACY=on GEMINI_PROXY_IP_SALT="$(openssl rand -hex 32)"   # 솔트 값은 출력·기록하지 않는다
supabase functions deploy gemini-proxy --project-ref phdjnbfitvmrguqzverm --use-api   # --no-verify-jwt 붙이지 않음 (config.toml verify_jwt=true)
```

### 4.3 배포 후 스모크
- **S0 (Gemini 비용 0, 함수가 Gemini 전에 거절하는 것만)**
  - `curl -X OPTIONS -H 'Origin: https://www.gateo.kr' -H 'Access-Control-Request-Method: POST' …/functions/v1/gemini-proxy` → 204, `Access-Control-Allow-Origin: https://www.gateo.kr` (⚠ verify_jwt=true에서 preflight 통과 확인. 401이면 멈추고 보고. `--no-verify-jwt`로 재배포하지 않음)
  - JWT 없이 POST → 401 (게이트웨이)
  - anon JWT + `Origin: https://evil.example` + `{task:'mooni_chat',…}` → 403 `origin_not_allowed`
  - 위 세 건 뒤 function_logs에 Gemini 호출 줄 0, `gemini_proxy_usage_daily` 0행(read_only SELECT)
  - API로 `verify_jwt` true, version 15 확인
- **S1 MOONi 실답변 1회 (E3 직후 = 구 번들 → legacy 경로)**
  - 박스 브라우저로 https://www.gateo.kr/ 홈 → MOONi(장소 바인딩 아님 → 인트로 생성 없음) → «안녕! 한 문장으로 인사해 줘» 1회만 보낸다. 짧은 일반 질문이라 flash-lite가 선택될 것으로 예상한다(`resolveMooniChatModel`; 실제 모델은 로그로 확인, 3.5-flash여도 PASS).
  - PASS: 답 말풍선이 뜬다. 로그 1줄 `status 200, legacy:true, outputTokens ≤ 2048, finishReason STOP`(thinking 토큰 수도 기록). `gemini_proxy_usage_daily` calls=1. 같은 시각 실사용자 4xx 0.
- **S2 (FG 배포 직후, 새 번들 → task 경로)**: S1과 같은 질문 1회. 로그 `task:'mooni_chat', legacy:false`. (S1과 S2는 서로 다른 단계에서 각각 1회)
- **관찰 1시간**: 실사용자 IP의 403/413/429 0, 503 비율이 배포 전(0)과 같음. `health_ping`은 smoke-health가 아니라 **하루 1회** 전용 워크플로(정시가 아닌 분)가 `x-gateo-health`로 호출한다. 상한 하루 4회.

### 4.4 롤백 (현재 배포본 v14 그대로 복원)
- 보관본: `deployed/v14/supabase/functions/gemini-proxy/index.ts` `f3d811a18c86`, `deno.json` `776494746017`, `_shared/geminiModels.ts` `1947872d447e`. 이 세 파일은 `catgeot/Days` 커밋 `ca6e6b11`의 같은 경로와 바이트 동일.
- **순서**: FG가 이미 나갔다면 **먼저 Vercel에서 이전 프런트 배포로 되돌린다**(새 번들의 `{task}` 요청은 v14에서 400/500이 됨). 한도·Origin 문제뿐이면 롤백 대신 시크릿(`GEMINI_PROXY_LIMITS`, `GEMINI_PROXY_LEGACY=on`, 허용 목록)만 고친다.
```bash
git -C /workspace/days-src fetch origin && git -C /workspace/days-src worktree add --detach /tmp/gemini-proxy-rollback ca6e6b11
cd /tmp/gemini-proxy-rollback && sha256sum supabase/functions/gemini-proxy/index.ts supabase/functions/gemini-proxy/deno.json supabase/functions/_shared/geminiModels.ts
# 기대 f3d811a18c86 / 776494746017 / 1947872d447e — 다르면 배포하지 말고 deployed/v14 파일을 이 경로에 복사한 뒤 다시 확인
supabase functions deploy gemini-proxy --project-ref phdjnbfitvmrguqzverm --use-api --no-verify-jwt   # v14와 같게 verify_jwt=false
```
- 확인: API `verify_jwt` False, version +1. `supabase functions download`로 다시 받아 `index.ts` sha256 `f3d811a18c86` 확인. 홈 MOONi 1회(S1과 같음).
- 그 다음에만 DB 3g 롤백 SQL. 시크릿은 남겨도 v14가 읽지 않는다.

## Cos GO (2026-10-03 21:57 KST): 10/5 묶음에 포함
1) DB 단계 GO: 새 테이블 2개와 함수 2개만 만들고, 기존 데이터는 건드리지 않음. 실행 전에 로컬 롤백을 다시 확인함.
2) 시크릿 GO: GEMINI_PROXY_IP_SALT 등의 값은 새로 무작위로 생성함. 보고서에는 이름만 적음.
- 하루 예산 기본값(시크릿으로 조정): 전역 300/일·60/시간, IP 4/분·20/시간·40/일, 사용자 40/일, 토큰 1,500,000. 7일 194회(최대 47/일, 평균 약 28)의 5배 호출 하한 140과 토큰 하한 1,120,000보다 크다. Google Cloud 할당량·결제 알림을 함께 둔다.
  - 예산에 닿으면 오류 대신 MOONi 안내 문구를 보여 줌.
- 배포 직후 스모크 테스트: MOONi 대화 1회와 매거진 생성 1회. 이상이 있으면 v14(deployed/v14)로 즉시 롤백함.
3) 다른 Gemini 함수 4개(explain-event-term, generate-place-magazine, update-event-travel-guide, update-place-wiki)
- 10/5 묶음이 안정된 뒤 읽기 전용으로 점검함.
- 구멍이 맞으면 같은 방식으로 수정안을 만듦. 관리자 전용 함수면 관리자 JWT로 제한함.
- 결과는 10/5 묶음 보고에 함께 넣음.
