# 2026-11-08 프로젝트 일지

이전: [`2026-11-07-project-log.md`](./2026-11-07-project-log.md)

## 탐색 페이지 #1, 11월 여행지 카드 정돈

- 「11월의 여행지」는 좁은 화면 두 칸, 넓은 화면 세 칸의 같은 크기 카드다. 사진·이름·이유·출처·저작 표기는 카드 안에만 있고, 행을 걸치지 않아 옆 카드와 겹치지 않는다. 제주 「추정」뱃지는 사진 안에 둔다.
- 코드 `70839199` · 브랜치 `cursor/explore-cards-d0e2` · PR [#712](https://github.com/catgeot/Days/pull/712). 로컬 Playwright `e2e/explore-v2-monthly.spec.js` 6 passed.
- Preview `https://days-git-cursor-explore-cards-d0e2-catgeots-projects.vercel.app/explore`. `/qa/explore-monthly`는 리다이렉트가 `main`에 반영된 뒤 그 주소로 열린다.
- 사람 확인: `/explore`에서 교토·치앙마이·푸꾸옥·제주·두바이·멜버른 글이 옆 사진 위로 넘어가지 않는지. 겹치거나 잘리면 같은 브랜치에서만 고친다.
- 다음: 탐색 페이지 #2, 카드 피드백. 새 브랜치·행 걸침 복귀 금지.
