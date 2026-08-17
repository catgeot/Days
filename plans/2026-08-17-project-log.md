# 2026-08-17 프로젝트 일지

직전: [`2026-08-16-project-log.md`](./2026-08-16-project-log.md)

## 큐레이션 → 홈 지도·무니 검은 화면

**상태**: `cursor/curation-globe-android-0ba2` · [PR #128](https://github.com/catgeot/Days/pull/128) · Preview QA 대기  
**브랜치**: `cursor/curation-globe-android-0ba2`

| 증상 | 플랫폼 | 상태 |
|------|--------|------|
| 「전체 지도에서 보기」검은 화면·먹통 | Android Chrome | tip `5ab79735` — map pending focus·viewport reset |
| 「무니에게 묻기」검은 화면 | iPhone (사람 QA) | tip 추가 — viewport sync 후 MOONi 오픈·타이머 정리 |

- **원인(공통)**: 큐레이션→홈 remount · Mapbox 준비 전 flyTo 유실 · 스크롤 viewport 잔류
- **원인(무니)**: viewport·지도 wake 전 ChatModal(검은 오버레이) 선오픈
- **VERIFY**: `npm run build` · `smoke-curation-place-bridge` PASS
- **Preview**: `https://days-git-cursor-curation-globe-android-0ba2-catgeots-projects.vercel.app/blog/curation`
- **PROD QA**: 병합 전 — Android 「전체 지도」·iPhone 「무니에게 묻기」 각각

## 에이전트 핸드오프 — 큐레이션 지도·무니 QA

**세션**: `AI 큐레이션 #7, 지도·무니 검은 화면 QA`

**읽을 것 (3)**  
1. [`plans/2026-08-17-project-log.md`](./2026-08-17-project-log.md) — 본 절  
2. [`plans/blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) §9만  
3. PR #128 diff — `CurationHub.jsx` · `Home/index.jsx` · `HomeGlobeMapbox.jsx`

**금지 (3)**  
1. 세션마다 새 Preview 브랜치·PR 생성  
2. `travelSpots.js` 전체 스캔 · spots JSON 직접 편집  
3. 브라우저/computerUse 대행 QA (사람 Preview만)

**남은 일**  
- Android Chrome: `/blog/curation` → 「전체 지도에서 보기」  
- iPhone Safari: 동일 페이지 → 「무니에게 묻기」(채팅 헤더·X·입력 보이는지)  
- PASS면 PR #128 merge · `/qa/curation` 필요 시 갱신
