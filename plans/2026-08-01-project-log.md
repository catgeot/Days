# 2026-08-01 프로젝트 일지

직전: [`2026-07-31-project-log.md`](./2026-07-31-project-log.md)

## Cloud 작업 규칙 #1, 이어하기·Preview 고정

- **세션**: `Cloud 작업 규칙 #1, 이어하기·Preview 고정`
- **브랜치**: `cursor/cloud-preview-continuity-8320` (이 주제 고정 · 재사용)
- **PR**: [#43](https://github.com/catgeot/Days/pull/43) · tip `d37a773`
- **Preview (고정)**: https://days-git-cursor-cloud-preview-continuity-8320-catgeots-projects.vercel.app/korea
- **규칙**: 세션 표기 `{주제} #{N}, {단계}` · 고정 브랜치·동일 git Preview URL · Preview 우측 작업 로그 · 턴 종료 Preview 링크 — [`AGENTS.md`](../AGENTS.md) Cloud · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md)
- **코드**: [`cloudPreviewWorkLog.js`](../src/shared/cloudPreview/cloudPreviewWorkLog.js) + [`CloudPreviewWorkLog.jsx`](../src/shared/cloudPreview/CloudPreviewWorkLog.jsx) (PROD 비표시)
- **QA**: 위 Preview → 우측 「작업 로그」→ 제목 클릭해 설명 확인
