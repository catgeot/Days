# 2026-08-07 프로젝트 일지

직전: [`2026-08-06-project-log.md`](./2026-08-06-project-log.md)

## QA 단축링크 `/qa/korea-theme` PROD 복구

**상태**: `main` · tip _(push 후)_ · Vercel PROD 배포 후 확인

- **증상**: `www.gateo.kr/qa/korea-theme` → gateo.kr 유지 · 검은 화면
- **원인**: PROD `vercel.json`에 `/qa/korea-theme` redirect 없음 → SPA rewrite → 미등록 라우트
- **한 일**: vercel redirect 추가 · `cloudQaShareLinks` korea-theme · `/qa/:slug` 클라이언트 폴백
- **VERIFY**: `npm run build` · 배포 후 `curl -sI https://www.gateo.kr/qa/korea-theme` → Preview로 307/302
- **공유**: `https://www.gateo.kr/qa/korea-theme`
- **Preview**: `https://days-git-cursor-korea-theme-catgeots-projects.vercel.app/korea/theme/scenic`
