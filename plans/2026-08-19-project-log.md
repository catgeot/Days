# 2026-08-19 프로젝트 일지

직전: [`2026-08-18-project-log.md`](./2026-08-18-project-log.md)

## 영문화 #13, 지구본 칩·국가 — Preview push

- **지구본 칩** `GlobeFaceRegionRail` — 소권역·나라·대양·해역 칩 label·aria en
- **i18n** `globeUi.js` · `home.globe.country`(219) · `subregion`(면별) · `ocean` · `oceanChipAria`
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · PR #135
- **Preview** `/qa/en` · `?lang=en` — 홈 지구본 칩·나라 목록
- **다음** 사람 Preview QA → 잔여 영문화 또는 PROD

## 영문화 #13 보정 — 동해 en 표기

- **동해** `name_en` Sea of Japan → **East Sea** (한국 표기 관례)
- **검색 alias** `East Sea` 추가 · `Sea of Japan`은 검색용 alias 유지
- **동중국해** alias에서 `동해` 오탐 제거
- **VERIFY** `generate:sea-basins` · `smoke:sea-basin-rail` · `build` PASS

## 영문화 #13, Preview QA PASS

- **사람 QA** `/qa/en` · `?lang=en` — 지구본 칩·나라·동해(East Sea) **통과**
- **tip** `022d1848` · PR [#135](https://github.com/catgeot/Days/pull/135)
- **다음** #14 지구본 지명·맵

## 영문화 #14, Preview QA PASS

- **사람 QA** `/qa/en` · `?lang=en` — gateo 핀·Mapbox 지명·클러스터 범례 **통과**
- **tip** `ff0cfe5f` · PR [#135](https://github.com/catgeot/Days/pull/135)
- **다음** #15 TourAPI 프록시 EN (`EngService2` + locale 캐시)
