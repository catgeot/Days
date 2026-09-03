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

### #8 Chrome 재실행 overlay ✅ 에이전트 · 사람 Preview에서 재실행 잔존

- **세션** `지구본 홈 헤더 #8, Chrome 재실행 overlay`
- **브랜치** `cursor/home-header-3eef` · tip `8ce1e72a` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **사람 QA** 첫 진입·커서 왕복·새로고침 정상. 크롬 창 닫고 재실행은 상단으로 밀림. Safari·네이버·구글검색 정상. PROD도 동일(미병합)
- **배포** 지금은 하지 않음. PROD에는 보정이 없어 같은 증상이 맞고, 재실행 수정을 Preview에서 먼저 확인
- **원인** 재실행 때 visualViewport만 줄어 inset으로 오인 → 56px 제거
- **적용** overlay는 layout `innerHeight` · 280ms 뒤 확정 · 높이는 보이는 vv
- **VERIFY** layout-full+작은 vv `56` · 진짜 inset `0` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **다음** **#9** — 휴리스틱 중단

### #9 100svh로 overlay 보정 중단 ✅ 에이전트 · 사람 QA에서 재실행 잔존 + 상단 여백

- **세션** `지구본 홈 헤더 #9, 사람 Preview QA`
- **브랜치** `cursor/home-header-3eef` · tip `ece13d6e` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **사람** 동일 가림이 계속됨. 검색바·EN 작업 이후 표면화. 해결 방안 질문
- **판단** overlay/inset을 JS 숫자로 구분 불가(#1–#8이 여백↔가림 교차). 검색/EN은 헤더가 촘촘해져 잘림이 드러난 것. 간헐 원인 자체는 `h-screen`(100vh)
- **적용** CriOS 56px·html lock·chrome-top **제거**. Home·MainLayout 모바일 `100svh`. 헤더 비주얼 유지
- **VERIFY** `smoke:home-chrome-viewport` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **사람 QA** 3번(크롬 재실행) 여전히 가림. 크롬·사파리 모두 상단 여백 → #10

### #10 재실행 한계 · 배포본 h-screen 복귀 ✅ 에이전트 · 사람 Preview 대기

- **세션** `지구본 홈 헤더 #10, 사람 Preview QA`
- **브랜치** `cursor/home-header-3eef` · tip `8994b825` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **사람** 3번은 한계로. 수정 전 배포 상단은? 지금 크롬·사파리 모두 상단 여백이 조금 있음
- **배포본(수정 전)** `h-screen` · 헤더 `fixed top-0 p-4`(16px) · 56px 없음. 그 작은 여백이 원래 상태. 재실행 가림은 배포본에도 간헐
- **적용** #9 `100svh` 되돌림(사파리 여백 회귀 방지). 56px 재도입 없음. 재실행은 고치지 않음
- **VERIFY** `smoke:home-chrome-viewport` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **다음** **#11** Preview vs `www.gateo.kr` 상단 비교 · OK면 PR 병합하지 않고 닫기

```
지구본 홈 헤더 #11, 배포본 상단 비교
@plans/feature-handoff-index.md
@plans/2026-09-03-project-log.md
브랜치 cursor/home-header-3eef · PR #181 · https://www.gateo.kr/qa/home-header
금지: UI 리디자인 · CriOS 56px overlay 재도입 · 100svh 재도입 · 코드를 origin/main에 임의 push
작업: Preview vs www.gateo.kr 상단 여백이 같은지. OK면 PR #181 병합하지 않고 닫기
```
