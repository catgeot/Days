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

## 갤러리 사진 관리 #1, 모바일 길게 누르기

- **브랜치** `cursor/gallery-manage-173f` · tip `36992c74` · **PR [#188](https://github.com/catgeot/Days/pull/188)**
- 모바일 그리드·확대 보기 **길게 누르기** → 확인 시트 → 기존 `handleRemoveImage`로 `place_stats`에서 제거. PC Ctrl/⌘+더블클릭 유지. 상시 휴지통 버튼 없음.
- **VERIFY** `smoke:gallery-photo-manage` · `smoke:gallery-portrait-filter` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery` · git Preview `/place/paris/gallery`

**다음 제시어**:

```
갤러리 사진 관리 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-manage-173f · PR #188 · Preview /qa/gallery
금지: 상시 휴지통 버튼 · PC Ctrl+더블클릭 제거 · UI 리디자인
작업: 모바일 타일 꾹 → 제거 확인 · 짧은 탭은 확대 · 확대 보기도 길게 누르기 · PC Ctrl+더블클릭 유지
```

## 갤러리 사진 관리 — PR #188 merge ✅

- **PR [#188](https://github.com/catgeot/Days/pull/188)** squash merge → main `d575c9a7`
- **PROD** `https://www.gateo.kr/place/paris/gallery`
- **주제 종료** — 모바일 길게 누르기 제거는 PROD

## 갤러리 캐시 신선도 #1, DB 즉시 + 스톡 SWR

- **브랜치** `cursor/gallery-swr-6b36` · tip `b7ee61e5` · **PR [#189](https://github.com/catgeot/Days/pull/189)**
- DB/세션 **즉시 표시** · 갤러리 탭만 **7일 Unsplash SWR**(hero·`image_url` 유지) · 검색 카드 `thumbnailOnly` · 제거 사진은 SWR 재유입 금지
- **VERIFY** `smoke:gallery-cache-policy` · `smoke:place-gallery-pexels` · `smoke:gallery-portrait-filter` · `smoke:gallery-photo-manage` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery-fresh` · git Preview `/place/paris/gallery`

**다음 제시어**:

```
갤러리 캐시 신선도 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-swr-6b36 · PR #189 · Preview /qa/gallery-fresh
금지: image_url SWR 덮어쓰기 · Tour 우세 스톡 치환 · 더보기 DB upsert · UI 리디자인
작업: 파리 갤러리 즉시 표시 · 대표 사진 유지 · 새 장이 뒤에 붙는지 · 검색/버킷 썸네일 흔들림 없음
```

## 갤러리 연관 스크롤 #1, 여행지 전환 상단

- **브랜치** `cursor/gallery-scroll-76a6` · tip `41b747c1` · **PR [#190](https://github.com/catgeot/Days/pull/190)**
- 하단 연관 칩 클릭 시 이전 갤러리 스크롤이 남아 새 여행지 중간부터 보이던 UX → 장소 전환 시 중첩 스크롤 즉시 상단 · 갤러리 탭 유지
- **VERIFY** `smoke:gallery-related-scroll` · `smoke:gallery-photo-manage` · `smoke:gallery-portrait-filter` · `vite build` PASS
- **다음** 사람 Preview `/qa/gallery-related` · git Preview `/place/paris/gallery`

**다음 제시어**:

```
갤러리 연관 스크롤 #2, Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-06-project-log.md
브랜치 cursor/gallery-scroll-76a6 · PR #190 · Preview /qa/gallery-related
금지: UI 리디자인 · 더보기 스크롤 리셋 · 헤더 탭 smooth 제거
작업: 파리 갤러리 중간 스크롤 → 하단 연관 칩 → 새 여행지 상단(소개·첫 사진) · 한 번 더 전환
```
