# 2026-08-12 프로젝트 일지

직전: [`2026-08-11-project-log.md`](./2026-08-11-project-log.md)

## 축제·명승 검색 #1, 최근 검색어

**상태**: feature `cursor/korea-recent-search-972e` · PR [#111](https://github.com/catgeot/Days/pull/111) · tip `5878f515` · Preview QA 대기  
**세션**: `축제·명승 검색 #1, 최근 검색어`

- **요청**: 축제홈·명승홈 검색을 반복할 때 매번 같은 텍스트를 다시 치지 않게
- **한 일**: localStorage 최근 검색어(축제/명승 키 분리) · 검색창 포커스/활성 시 목록 · 입력 중 부분 일치 필터 · 항목 삭제·전체 지우기
- **VERIFY**: `npm run smoke:korea-recent-searches` · `npm run build` · 로컬 UI 스모크(축제·명승 드롭다운)
- **공유**: `https://www.gateo.kr/qa/korea-recent-search`
- **Preview**: `https://days-git-cursor-korea-recent-search-972e-catgeots-projects.vercel.app/korea` · 명승 `/korea/theme/scenic`
- **작업 로그**: 「축제홈·명승홈 최근 검색어」
- **남은 일**: 사람 Preview QA
- **다음 채팅명**:

```
축제·명승 검색 #2, 최근 검색어 QA
```

## 명승 검색 #1, 화엄사 0건

**상태**: `main` 반영 · PR [#110](https://github.com/catgeot/Days/pull/110) · 사람 QA OK
**세션**: `명승 검색 #1, 화엄사 0건`

- **증상**: 「화엄사」검색 0건 · 관광지 파드에 사찰 없음 · (후속) 선정·명승은 나오는데 관광지만 「이 종목 0건」
- **원인**: (1) draft 검색+권역 시드 (2) CHA ctcd52 전북 오매핑 (3) TourAPI areacode/cat 공백 → areaBased sync 누락 (4) 검색 확정 시 tregion이 수도권 유지 + 명소 매칭 있으면 관광지 권역 자동전환 skip
- **한 일**: 검색 UX · ctcd52→전남 · DB upsert 127923 · curated 백필·추론 · 관광지 권역 매칭 우선 · main 병합
- **VERIFY**: smoke:korea-scenic-search · build · 사람 Preview QA OK
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`
- **작업 로그**: 종료(`active: false`) · `/qa/scenic-hwaeomsa` → PROD
- **남은 일**: curated 잔여 백필(429)은 별도 세션

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
