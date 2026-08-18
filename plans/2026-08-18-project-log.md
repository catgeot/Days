# 2026-08-18 프로젝트 일지

직전: [`2026-08-16-project-log.md`](./2026-08-16-project-log.md)

## 영문화 #3, korea·theme — Preview QA 대기

- **`korea.*`** i18n 키 — `/korea` 축제 허브 · `/korea/theme` 랜딩 · `/korea/theme/scenic` 명승 헤더·검색·칩·목록·지도·즐겨찾기·위치 안내
- **공통** `RecentSearchSuggestions` · `ThemeModuleBackButton` · `koreaUi.js`(시간·테마 칩 라벨)
- **VERIFY** `npm run build` PASS
- **PR** [#132](https://github.com/catgeot/Days/pull/132)
- **Preview** `/qa/en` · `?lang=en` → `/korea` · `/korea/theme/scenic` 헤더·검색·필터 영문
- **다음** #4 SEO·릴리스(합의 후)

## 영문화 #2, 홈·PlaceCard — 사람 Preview QA OK

- **홈** 카테고리 칩·바로가기·지구본 메뉴 라벨 → `home.*` i18n 키
- **PlaceCard** 탭·헤더·플래너 툴킷 섹션·링크 CTA · `name_en`/`country_en` 표시
- **VERIFY** `build` · `smoke:place-label-slug` PASS
- **PR** [#132](https://github.com/catgeot/Days/pull/132) · tip `4821414b`
- **Preview** `/qa/en` · `?lang=en` 홈·장소 카드·플래너 영문 — **사람 QA OK**
- **다음** #3 한국 투톱(사람 합의 후)

## 영문화 #1, locale 기반 — 사람 Preview QA OK

- **i18n** `src/i18n/` — `i18next` · `LocaleProvider` · ko/en JSON SSOT
- **URL** `?lang=en` + `localStorage`(`gateo.locale`) · `document.documentElement.lang` 동기
- **헤더** 로고 옆 `LocaleToggle` EN/한 · 검색 placeholder · `SiteUpdateBanner` 카피
- **hotfix** Suspense 빈 화면 · `LocaleContext` 누락 · URL 동기화 레이스
- **PR** [#132](https://github.com/catgeot/Days/pull/132) · tip `00f1ae1a`
- **Preview** `/qa/en` · `?lang=en` 토글·placeholder 영문 전환 확인
- **다음** #2 홈·PlaceCard 주요 카피 en
