# 2026-08-18 프로젝트 일지

직전: [`2026-08-16-project-log.md`](./2026-08-16-project-log.md)

## 영문화 #2, 홈·PlaceCard — 사람 Preview QA OK

- **홈** 카테고리 칩·바로가기·지구본 메뉴 라벨 → `home.*` i18n 키
- **PlaceCard** 탭·헤더·플래너 툴킷 섹션·링크 CTA · `name_en`/`country_en` 표시
- **VERIFY** `build` · `smoke:place-label-slug` PASS
- **PR** [#132](https://github.com/catgeot/Days/pull/132) · tip `97cbab99`
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
