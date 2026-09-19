# 2026-09-19 프로젝트 일지

직전: [`2026-09-18-project-log.md`](./2026-09-18-project-log.md)

## 팔경 활용 #65 — 보성9경 일림산 용추계곡·주암호 서재필기념관 오버레이 (Cloud)

- **세션** `팔경 활용 #65, 보성 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `9d09f967` · PR [#286](https://github.com/catgeot/Days/pull/286)
- **완료**: JSON contentId 없이 LOCAL_SCENIC_MEMBER_OVERLAYS로 보성9경 결손 2건 보강. 일림산 용추계곡(7경)은 웅치면 용반리 일림산 664m·보성강 시원·용추폭포(선녀탕·용바위). 주암호 서재필기념관(9경)은 문덕면 용암길 8 기념관·가내길 18-35 생가(1864 가내마을·1992 조성·개화문). 보성군 문화관광 9경 공식 사진. 문경 용추계곡·가평·동해 용추폭포·제암산자연휴양림·서울 독립문·순천 주암댐·주암호생태습지·대원사와 구분. 순수 누락 **38**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=boseong`
- **잔여**: 사진/개요 순수 누락 **38**/876. 다음 허브 **산청9경 2**(황매산 철쭉·남명조식유적지)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #64 QA — 무안 검색 승달산·초의 빈 썸네일 (Cloud)

- **세션** `팔경 활용 #64, 무안 결손 오버레이` (같은 턴 Preview 피드백)
- **브랜치** `cursor/palgyeong-use-e744` · tip `83dc35a4` · PR [#284](https://github.com/catgeot/Days/pull/284)
- **원인**: 「무안」검색 8경 승달산 랜드마크 아이콘. Tour `126614` first_image 공란. 4경 초의선사탄생지 `127177`은 tourapi_attraction 미동기화.
- **완료**: JSON contentId 없이 무안군 문화관광 공식 사진 오버레이. 승달산 산나리 조망(`seungdalsan_8.jpg`)·초의길 30 전경(`/9/01.jpg`). 도리포·낙지공원·백로 번식지는 Tour first_image 있어 유지. 법천사 무안과 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview 「무안」검색 8경·4경 썸네일
- **잔여**: 사진/개요 순수 누락 **40**/876. 다음 허브 **보성9경 2**(일림산 용추계곡·주암호 서재필기념관)
- **QA**: 「무안」검색 승달산·초의선사탄생지 사진인지. 도리포·낙지공원·법천사 무안 기존 썸네일 유지인지.

## 향교 검색 #1 — TourAPI 다후보 (Cloud)

- **세션** `향교 검색 #1, TourAPI 다후보`
- **브랜치** `cursor/hyanggyo-search-f9b8` · tip `c873bce1` · PR [#285](https://github.com/catgeot/Days/pull/285)
- **원인**: 허브 prefix가 「춘천향교」를 춘천 도시로 스냅. 허브 SSOT 향교는 4곳뿐. TourAPI에는 춘천향교(125780)·향교 제목 168건.
- **완료**: 도시명 뒤 나머지가 시·군이 아니면 허브 히트 아님. 향교·서원은 TourAPI 제목 다후보. 시설 쿼리에 향교·서원.
- **VERIFY**: `npm run smoke:korea-poi-type-search` PASS · `smoke:explore-search-aliases` PASS · `smoke:search-enter-match` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/hyanggyo → git Preview `/`
- **QA**: 「향교」엔터 → 춘천·나주 등 여러 장. 「춘천 향교」엔터 → 춘천향교 · 춘천 도시 아님. 「목포」엔터 리스트 유지.
- **다음**: Preview OK면 PR #285 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #64 — 무안9경 식영정·느러지·톱머리·홀통 오버레이 (Cloud)

- **세션** `팔경 활용 #64, 무안 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `5eb2785b` · PR [#284](https://github.com/catgeot/Days/pull/284)
- **완료**: JSON contentId 없이 LOCAL_SCENIC_MEMBER_OVERLAYS로 무안9경 결손 2건 보강. 식영정(3경)은 몽탄면 호반로 562-15 息營亭(1630 한호 임연·문화재자료 237호)와 영산강 느러지 곡강. 톱머리·홀통(5경)은 망운면 톱머리길 66·현경면 홀통길 198-1 백사장·해송. 무안군 문화관광 공식 사진. 담양 息影亭·나주 느러지전망대·영월 한반도지형·도리포·조금나루와 구분. 순수 누락 **40**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=muan`
- **잔여**: 사진/개요 순수 누락 **40**/876. 다음 허브 **보성9경 2**(일림산 용추계곡·주암호 서재필기념관)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 탐색 Enter #1 — 도시 허브 리스트 (Cloud)

- **세션** `탐색 Enter #1, 도시 허브 리스트`
- **브랜치** `cursor/search-enter-hub-2018` · tip `b8ef3e66` · PR [#283](https://github.com/catgeot/Days/pull/283)
- **원인**: 여행지 매칭 #2가 타이핑 제안 이름 일치를 Enter에서 바로 고름. 「목포」드롭다운의 도시 카드가 써머리 장소 카드로 열림.
- **완료**: `preferEnterSuggestion`이 도시 허브 exact면 null. Enter는 도시+명소 선택 카드. 유달산·광천선굴 명소 exact는 유지.
- **VERIFY**: `npm run smoke:search-enter-match` PASS · `smoke:explore-choice-overlay` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/search-enter-hub → git Preview `/explore`
- **QA**: 「목포」엔터 → 리스트 카드. 「유달산」엔터 → 유달산. 「광천선굴」엔터 → 평창 광천선굴.
- **다음**: Preview OK면 PR #283 병합
- **QA 방식**: 사람은 **같은 턴** Preview QA.

## 팔경 활용 #63 — 목포9경 목포진·다도해 전경 오버레이 (Cloud)

- **세션** `팔경 활용 #63, 목포 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `593fdee0` · PR [#282](https://github.com/catgeot/Days/pull/282)
- **완료**: JSON contentId 없이 LOCAL_SCENIC_MEMBER_OVERLAYS로 목포9경 결손 2건 보강. 목포진(6경)은 만호동 목포진길 11번길 1-5 수군진 역사공원(세종 21년 설치·2014 객사 복원·문화재자료 137호). 다도해 전경(8경)은 유달산에서 고하도·외달도 조망. 목포시 문화관광 9경 공식 사진. 해남 구 목포구등대·목포대교 일몰·유달산 산봉·외달도 섬·진도 다도해해상국립공원과 구분. 순수 누락 **42**/876.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=mokpo`
- **잔여**: 사진/개요 순수 누락 **42**/876. 다음 허브 **무안9경 2**(영산강 식영정과 느러지·톱머리·홀통 해수욕장)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## MOONi 일정 페이스메이커 #3 — PR #281 메인 병합 (Cloud)

- **세션** `MOONi 일정 페이스메이커 #3, Preview OK면 PR 병합`
- **브랜치** `cursor/mooni-itinerary-concierge-76f0` · merge `16c8be14` · PR [#281](https://github.com/catgeot/Days/pull/281) (MERGED)
- **완료**: 컴포저 상황극 QA(체류·공항·항공시각 전제 유지 · 턴당 ~1.4ms)와 `smoke-mooni-ask-bridge`/`build` PASS 후 PR #281을 main에 병합. 인덱스 주제 종료. Preview 작업 로그는 팔경 활용을 활성으로 유지.
- **VERIFY**: `node scripts/smoke-mooni-ask-bridge.mjs` PASS · `npm run build` PASS
- **PROD** https://www.gateo.kr/place/paris
- **QA**: 「오를리 공항 도착 3박 4일」 후 「둘째 날은?」이 3박·ORY를 유지하는지. 「KE901 오후 2시 CDG」 후 일정 질문이 CDG·14:00을 쓰는지. 도시명 「파리」만으로는 공항을 안 잡는지.
- **다음**: 없음 (주제 종료)

## 팔경 활용 #62 QA — 경기 광주 관광공사 검색 0건 (Cloud)

- **세션** `팔경 활용 #62, 경기 광주 결손 오버레이 QA`
- **브랜치** `cursor/palgyeong-use-e744` · tip `0979bf47` · PR [#280](https://github.com/catgeot/Days/pull/280)
- **완료**: 「경기 광주」관광공사 전무는 사실이 아님. TourAPI type12 `경기도 광주시` 40건. 허브명「경기 광주」ilike가「경기도 광주시」와 안 맞아 0건. Tour DB 검색만 `scenicTourSearchQuery`→「경기도 광주」. 명승 0은 사실(남한산성은 사적).
- **VERIFY**: `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-local-scenic-lists` PASS · `npx vite build` PASS · DB `경기 광주`=0 · `경기도 광주`=40
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview 검색 「경기 광주」
- **잔여**: 다음 허브 **목포9경 2**(목포진·다도해 전경)
- **QA**: 검색 「경기 광주」한국관광공사 목록이 비어 있지 않은지(개원사·한옥마을·경안천). 명승 0은 정상.

## 여행지 매칭 #14 — PR #276 메인 병합 및 배포 (Cloud)

- **세션** `여행지 매칭, PR #276 메인 병합 및 배포`
- **브랜치** `cursor/dest-match-arch` · merge `e89de918` · PR [#276](https://github.com/catgeot/Days/pull/276) (MERGED)
- **완료**: 검증 게이트 PASS 후 PR #276을 main에 병합. 작업 로그 `active: false`. `/qa/dest-match` → PROD `https://www.gateo.kr/`. 인덱스·플랜 §9 주제 종료.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run smoke:mrt-stay` PASS (33) · `npx vite build` PASS
- **PROD** https://www.gateo.kr/ · `/qa/dest-match` → PROD `/`
- **QA**: 홈「종각」「광천」「송암」「강원대」동음 분기 · 광천선굴 숙소 평창 · 송암스포츠타운 숙소 춘천(양주 아님)
- **다음**: 없음 (주제 종료)

## MOONi 일정 페이스메이커 #2 — 여행지 세션 맥락 저장 및 실전 응답 튜닝 (Cloud)

- **세션** `MOONi 일정 페이스메이커 #2, 사용자 피드백 반영 및 실전 응답 튜닝`
- **브랜치** `cursor/mooni-itinerary-concierge-76f0` · tip `7c2c083d` · PR [#281](https://github.com/catgeot/Days/pull/281)
- **점검**: 대화 기록(`saved_trips.messages`)은 여행지별로 남지만, 체류·항공편·현재 동선은 구조화되어 있지 않아 후속 질문이 카탈로그 기본값으로 덮일 수 있었음.
- **완료**: `mooniTripSession.js`로 체류 일수·도착/출발 공항·항공편 번호·도착 시각·컨디션·현재 권역을 추출해 해당 여행지 세션(`curation_data.mooniSession` + localStorage)에 저장. 매 턴 system prompt `[이번 여행 세션]`으로 주입. 사용자 도착 공항이 GATEO 카탈로그보다 우선.
- **VERIFY**: `node scripts/smoke-mooni-ask-bridge.mjs` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/place/paris
- **QA**: 「오를리 공항 도착 3박 4일」 후 「둘째 날은?」이 체류·오를리를 다시 묻지 않는지. 「KE901 오후 2시 CDG 도착」 후 일정이 그 시각·공항을 쓰는지.
- **다음**: `MOONi 일정 페이스메이커 #3, Preview OK면 PR 병합` (완료 · merge `16c8be14`)

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
- **완료**: 홈「송암」→ 춘천 송암스포츠타운 → 숙소 찾기가 검색어「송암」을 1차 키워드로 써서 양주 장흥 펜션이 나왔다. 짧은 동음 토큰은 시·군(춘천) 선두, Geo-Sanity에 양주 추가. **#14에서 PR [#276](https://github.com/catgeot/Days/pull/276) 병합.**
- **VERIFY**: `npm run smoke:mrt-stay` PASS (`chuncheon-songam-sports-town` kw=춘천) · `smoke:ko-homonym-ri-search` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「송암」→ 송암스포츠타운 → 숙소 찾기 → 춘천. 양주 비타민펜션·장흥유원지면 실패.
- **다음**: `여행지 매칭 #12, 하드코딩 사전 정리 및 SSOT 일원화`

## 여행지 매칭 #13 — 종합 QA 및 메인 병합 준비 (Cloud)

- **세션** `여행지 매칭 #13, 종합 QA 및 메인 병합 준비`
- **브랜치** `cursor/dest-match-arch` · tip `cf1eb018` · PR [#276](https://github.com/catgeot/Days/pull/276) (Ready for Review)
- **완료**: 서브에이전트(컴포져) 및 전체 스모크 기반으로 종각·광천·송암·강원대 등 주요 지명의 동음이의어 분기, First-Pass 고유 매칭, 숙소 래더(Geo-Sanity 가드 포함), 갤러리 시설 컷 필터링에 대한 심층 QA를 완료. 모든 시나리오 PASS 확인 후 PR #276을 Draft 해제(Ready for Review)하여 메인 병합 준비를 완료.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run smoke:mrt-stay` PASS (33개 케이스) · `npx vite build` PASS (빌드 에러 0건)
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 종각(서울/대구 분기), 광천(평창/광주/홍성 분기, 광천선굴 숙소 평창), 송암(고양/춘천/광주 분기, 송암스포츠타운 숙소 춘천), 강원대(춘천/삼척 분기) 정상 동작 확인.
- **다음**: `여행지 매칭 #14, PR #276 메인 병합 및 배포` (완료 · merge `e89de918`)

## 여행지 매칭 #12 — 하드코딩 사전 정리 및 SSOT 일원화 (Cloud)

- **세션** `여행지 매칭 #12, 하드코딩 사전 정리 및 SSOT 일원화`
- **브랜치** `cursor/dest-match-arch` · tip `04b69655` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: `mrtStayQuery.js`, `exploreSearchAliases.js`, `usePlaceGallery.js`, `koreaHomonymDictionary.js` 등에 분산되어 있던 `KO_STATION_ALIASES`, `KO_UNIVERSITY_ALIASES`, `KO_UNIVERSITY_SATELLITE_ALIASES`, `KO_EXPLORE_SEARCH_ALIASES`, `KO_GALLERY_QUERY_OVERRIDES`, `KOREA_HOMONYM_GROUPS`를 `src/pages/Home/lib/koreaPlaceMatchDictionary.js` 단일 SSOT 파일로 통합 일원화. `resolveKoreaPlaceMatch` 통합 리졸버 및 helper 함수 모듈화. 기존 모듈 re-export로 하위 호환성 100% 유지. `scripts/smoke-explore-search-aliases.mjs`에 SSOT 무결성 검증 추가. 기존 회귀 0건. **#14에서 PR [#276](https://github.com/catgeot/Days/pull/276) 병합.**
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run smoke:mrt-stay` PASS (33개 케이스) · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈 검색에서 종각, 광천, 송암스포츠타운, 강원대 등이 정상 동작하고, 숙소 찾기 및 갤러리가 깨짐 없이 노출되는지 확인.
- **다음**: `여행지 매칭 #13, 종합 QA 및 메인 병합 준비`

