# 2026-09-18 프로젝트 일지

직전: [`2026-09-17-project-log.md`](./2026-09-17-project-log.md)

## 팔경 활용 #59 — 태백8경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #59, 태백 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `a0f0d93b` · PR [#277](https://github.com/catgeot/Days/pull/277)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 태백8경 결손 3건(장성하부고생대화석산지·용연굴·절골마을관리휴양지). 화석산지는 장성동 산42-2 천연기념물 416호 직운산층 노두(3경), 용연굴은 태백로 283-29 해발 920m 건식 석회동굴(7경), 절골은 오투로 116 황지동 절골힐링캠핑장·본적사지(8경). 전남 장성·구문소·영동 용연대·정선 화암동굴·철암 고원휴양림과 구분. 태백 순수 누락 3→0.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=taebaek`
- **잔여**: 사진/개요 순수 누락 **52**/876. 다음 허브 **의정부8경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 여행지 매칭 #4 — 국내 지명 First-Pass 리졸버 (Cloud)

- **세션** `여행지 매칭 #4, 국내 지명 First-Pass 리졸버`
- **브랜치** `cursor/dest-match-arch` · tip `b3e7ac31` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: Mapbox 전 `resolveKoreaDestinationFirstPass`. 광천선굴·광천성굴 → 평창. 종각·종각역 → 서울 종각역. TourAPI 유일 제목만 1차 히트. **PR 미병합**.
- **VERIFY**: `npm run smoke:explore-search-aliases` PASS · `smoke:mrt-stay` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「광천선굴」「광천성굴」→ 평창(광주 광천동 아님). 「종각」「종각역」→ 서울 종각역(대구 아님).
- **다음**: `여행지 매칭 #5, 카테고리 맥락 파이프라인 전달`

## 여행지 매칭 #3 — 숙소 거리 가드(Geo-Sanity) (Cloud)

- **세션** `여행지 매칭 #3, 숙소 거리 가드(Geo-Sanity)`
- **브랜치** `cursor/dest-match-arch` · tip `3cd8b196` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: 검색 중심 30km 초과 타 시·군 숙소 배제. 평창/춘천 → 광주/양양 0건. 같은 시·군은 유지. 클라·Edge. **PR 미병합**.
- **VERIFY**: `npm run smoke:mrt-stay` PASS · `smoke:tourapi` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「평창」「춘천」숙소 찾기 → 광주·양양 호텔 아님. Edge `fetch-mrt-stays` 배포는 선택(클라 가드 동작).
- **다음**: `여행지 매칭 #4, 국내 지명 First-Pass 리졸버`

## 여행지 매칭 #2 — 검색 Enter 제안 불일치 (Cloud)

- **세션** `여행지 매칭 #2, 검색 Enter 제안 불일치`
- **브랜치** `cursor/dest-match-arch` · tip `7e5fc984` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **원인**: 「광천선굴」「광천성굴」타이핑 목록은 Mapbox·허브 후보로 광천선굴이 보이는데, 엔터는 지오코딩 실패 후 `search_dictionary`·AI가 정선 화암동굴로 교정함.
- **완료**: 평창 허브 명소 SSOT·별칭. 엔터는 보이는 제안·Search Box 이름 일치를 AI보다 앞세움. 이름 불일치 교정 캐시 무시. **PR 미병합**.
- **VERIFY**: `npm run smoke:search-enter-match` PASS · `smoke:explore-search-aliases` PASS · `smoke:explore-choice-overlay` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「광천성굴」「광천선굴」엔터 → 평창 광천선굴. 화암동굴 교정 카드 아님.
- **다음**: `여행지 매칭 #3, 숙소 거리 가드(Geo-Sanity)`
