# 2026-08-25 project log

이전: [`2026-08-24-project-log.md`](./2026-08-24-project-log.md)

## 영문 검색 SEO — 여행지 메타·써머리

- **문제**: `?lang=en` UI는 있으나 PlaceCard meta·써머리가 한글 `desc`·제네릭 탭 문구, place sitemap hreflang 없음
- **조치**: `placeSeoEnOverrides`(tier1+phuket+galapagos) · `placeSeoText` · Helmet keywords · index EN 크롤러 링크 · sitemap `/place/*` hreflang
- **VERIFY**: `npm run smoke:place-seo-en` · `npm run build` PASS
- **커밋**: `3cd50468` · `22c7e667` — **main push 완료** (2026-08-25)
- **후속 플랜**: [`en-seo-followup-plan.md`](./en-seo-followup-plan.md) — SPA prerender · tier2 · RSS · `/en/` prefix

**사람 QA**: PROD 배포 후 view-source — `/place/phuket/gallery` · `/place/phuket/planner?lang=en` title·keywords·description

## 외부 검색 — 탭별 title·sitemap (2026-08-25)

- **범위**: 홈 내부 검색 변경 없음 · **Google/Naver** 「지명+여행/갤러리/플래너」용 Helmet·sitemap
- **조치**: `getPlaceTabSeoTitle` · 탭별 keywords · canonical `/place/:slug/:tab` · sitemap gallery/planner ×273 · index KO 링크
- **VERIFY**: `smoke:place-seo-en` · `build` PASS

## 검색노출 — 세션표·핸드오프 (2026-08-25)

- **결정**: 세션당 1 산출 · tier2 40 slug/세션 · **#1~#5·#8~#9 = main** · **#6~#7 = `cursor/en-seo`+PR**
- **문서**: [`en-seo-followup-plan.md`](./en-seo-followup-plan.md) §2 세션표 · [`feature-handoff-index.md`](./feature-handoff-index.md) 행 추가
- **시작 필수**: `git fetch origin main && git pull --rebase origin main` — 스냅샷·로컬 구버전 작업 금지

## 검색노출 #2 — 검색의도 SSOT (2026-08-25)

- **조치**: [`placeSearchIntent.js`](../src/data/placeSearchIntent.js) 신규 — intentId·tab·ko/enQuerySuffix·title·descLead·sitemapPriorityOffset · `placeSeoText` import 연동 (TAB_INTENT 중복 제거)
- **VERIFY**: `npm run smoke:place-seo-en` · `npm run build` PASS

## 검색노출 #3 — tier2 EN 배치1

- **범위**: tier2 · popularity≥80 상위 **40 slug** → `placeSeoEnOverrides` (66→106)
- **감사**: `npm run audit:place-seo-en` 신규 — Hangul 0 · desc 길이 · 커버리지 리포트
- **VERIFY**: `audit:place-seo-en` · `smoke:place-seo-en` · `build` PASS
- **잔여**: tier2 pop≥80 미커버 2 (`kobe` · `okinawa`) — 배치2
- **다음**: `검색노출 #4, tier2 EN 배치2`

## 검색노출 #4 — tier2 EN 배치2

- **범위**: `kobe`·`okinawa` + tier2 pop **70–79** 상위 **38 slug** → overrides (106→146)
- **VERIFY**: `audit:place-seo-en` (tier2 pop≥80 **43/43**) · `smoke:place-seo-en` · `build` PASS
- **잔여**: tier2 pop 70–79 미커버 **~70 slug** (백로그) · 다음 세션표 **#5 explore·korea hreflang**
- **다음**: `검색노출 #5, explore·korea hreflang`

## 검색노출 #5 — explore·korea hreflang

- **조치**: `I18N_HUB_PATHS` 3→9 (`/explore` · `/korea/theme`·courses·packages·top10·regions) · `generate-sitemap.cjs` 동기 · `public/sitemap.xml` 재생성
- **smoke**: explore·korea/theme·courses hreflang en assert 추가
- **VERIFY**: `smoke:place-seo-en` · `build` PASS
- **다음**: `검색노출 #6, 크롤러 HTML MVP` (`cursor/en-seo`)

## 검색노출 #5 보완 — build·PROD sitemap SSOT

- **문제**: `vite-plugin-sitemap`이 build 시 `dist/sitemap.xml`을 덮어써 hreflang·#5 작업이 PROD에 안 갔음
- **조치**: plugin 제거 · `build`에 `generate-sitemap` 선행 · `verify-sitemap-dist` 게이트 · `npm run generate:sitemap`
- **VERIFY**: `build` (dist hreflang 2484) · `smoke:place-seo-en` PASS

## 검색노출 #8 — 정적링크·baseline

- **조치**: `generate:index-static-links` — tier1 64 × intent(gallery·travel) KO 링크 128개 · `index.html` 마커 블록 · GSC baseline CSV 템플릿(`scripts/data/gsc-seo-baseline-template.csv`)
- **VERIFY**: `smoke:place-seo-en` · `build` PASS
- **사람**: GSC URL Inspection — 템플릿 CSV에 `gsc_index_status`·`gsc_last_crawl` 기록 후 `scripts/outputs/gsc-seo-baseline.csv`로 저장(로컬·gitignore)
- **다음**: `검색노출 #9, RSS·canonical` (세션표 순서) · **#6·#7** 크롤러 HTML은 미완 백로그(`cursor/en-seo`)
