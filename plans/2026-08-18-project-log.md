# 2026-08-18 프로젝트 일지

직전: [`2026-08-16-project-log.md`](./2026-08-16-project-log.md)

## 영문화 #1, locale 기반

- **i18n** `src/i18n/` — `i18next` · `LocaleProvider` · ko/en JSON SSOT
- **URL** `?lang=en` + `localStorage`(`gateo.locale`) · `document.documentElement.lang` 동기
- **헤더** `LocaleToggle` — PC 툴바·모바일 검색 옆 EN/한 토글
- **공통 키** 홈 검색 placeholder · `SiteUpdateBanner` 카피
- **PR** [#132](https://github.com/catgeot/Days/pull/132) · tip 갱신 예정
- **hotfix** i18n 동기 init — react-i18next Suspense 빈 화면
- **다음** #2 홈·PlaceCard 주요 카피 en
