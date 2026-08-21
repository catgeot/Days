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

**다음 제시어**:

```
영문화 #40, Preview QA — 명승 모달·지도 EN
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
cursor/en · /korea/theme/scenic?lang=en · ThemeSpotDetailModal · 지도 breadcrumb
```
