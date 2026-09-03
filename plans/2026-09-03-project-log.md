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

```
지구본 홈 헤더 #6, PROD Chrome 확인
@plans/feature-handoff-index.md
@plans/2026-09-03-project-log.md
브랜치 cursor/home-header-3eef · PR #181 · https://www.gateo.kr/
금지: UI 리디자인 · Cursor 인앱·Vercel URL바용 56px 추가 · offsetTop 지속 보정 · 코드를 origin/main에 임의 push
작업: iPhone Chrome 앱에서 gateo.kr 탭 재오픈+새로고침. 정상이면 56px 축소 또는 PR 닫기. Chrome만 가리면 CriOS만 유지
```
