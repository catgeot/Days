# 2026-08-12 프로젝트 일지

직전: [`2026-08-11-project-log.md`](./2026-08-11-project-log.md)

## 로그북 #3, 큐레이션 페이지 QA

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `79be0f3b` · Preview QA 대기  
**세션**: `로그북 #3, 큐레이션 페이지 QA`

- **증상**: 나의 목록(라자암팟·소코트라)이 있는데도 「낙원 탐색 시작」박스가 메인으로 보임
- **원인**: session `gateo_curation_data`가 비면 status=idle → 실행 박스 표시 (history는 local만 있음)
- **한 일**: `resolveActiveCurationPanel` — session 없으면 history[0] 본문 복원 · 실행 박스는 이력 없을 때만 메인 · `smoke:curation-history`
- **VERIFY**: `npm run smoke:curation-history` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「마지막 실행 본문 복원 · 없을 때만 실행 박스」
- **남은 일**: 사람 Preview QA(라자암팟 본문→목록 · 빈 이력 시 실행 박스 메인)
- **다음 채팅명**:

```
로그북 #4, 큐레이션 페이지 QA
```

## 로그북 #2, 큐레이션 페이지

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#108](https://github.com/catgeot/Days/pull/108) · tip `463a11cf` · Preview QA 대기  
**세션**: `로그북 #2, 큐레이션 페이지`

- **요청**: 최근 실행 본문 메인 · 그 아래 나의 큐레이션 세로 목록 · 하단 여유 · 별표·비로그인 안내
- **한 일**: `CurationHub` IA(본문→목록) · `page-scroll-end-pad` · 별표 즐겨찾기 + 로그인 안내 · `/qa/logbook-curation`
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-curation`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「최근 실행 본문 메인 · 목록은 하단」
- **남은 일**: → #3 QA에서 본문 복원 수정

## 로그북 #1, 공개피드 CTA

**상태**: feature `cursor/logbook-cta-home-bbbd` · PR [#107](https://github.com/catgeot/Days/pull/107) · tip `95abbb3b` · Preview QA 대기  
**세션**: `로그북 #1, 공개피드 CTA`

- **증상**: 공개 피드(`/p/:id`) 하단 「나만의 기록 남기기」→ `/auth/login`
- **한 일**: `PublicViewer` CTA → `/blog`(로그북 홈) · `/qa/logbook-cta`
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/logbook-cta`
- **Preview**: `https://days-git-cursor-logbook-cta-home-bbbd-catgeots-projects.vercel.app/blog`
- **작업 로그**: 「공개 피드 「나만의 기록 남기기」→ 로그북 홈」
- **남은 일**: 사람 Preview QA(공개 기록 하단 CTA → `/blog`)

## 지구본 홈 #4, 아이투타키 투어 오탐

**상태**: feature `cursor/aitutaki-gyg-tour-b09e` · PR [#106](https://github.com/catgeot/Days/pull/106) · tip `61c07bd3` · Preview QA 대기  
**세션**: `지구본 홈 #4, 아이투타키 투어 오탐`

- **증상**: 써머리「투어 찾기」아이투타키 → GYG bare `Aitutaki`가 아유타야(·일본 혼입)로 오탐
- **원인**: GYG 아이투타키 재고 없음 · fuzzy가 Ayutthaya로 붙음
- **한 일**: `GYG_ACTIVITIES_Q_BY_SLUG.aitutaki` → `Rarotonga, Cook Islands` · City id `2689` · `smoke:gyg-activities-query` · `/qa/aitutaki-tour`
- **VERIFY**: `npm run smoke:gyg-activities-query` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/aitutaki-tour`
- **Preview**: `https://days-git-cursor-aitutaki-gyg-tour-b09e-catgeots-projects.vercel.app/`
- **작업 로그**: 「아이투타키 투어 찾기 → 아유타야 오탐 보정」
- **남은 일**: 사람 Preview QA(아이투타키→투어 찾기 · 아유타야/일본 없음 · 쿡 제도 투어)
- **다음 채팅명**:

```
지구본 홈 #5, 아이투타키 투어 QA
```
