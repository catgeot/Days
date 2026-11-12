# 2026-11-12 프로젝트 일지

이전: [`2026-11-08-project-log.md`](./2026-11-08-project-log.md)

## 세계행사 일정 #59, 스크롤 위로 버튼

- 세계 행사 목록과 행사 본문을 조금 내리면 오른쪽 아래에 「위로」가 나타난다. 누르면 그 페이지 본문만 맨 위로 올라간다. 본문에서는 무니 버튼이 「위로」 위로 올라가고, 무니 채팅이 열려 있으면 「위로」는 숨긴다.
- 코드 `af614ff7` · 브랜치 `cursor/world-events-scroll-up-be96` · PR [#764](https://github.com/catgeot/Days/pull/764). `npm run smoke:world-events-hub` PASS. 로컬 Playwright에서 목록·에든버러 프린지 본문 모두 스크롤 후 「위로」 클릭 시 맨 위로 복귀.
- `smoke:world-events-detail`은 옥토버페스트 opening 체크인이 행사 시작 전날(2026-09-18)이 아니라 2026-11-11로 나와 기존 FAIL. 이번 버튼과 무관.
- Preview `https://days-git-cursor-world-events-scroll-up-be96-catgeots-projects.vercel.app/world-events` · 본문 `/world-events/edinburgh-fringe-2026`. `/qa/world-events`는 wave3라 이 버튼이 없다.
- 사람 확인: 목록을 내린 뒤 「위로」, 카드로 들어간 본문에서도 같은 버튼이 무니와 겹치지 않는지.
- 다음: 피드백이 있으면 세계행사 일정 #60, 위로 버튼 피드백. 같은 브랜치만. wave3와 합치지 않는다.
- Preview 404는 `cursor/*` 배포가 꺼져 있어서였다. `960f2ff4`에서 이 브랜치만 예외로 켰고 배포는 READY. 주소는 위 git Preview.

## 세계행사 일정 #60 준비, 본문 QA JSON

- 사람 Preview(2026-11-12 11:50 KST): 에든버러 프린지 본문 아래에 「QA — raw JSON」검은 블록이 보인다. `schema_version`·`trip_presets`가 그대로다.
- 원인: `EventTravelGuidePanel.jsx`의 `showRaw`가 `isCloudPreviewSurface()`라 `*.vercel.app`에서 켜진다. `gateo.kr`에서는 이미 숨긴다. 일정 프리셋·주의사항 문장은 유지하고 검은 JSON만 뺀다.
- 다음 세션은 새 브랜치를 만들지 않는다. `cursor/world-events-scroll-up-be96` · PR #764 · tip `960f2ff4`에 커밋하고 push하면 같은 Preview가 갱신된다. `vercel.json` 배포 예외를 끄지 않는다. main 병합은 하지 않는다.

## 명승 카드 #1, 축제형 카드 리스트

- 명승 홈 선정 명소·국가유산 명승·관광지·찜/본 항목이 기본으로 축제 홈과 같은 사진 카드다. 좁은 화면은 두 열. 명승 사진이 대부분 가로 3:2라 전폭 배너로는 나누지 않는다. 「목록 보기」는 예전 행과 「크게」.
- 코드 `734f42fa` · 브랜치 `cursor/scenic-cards-f089` · PR [#767](https://github.com/catgeot/Days/pull/767). `node --test scripts/health/scenic-card-grid.test.mjs` PASS · `npx vite build` PASS. 로컬 390px에서 서울 카드 사진, 경복궁 상세, 목록 전환 확인. `cursor/*` 배포는 꺼 둔 채 이 브랜치만 `vercel.json`에서 켰다.
- Preview `https://days-git-cursor-scenic-cards-f089-catgeots-projects.vercel.app/korea/theme/scenic`. `/qa/scenic-cards`는 이 브랜치가 main에 합쳐진 뒤에야 prod 리다이렉트가 있다.
- 사람 확인: 카드 두 열, 카드로 상세, 「목록 보기」가 예전 행인지.
- 다음: 명승 카드 #2, Preview OK면 PR 병합. 같은 브랜치만.
