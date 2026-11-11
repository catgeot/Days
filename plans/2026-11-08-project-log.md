# 2026-11-08 프로젝트 일지

이전: [`2026-11-07-project-log.md`](./2026-11-07-project-log.md)

## 탐색 페이지 #1, 11월 여행지 카드 정돈

- 「11월의 여행지」는 좁은 화면 두 칸, 넓은 화면 세 칸의 같은 크기 카드다. 사진·이름·이유·출처·저작 표기는 카드 안에만 있고, 행을 걸치지 않아 옆 카드와 겹치지 않는다. 제주 「추정」뱃지는 사진 안에 둔다.
- 코드 `70839199` · 브랜치 `cursor/explore-cards-d0e2` · PR [#712](https://github.com/catgeot/Days/pull/712). 로컬 Playwright `e2e/explore-v2-monthly.spec.js` 6 passed.
- Preview `https://days-git-cursor-explore-cards-d0e2-catgeots-projects.vercel.app/explore`. `/qa/explore-monthly`는 리다이렉트가 `main`에 반영된 뒤 그 주소로 열린다.
- 사람 확인: `/explore`에서 교토·치앙마이·푸꾸옥·제주·두바이·멜버른 글이 옆 사진 위로 넘어가지 않는지. 겹치거나 잘리면 같은 브랜치에서만 고친다.
- 다음: 탐색 페이지 #2, 카드 피드백. 새 브랜치·행 걸침 복귀 금지.

## 탐색 페이지 #2, 카드 피드백

- 「11월의 여행지」는 좁은 화면 두 열, 넓은 화면 세 열이다. 사진 비율과 요약 길이로 카드 높이가 다르고, 오른쪽 열은 조금 아래에서 시작한다. 한 카드가 여러 행을 차지하지 않아 글이 옆 사진 위로 넘치지 않는다.
- 카드 본문은 여행지 요약과 이달 이유만 있다. 관광청 링크, 저작 표기, 파일·정책 페이지는 카드에 없다. 제주 「추정」뱃지는 사진 안에 있다.
- 코드 `8073f29d` · 브랜치 `cursor/explore-cards-d0e2` · PR [#712](https://github.com/catgeot/Days/pull/712). 단위 테스트 10 passed · Playwright `playwright.config.explore-v2.js` 6 passed, 2 skipped.
- Preview `https://days-git-cursor-explore-cards-d0e2-catgeots-projects.vercel.app/explore`. `/qa/explore-monthly`는 리다이렉트가 `main`에 반영된 뒤 그 주소로 열린다.
- 사람 확인: 교토·치앙마이·푸꾸옥·제주·두바이·멜버른 높이가 서로 다른지, 본문이 요약인지. 요약이 너무 길거나 높이 차가 어색하면 같은 브랜치에서 그 카드만 줄인다.
- 다음: 탐색 페이지 #3, 카드 높이 조율. 새 브랜치·행 걸침·카드 출처 링크 복귀 금지.

## 탐색 페이지 #3, 카드 높이 조율

- 카드 글은 여행지 설명이 아니라, 언제가 최적기이고 그때 가는 이유인 한 줄이다. 좁은 화면은 가로 한 장, 세로 두 장, 가로 한 장, 세로 두 장이다. 제주는 억새 사진이 가로로 넓어 가로 칸에 둔다. 넓은 화면은 그 칸을 한 줄에 나란히 둔다. 한 카드가 여러 행을 차지하지 않는다.
- 코드 `d7c659f2` · 브랜치 `cursor/explore-cards-d0e2` · PR [#712](https://github.com/catgeot/Days/pull/712). 단위·검색 테스트 17 passed · Playwright `playwright.config.explore-v2.js` 6 passed, 2 skipped.
- Preview `https://days-git-cursor-explore-cards-d0e2-catgeots-projects.vercel.app/explore`. `/qa/explore-monthly`는 리다이렉트가 `main`에 반영된 뒤 그 주소로 열린다.
- 사람 확인: 교토·치앙마이·푸꾸옥·제주·두바이·멜버른이 가로·세로로 섞이는지, 글이 한 줄 요약인지. 사진이 잘리거나 문장이 어색하면 같은 브랜치에서 그 카드만 고친다.
- 다음: 탐색 페이지 #4, 카드 피드백. 새 브랜치·행 걸침·카드 출처 링크 복귀 금지.

## 탐색 페이지 #4, 카드 피드백

- 사진에서 본 배치를 유지한다. 좁은 화면은 왼쪽이 조금 넓은 두 열이고, 넓은 화면은 세 칸이다. 한 카드가 여러 행을 차지하지 않는다. 출처·저작 링크는 카드에 없다.
- 억새·해변·경마장은 가로, 단풍·마리나는 세로로 두어 주제가 잘리지 않게 했다. 한 줄은 언제 가면 좋은지다.
- 코드 `c07c4007` · 브랜치 `cursor/explore-cards-d0e2` · PR [#712](https://github.com/catgeot/Days/pull/712). 단위 테스트 10 passed · 검색 테스트 7 passed · Playwright `playwright.config.explore-v2.js` 6 passed, 2 skipped.
- Preview `https://days-git-cursor-explore-cards-d0e2-catgeots-projects.vercel.app/explore`. `/qa/explore-monthly`는 리다이렉트가 `main`에 반영된 뒤 그 주소로 열린다.
- 사람 확인: 교토·제주·치앙마이·푸꾸옥·두바이·멜버른이 두 열로 섞이는지, 사진 주제와 한 줄이 맞는지. 괜찮으면 PR #712 병합.
- 다음: 탐색 페이지 #5, 배치 확인 후 병합. 새 브랜치·행 걸침·카드 출처 링크 복귀 금지.

## 탐색 페이지 #5, 메인 반영

- 사람 요청으로 PR [#712](https://github.com/catgeot/Days/pull/712)를 squash 병합했다. `main` `b8501e59`. 좁은 화면은 왼쪽이 조금 넓은 두 열, 넓은 화면은 세 칸이다. 출처 링크는 카드에 없다.
- `/qa/explore-monthly`는 `https://www.gateo.kr/explore`로 간다. 확인은 `https://www.gateo.kr/explore`.
- 주제 종료. 다음 제시어 없음.

## 투어 카드 UI #2, PR704 후속 (좁은 diff)

- PR [#704](https://github.com/catgeot/Days/pull/704)의 sitemap/RSS/crawler 4파일 churn 없이 투어 UI·handoff·e2e 10파일만 최신 `main`에 재적용. 선행 #704은 Draft 유지.
- `TourCardBookingLink`·`StayListPartnerNotice` 1회 고지·카드별 CTA·제휴 줄 제거·사진 높이 확대 (`MrtTnaActivitiesWidget`, `EventTnaStrip`).
- 코드 `72a754bd` · 브랜치 `cursor/tour-card-readability-dce1` · 후속 Draft PR [#720](https://github.com/catgeot/Days/pull/720). CI [42474780179](https://github.com/catgeot/Days/actions/runs/42474780179) success.
- 검증: fixture mock 해운대 `e2e/tour-list-card-readability.spec.js` 3/3 · `smoke:partner-booking-handoff` · `npm run build`. 강릉 실 API·라이브 Preview 미확인.
- Preview `https://days-git-cursor-tour-card-readability-dce1-catgeots-projects.vercel.app/`. **머지·배포 금지**.
- 다음: 부모 — 강릉 등 실 응답 Preview QA 후 Ready/머지 판단.
