# 2026-09-17 프로젝트 일지

직전: [`2026-09-16-project-log.md`](./2026-09-16-project-log.md)

## 종각역 숙소 #14 — 광천선굴 광주 오탐 (Cloud)

- **세션** `종각역 숙소 #14, 광천선굴 광주 오탐`
- **브랜치** `cursor/gwangcheon-cave-stay-6560` · tip `3c4724cf` · PR [#273](https://github.com/catgeot/Days/pull/273)
- **원인**: 평창 광천선굴(고대동길 119)은 OSM에 없음. 「광천성굴」을 AI가 「광천동굴」로 고친 뒤 지오코더가 광주 서구 광천동을 잡아 광주역·신안동 호텔이 2km로 붙음.
- **완료**: 평창 허브 명소 SSOT·별칭 바로 핀 · 동굴 검색은 동·동네 거부 · 숙소 키워드·원점 평창 스냅. **PR 미병합**.
- **VERIFY**: `npm run smoke:mrt-stay` PASS · `npm run smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/gwangcheon-stay → git Preview `/`
- **QA**: 홈「광천성굴」「광천동굴」→ 평창 광천선굴. 숙소 찾기 → 광주 금호 피아노 아님.
- **다음**: Preview OK면 PR #273 병합

## 팔경 활용 #56 — 양구9경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #56, 양구 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `777510d1` · PR [#272](https://github.com/catgeot/Days/pull/272)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 양구9경 결손 3건(양구 수목원·양구 봉화산·양구 상무룡 출렁다리). 수목원은 동면 숨골로310번길 132 도내 6번째 공립 수목원(1경), 봉화산은 국토정중앙면 죽리 해발 875m 주말 산행(7경), 상무룡 출렁다리는 양구읍 간척월명로 1719-21 파로호 335m 현수교(8경). 구례 수목원·서울 중랑 봉화산·화순 백아산 하늘다리와 구분. 양구 순수 누락 2→0(수목원은 기존 GATEO 사진).
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=yanggu`
- **잔여**: 사진/개요 순수 누락 **61**/876. 다음 허브 **정읍9경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.
