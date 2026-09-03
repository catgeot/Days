# 2026-09-03 프로젝트 일지

직전: [`2026-09-02-project-log.md`](./2026-09-02-project-log.md)

---

## 지구본 홈 헤더 — Chrome 주소창 가림

### #5 사람 Preview QA — 배포본 vs Preview

- **세션** `지구본 홈 헤더 #5, 사람 Preview QA`
- **브랜치** `cursor/home-header-3eef` · tip `7313c02f` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **사람 QA** 배포본(`www.gateo.kr`)은 정상 · 상단 여백이 조금 더 생김. 가림은 Preview 실행 때
- **원인** Preview ≠ 배포본.
  - 코드: feature만 CriOS 56px. PROD(`main`)에는 없음
  - 크롬: 스크린샷 URL이 `…3eef-….vercel.app` · 우측 「작업 로그」는 Preview 전용 · 한쪽은 Cursor 인앱(`< Cursor`)이 웹뷰 위를 덮음. Cursor/Safari UA에는 `CriOS`가 없어 56px도 안 붙음
- **적용** CSS 추가 없음. Cursor 인앱·긴 Vercel 주소창을 패딩으로 쫓지 않음(배포본이 내려감)
- **다음** **#6** — iPhone **Chrome 앱**에서 `www.gateo.kr` 탭 재오픈+새로고침. 정상이면 56px 축소 또는 PR 닫기

### #6 PROD Chrome 확인 ✅ 에이전트 · 사람 Preview 대기

- **세션** `지구본 홈 헤더 #6, PROD Chrome 확인`
- **브랜치** `cursor/home-header-3eef` · tip `0ecec79b` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **사람 QA** 주소 첫 진입은 헤더 정상 · **검은 여백**은 이전 56px. 크롬 완전 종료 후 재실행은 헤더가 주소창에 가림
- **원인** CriOS에 56px를 항상 넣음 → inset 첫 진입은 여백. overlay(재실행)는 별도 감지 없이 가림
- **적용** `screen.height-innerHeight`로 overlay만 56px · overlay latch(지구본 높이 감소로 해제 금지) · inset은 0 · `pageshow` 재적용
- **VERIFY** overlay mock `56` latch · inset mock `0` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **다음** **#7** 사람 Preview QA — 첫 진입 여백 · 크롬 종료 후 재실행 가림

### #7 Preview 첫 진입 점프 ✅ 에이전트 · 사람 Preview 대기

- **세션** `지구본 홈 헤더 #7, Preview 첫 진입 점프`
- **브랜치** `cursor/home-header-3eef` · tip `834ece32` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **사람 QA** Preview 첫 진입은 잠깐 정상 → 화면 전체가 주소창 뒤로. 커서↔크롬 왕복은 여백 있고 정상. 새로고침 정상. 스크린샷 URL `…3eef-….vercel.app` · 「작업 로그」 · `< Cursor` → Preview (배포본 아님)
- **원인** innerHeight만으로 overlay 확정 + `pageTop` `scrollTo(0,0)` + 큰 높이 잠금. 재현되는 타이밍 레이스(첫 페인트 후 점프).
- **적용** visualViewport로 overlay · 280ms 뒤 확정 · pageTop scrollTo 제거 · inset은 보이는 높이로 축소
- **VERIFY** settle 전 `0` · overlay `56` latch · visual inset `0` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **다음** **#8** 사람 Preview QA — 첫 진입 점프 없는지. PROD 확인은 Cursor 밖 `www.gateo.kr`

```
지구본 홈 헤더 #8, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-03-project-log.md
브랜치 cursor/home-header-3eef · PR #181 · https://www.gateo.kr/qa/home-header
금지: UI 리디자인 · Cursor 인앱·Vercel URL바용 56px 추가 · offsetTop 지속 보정 · 코드를 origin/main에 임의 push
작업: iPhone Chrome Preview 첫 진입이 점프하지 않는지 · 새로고침 유지. PROD는 Cursor 없이 www.gateo.kr
```
