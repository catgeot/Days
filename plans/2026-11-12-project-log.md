# 2026-11-12 프로젝트 일지

이전: [`2026-11-08-project-log.md`](./2026-11-08-project-log.md)

## 세계행사 일정 #59, 스크롤 위로 버튼

- 세계 행사 목록과 행사 본문을 조금 내리면 오른쪽 아래에 「위로」가 나타난다. 누르면 그 페이지 본문만 맨 위로 올라간다. 본문에서는 무니 버튼이 「위로」 위로 올라가고, 무니 채팅이 열려 있으면 「위로」는 숨긴다.
- 코드 `af614ff7` · 브랜치 `cursor/world-events-scroll-up-be96` · PR [#764](https://github.com/catgeot/Days/pull/764). `npm run smoke:world-events-hub` PASS. 로컬 Playwright에서 목록·에든버러 프린지 본문 모두 스크롤 후 「위로」 클릭 시 맨 위로 복귀.
- `smoke:world-events-detail`은 옥토버페스트 opening 체크인이 행사 시작 전날(2026-09-18)이 아니라 2026-11-11로 나와 기존 FAIL. 이번 버튼과 무관.
- Preview `https://days-git-cursor-world-events-scroll-up-be96-catgeots-projects.vercel.app/world-events` · 본문 `/world-events/edinburgh-fringe-2026`. `/qa/world-events`는 wave3라 이 버튼이 없다.
- 사람 확인: 목록을 내린 뒤 「위로」, 카드로 들어간 본문에서도 같은 버튼이 무니와 겹치지 않는지.
- 다음: 피드백이 있으면 세계행사 일정 #60, 위로 버튼 피드백. 같은 브랜치만. wave3와 합치지 않는다.
