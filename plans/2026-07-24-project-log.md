# 2026-07-24 프로젝트 일지

직전: [`2026-07-23-project-log.md`](./2026-07-23-project-log.md)

## 갤러리 — 모바일 확장 카드 스켈레톤 고착

**상태**: ✅ 사람 QA 통과 · 커밋·push

- 원인: (1) 캐시·모바일에서 `img.onLoad` 누락으로 타일 pulse 스켈레톤 유지 (2) `place_stats`/전체 fetch hang·early return 시 `isImgLoading` 미해제
- 대응: `GalleryGridTile` complete/rAF 동기화·6s hang→드롭 · paint chrome 3.5s · `usePlaceGallery` early-return 해제·DB 8s·전체 28s safety
- QA: 재현지 **케이프타운** · 스켈레톤 정상 해제 확인
