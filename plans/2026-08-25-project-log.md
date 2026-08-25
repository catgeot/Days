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

## 검색노출 #6 — 크롤러 HTML MVP (2026-08-25)

- **브랜치**: `cursor/en-seo` (신규 feature)
- **조치**: Vercel Edge `middleware.js` — Googlebot·`?crawler=1` 시 tier1 `/place/:slug/gallery|planner` view-source에 tab별 title·description·keywords·canonical·hreflang 주입
- **SSOT**: `scripts/generate-crawler-place-meta.mjs` → `src/edge/crawlerPlaceMeta.generated.js` (64 slug × 2 tab × ko/en)
- **커밋**: `605a2ba4` · PR #151
- **Preview**: `www.gateo.kr/qa/en-seo` → `/place/tokyo/gallery?crawler=1` view-source

## 검색노출 #7 — 크롤러 HTML 확장 (2026-08-25)

- **브랜치**: `cursor/en-seo`
- **조치**: middleware matcher `/` · `/korea` · `/place/:slug`(tier1 base) · `crawlerHubMeta.generated.js` · `resolveCrawlerMeta.js` · smoke Googlebot UA 4경로
- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `build` PASS
- **Preview QA**: view-source `?crawler=1` — `/` · `/korea` · `/place/tokyo` · `/place/tokyo/gallery` · middleware 시뮬 PASS
- **main 병합**: PR #151 (2026-08-25)

## 검색노출 #6·#7 QA·main 병합 (2026-08-25)

- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `build` PASS · middleware 시뮬 5경로 OK
- **충돌**: origin/main #8 정적링크와 merge 해결
- **main**: `bc50e939` — PR #151 merge
- **사람 PROD QA**: 배포 후 view-source `?crawler=1` — `/` · `/korea` · `/place/tokyo/gallery`
- **다음**: `검색노출 #9, RSS·canonical`

## 검색노출 #8 — 정적링크·baseline

- **조치**: `generate:index-static-links` — tier1 64 × intent(gallery·travel) KO 링크 128개 · `index.html` 마커 블록 · GSC baseline CSV 템플릿(`scripts/data/gsc-seo-baseline-template.csv`)
- **VERIFY**: `smoke:place-seo-en` · `build` PASS
- **사람**: GSC URL Inspection — 템플릿 CSV에 `gsc_index_status`·`gsc_last_crawl` 기록 후 `scripts/outputs/gsc-seo-baseline.csv`로 저장(로컬·gitignore)
- **다음**: `검색노출 #9, RSS·canonical`

## 검색노출 #9 — RSS·canonical (2026-08-25)

- **조치**: `public/rss-en.xml` 신규 · KO `rss.xml` gallery canonical 링크·bilingual item(EN/KO 상호 링크) · `generate-sitemap.cjs` locale 분기 · `smoke:rss-canonical` · `verify-rss-dist`
- **canonical**: RSS item·guid → `/place/:slug/gallery` (PlaceCard·crawler SSOT와 동일) · EN `?lang=en`
- **VERIFY**: `smoke:rss-canonical` · `smoke:place-seo-en` · `smoke:crawler-place-meta` · `build` PASS
- **사람**: 네이버 서치어드바이저에 `https://www.gateo.kr/rss-en.xml` 추가 제출(선택)
- **다음**: `검색노출 #10, OG·스키마`

## 검색노출 #10 — OG·스키마 (2026-08-25)

- **조치**: `placeSeoOg.js` · tier1 `placeSeoOgImageOverrides`(64 slug) · PlaceCard/SEO slug og:image · gallery `ImageGallery`+`ImageObject` JSON-LD · crawler inject ogImage·schema
- **VERIFY**: `smoke:place-seo-en` · `smoke:crawler-place-meta` · `smoke:rss-canonical` · `build` PASS
- **main**: `3b1816a8`
- **사람 QA**: `/place/phuket/gallery` — DevTools `og:image`·`ImageGallery` JSON-LD · view-source `?crawler=1` `/place/tokyo/gallery`

## 검색노출 #10 — PROD QA og:image·ImageGallery (2026-08-25)

- **tier1 crawler (view-source `?crawler=1`)** — `/place/tokyo/gallery` **PASS**: `x-crawler-meta: tier1-place` · title `도쿄 여행 사진 · 갤러리` · og:image Unsplash slug URL(전역 `og-image.png` 아님) · `ImageGallery`+`ImageObject` JSON-LD in `<head>`
- **tier2 phuket (view-source)** — `/place/phuket/gallery?crawler=1` **의도대로**: tier2는 crawler meta map 밖 → 초기 HTML은 전역 meta 유지( smoke `tier2 slug not in meta map` ). SPA 로드 후 Helmet·JSON-LD는 **DevTools** 확인
- **phuket SPA 기대값**(DevTools): og:image pool `…/photo-1528127269322…` 또는 갤러리 hero URL · `script[data-schema-type="ImageGallery"]` (이미지 fetch 후)
- **VERIFY**: smoke 3종 재실행 PASS
- **잔여(사람)**: phuket 갤러리 DevTools 1회 · GSC URL Inspection tier1 gallery 재크롤

## 검색노출 #11 — tier2 crawler 배치1 (2026-08-25)

- **배경**: #6 MVP는 tier1 64만 view-source inject — tier2(phuket 등)는 **후속 배치** 대상이었음(영구 제외 아님)
- **조치**: `generate-crawler-place-meta` — tier1 + **tier2 popularity≥80 43 slug** (107 total) · og:image·ImageGallery crawler inject
- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `build` PASS
- **main push**: `be4dae28` → origin/main (2026-08-25)
- **PROD QA**: 배포 후 `/place/phuket/gallery?crawler=1` view-source 재확인
- **합의**: 「자유여행」= 플래너·여행 스케치(wiki)·로컬 왓슨·무니(대화) — §1.5 다면 랜딩 · 무니 전용 URL 없음

## 검색노출 #12 — tier2 crawler 배치2 (2026-08-25)

- **범위**: tier2 pop **70–79** 상위 **40 slug** → crawler meta (107→**147**)
- **샘플**: seychelles · chichen-itza · cinque-terre · maldives (pop79–78)
- **조치**: `generate-crawler-place-meta` batch2 로직 · smoke seychelles assert · hamburg(41위) 미포함 확인
- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `build` PASS
- **잔여**: tier2 pop70–79 **~69 slug** (3차 배치) · #13 항공 경로 · #14–#17 허브
- **PROD QA**: `/place/seychelles/gallery?crawler=1` view-source — title·og:image·ImageGallery JSON-LD
- **다음**: `검색노출 #12+, tier2 crawler 배치3`

## 검색노출 #12+ — tier2 crawler 배치3 (2026-08-25)

- **범위**: tier2 pop **70–79** 41–80위 **40 slug** → crawler meta (147→**187**)
- **샘플**: hamburg · havana · lombok · mount-bromo (pop76)
- **조치**: `generate-crawler-place-meta` batch3 로직 · smoke hamburg assert · bohol(81위) 미포함 확인
- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `smoke:rss-canonical` · `build` PASS
- **main push**: `1f5156c8` → origin/main (2026-08-25)
- **잔여**: tier2 pop70–79 **29 slug** (4차) · #13 항공 경로 · #14–#17 허브
- **PROD QA**: `/place/hamburg/gallery?crawler=1` view-source — title·og:image·ImageGallery JSON-LD
- **다음**: `검색노출 #13, tier2 crawler 배치4 마무리`

## 검색노출 #13 준비 — tier2 crawler 배치4 (2026-08-25)

- **목표**: pop70–79 잔여 **29 slug** → crawler meta **187→216** (tier2 pop70–79 **전수 완료**)
- **한 줄**: `generate-crawler-place-meta.mjs` — `TIER2_CRAWLER_POP70_79_INCLUDED` **80 → 109**
- **큐 SSOT**: [`scripts/data/tier2-crawler-pop70-79-queue.json`](../scripts/data/tier2-crawler-pop70-79-queue.json) · 샘플 bohol·galapagos·seoul
- **smoke**: count 216 · bohol assert ON · tier2 pop&lt;70 `santorini` null 유지
- **리팩터**: batch2/3 Set → 단일 `INCLUDED` 카운터 (출력 187 동일)
- **완료 후**: #14 항공 경로 · #15 허브 crawler

## 검색노출 #13 — tier2 crawler 배치4 (2026-08-25)

- **범위**: tier2 pop **70–79** 81–109위 **29 slug** → crawler meta (187→**216**)
- **한 줄**: `TIER2_CRAWLER_POP70_79_INCLUDED` **80 → 109** · pop70–79 **전수 완료**
- **샘플**: bohol · galapagos · seoul · ulaanbaatar
- **smoke**: count **216** · bohol assert ON · tier2 pop&lt;70 `santorini` null
- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `smoke:rss-canonical` · `build` PASS
- **main push**: `a74d24f5` → origin/main (2026-08-25)
- **PROD QA**: `/place/bohol/gallery?crawler=1` · `/place/galapagos/gallery?crawler=1` view-source
- **다음**: `검색노출 #14, 항공 경로 SEO`

## 검색노출 #14 — 항공 경로 SEO (2026-08-25)

- **조치**: `placeSearchIntent` `flight-route` intent(planner) · `placeFlightRouteSeo.js` — ICN→IATA desc·keywords · crawler planner meta 재생성
- **샘플**: tokyo ICN→HND 직항 · phuket ICN→HKT (runtime SSOT)
- **VERIFY**: `smoke:place-seo-en` · `smoke:crawler-place-meta` · `smoke:rss-canonical` · `build` PASS
- **PROD QA**: view-source `?crawler=1` — `/place/tokyo/planner` · `/place/phuket/planner` description·keywords에 ICN→IATA
- **다음**: `검색노출 #15, 허브 crawler`

## 검색노출 #15 — 허브 crawler (2026-08-25)

- **조치**: `crawlerHubMeta` — `/korea/theme/scenic` · `/explore` (locale KO·EN) · `resolveCrawlerMeta` HUB_PATHS · middleware matcher · smoke scenic·explore assert
- **SSOT**: `korea.theme.scenicTitle`/`scenicSeoDescription` · explore는 홈 default meta + canonical `/explore`
- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `smoke:rss-canonical` · `build` PASS
- **PROD QA**: view-source `?crawler=1` — `/korea/theme/scenic` title「한국의 명승」·`/explore` canonical
- **다음**: `검색노출 #16, 큐레이션·로그북 SEO`

## 검색노출 #16 — 큐레이션·로그북 SEO (2026-08-25)

- **조치**: `/blog`·`/blog/curation` Helmet(`logbook.seo`·`curationPage.seo*`) · sitemap `/logbook`→`/blog`+`/blog/curation` hreflang · `/logbook`→`/blog` 301 redirect · index 정적 링크 · hub crawler meta
- **VERIFY**: `smoke:place-seo-en` · `smoke:crawler-place-meta` · `smoke:rss-canonical` · `build` PASS
- **PROD QA**: view-source `?crawler=1` — `/blog/curation` title·canonical · `/blog` · sitemap에 `/blog`만
- **다음**: `검색노출 #17, 자유여행 intent`

## 검색노출 #17 — 자유여행 intent (2026-08-25)

- **조치**: `placeSearchIntent` planner+wiki **자유여행** suffix · planner descLead **MOONi(무니)** · wiki descLead **로컬 왓슨·현지 팁** · sitemap `/place/:slug/wiki` ×273 · crawler wiki inject · middleware matcher
- **VERIFY**: `smoke:place-seo-en` · `smoke:crawler-place-meta` · `smoke:rss-canonical` · `build` PASS (sitemap **1133** URL)
- **PROD QA**: view-source `?crawler=1` — `/place/tokyo/planner`(MOONi·자유여행 keywords) · `/place/tokyo/wiki`(로컬 왓슨·스케치)
- **다음**: `검색노출 #18, explore 카테고리`

## 검색노출 #18 — explore 카테고리 (2026-08-25)

- **조치**: `exploreCategorySeo.js` SSOT(6대륙×5테마) · Home Helmet · crawler hub 30경로 · middleware `/explore/:continent/:category` · sitemap explore hreflang · index EN 5링크
- **VERIFY**: `smoke:crawler-place-meta` · `smoke:place-seo-en` · `smoke:rss-canonical` · `build` PASS
- **PROD QA**: view-source `?crawler=1` — `/explore/asia/paradise`(아시아 휴양·호캉스 title·keywords) · `/explore/europe/culture?lang=en`
- **다음**: GSC baseline · tier2 EN 잔여

## 검색노출 #19 — GSC baseline·tier2 EN (2026-08-25)

- **GSC baseline**: `generate:gsc-baseline` — tier1 128 + tier2·hub·wiki·explore·flight 샘플 **174 URL** · `smoke:gsc-baseline` · `generate-index-static-links`에서 GSC 분리
- **tier2 EN batch3**: pop70–79 상위 **40 slug** → `placeSeoEnOverrides` (146→**186**) · 샘플 hamburg·ayutthaya·serengeti
- **audit**: pop70–79 **79/109** covered · Hangul 0 · desc 길이 0
- **VERIFY**: `audit:place-seo-en` · `smoke:gsc-baseline` · `smoke:place-seo-en` · `build` PASS
- **사람**: GSC URL Inspection — `scripts/data/gsc-seo-baseline-template.csv` → `scripts/outputs/gsc-seo-baseline.csv`(gitignore)
- **잔여**: tier2 EN pop70–79 **30 slug**
- **다음**: `검색노출 #20, tier2 EN 배치4 마무리`

## 검색노출 #20 — tier2 EN 배치4 마무리 (2026-08-25)

- **범위**: tier2 pop **70–79** 잔여 **30 slug** → `placeSeoEnOverrides` (186→**216**) · pop70–79 **109/109 전수**
- **샘플**: seoul · bohol · samoa · iceland · palawan · uyuni-salt-flat
- **GSC baseline**: `generate:gsc-baseline` — tier2 EN batch4 샘플 5 URL(`?lang=en`) · `smoke:gsc-baseline` assert
- **VERIFY**: `audit:place-seo-en` (109/109) · `smoke:gsc-baseline` · `smoke:place-seo-en` · `build` PASS
- **사람**: GSC URL Inspection — `scripts/data/gsc-seo-baseline-template.csv` 174 URL → `scripts/outputs/gsc-seo-baseline.csv`
- **잔여**: tier2 EN pop70–79 **완료** · PROD 재크롤·GSC baseline 기록
- **다음**: `검색노출 #21, GSC baseline 사람 QA`
