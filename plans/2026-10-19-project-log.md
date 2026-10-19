# 2026-10-19 프로젝트 일지

이전: [`2026-10-17-project-log.md`](./2026-10-17-project-log.md)

## 해외 장소 KTO 갤러리 · 현지정보 헤더 UX

- draft [#511](https://github.com/catgeot/Days/pull/511) `cursor/overseas-kto-gallery-53b4` — 카이로 등 해외 Hangul 지명이 TourAPI를 켜던 게이트 제거 · `place_stats` TourAPI 행 해외 필터 · 현지정보/다녀온 이야기 접기 라벨 UX. audit 해외 2건(cairo·dubai). **병합 금지**.

- draft [#511](https://github.com/catgeot/Days/pull/511) QA hold: curated 게이트 복구 · WebKit search-path 캡처 · 국내 3곳 prod=local KTO.

- [#511](https://github.com/catgeot/Days/pull/511) Venice live TourAPI on prod; 10-place live sample + before/after 캡처.

## 국내 갤러리 스톡 relevance · PR #525 r3

- 브랜치 `cursor/korea-gallery-stock-relevance-f0f1` · draft [#525](https://github.com/catgeot/Days/pull/525) · tip `0fd6ae43` — Tour 타일 페인트(VisitKorea referrer·eager load)·로딩 크롬 `isPaintPending`·Tour-dominant Pexels skip · R3 WebKit 캡처(`e2e/korea-gallery-r3-capture.spec.js`, artifacts `korea-gallery-r3/`).
- QA: home→place→`/gallery` · 한반도섬/양구/청주/두타연 r2 initial **전타일 painted** · reentry pexels **0** (국내).
