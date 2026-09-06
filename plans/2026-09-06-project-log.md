# 2026-09-06 작업 로그

직전: [`2026-09-05-project-log.md`](./2026-09-05-project-log.md)

## 갤러리 인물 제외 #1, 단일 인물 필터

- **브랜치** `cursor/gallery-c260` · tip `7decd79c` · **PR [#187](https://github.com/catgeot/Days/pull/187)**
- Unsplash/Pexels에 인물 제외 파라미터 없음 · `orientation=landscape` 미사용(세로 전경 유지)
- [`galleryPortraitFilter.js`](../src/utils/galleryPortraitFilter.js) — 셀카·헤드샷·세로 단일 인물만 제외, 전경 속 사람 유지 · 캐시 v1.19
- **VERIFY** `smoke:gallery-portrait-filter` · `smoke:place-gallery-pexels` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery` · `/place/paris/gallery`

## 갤러리 인물 제외 — PR #187 merge ✅

- **PR [#187](https://github.com/catgeot/Days/pull/187)** squash merge → main `eb1189b6`
- **PROD** `https://www.gateo.kr/place/paris/gallery`
- **주제 종료** — 인덱스 종료 행 · 캐시 정책 유지(DB 히트 시 LIVE 생략 · 더보기 DB 미반영)

**다음 제시어 없음** (주제 종료).
