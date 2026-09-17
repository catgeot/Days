# 2026-09-17 프로젝트 일지

직전: [`2026-09-16-project-log.md`](./2026-09-16-project-log.md)

## 종각역 숙소 #14 — 광천선굴 갤러리 (Cloud)

- **세션** `종각역 숙소 #14, Preview OK면 PR 병합`
- **브랜치** `cursor/gwangcheon-cave-stay-6560` · tip `cc707a2c` · PR [#273](https://github.com/catgeot/Days/pull/273)
- **원인**: 배포본 「광천동굴」은 Tour contentId가 없어 Unsplash 종유석이 나왔고, Preview 광천선굴은 TourAPI `2987914` detailImage 4장이 무장애 화장실·휠체어·개찰구라 질이 떨어짐. 프록시가 `imgname`을 버려 전부 동일 점수.
- **완료**: 시설 컷·무제 CMS는 firstimage만 유지, 장이 적으면 종유석 스톡을 이어 붙임. 캐시 `v1.23`. **PR 미병합**(갤러리 Preview 후).
- **VERIFY**: `npm run smoke:mrt-stay` PASS · `smoke:explore-search-aliases` PASS · `smoke:tourapi` PASS · `smoke:place-gallery-pexels` PASS · `smoke:gallery-portrait-filter` PASS · `smoke:gallery-cache-policy` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/gwangcheon-stay → git Preview `/`
- **QA**: 홈「광천성굴」「광천동굴」→ 평창 광천선굴 · 숙소 광주 아님 · 갤러리에 화장실·휠체어 없고 동굴 전경.
- **다음**: Preview OK면 PR #273 병합. Edge `tourapi-proxy` `imgname` 배포는 선택.

## 팔경 활용 #58 — 정선 화암8경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #58, 정선 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `1de82ca5` · PR [#275](https://github.com/catgeot/Days/pull/275)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 화암8경 결손 3건(거북바위·용마소·화표주). 거북바위는 화암리 336-1 약수 진입로 오른쪽 절벽 위 둘레 6m 수호 바위(2경), 용마소는 화암리 1306-1 그림바위 앞 반석 소·아기장수 전설 용사소(3경), 화표주는 화암리 329-4 화표동 삼거리 돌기둥 두 개(5경). 여수 거북바위·정읍 용산호·소금강 기암과 구분. 정선 순수 누락 3→0.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=jeongseon`
- **잔여**: 사진/개요 순수 누락 **55**/876. 다음 허브 **태백8경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #57 — 정읍9경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #57, 정읍 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `4dd8d86a` · PR [#274](https://github.com/catgeot/Days/pull/274)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 정읍9경 결손 3건(동학농민혁명기념공원·용산호·월영습지와 솔티숲). 동학은 덕천면 동학로 742 황토현전적 2022년 개원 공원(4경), 용산호는 신정동 132-11 미르샘다리 642m(6경), 월영습지는 쌍암동 1029·송산동 산112 2014 습지보호지역(8경). 전주 기념관·임실 옥정호·안동 월영교와 구분. 정읍 순수 누락 3→0.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=jeongeup`
- **잔여**: 사진/개요 순수 누락 **58**/876. 다음 허브 **정선 화암8경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

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
