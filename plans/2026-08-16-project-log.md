# 2026-08-16 프로젝트 일지

직전: [`2026-08-13-project-log.md`](./2026-08-13-project-log.md)

## 해안 해양 탐색 #6, 바다 리스트 최적화

**상태**: `cursor/coast-sea-plan-8c05` tip `4c293544` · PR [#118](https://github.com/catgeot/Days/pull/118)  
**세션**: `해안 해양 탐색 #6, 바다 리스트 최적화`

- **증상**: 가용높이 연동 후 해역 칩 수 동일·감소 + 빈 스크롤·지도 체이닝
- **한 일**: `maxListHeightPx` 개수 제한 제거 · `maxCount` 12 · 모바일 `maxHeight`만 · 해역 모드 `justify-end` 해제
- **VERIFY**: `smoke-sea-basin-rail` · `smoke-sea-basin-search` · `audit:sea-basins` · `build`
- **Preview**: `https://days-git-cursor-coast-sea-plan-8c05-catgeots-projects.vercel.app/` — 모바일 바다 탭 QA ✅
- **규칙**: `cloud-preview-continuity` §1.2 제시어 핀 3개 · `feature-handoff-index.md` 추가
- **main 병합**: `origin/main` `bf22da68` — PR #118 feature merge · smoke/audit/build PASS · PROD 배포 후 QA
- **다음 제시어**:

```
해안 해양 탐색 #7, (다음 단계)
@plans/feature-handoff-index.md
@plans/2026-08-16-project-log.md
@plans/coast-sea-explore-plan.md
브랜치 cursor/coast-sea-plan-8c05 · PR #118 · Preview QA
금지: main 새 브랜치 · seaBasins.json 직접 편집 · UI 리디자인 · GLOBE_CATEGORY_IDS에 coast 추가
```
