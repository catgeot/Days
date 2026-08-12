# 2026-08-12 프로젝트 일지

직전: [`2026-08-11-project-log.md`](./2026-08-11-project-log.md)

## 명승 검색 #1, 화엄사 0건

**상태**: feature `cursor/scenic-hwaeomsa-search-8838` · PR [#109](https://github.com/catgeot/Days/pull/109) · tip `17afc3aa` · Preview QA 대기  
**세션**: `명승 검색 #1, 화엄사 0건`

- **증상**: 명승 홈에서 「화엄사」검색 시 결과 없음
- **원인**: (1) draft 입력만으로 검색 활성→기본 수도권·시도·hub에 걸려 0건 (2) 검색 중 권역 칩이 시도·hub 재시드 (3) CHA ctcd 52를 전북으로 오매핑(실제 전남광주·구례)
- **한 일**: 확정어만 필터 · 검색 중 권역만 전환 · ctcd52→전남 · smoke 화엄사
- **VERIFY**: `npm run smoke:korea-scenic-search` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-hwaeomsa`
- **Preview**: `https://days-git-cursor-scenic-hwaeomsa-search-8838-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「「화엄사」검색 0건 보정」
- **남은 일**: 사람 Preview QA(화엄사 검색→선정·명승)
- **다음 채팅명**:

```
명승 검색 #2, 화엄사 QA
```

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
- **다음 채팅명**:

```
로그북 #2, 공개피드 CTA QA
```

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
