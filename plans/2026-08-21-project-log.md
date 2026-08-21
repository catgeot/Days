# 2026-08-21 프로젝트 일지

직전: [`2026-08-20-project-log.md`](./2026-08-20-project-log.md)

## 영문화 #39, 명승·테마 UI·지도 EN — Preview push

- **범위** `ThemeSpotDetailModal` — 크로스 레일·주변 POI·라이트박스·영상 UI `korea.theme.spotDetail` · TourAPI 본문 `lang="ko"` 유지
- **지도** `localizeMapDrillCrumbLabel` — breadcrumb EN · `scenicSpotMapTitle` — 핀 라벨 `nameEn` 우선
- **VERIFY** `audit:i18n` · `build` · `smoke:korea-scenic-place-label` · `smoke:korea-scenic-map` · `smoke:browser-locale-hint` PASS
- **브랜치** `cursor/en` · `/qa/en` · `?lang=en` — `/korea/theme/scenic` 모달·지도 breadcrumb·핀
- **다음** Preview QA — 명승 상세 모달 EN · 지도 드릴 breadcrumb/핀 · 잔여 한글(작업 로그 등)

**다음 제시어**:

```
영문화 #40, Preview QA — 명승 모달·지도 EN
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
cursor/en · /korea/theme/scenic?lang=en · ThemeSpotDetailModal · 지도 breadcrumb
```
