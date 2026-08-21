# 2026-08-21 프로젝트 일지

직전: [`2026-08-20-project-log.md`](./2026-08-20-project-log.md)

## 영문화 #38, PROD QA — 한국 2차 UI·지도명 잔여 확인

- **범위** main `72144c4d` · `/korea?lang=en` · `/korea/theme/scenic?lang=en`
- **PASS** 축제 상단 분류칩 EN · 홈·탐색·PlaceCard P0
- **잔여** 명승 지도 breadcrumb·핀 · `ThemeSpotDetailModal` UI → **#39·#40** · 축제 지도·title → **#41**

## 영문화 #39~#41 — 명승·축제 UI·지도 EN (cursor/en · PR #141)

- **#39** `ThemeSpotDetailModal` UI · 지도 breadcrumb·핀 · `scenicSpotMapTitle`
- **#40** 명승 모달 헤더·인근 축제 크로스 · 내 위치 칩 EN
- **#41** `festivalTitleEnMerge` · `KoreaFestivalMap` · `FestivalDetailSheet` 헤더·크로스 UI
- **VERIFY** `audit:i18n` · `build` · `smoke:festival-detail-locale` · scenic 스모크 PASS
- **잔여(데이터)** EngService2 미등록 축제 핀 ko · TourAPI POI명 ko — 차차

## 영문화 #41, main 병합 — Preview QA OK

- **결정** 사람 Preview QA OK · 잔존 이슈는 차차 · **PR #141 → main `5c8adea5`**
- **다음** **#42 테스트·최적화** — PROD 회귀 · en fetch/캐시 · 알려진 한계 정리

## 영문화 #42, PROD QA — 탐색 썸네일 EN

- **증상** `?lang=en` 탐색 Island getaways 카드 제목·국가가 한글(`spot.name`·`country`)
- **수정** `SpotThumbnailCard` → `getLocalizedPlaceName` / `getLocalizedCountryName` (`614ed344`)
- **VERIFY** `audit:i18n` · `build` PASS · island 샘플 EN 라벨 node 확인
- **사람 QA** main push·배포 후 `/?lang=en` → 탐색 → Island getaways 카드 EN 재확인

**다음 제시어 (#42)**:

```
영문화 #42, PROD QA — 탐색 썸네일 EN
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
main · ?lang=en · Island getaways 카드 EN
```
