# 2026-08-18 프로젝트 일지

직전: [`2026-08-16-project-log.md`](./2026-08-16-project-log.md)

## 영문화 #9, 로그북·대시보드 — Preview push

- **`logbook.*`** i18n — `/blog` 대시보드·RecentList·Calendar·CurationCard · Write·Detail·PublicViewer · Sidebar·PublicNav·UserProfile·QuickMemo·SlideViewer · `/blog/curation`·CurationHub(취향 칩 id)
- **헬퍼** `src/i18n/logbookUi.js` · `reportAuthor` fallback `traveler`
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · PR [#133](https://github.com/catgeot/Days/pull/133)
- **Preview** `/qa/en` · `?lang=en` → `/blog` · `/blog/write` · `/blog/curation`
- **다음** 사람 Preview QA → #10 잔여·병합 합의

## 영문화 #8.5, 중간점검 — 무니·써머리 QA

- **버그 수정** 모바일 갤러리→무니 시 연관 여행지 하단 푸터가 채팅 칩과 겹침 — `isMooniChatOpen`으로 포털 숨김 · tip `5e7337c4`
- **써머리** 모바일 설명란 탭으로 확장 카드 진입 복구(제목·헤더는 오탭 방지 유지) · tip `78b372f2`
- **VERIFY** `npm run build` PASS · PR [#133](https://github.com/catgeot/Days/pull/133)
- **Preview** `/qa/en` · `?lang=en` — 갤러리→무니·써머리 설명 탭 QA

## 영문화 #8, 한국 테마 나머지 — Preview

- **courses** `/korea/theme/courses` — 페이지·상세 모달·시도 칩 `korea.theme.courses.*`
- **scenic 잔여** — 섹션·검색·내 주변·빈 상태·페이지네이션 `korea.theme.scenic*`
- **지도** `KoreaScenicMap` — 위치·드릴·전체화면 `korea.theme.map.*`
- **nav** 테마 모듈 복귀 라벨 `korea.theme.nav.module.*`
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **PR** [#133](https://github.com/catgeot/Days/pull/133) · 브랜치 `cursor/en`
- **Preview** `/qa/en` · `?lang=en` → `/korea/theme/courses` · `/korea/theme/scenic` — **사람 QA**
- **다음** #9 로그북·대시보드

## 영문화 #7, PlaceCard 세부 — Preview

- **PlaceCard 세부** 갤러리·위키·영상·채팅·리뷰·요약·플래너 로딩·공통 `place.*` i18n 키 en/ko
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **브랜치** `cursor/en` · **Preview** `/qa/en` · `?lang=en` PlaceCard 샘플 slug QA
- **다음** 사람 Preview QA → 한국 테마 나머지·로그북 등 #8+

## 영문화 #5, PROD 병합 — main 반영

- **PR** [#132](https://github.com/catgeot/Days/pull/132) **main merge** `bc381852`
- **Preview QA** (#2~#6) — 사람 QA OK (merge 전)
- **PROD** Vercel 배포 후 `/qa/en` → `/?lang=en` 재확인
- **다음** #7 PlaceCard 세부·확장 영문화 (`cursor/en` 새 세션)

## 영문화 #5, PROD 병합·QA — Preview QA OK · merge 대기

- **Preview QA** (#2~#6) git Preview `?lang=en` — **사람 QA OK**
- **PROD `/qa/en`** → `/qa` 목록 — **예상 동작**(PR #132 미병합 · `main`에 `/qa/en` redirect·`en` slug 없음)
- **VERIFY** `npm run build` · `smoke:place-label-slug` PASS
- **PR** [#132](https://github.com/catgeot/Days/pull/132) — **사람 승인 후 merge** → 배포 후 `/qa/en`·PROD #1 재확인
- **병합 후** `/qa/en` → `https://www.gateo.kr/?lang=en`
- **다음** merge·PROD 배포 → #6 PROD QA 확인·정리

## 영문화 #4, SEO·릴리스 — 사람 Preview QA OK

- **SEO** `hreflang` ko/en/x-default · locale별 canonical·og:locale · `seo.*` i18n 기본 title/description
- **sitemap** 홈·`/korea`·`/korea/theme/scenic` xhtml alternate (`generate-sitemap.cjs`)
- **릴리스** `releaseNotes.js` `2026-08-18` 영문 UI 공지
- **VERIFY** `npm run build` PASS
- **PR** [#132](https://github.com/catgeot/Days/pull/132)
- **Preview** `/qa/en` · `?lang=en` → 페이지 소스 hreflang·영문 meta — **사람 QA OK**
- **다음** #5 PROD 병합·QA

## 영문화 #3, korea·theme — 사람 Preview QA OK

- **`korea.*`** i18n 키 — `/korea` 축제 허브 · `/korea/theme` 랜딩 · `/korea/theme/scenic` 명승 헤더·검색·칩·목록·지도·즐겨찾기·위치 안내
- **공통** `RecentSearchSuggestions` · `ThemeModuleBackButton` · `koreaUi.js`(시간·테마 칩 라벨)
- **VERIFY** `npm run build` PASS
- **PR** [#132](https://github.com/catgeot/Days/pull/132)
- **Preview** `/qa/en` · `?lang=en` → `/korea` · `/korea/theme/scenic` 헤더·검색·필터 영문 — **사람 QA OK**
- **다음** #4 SEO·릴리스

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
