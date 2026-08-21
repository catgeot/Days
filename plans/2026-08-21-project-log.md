# 2026-08-21 프로젝트 일지

직전: [`2026-08-20-project-log.md`](./2026-08-20-project-log.md)

## 영문화 #38, PROD QA — 한국 2차 UI·지도명 잔여 확인

- **범위** main `72144c4d` · `/korea?lang=en` · `/korea/theme/scenic?lang=en`
- **PASS** 축제 상단 분류칩 EN · 홈·탐색·PlaceCard P0
- **잔여** 명승 지도 breadcrumb 한글 · 지도 핀(축제·명소) 한글 · `ThemeSpotDetailModal` UI 한글(eyebrow만 EN)
- **합의** TourAPI·blurb **본문** ko SSOT 유지 · **상단 title·UI 셸·지도 핀 라벨** EN 필요
- **다음** **#39·#40 2세션** — 플랜 [`i18n-en-plan.md`](./i18n-en-plan.md) **§12**

## 영문화 #38 후속, #39·#40 세션 분할 확정

- **#39** A·B·C·D₁ — 명승·테마: `ThemeSpotDetailModal` UI · 지도 breadcrumb·명소 핀 · 상단 title
- **#40** D₂·E — 축제: `KoreaFestivalMap` 핀 · `FestivalDetailSheet` 헤더 title · `titleEn` join
- **금지** #39에서 축제 지도 파일 수정

**다음 제시어 (#39)**:

```
영문화 #39, 명승·테마 UI·지도 EN
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
cursor/en · /korea/theme/scenic?lang=en · ThemeSpotDetailModal · 지도 breadcrumb·핀
```

**#39 종료 후 (#40)**:

```
영문화 #40, 축제 지도·title EN
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
cursor/en · /korea?lang=en · KoreaFestivalMap · titleEn join
```
