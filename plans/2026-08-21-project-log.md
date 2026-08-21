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

## 영문화 #42, PROD QA — 탐색 크래시·titleEn 캐시

- **크래시** `614ed344` EN 라벨 추가 후 `CardBackgroundImage`가 스코프 밖 `displayName` 참조 → lazy load 시 ReferenceError · **수정** `648fa6bf`
- **성능** ko locale 첫 fetch 시 en window 2nd fetch 생략 · en 전환·캐시 hit lazy merge 유지 · **904c93e7**
- **VERIFY** `audit:i18n` · `build` · `smoke:festival-detail-locale` PASS
- **사람 QA** main push·배포 후 `/?lang=en` → 탐색 진입·Island getaways · `/korea?lang=en` 축제 EN title

## 영문화 #42 — 명승 모달 PACKAGES CTA EN

- **증상** `?lang=en` 명승 상세 PACKAGES 버튼 「강원 패키지」ko 유지
- **수정** `ThemeSpotCrossRail` → `localizedPackageCtaLabel(key)` · EN 「Gangwon packages」
- **VERIFY** `smoke:festival-detail-locale` · `build` PASS

## 영문화 #42 — 명승 모달 상단 지역 EN

- **증상** `?lang=en` 명승 모달 제목 아래 「강원」ko (축제→인근 명승 경로)
- **수정** `localizedSpotModalSubtitle` · `toScenicModalSpot` · `formatScenicSpotPlaceLabel` areaCode 폴백 · `142fb4d9`+`…`
- **VERIFY** node `formatScenicSpotPlaceLabel({region:강원}, en)` → Gangwon

## 영문화 #42a, PROD QA — 지구본·항공·칩 EN

- **범위** `?lang=en` PROD 회귀 5항목 — 숙소 헤더 · 3D 투어·경계 · 연관 칩 · FlightCinemaBar
- **키** `home.globe.*` · `home.flightCinema.*` · `place.common.relatedGatewayHint`
- **VERIFY** `audit:i18n` · `build` · browser-locale·place-label smoke PASS
- **잔여** LogoPanel · Footer/About → **#42b**

**다음 제시어 (#42b)**:

```
영문화 #42b, PROD QA — 로고·About
@plans/feature-handoff-index.md
@plans/2026-08-21-project-log.md
@plans/i18n-en-plan.md
main · ?lang=en · LogoPanel · FooterModal · footerData contentEn
```
