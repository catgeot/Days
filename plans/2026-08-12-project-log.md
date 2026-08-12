# 2026-08-12 프로젝트 일지

직전: [`2026-08-11-project-log.md`](./2026-08-11-project-log.md)

## 명승 검색 #1, 화엄사 0건

**상태**: feature `cursor/scenic-hwaeomsa-search-8838` · PR [#110](https://github.com/catgeot/Days/pull/110) · tip `25d3788d` · (#109 머지 후속) · Preview QA 대기
**세션**: `명승 검색 #1, 화엄사 0건`

- **증상**: 「화엄사」검색 0건 · 관광지 파드에 사찰 없음 · (후속) 선정·명승은 나오는데 관광지만 「이 종목 0건」
- **원인**: (1) draft 검색+권역 시드 (2) CHA ctcd52 전북 오매핑 (3) TourAPI areacode/cat 공백 → areaBased sync 누락 (4) 검색 확정 시 tregion이 수도권 유지 + 명소 매칭 있으면 관광지 권역 자동전환 skip
- **한 일**: 검색 UX · ctcd52→전남 · DB upsert 127923 · curated 백필·추론 · smoke infer · 관광지 권역을 명소·명승 매칭 우선 + 현 권역 0건 시 전환
- **VERIFY**: smoke:korea-scenic-search · smoke:tourapi-attraction-infer · DB ilike 화엄사
- **공유**: `https://www.gateo.kr/qa/scenic-hwaeomsa`
- **Preview**: `https://days-git-cursor-scenic-hwaeomsa-search-8838-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「검색 시 관광지 권역이 수도권에 남는 문제」
- **남은 일**: Preview QA(「화엄사」→ 관광지 파드 결과) · curated 잔여 백필(429) 재시도 가능
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
