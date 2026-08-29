# 2026-08-29 프로젝트 일지

← [`2026-08-27-project-log.md`](./2026-08-27-project-log.md)

## 홈 — 마나가하 hub 명소 검색 크래시 (#159)

- **증상** explore `마나가하섬` → 「사이판 마나가하 섬」 선택 시 홈 크래시 (Mapbox `continuePlacement` · ko `getLocalizedPlaceName`)
- **브랜치** `cursor/managaha-search-crash-6c7d` · PR #159 · tip `5482d90e`
- **VERIFY** `npm run build` · Playwright repro 10/10 PASS
- **사람 QA** Preview — ko UI · 드롭다운·Enter 모호성·써머리 카드

## 갤러리 — Whakarewarewa Pexels 백필 (#160)

- **main** `cd328c6a` — PR #160 merge · `usePlaceGallery` Pexels 백필·페이지 분리 · `smoke-place-gallery-pexels*`
- **VERIFY** 스모크·LIVE Pexels PASS (Cloud 시크릿)
- **사람 QA** PROD `/place/whakarewarewa-village/gallery` — Vercel **Production**에 `VITE_PEXELS_API_KEY` 등록·재배포 후 더보기·Network `api.pexels.com`

## 갤러리 — Whakarewarewa PROD 콘솔 (#161)

- **증상** PROD `VITE_PEXELS_API_KEY missing` 반복 · Unsplash 0건 · 더보기 실패 (Summarizer/tp/ads는 제3자)
- **main** `5873092c` — PR #161 merge · `pexels-proxy` Edge · Unsplash 보조 쿼리
- **Edge** `npx supabase functions deploy pexels-proxy --project-ref phdjnbfitvmrguqzverm --no-verify-jwt` ✅ 2026-08-29
- **후속** `a10e02c1+` — 갤러리 **최대 60장** · Pexels 배치 20장 · 60장 도달 시 더보기 숨김
- **사람 QA** PROD `/place/whakarewarewa-village/gallery` — ≤60장 · 더보기(60 미만만)
