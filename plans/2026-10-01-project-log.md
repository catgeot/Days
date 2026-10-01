# 2026-10-01 프로젝트 일지

직전: [`2026-09-30-project-log.md`](./2026-09-30-project-log.md)

## 탐색 검색 → 장소카드 뒤로가기

- **브랜치** `cursor/explore-place-back-84a8` · `afeb4ec3` · PR [#366](https://github.com/catgeot/Days/pull/366)
- **원인** 장소카드 ← 가 카드 마운트 이후 경로만 봐서, 탐색 검색 → 지구본 써머리 → `/place` 뒤로가기가 `navigate('/')`로 떨어짐.
- **조치** 탐색에서 연 카드만 검색·선택 목록으로 복귀. 탐색 밖 써머리에서 연 카드는 기존처럼 홈. 써머리 X는 지구본 유지.
- **VERIFY** `npm run smoke:place-card-back` PASS
- **Preview** git `https://days-git-cursor-explore-place-back-84a8-catgeots-projects.vercel.app/explore`
