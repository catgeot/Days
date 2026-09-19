# 2026-09-19 프로젝트 일지

직전: [`2026-09-18-project-log.md`](./2026-09-18-project-log.md)

## 팔경 활용 #62 QA — 경기 광주 8경 공식 목록 재정비 (Cloud)

- **세션** `팔경 활용 #62, 경기 광주 결손 오버레이 QA`
- **브랜치** `cursor/palgyeong-use-e744` · tip `293a5c1a` · PR [#280](https://github.com/catgeot/Days/pull/280)
- **완료**: 사람 Preview에서 팔경 목록에 없는 곳이 팔경에 들어가 있었다. 광주시 문화관광 공식 8경으로 멤버를 맞춤(1 남한산성·2 분원도요지&팔당물안개공원·3 경안천습지생태공원·4 앵자봉&천진암·5 무갑산·6 태화산·7 경기도자박물관·8 중대물빛공원). 화담숲·곤지암도자공원은 GATEO 선정만 유지. 송정사 제외. JSON contentId 없이 2·4·6·7경 시 공식 사진·개요 오버레이. 광주 순수 누락 0. 전체 **44**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=gwangju_gi`
- **잔여**: 사진/개요 순수 누락 **44**/876. 다음 허브 **목포9경 2**(목포진·다도해 전경)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 여행지 매칭 #11 — 송암스포츠타운 숙소 양주 오탐 (Cloud)

- **세션** `여행지 매칭 #11, 송암스포츠타운 숙소 양주 오탐`
- **브랜치** `cursor/dest-match-arch` · tip `954338a3` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: 홈「송암」→ 춘천 송암스포츠타운 → 숙소 찾기가 검색어「송암」을 1차 키워드로 써서 양주 장흥 펜션이 나왔다. 짧은 동음 토큰은 시·군(춘천) 선두, Geo-Sanity에 양주 추가. **PR 미병합**.
- **VERIFY**: `npm run smoke:mrt-stay` PASS (`chuncheon-songam-sports-town` kw=춘천) · `smoke:ko-homonym-ri-search` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「송암」→ 송암스포츠타운 → 숙소 찾기 → 춘천. 양주 비타민펜션·장흥유원지면 실패.
- **다음**: `여행지 매칭 #12, 하드코딩 사전 정리 및 SSOT 일원화`

## 여행지 매칭 #12 — 하드코딩 사전 정리 및 SSOT 일원화 (Cloud)

- **세션** `여행지 매칭 #12, 하드코딩 사전 정리 및 SSOT 일원화`
- **브랜치** `cursor/dest-match-arch` · tip `04b69655` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: `mrtStayQuery.js`, `exploreSearchAliases.js`, `usePlaceGallery.js`, `koreaHomonymDictionary.js` 등에 분산되어 있던 `KO_STATION_ALIASES`, `KO_UNIVERSITY_ALIASES`, `KO_UNIVERSITY_SATELLITE_ALIASES`, `KO_EXPLORE_SEARCH_ALIASES`, `KO_GALLERY_QUERY_OVERRIDES`, `KOREA_HOMONYM_GROUPS`를 `src/pages/Home/lib/koreaPlaceMatchDictionary.js` 단일 SSOT 파일로 통합 일원화. `resolveKoreaPlaceMatch` 통합 리졸버 및 helper 함수 모듈화. 기존 모듈 re-export로 하위 호환성 100% 유지. `scripts/smoke-explore-search-aliases.mjs`에 SSOT 무결성 검증 추가. 기존 회귀 0건. **PR 미병합**.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run smoke:mrt-stay` PASS (33개 케이스) · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈 검색에서 종각, 광천, 송암스포츠타운, 강원대 등이 정상 동작하고, 숙소 찾기 및 갤러리가 깨짐 없이 노출되는지 확인.
- **다음**: `여행지 매칭 #13, 종합 QA 및 메인 병합 준비`

