# 2026-08-01 프로젝트 일지

직전: [`2026-07-31-project-log.md`](./2026-07-31-project-log.md)

## Cloud 작업 규칙 #1, 이어하기·Preview 고정

- **세션**: `Cloud 작업 규칙 #1, 짧은 QA 링크`
- **브랜치**: `cursor/cloud-preview-continuity-8320` (이 주제 고정 · 재사용)
- **PR**: [#43](https://github.com/catgeot/Days/pull/43)
- **공유 (테스터)**: https://www.gateo.kr/qa/puzzle · https://www.gateo.kr/qa/cloud-rules · 목록 `/qa` (main 반영 후)
- **Preview (고정)**: https://days-git-cursor-cloud-preview-continuity-8320-catgeots-projects.vercel.app/korea
- **규칙**: 짧은 `/qa/<slug>` 공유 · 새 브랜치명 짧게 · 세션 표기 · 작업 로그 — [`cloud-preview-continuity.md`](./cloud-preview-continuity.md)
- **코드**: [`cloudQaShareLinks.js`](../src/shared/cloudPreview/cloudQaShareLinks.js) + `vercel.json` redirects + `/qa` 목록
- **QA**: main 머지 후 `gateo.kr/qa/puzzle` → 퍼즐 Preview · Preview 우측 작업 로그
