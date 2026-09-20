# 2026-09-20 프로젝트 일지

직전: [`2026-09-19-project-log.md`](./2026-09-19-project-log.md)

## 항공권 검색 #12 — 써머리 검색은 일정 폼 모달 (Cloud)

- **세션** `항공권 검색 #12, Preview QA`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `2fda0eb0` · PR [#288](https://github.com/catgeot/Days/pull/288)
- **원인**: 써머리·시네마 「항공권 검색」이 위젯 무력화 이후 일정 없이 Trip.com `/tickets-` 로 떨어짐.
- **완료**: 네이티브 검색 폼 모달. 날짜를 고른 뒤에만 검색. 플래너 폼도 기본 +14/+21 없음. **병합 보류**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview 홈 써머리·`/place/paris/planner`
- **QA**: 써머리 항공권 검색 → 일정 폼 · 날짜 선택 후 `/tickets-` · 날짜 없이 검색하면 달력
