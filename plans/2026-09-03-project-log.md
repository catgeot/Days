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

### #11 배포본 정정 — 헤더 문제 이전 vs 현재 main ✅

- **세션** `지구본 홈 헤더 #11, 배포본 상단 비교`
- **사람** 현재 배포본은 상단 홈 헤더 문제가 한 번 main에 반영된 상태. 그 **이전** 배포본을 확인하라
- **PR #181** OPEN · **미병합**. 56px·100svh·html lock은 `www.gateo.kr`에 없음
- **현재 배포** `9824bfb8` 검색바 히트 PR [#175](https://github.com/catgeot/Days/pull/175) (2026-09-02) + locale PR #176 — 모바일 `[로고+EN | 검색]` · 헤더 `p-4`(16px)
- **헤더 문제 이전** `9824bfb8^`: 겉은 같은 `p-4`. 로고 열 `pt-2` → 로고 24px. 검색 `max-md:top-6`(24px)·`left-[7.75rem]`. EN은 2026-08-18부터 로고 옆
- **여백** 문제 이전이 더 아래(24px). 지금 작은 여백은 `p-4`. 56px 검은 띠는 배포에 한 번도 없음
- **다음** **#12** 여백 유지 확인 후 PR 닫기

### #12 여백 유지 · 배포본 그대로 · PR #181 미병합 종료 ✅

- **세션** `지구본 홈 헤더 #12, 상단 여백 방향`
- **사람** 헤더 여백은 현재 상태 유지. 배포본을 손볼 일 없이 이대로 두면 되는지
- **결론** **손대지 않음.** `www.gateo.kr` = PR #175 `p-4` 그대로
- **올리지 않음** CriOS 56px · 100svh · html lock (PR [#181](https://github.com/catgeot/Days/pull/181) **닫음**)
- **한계** iOS Chrome 완전 종료 후 재실행 가림은 남음
- **주제 종료** 다음 제시어 없음

```
(주제 종료 — 지구본 홈 헤더 overlay 재시도 금지)
```

---

## 홈 지구본 지명 — 사파리 첫 진입

### #3 사파리 첫 진입 지명 ✅ 에이전트 · 사람 Preview 대기

- **세션** `홈 지구본 지명 #3, 사파리 첫 진입 지명`
- **브랜치** `cursor/globe-labels-ddce` · tip `915772bd` · PR [#182](https://github.com/catgeot/Days/pull/182)
- **배경** PR [#180](https://github.com/catgeot/Days/pull/180) merge `d6c91f0d` 이후에도 사파리 첫 진입에서 지명이 간헐적으로 없음 · EN 토글만 복구
- **원인** locale 패치가 `mapReady` 전 no-op · overlay 320ms 뒤 `jumpTo`가 Safari CJK placement를 끊음 · `isMoving`이 자전 없이도 남아 overlay `return`
- **적용** `mapReady` 후 EN 토글과 같은 text-field 강제 적용 · 페인트 또는 1.6s까지 자전 hold·pump · 첫 visibility `force`
- **VERIFY** `smoke:globe-label-first-reveal` · `smoke:place-label-slug` · `vite build` PASS
- **Preview** `/qa/globe-labels` · git Preview 홈
- **다음** **#4 사람 Preview QA** — 사파리 첫 진입(EN 없이) 지명 · 완전 종료 후 재실행 2~3회

```
홈 지구본 지명 #4, 사파리 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-03-project-log.md
브랜치 cursor/globe-labels-ddce · PR #182 · https://www.gateo.kr/qa/globe-labels
금지: UI 리디자인 · HomeGlobeMapbox 광역 리팩터 · 코드를 origin/main에 임의 push
작업: 사파리 첫 진입(EN 없이) 지명 · 완전 종료 후 재실행 2~3회 · 자전 · EN↔KO · OK 시 PR #182 merge
```

### #4 main 반영 ✅ · 사람 PROD QA

- **세션** `홈 지구본 지명 #4, 사파리 PROD QA`
- **사람** 메인에 반영해서 테스트
- **merge** PR [#182](https://github.com/catgeot/Days/pull/182) → `origin/main` `cf63192c`
- **PROD** `https://www.gateo.kr/` — Vercel 배포 후 사파리 첫 진입
- **다음** 사파리 완전 종료 후 재실행 2~3회 · 자전 · EN↔KO

```
홈 지구본 지명 #4, 사파리 PROD QA
@plans/feature-handoff-index.md
@plans/2026-09-03-project-log.md
PROD https://www.gateo.kr/
금지: UI 리디자인 · HomeGlobeMapbox 광역 리팩터 · 코드를 origin/main에 임의 push
작업: 사파리에서 www.gateo.kr 첫 진입(EN 없이) 지명 · 완전 종료 후 재실행 2~3회 · 자전 · EN↔KO
```
