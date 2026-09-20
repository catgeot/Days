# 2026-09-20 프로젝트 일지

직전: [`2026-09-19-project-log.md`](./2026-09-19-project-log.md)

## 플래너 3단계 #2 — 항공 검색 폼을 항공권 파트로 (Cloud)

- **세션** `플래너 3단계 #2, Preview QA`
- **브랜치** `cursor/planner-stages-7ee0` · tip `53248157` · PR [#289](https://github.com/catgeot/Days/pull/289)
- **원인**: 상단 항공 검색 폼이 1·2·3단계마다 보여 무겁고, 저장된 데이터 새로고침 버튼은 불필요.
- **완료**: 검색 폼을 1단계 항공권 카드 아래로 이동. 새로고침 버튼 제거. 픽업·유심 2열·복잡도 n/100 유지. **병합 보류**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `smoke:planner-empty-scroll` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/planner-stages → git Preview `/place/paris/planner`
- **QA**: 1단계 항공권 아래 검색 폼 · 2·3단계 상단 폼 없음 · 새로고침 없음

## 플래너 3단계 #1 — 배너 유지한 채 섹션만 분리 (Cloud)

- **세션** `플래너 3단계 #1, 배너 유지 분리`
- **브랜치** `cursor/planner-stages-7ee0` · tip `ce1e1e45` · PR [#289](https://github.com/catgeot/Days/pull/289)
- **원인**: 이전 3단계 분리는 위젯을 체크리스트 칸에 넣고 UI를 많이 바꿔 보기가 좋지 않았고, 실제 항공 검색 문제는 트립닷컴 위젯이었다.
- **완료**: 상단 항공·픽업 배너·유심 2열·복잡도 점수는 유지. 기존 세 섹션(필수 준비·도착 이동·즐기기)만 단계 탭으로 전환. **병합 보류**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `smoke:planner-empty-scroll` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/planner-stages → git Preview `/place/paris/planner`
- **QA**: 1·2·3단계 전환 · 상단 배너 유지 · 유심 2열 · 복잡도 n/100

## 항공권 검색 #12 — 써머리 검색은 일정 폼 모달 (Cloud)

- **세션** `항공권 검색 #12, Preview QA`
- **브랜치** `cursor/tripcom-flight-widget-3ec3` · tip `2fda0eb0` · PR [#288](https://github.com/catgeot/Days/pull/288) · **merge `fb61c9d9` ✅**
- **원인**: 써머리·시네마 「항공권 검색」이 위젯 무력화 이후 일정 없이 Trip.com `/tickets-` 로 떨어짐.
- **완료**: 네이티브 검색 폼 모달. 날짜를 고른 뒤에만 검색. 플래너 폼도 기본 +14/+21 없음. **main 병합**.
- **VERIFY**: `npm run smoke:tripcom-flight-planner` PASS · `smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/flight → git Preview 홈 써머리·`/place/paris/planner`
- **QA**: 써머리 항공권 검색 → 일정 폼 · 날짜 선택 후 `/tickets-` · 날짜 없이 검색하면 달력
