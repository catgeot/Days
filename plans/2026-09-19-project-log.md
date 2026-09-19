# 2026-09-19 프로젝트 일지

직전: [`2026-09-18-project-log.md`](./2026-09-18-project-log.md)

## MOONi 일정 페이스메이커 #1 — 기행문 묘사 기반 맞춤 일정 및 컨시어지 기능 강화 (Cloud)

- **세션** `MOONi 일정 페이스메이커 #1, 기행문 묘사 기반 맞춤 일정 및 컨시어지 기능 강화`
- **브랜치** `cursor/mooni-itinerary-concierge-76f0` · tip `ac868a8a` · PR [#281](https://github.com/catgeot/Days/pull/281)
- **완료**: 파리 기행문 초안에 묘사된 MOONi(AI 도슨트 겸 페이스메이커) 기능에 맞춰, 체류 일수·동행·도착 공항·컨디션에 따른 맞춤형 일정 조율 및 실전 여행 컨시어지 기능을 대폭 강화.
  1) `bookingIntentResolver.js`: `detectItineraryIntent` 추가로 일정/루트/코스/동선 발화 시 전문 `PLANNER` 페르소나 자동 전환.
  2) `mooniPromptBundles.js`: 과밀 방지(Slow Travel), 오전/오후 권역 분할, 첫날 시차 배려(공항→숙소 체크인→가벼운 산책→휴식), 컨디션 맞춤(첫날 가볍게, 다리 아픔, 비오는 날), 솅겐 90/180일 무비자 원칙, EES/ETIAS 최신 변동 주의, 다중 공항(CDG/ORY 등) 시내 이동 요령, 루브르 등 명소 시간대별 예약/가방 규정 가이드 명문화.
  3) `mooniChipPrompts.js`: 일정/루트/코스/동선/첫날/컨디션 발화 패턴 정규식 확장 매핑.
  4) `mooniQuickReplies.js` & `locales/*.json`: 기존 고정형 "2~3일 일정" 칩을 "추천 일정·동선" (모바일 "추천 일정", EN "Suggested itinerary")으로 개선하고, 전송 문구를 "무리 없는 추천 일정과 동선 짜줘"로 유연화.
- **VERIFY**: `node scripts/smoke-mooni-ask-bridge.mjs` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/place/paris (파리 장소 페이지에서 MOONi 대화 열기)
- **QA**: 파리 페이지에서 MOONi에게 "첫날은 가볍게 일정 짜줘" 또는 "오를리 공항 도착 3박 4일 일정" 질문 시 완급 조절된 현실적 동선 및 실전 팁이 나오는지 확인.
- **다음**: `MOONi 일정 페이스메이커 #2, 사용자 피드백 반영 및 실전 응답 튜닝`

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

