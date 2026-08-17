# 2026-08-17 프로젝트 일지

직전: [`2026-08-16-project-log.md`](./2026-08-16-project-log.md)

## AI 큐레이션 #8, 지도·무니 Preview QA 반영

**상태**: **main 병합 완료** (PR #128 · `68b14979`) · PROD 배포 후 Android QA  
**세션**: `AI 큐레이션 #8 → main merge`

- **merge**: PR #128 → `main` `68b14979` (iPhone Preview QA PASS 후)
- **PROD QA**: `https://www.gateo.kr/blog/curation?debug=curation` — Android 「전체 지도」·「무니에게 묻기」
- **/qa/curation**: PROD로 redirect 갱신


| 플랫폼 | 결과 | 로그 |
|--------|------|------|
| iPhone Safari | **PASS** (무니·재시도) | `home.sync.run globeReady:true` → `home.sync.ready mapReady:true` → `home.flyTo` → `home.mooni.open` → `chat.start` → `chat.open.draft` |

- **tip**: `06e2b250` — globe ref poll · `whenGlobeFocusReady` · `executeFocus` style 가드
- **VERIFY**: `smoke-curation-place-bridge` · `npm run build` PASS
- **공유**: `https://www.gateo.kr/qa/curation` · `?debug=curation`
- **Preview**: `https://days-git-cursor-curation-globe-android-0ba2-catgeots-projects.vercel.app/blog/curation?debug=curation`
- **남은 일**: Android 「전체 지도」확인(선택) · 사람 PR #128 merge

**다음 채팅명** (merge 후):

```
AI 큐레이션 #9, PROD 배포 확인
```


### #8a (이전 커밋)

| 증상 | 원인 | 수정 |
|------|------|------|
| `unmount-before-sync` · `consume.empty` | effect cleanup이 360ms sync 타이머 취소 | 모듈 레벨 `scheduleCurationHomeHandoffApply` |


## AI 큐레이션 #7, 지도·무니 검은 화면 QA

**상태**: `cursor/curation-globe-android-0ba2` · [PR #128](https://github.com/catgeot/Days/pull/128) · Preview QA 대기  
**세션**: `AI 큐레이션 #7, 지도·무니 검은 화면 QA`

| 증상 | 플랫폼 | 수정 |
|------|--------|------|
| 「전체 지도에서 보기」검은 화면·먹통 | Android Chrome | Mapbox pending focus · viewport reset · 지연 flyTo 복구 |
| 「무니에게 묻기」검은 화면 | iPhone Safari | viewport sync·wake 후 rAF로 MOONi 오픈 |

- **한 일**: #7 — route state 1차 핸드오프(Strict Mode claim·재시도) · 디버그 로그 sessionStorage 유지
- **VERIFY**: `npm run build` · `smoke-curation-place-bridge` PASS
- **공유**: `https://www.gateo.kr/qa/curation`
- **Preview**: `https://days-git-cursor-curation-globe-android-0ba2-catgeots-projects.vercel.app/blog/curation`
- **남은 일(사람)**: Android 「전체 지도」·iPhone 「무니에게 묻기」 Preview QA → PASS면 PR #128 merge

**다음 채팅명**:

```
AI 큐레이션 #8, 지도·무니 Preview QA 반영
```

## 큐레이션 → 홈 지도·무니 검은 화면 (이전)

**상태**: `cursor/curation-globe-android-0ba2` · [PR #128](https://github.com/catgeot/Days/pull/128)  
**브랜치**: `cursor/curation-globe-android-0ba2`

| 증상 | 플랫폼 | 상태 |
|------|--------|------|
| 「전체 지도에서 보기」검은 화면·먹통 | Android Chrome | tip `5ab79735` — map pending focus·viewport reset |
| 「무니에게 묻기」검은 화면 | iPhone (사람 QA) | tip `0eac89fa` — viewport sync 후 MOONi 오픈 |

- **원인(공통)**: 큐레이션→홈 remount · Mapbox 준비 전 flyTo 유실 · 스크롤 viewport 잔류
- **원인(무니)**: viewport·지도 wake 전 ChatModal(검은 오버레이) 선오픈

## 에이전트 핸드오프 — 큐레이션 지도·무니 QA

**읽을 것 (3)**  
1. [`plans/2026-08-17-project-log.md`](./2026-08-17-project-log.md) — 본 절  
2. [`plans/blog-ai-curation-page-plan.md`](./blog-ai-curation-page-plan.md) §9만  
3. PR #128 diff — `CurationHub.jsx` · `Home/index.jsx` · `HomeGlobeMapbox.jsx`

**금지 (3)**  
1. 세션마다 새 Preview 브랜치·PR 생성  
2. `travelSpots.js` 전체 스캔 · spots JSON 직접 편집  
3. 브라우저/computerUse 대행 QA (사람 Preview만)
