# 2026-08-03 프로젝트 일지

직전: [`2026-08-02-project-log.md`](./2026-08-02-project-log.md)

## 축제 페이지 #1, 시간 탭 실제 건수

**상태**: feature `cursor/korea-time-list-16a3` · tip `bd38af3` · Draft PR [#48](https://github.com/catgeot/Days/pull/48) · Preview QA 대기

- **이슈**: 지금·주말·이번 달·시즌이 모두 48건처럼 보임 (UI `PANEL_LIMIT` 상한 + 메타가 잘린 건수 표시)
- **변경**: 목록 상한 제거 · 메타·시간 칩에 실제 건수 · 리스트 시작일 순 · 지도 클러스터 leaf 1000
- **공유**: `https://www.gateo.kr/qa/korea` · git Preview `https://days-git-cursor-korea-time-list-16a3-catgeots-projects.vercel.app/korea`
- **QA**: `/korea` → 시간 칩 건수가 탭마다 다른지 · 목록 메타 건수=리스트 길이 · API 추가 호출 없음(탭 전환만)
