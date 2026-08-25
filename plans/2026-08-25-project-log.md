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
- **다음**: `검색노출 #1, PROD QA — meta·탭 title`
