# 2026-09-06 작업 로그

직전: [`2026-09-05-project-log.md`](./2026-09-05-project-log.md)

## 갤러리 인물 제외 #1, 단일 인물 필터

- **브랜치** `cursor/gallery-c260` · tip `7decd79c` · **PR [#187](https://github.com/catgeot/Days/pull/187)**
- Unsplash/Pexels에 인물 제외 파라미터 없음 · `orientation=landscape` 미사용(세로 전경 유지)
- [`galleryPortraitFilter.js`](../src/utils/galleryPortraitFilter.js) — 셀카·헤드샷·세로 단일 인물만 제외, 전경 속 사람 유지 · 캐시 v1.19
- **VERIFY** `smoke:gallery-portrait-filter` · `smoke:place-gallery-pexels` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery` · `/place/paris/gallery`

```
갤러리 인물 제외 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-c260 · PR #187 · Preview /qa/gallery
금지: orientation=landscape 재도입 · UI 리디자인 · feature에 plans 커밋
작업: 파리 갤러리에서 단일 인물(셀카·얼굴)이 줄었는지 · 거리·랜드마크 전경은 남는지
```
