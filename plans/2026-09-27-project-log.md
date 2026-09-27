# 2026-09-27 프로젝트 일지

직전: [`2026-09-26-project-log.md`](./2026-09-26-project-log.md)

## 로그북 #12, 공개 피드 읽음

- **세션** `로그북 #12, 공개 피드 읽음` · feature `cursor/logbook-reads-af3f` · tip `b0d732fc` · PR [#325](https://github.com/catgeot/Days/pull/325)
- **조치** 공개 피드 카드 하단에 읽은 수. 공개 글을 열면 세션당 1회 `increment_report_view`. 내 기록 탭에는 없음. 컬럼이 없으면 숫자를 숨김.
- **VERIFY** `smoke:logbook-view-count` PASS · `vite build` PASS. migration `20260927120000_reports_view_count.sql` 적용됨 — `view_count` integer default 0, 기존 49행 0, `increment_report_view(text)` security definer, anon·authenticated EXECUTE, 트리거 `reports_guard_view_count`.
- **Preview** https://www.gateo.kr/qa/logbook-reads (main 병합 후) · git `https://days-git-cursor-logbook-reads-af3f-catgeots-projects.vercel.app/blog`
- **다음** `로그북 #13, 읽는 시간·같은 장소 수` — 카드에 읽는 시간, 같은 장소 기록 수. 좋아요·댓글 수는 기능이 생긴 뒤.
