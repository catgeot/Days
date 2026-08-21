# 2026-08-21 프로젝트 일지

직전: [`2026-08-20-project-log.md`](./2026-08-20-project-log.md)

## 영문화 #39, 명승·테마 UI·지도 EN — Preview push

- **범위** `ThemeSpotDetailModal` — 크로스 레일·주변 POI·라이트박스·영상 UI `korea.theme.spotDetail` · TourAPI 본문 `lang="ko"` 유지
- **지도** `localizeMapDrillCrumbLabel` — breadcrumb EN · `scenicSpotMapTitle` — 핀 라벨 `nameEn` 우선
- **VERIFY** `audit:i18n` · `build` · `smoke:korea-scenic-place-label` · `smoke:korea-scenic-map` · `smoke:browser-locale-hint` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — `/korea/theme/scenic` 모달·지도 breadcrumb·핀
- **다음** Preview QA — 명승 상세 모달 EN · 지도 드릴 breadcrumb/핀 · 잔여 한글(작업 로그 등)

## 영문화 #39 follow-up — 내 위치 지도 칩 EN

- **원인** `nearbySpotMapChips`가 `spot.name`(한글)만 사용 · `ScenicPage` near 칩에 locale 미전달
- **수정** `scenicSpotMapTitle(spot, locale)` · curated/heritage/tour near 칩 `{ locale }` · `smoke:korea-scenic-nearby` 춘천 EN assert
- **VERIFY** `smoke:korea-scenic-nearby` · `build` PASS · **SHA** `0154d9d0` · PR #141

## 영문화 #39 follow-up — 내 위치 칩 줌 확대 시 전체 제목

- **동작** 줌 ≥12에서 `labelFull` 표시 · `<12`는 기존 10자 truncate · 핀과 동일 `KOREA_MAP_PIN_LABEL_FULL_ZOOM`
- **VERIFY** `smoke:korea-scenic-nearby` · `smoke:korea-scenic-map` · `build` PASS

## 영문화 #40 follow-up — 명승 모달 인근 축제 본문 연계

- **추가** `ThemeSpotDetailModal` 본문 「인근 축제」— `fetchNearbyFestivals` · 클릭→`/korea?from=theme&festival=` · `themeBack` 복귀
- **EN** sameHub·인근 hub·숙소/투어 키워드 라벨 · deep-link `lang=en` 유지
- **VERIFY** `build` · `smoke:korea-theme-spot-modal`(i18n assert) · `smoke:scenic-detail-locale` PASS · **SHA** `739c18de`

- **수정** `ThemeSpotDetailModal` 헤더 `displayTitle` → `scenicSpotMapTitle(spot, locale)` (EN title 누락)
- **스모크** `smoke:korea-theme-spot-modal` i18n 키 assert · `smoke:scenic-detail-locale` breadcrumb·핀·title EN 검증 추가
- **VERIFY** `audit:i18n` · `build` · `smoke:scenic-detail-locale` · `smoke:korea-scenic-place-label` · `smoke:korea-scenic-map` · `smoke:korea-scenic-nearby` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · `/qa/en` · PR #141
- **다음** 사람 Preview QA → **#41 축제 지도·title EN**

**다음 제시어 (#41)**:

```
영문화 #41, 축제 지도·title EN
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
cursor/en · /korea?lang=en · KoreaFestivalMap · titleEn join
```

## 영문화 #41, 축제 지도·title EN — titleEn join

- **데이터** `fetchKoreaFestivalsRolling12` — ko 목록 + `festivalWindow` locale=en → `contentId` join `titleEn` · 카드 `title`(ko) 유지
- **지도** `KoreaFestivalMap` — `festivalMapTitle(item, locale)` 핀 라벨 EN
- **상세** `FestivalDetailSheet` 헤더 — `titleEn` 우선 · 본문·TourAPI detail ko SSOT
- **VERIFY** `audit:i18n` · `build` · `smoke:festival-detail-locale` · `smoke:browser-locale-hint` · `smoke:korea-scenic-place-label` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · PR #141 · `/qa/en` · `/korea?lang=en`
- **다음** 사람 Preview QA — 축제 지도 핀·상세 헤더 EN · 목록·본문 ko

**다음 제시어 (Preview QA)**:

```
영문화 #41, 축제 지도·title EN — Preview QA
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
cursor/en · /korea?lang=en · KoreaFestivalMap · FestivalDetailSheet 헤더
```
