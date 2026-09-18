# 2026-09-18 프로젝트 일지

직전: [`2026-09-17-project-log.md`](./2026-09-17-project-log.md)

## 팔경 활용 #61 QA — 연화도 용머리 U투어 공식 사진 (Cloud)

- **세션** `팔경 활용 #61, 통영 결손 오버레이` (같은 턴 Preview 피드백)
- **브랜치** `cursor/palgyeong-use-e744` · tip `ff38062f` · PR [#279](https://github.com/catgeot/Days/pull/279)
- **완료**: 사람 Preview에서 1경 연화도 용머리 목록은 랜드마크, 상세 「사진 2장」은 물음표였다. 오버레이는 적용됐으나 네이버 `postfiles.pstatic.net`이 Preview Referer에 403. JSON contentId 없이 통영U투어 연화도 CMS로 교체(메인 idx=16550 용머리 능선·16548 해식절벽·16549 출렁다리·2803861 능선). 연화사 법당·해수관음·수국길은 넣지 않음. 이순신공원 공사 동상은 유지. 삼덕항 `2782775`는 공식 사진 없어 건너뜀. Tour `127103` 상세 infoItems(등산로)는 CID 경로라 이번 턴에 안 바꿈.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=tongyeong`
- **잔여**: 사진/개요 순수 누락 **46**/876. 다음 허브 **광주8경 2**(경기 광주)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 여행지 매칭 #8 — 송암 동음 다후보 (Cloud)

- **세션** `여행지 매칭 #8, 송암 동음 다후보`
- **브랜치** `cursor/dest-match-arch` · tip `5ef7970a` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: 「송암」엔터가 송암스페이스센터 부분일치로 고양 허브(일산호수공원·킨텍스)만 펼치던 문제를 고침. 동음 사전에 고양 송암스페이스센터·춘천 송암스포츠타운·광주 송암동. 명소 부분일치는 형제 명소 역펼침 안 함. **PR 미병합**.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「송암」엔터 → 스페이스센터·스포츠타운·광주 송암동. 일산호수공원·킨텍스만 가득한 목록 아님.
- **다음**: `여행지 매칭 #9, 동음이의어 사용자 선택 UI`

## 팔경 활용 #61 QA — 통영 1경·이순신공원 빈 썸네일 (Cloud)

- **세션** `팔경 활용 #61, 통영 결손 오버레이` (같은 턴 Preview 피드백)
- **브랜치** `cursor/palgyeong-use-e744` · tip `97f0490d` · PR [#279](https://github.com/catgeot/Days/pull/279)
- **완료**: 사람 Preview에서 1경 연화도 용머리·검색 연화도(통영)·홈 이순신공원이 빈 썸네일이었다. JSON contentId 없이 멤버 오버레이에 통영시 공식 블로그 용머리해안(IMG_0364·IMG_4892)과 한국관광공사 이순신공원 동상(3479192)을 넣음. Tour `127103`은 멤버 overlay로 검색 행도 채움. TOUR_THUMB `584970`. 제주 용머리해안·연화사·여수·남해 이순신공원·남망산과 구분. 삼덕항 `2782775`는 공식 사진 없어 건너뜀.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=tongyeong`
- **잔여**: 사진/개요 순수 누락 **46**/876. 다음 허브 **광주8경 2**(경기 광주)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 여행지 매칭 #7 — 광천·대구 종각 매칭 수정 (Cloud)

- **세션** `여행지 매칭 #7, 광천·대구 종각 매칭 수정`
- **브랜치** `cursor/dest-match-arch` · tip `b1bf56e8` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: 「광천」엔터가 홍성 광천읍 정착지 별칭 역펼침으로 가서 평창 광천선굴이 빠지던 문제를 고침. 동음 사전이 큐레이션 정착지보다 앞. 대구 종각네거리는 검색어「종각」약칭으로 서울 종로 숙소·거리 원점에 붙지 않음. **PR 미병합**.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `smoke:mrt-stay` PASS · `smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「광천」엔터 → 평창 선굴·광주 광천동·홍성 광천읍(홍성 클러스터만 아님). 「종각」→ 대구 종각네거리 → 숙소 찾기 → 대구(서울 인사동·종로 아님).
- **다음**: `여행지 매칭 #8, 동음이의어 사용자 선택 UI`

## 팔경 활용 #61 — 통영팔경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #61, 통영 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `13ae3ad7` · PR [#279](https://github.com/catgeot/Days/pull/279)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 통영팔경 결손 3건(남망산공원·한산도제승당·통영운하 야경). 남망산공원은 동호동 남망공원길 29 1997년 조각공원(3경), 제승당은 한산일주로 70 사적 113호 운주당 터(4경), 운하는 당동~미수동 1932년 3중 교통로(7경). 동피랑·디피랑·세병관·아산 현충사·여수 밤바다·광양만 야경과 구분. 통영 사진·개요 결손 3→0.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=tongyeong`
- **잔여**: 사진/개요 순수 누락 **46**/876. 다음 허브 **광주8경 2**(경기 광주)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 여행지 매칭 #6 — 동음이의어 다후보 리스트업 (Cloud)

- **세션** `여행지 매칭 #6, 동음이의어 다후보 리스트업`
- **브랜치** `cursor/dest-match-arch` · tip `51fb8518` · 로직 `0eecf896` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: `koreaHomonymDictionary` + `detectHomonymLocation`. 종각·광천·강원대·봉화산·대포·대화는 `disambiguationCandidates`로 나열, unique resolve는 null. 종각역·광천선굴은 First-Pass 유지. 용산 hub exact는 도시 클러스터 유지. **PR 미병합**.
- **VERIFY**: `npm run smoke:ko-homonym-ri-search` PASS · `smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/` · PROD `/qa` 목록 1행 (`1090816e` 배포, 307 → git Preview). 스크린샷 시점에는 dest-match 행이 PROD에 없어 `/qa`로 떨어졌음. 하드 리프레시 후 맨 위 「여행지 매칭 — 동음 지명 다후보」.
- **QA**: 홈「종각」엔터 → 서울 종각역·대구 종각네거리. 「광천」엔터 → 평창 선굴·광주 광천동·홍성 광천읍. 대구·광주 단독 진입 아님. Preview 홈은 PROD와 같아 보이며, 검색 엔터에 다후보 카드가 뜸.
- **다음**: `여행지 매칭 #7, 동음이의어 사용자 선택 UI`

## 팔경 활용 #60 — 의정부8경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #60, 의정부 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `3f6ce41b` · PR [#278](https://github.com/catgeot/Days/pull/278)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 의정부8경 결손 3건(수락산 도정봉·의정부경전철·의정부제일시장). 도정봉은 장암동 해발 526m 화강암 능선(3경, 만가대 4.5km·동막골 5.3km·기차바위·철모바위), 경전철은 2012년 경기도 최초 발곡~탑석(5경), 제일시장은 시민로121번길 43-2 1978년 600여 점포 가나다라동(7경). 노원 수락산·당고개·논산 수락계곡·김해경전철·부대찌개거리와 구분. 의정부 사진·개요 결손 3→0.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=uijeongbu`
- **잔여**: 사진/개요 순수 누락 **49**/876. 다음 허브 **통영팔경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 여행지 매칭 #5 — 카테고리 맥락 파이프라인 전달 (Cloud)

- **세션** `여행지 매칭 #5, 카테고리 맥락 파이프라인 전달`
- **브랜치** `cursor/dest-match-arch` · tip `1f625d10` · PR [#276](https://github.com/catgeot/Days/pull/276)
- **완료**: `placeCategory`(자연·역사·역·대학)를 MRT 래더·갤러리에 전달. 광천선굴 1차 키워드 평창, 광주 광천동 호텔 승격 차단. 갤러리는 contentId·전경·landscape. **PR 미병합**.
- **VERIFY**: `npm run smoke:explore-search-aliases` PASS · `smoke:mrt-stay` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/dest-match → git Preview `/`
- **QA**: 홈「광천선굴」숙소 찾기 → 평창(광주 호텔 아님). 갤러리 동굴 전경.
- **다음**: `여행지 매칭 #6, 동음이의어 다후보 리스트업`

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
