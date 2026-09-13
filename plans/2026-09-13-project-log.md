# 2026-09-13 프로젝트 일지

직전: [`2026-09-12-project-log.md`](./2026-09-12-project-log.md)

## 방문자 개선 #1 — 404 복구 및 AI채팅 초기화 (Cloud)

- **세션** `방문자 개선 #1, 404 복구 및 AI채팅 초기화`
- **브랜치** `cursor/visitor-growth-1f90` · tip `7a0e5abc`
- **완료**: `AboutPage` 신설·`/about` 라우트, `/pricing`→`/about`·`/product`→`/explore` 리다이렉트, 와일드카드 404→`/`. 장소 미선택 AI 채팅은 `MOONi` 바인딩·`placeIntroTarget` 가드로 `Invalid destination name` 차단. 범용 탐색 칩 4종(휴양지·힐링·5시간 이내·가족).
- **VERIFY**: `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/`
- **QA**: `/about`·`/pricing`·`/product`·존재하지 않는 URL → 홈. 장소 없이 하단 「AI와 여행 대화」→ 환영 멘트·칩 4종.

## 방문자 활성화 — 사이트 체질 개선 12대 과제 종합 계획 수립

- **작업**: 그록봇(Grok) 진단 12대 문제점 실사 및 개선 로드맵 수립
- **실사**: 서브에이전트 3기 병렬 기동으로 12개 항목 코드베이스 정밀 진단
  - P0: 404 빈 화면(App.jsx 라우트 누락), 장소 미선택 AI 채팅 Invalid destination name 에러(ChatModal/placeChatIntro.js), 홈 가치제안 부재
  - P1: 무드 검색 지오코딩 오탐(useHomeHandlers.js), 모바일 390px 검색 잘림/로그인 은닉, 플래너 복잡도 90/100 과밀(25~30개 버튼), 제휴 AD 표기 누락
  - P2: EN 모드 한글 노출(PlaceCardExpanded.jsx), 신뢰 요소(전역 푸터 부재), 로딩 스켈레톤/빈 상태 에러 복구(korea/curation), 가입 혜택 전무, 접근성(aria-label/지구본 모션)
- **플랜**: [`visitor-growth-activation-plan.md`](./visitor-growth-activation-plan.md) (4단계 8세션 독립 완결형 실행 계획서)
- **핸드오프**: [`feature-handoff-index.md`](./feature-handoff-index.md)에 `방문자 개선` 행 및 다음 제시어 등록
- **다음**: 세션 #1 `방문자 개선 #1, 404 복구 및 AI채팅 초기화` (브랜치 `cursor/visitor-growth-1f90`)

## 팔경 활용 #38 — 천안 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #38, 천안 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `86066c69` · PR [#243](https://github.com/catgeot/Days/pull/243) · [#240](https://github.com/catgeot/Days/pull/240) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 천안8경 결손 4건(유관순열사사적지·태조산 왕건길과 청동대좌불·아라리오조각광장·봉선홍경사갈기비)의 개요·주소·공식 사진 보강. 천안시 문화관광 유관순 추모각·각원사 청동대좌불·아라리오 조각·봉선홍경사갈기비 사진을 연결했고, 청동대좌불은 GATEO 선정 각원사와 다른 시 공식 사진을 썼다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=cheonan`
- **잔여**: 사진/개요 순수 누락 **122**/876. QA 후 다음 허브 **담양10경 4**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #39 — 담양 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #39, 담양 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `1c2fa1c2` · PR [#245](https://github.com/catgeot/Days/pull/244)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 담양10경 결손 4건(가마골용소·삼인산·메타세쿼이아 가로수길·담양관방제림)의 개요·주소·공식 사진 보강. 담양군 문화관광 게시판 공식 사진을 연결했고, 가마골용소·관방제림·메타세쿼이아는 한국관광공사 사진을 보탰다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=damyang`
- **잔여**: 사진/개요 순수 누락 **118**/876. QA 후 다음 허브 **밀양8경 4**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #40 다음 — 밀양 결손 오버레이

```
팔경 활용 #40, 밀양 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 밀양8경 사진·개요 없는 4건(시례 호박소·월연정 풍경·만어사 운해·종남산 진달래)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=miryang
```

## 탐색홈 검색 #5 — 문경 썸네일 경로 통일 (Cloud)

- **세션** `탐색홈 검색 #5, 문경 썸네일 경로 통일`
- **브랜치** `cursor/explore-search-d14b` · tip `1aa00b90` · PR [#242](https://github.com/catgeot/Days/pull/242) · [#239](https://github.com/catgeot/Days/pull/239) merge ✅
- **원인**: 탐색홈은 팔경 오버레이·GATEO 선정 `imageUrl`만, 명소홈은 TourAPI `first_image`·contentId 오버레이까지. 드롭다운은 TourAPI 미조회
- **완료**: `resolveSearchScenicMedia`로 팔경 오버레이 → contentId 오버레이 → GATEO 선정 순 해석. 드롭다운도 선택 행과 같이 TourAPI 캐시. 팔경 결손 오버레이가 추가되면 탐색에도 같이 반영
- **VERIFY**: `smoke:explore-choice-overlay` PASS · `smoke:korea-local-scenic-lists` PASS · `smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/explore-search → git Preview `/explore`
- **QA**: 문경 검색 — 새재계곡·쌍용·진남교반·운달·봉암사 사진. 선정(문경새재·오픈세트장·오미자) 사진. 선유동·용추·경천호는 TourAPI 또는 이후 팔경 오버레이
- **주의**: `/qa/explore-search`→PROD PR [#241](https://github.com/catgeot/Days/pull/241)은 이 Preview QA가 끝날 때까지 병합 보류
- **QA 방식**: 사람은 **같은 턴** Preview QA

## 탐색홈 검색 #6 — Preview OK 후 PR 병합 (Cloud)

- **세션** `탐색홈 검색 #6, Preview OK면 PR 병합`
- **브랜치** `cursor/explore-search-d14b` · merge `ad333614` · PR [#242](https://github.com/catgeot/Days/pull/242) (MERGED)
- **완료**: Preview QA 후 PR #242 병합. #5 `resolveSearchScenicMedia`·드롭다운 TourAPI 썸네일 포함. 쌍용계곡 VisitKorea 1050806(실내 사진) → 문경시 문화관광 mg8_0401·0402. 팔경·선정 행 사진 OK. 선유동·용추·경천호는 TourAPI 또는 이후 팔경 오버레이
- **VERIFY**: `smoke:explore-choice-overlay` PASS · `smoke:korea-local-scenic-lists` PASS · `smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **PROD** https://www.gateo.kr/explore (배포 후)
- **잔여**: `/qa/explore-search`→PROD PR [#241](https://github.com/catgeot/Days/pull/241) — 병합 보류 유지
- **다음 제시어 없음** (주제 종료)

## 팔경 활용 #37 — 논산 검색 빈 썸네일 (Cloud)

- **세션** `팔경 활용 #37, 논산 검색 빈 썸네일` — #37 Preview QA 피드백
- **브랜치** `cursor/palgyeong-use-e744` · tip `e3b1711a` · PR [#240](https://github.com/catgeot/Days/pull/240)
- **완료**: 「논산」 관광지 검색에서 TourAPI `first_image`가 없던 3건(양촌자연휴양림 2750930·강경역사관 946844·노강서원 1956315)에 JSON contentId 기입 없이 런타임 썸네일 오버레이. 양촌·노강은 논산시 문화관광 공식 갤러리, 강경역사관은 한국관광공사 detailImage.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview 검색 「논산」 자연·인문
- **잔여**: 다음 허브 **천안8경 4**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #37 — 논산 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #37, 논산 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `2e8f2439` · PR [#240](https://github.com/catgeot/Days/pull/240) · [#238](https://github.com/catgeot/Days/pull/238) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 논산11경 결손 4건(대둔산 수락계곡·강경포구와 근대역사거리·노성산성과 명재고택·종학당과 한국유교문화진흥원)의 개요·주소·공식 사진 보강. 논산시 문화관광 11경 수락계곡·강경포구·명재고택·종학당 사진을 연결했고, 수락계곡은 시 여름명소 선녀폭포·수락폭포 사진, 강경·고택·종학당은 한국관광공사 옥녀봉·강경역사관·명재고택·종학당 사진을 보탰다. 수락계곡 썸네일은 GATEO 선정 대둔산(완주)과 다르게 유지.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=nonsan`
- **잔여**: 사진/개요 순수 누락 **126**/876. QA 후 다음 허브 **천안8경 4**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 탐색홈 검색 #4 — origin/main 반영 (Cloud)

- **세션** `탐색홈 검색 #4, 옹진은 팔경 없이 명소 그룹`
- **브랜치** `cursor/explore-search-d14b` · merge `b67985a8` · PR [#239](https://github.com/catgeot/Days/pull/239)
- **완료**: Preview OK 후 PR #239를 `origin/main`에 병합. #1 Enter 후 드롭다운 닫힘. #3 팔경식 행·문경 1경 썸네일. #4 옹진은 「옹진 명소」만(N경 없음)
- **VERIFY**: `smoke:explore-choice-overlay` · `smoke:korea-local-scenic-lists` · `smoke:explore-search-aliases` · `vite build` PASS
- **PROD** https://www.gateo.kr/explore
- **다음 제시어 없음** (주제 종료). `/qa/explore-search` → PROD는 PR [#241](https://github.com/catgeot/Days/pull/241). 작업 로그는 팔경 활용(#240)이 현재 프로젝트

## 탐색홈 검색 #4 — 옹진은 팔경 없음 (Cloud)

- **세션** `탐색홈 검색 #4, 옹진은 팔경 그룹이 없어요`
- **브랜치** `cursor/explore-search-d14b` · tip `86a381d3` · PR [#239](https://github.com/catgeot/Days/pull/239)
- **이후 #4에서 `origin/main` 병합** (`b67985a8`). 당시 보류 이유: 무팔경 허브 소제목이 새 동작이라 Preview 전 merge 금지
- **완료**: 옹진은 지자체 팔경 SSOT가 없어 N경을 붙이지 않음. 섬은 「옹진 명소」소제목만. 문경 팔경·문경 1경은 유지
- **VERIFY**: `smoke:explore-choice-overlay` PASS · `smoke:korea-local-scenic-lists` PASS · `smoke:explore-search-aliases` PASS · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/explore-search → git Preview `/explore`
- **QA**: 옹진 Enter — 옹진 명소·섬 사진·1경 없음. 문경 — 문경 팔경·문경 1경
- **QA 방식**: 사람은 **같은 턴** Preview QA

## 탐색홈 검색 #3 — 팔경식 리스트·카드 썸네일 (Cloud)

- **세션** `탐색홈 검색 #3, Preview OK면 PR 병합`
- **브랜치** `cursor/explore-search-d14b` · tip `d7bdccd9` · PR [#239](https://github.com/catgeot/Days/pull/239)
- **병합 안 함**: Preview가 팔경식 나열·카드 보강을 요청. 새 동작이라 Preview 전 merge 금지
- **완료**: Enter 선택 결과를 명승 팔경 리스트처럼 한 줄 행으로 나열. 팔경 멤버에 「문경 1경」 행 부제. GATEO 선정 썸네일을 드롭다운·선택 행에 연결(옹진 덕적도 등). Enter 후 드롭다운은 닫힘 유지
- **VERIFY**: `smoke:explore-choice-overlay` PASS · `smoke:korea-local-scenic-lists` PASS · `smoke:explore-search-aliases` PASS · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/explore-search → git Preview `/explore`
- **QA**: 옹진 Enter — 도시·섬 한 줄 행+사진 · 문경 검색 — 문경 팔경·문경 1경
- **QA 방식**: 사람은 **같은 턴** Preview QA

## 탐색홈 검색 #2 — QA 링크 PROD 연결 (Cloud)

- **세션** `탐색홈 검색 #2, QA 링크 PROD 연결`
- **원인**: `/qa/explore-search`가 PROD SSOT에 없어 모르는 slug → `/qa` 목록으로 떨어짐
- **완료**: `cloudQaShareLinks.js`·`vercel.json`에 `/qa/explore-search` → git Preview `/explore` 를 `origin/main`에 반영. 배포 후 짧은 링크가 탐색홈 Preview로 바로 감
- **Preview** https://www.gateo.kr/qa/explore-search → git Preview `/explore`
- **QA**: `/qa` 목록에 「탐색홈 검색 선택 카드」가 있는지 · 누르면 `/explore` Preview인지
- **QA 방식**: 사람은 **같은 턴** Preview QA

## 탐색홈 검색 #1 — 선택 카드·드롭다운 중첩 (Cloud)

- **세션** `탐색홈 검색 #1, 선택 카드 중첩 정리`
- **브랜치** `cursor/explore-search-d14b` · tip `09d5c2a8` · PR [#239](https://github.com/catgeot/Days/pull/239)
- **완료**: 옹진처럼 동명이 많은 검색어를 Enter하면 타이핑 드롭다운과 선택 카드가 같은 후보를 두 겹으로 띄웠다. Enter 이후에는 설명 있는 선택 카드만 남기고 드롭다운·안내문을 닫음. 타이핑 중 제안 목록은 유지.
- **VERIFY**: `npm run smoke:explore-choice-overlay` PASS · `npm run smoke:explore-search-aliases` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/explore-search → git Preview `/explore`
- **QA**: `/explore`에서 「옹진」 검색 후 Enter — 도시·섬 카드만 보이는지, 스크롤해도 목록이 두 겹으로 바뀌지 않는지
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #36 — 계룡 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #36, 계룡 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `6ebd84b2` · PR [#238](https://github.com/catgeot/Days/pull/238) · [#237](https://github.com/catgeot/Days/pull/237) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 계룡9경 결손 4건(향적산 국사봉·숫용추·암용추·계룡대 통일탑)의 개요·주소·공식 사진 보강. 계룡시 엄사면 향적산 국사봉 사진, 문화관광 숫용추·암용추 사진, 문화관광·신도안면 계룡대 통일탑 사진을 연결했고, 국사봉 갤러리는 같은 산 향적산 치유의 숲 공식 사진을 보탰다. 국사봉 썸네일은 GATEO 선정 계룡산국립공원과 다르게 유지.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=gyeryong`
- **잔여**: 사진/개요 순수 누락 **130**/876. QA 후 다음 허브 **논산11경 4**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #37 다음 — 논산 결손 오버레이

```
팔경 활용 #37, 논산 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 논산11경 사진·개요 없는 4건(대둔산 수락계곡·강경포구와 근대역사거리·노성산성과 명재고택·종학당과 한국유교문화진흥원)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=nonsan
```

## 팔경 활용 #35 — 증평 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #35, 증평 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `f9f4528c` · PR [#237](https://github.com/catgeot/Days/pull/237) · [#236](https://github.com/catgeot/Days/pull/236) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 증평구경 결손 4건(좌구산 천문대·삼기저수지 등잔길·추성산성·연병호 항일역사공원)의 개요·주소·공식 사진 보강. 증평군 문화관광 천문대 사진, 한국관광공사 삼기저수지 사진, 국가유산청·증평기록관 추성산성·연병호 사진을 연결했다. 좌구산 천문대 썸네일은 GATEO 선정 좌구산휴양림과 다르게 유지.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=jeungpyeong`
- **잔여**: 사진/개요 순수 누락 **134**/876. QA 후 다음 허브 **계룡9경 4**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #34 — 안양 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #34, 안양 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `23ed5d76` · PR [#236](https://github.com/catgeot/Days/pull/236) · [#235](https://github.com/catgeot/Days/pull/235) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 안양9경 결손 4건(망해암일몰·수리산성지·평촌1번가 문화의거리·만안교)의 개요·주소·공식 사진 보강. 안양시 문화관광 망해암·수리산성지·평촌1번가·만안교 사진을 연결했다. TourAPI searchPhoto는 0건이었다.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=anyang`
- **잔여**: 사진/개요 순수 누락 **138**/876. 다음은 증평구경 4 → **#35 완료**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #33 — 포항 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #33, 포항 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `578498bb` · PR [#235](https://github.com/catgeot/Days/pull/235) · [#232](https://github.com/catgeot/Days/pull/232) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 포항12경 결손 5건(호미곶 일출·내연산 12폭포·운제산 오어사 사계·영일대 포스코 야경·철길숲 불의 정원)의 개요·주소·공식 사진 보강. 한국관광공사 호미곶 해맞이광장·내연산 연산폭포·오어사·영일대 누각 사진을 연결했고, 철길숲은 포항시 공식 사진을 썼다. 영일대 포스코 야경 썸네일은 GATEO 선정 영일대해수욕장·스페이스워크와 다르게 유지.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=pohang` · 검색 「포항」 그룹명 **포항 12경**
- **잔여**: 사진/개요 순수 누락 **142**/876. 다음은 안양9경 4 → **#34 완료**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #32 — 남해 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #32, 남해 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `2dbb33e9` · PR [#232](https://github.com/catgeot/Days/pull/232) · [#231](https://github.com/catgeot/Days/pull/231) merge ✅
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 남해12경 결손 5건(남해 금산과 보리암·창선교와 남해지족해협 죽방렴·서포 김만중 선생 유허와 노도·남해 물건리 방조어부림과 물미해안·창선-삼천포대교)의 개요·주소·공식 사진 보강. 한국관광공사 보리암·죽방렴·창선교·노도·방조어부림·창선삼천포대교 사진을 연결했고, 창선-삼천포대교는 사천9경 케이블카·교량 사진과 다른 썸네일을 썼다. 사람 Preview에서 「남해 십경」으로 보이던 그룹 제목을 공식명 「남해 12경」으로 맞춤(sipgyeong+12경). 하동·금산 십경은 그대로.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=namhae` · 검색 「남해」 그룹명 **남해 12경**
- **잔여**: 사진/개요 순수 누락 **147**/876. 다음은 포항12경 5 → **#33 완료**

## 같은 세션 QA — AGENTS.md 전 주제 규칙

- **적용**: [`AGENTS.md`](../AGENTS.md) Cloud · [`cloud-preview-continuity.md`](./cloud-preview-continuity.md) **§5** · `.ai-context` **§4.1 13**
- **기본**: 복잡 로직·토큰 과다 작업 **외에는** 작업 세션에서 QA 마무리. 다음 제시어 = 다음 작업. `{주제} #N, 사람 Preview QA`를 다음 에이전트 채팅으로 넘기지 않음.
- **예외**: 복잡 로직·토큰 과다 세션만 별도 사람 Preview QA 채팅 허용. 피드백 → 수정 세션.
- **팔경**: 다음 에이전트 = **#38 천안 결손 오버레이**

## 축제 숙소허브 #1 — 미추홀→옹진 오탐 (Cloud)

- **세션** `축제 숙소허브 #1, 주소 매칭`
- **브랜치** `cursor/festival-stay-hub-c241` · tip `60e7e10d` · PR [#233](https://github.com/catgeot/Days/pull/233)
- **원인**: 인천 시드가 인천·강화·옹진뿐 · 옹진 좌표가 군청(미추홀 인근) → 학산마당극놀래 숙소·투어가 「옹진」
- **수정**: 주소 시·군·구로 구 허브(`michuhol`) 우선 · 없으면 인천 시도 대표 · 옹진군 주소는 옹진 유지
- **VERIFY**: `smoke:korea-festival-personal` · `smoke:korea-theme-cross-links` · `smoke:korea-tna-strip` · `smoke:korea-festival-stay-url` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/festival-stay-hub → git Preview `/korea`
- **QA**: 학산마당극놀래 본문 숙소·투어 제목이 **미추홀**인지(옹진 아님)

## 축제 숙소허브 #2 — 시드 없는 구 숙소·투어 폴백 (Cloud)

- **세션** `축제 숙소허브 #2, Preview OK면 PR 병합`
- **브랜치** `cursor/festival-stay-hub-c241` · tip `31780152` · PR [#233](https://github.com/catgeot/Days/pull/233)
- **피드백**: 미추홀 매칭은 맞지만 MRT 숙소·투어 재고가 없어 섹션이 빔. 다른 구도 동일
- **수정**: 시드에 없는 구 허브는 숙소·투어만 시도 대표(인천)로 폴백 · 지리 nearby는 미추홀 · 옹진군청 최근접은 쓰지 않음 · 시드 도시(횡성)는 유지 · 재고 0이면 인근 시드 키워드 alt
- **VERIFY**: `smoke:korea-festival-personal` · `smoke:korea-theme-cross-links` · `smoke:korea-tna-strip` · `smoke:korea-festival-stay-url` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/festival-stay-hub → git Preview `/korea`
- **QA**: 학산마당극놀래 숙소·투어 제목 **인천** · 카드 보임(옹진·빈 미추홀 아님). 이번 턴 Preview 후 OK면 병합
- **병합 안 함**: 폴백은 새 동작이라 Preview 전 merge 금지

## 축제 숙소허브 #3 다음

```
축제 숙소허브 #3, Preview OK면 PR 병합
@plans/feature-handoff-index.md
@plans/2026-09-13-project-log.md
브랜치 cursor/festival-stay-hub-c241 · PR #233 · Preview /qa/festival-stay-hub
금지: UI 리디자인 · 축제 시트 리팩터 · feature에 plans/** 커밋
작업: 학산마당극놀래 본문 숙소·투어가 인천이고 카드가 보이는지(옹진·빈 미추홀 아님). OK면 PR #233 병합
```

## 한국 투어티켓 #7 — 국내 렌터카·기차표 (Cloud)

- **세션** `한국 투어티켓 #7, 국내 렌터카·기차표`
- **브랜치** `cursor/korea-tna-strip-ef65` · tip `593fd59f` · PR [#234](https://github.com/catgeot/Days/pull/234) · #6 [#230](https://github.com/catgeot/Days/pull/230) MERGED
- **렌터카**: 문구 「{{지역}} 렌터카 보기」(최저가 비교 없음). 클룩 국내 `{지명} 렌터카` 검색은 매칭이 거의 없어 **마이리얼트립** `/rentalcars?category=domestic` 로 변경. 픽업 도시는 MRT 페이지에서 선택.
- **기차표**: 제휴사 중 기차는 **12Go**(trainbusferry, 동남아·외국인 KR Pass)와 **트립닷컴**(KTX). 국내 명승·축제는 **트립닷컴 `/trains/`** 칩. 클룩 즐길거리 칩·MRT 투어 카드는 유지.
- **VERIFY**: `smoke:korea-tna-strip` · `smoke:travel-agencies` · `smoke:korea-scenic-stay` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/korea-tna-strip → git Preview `/korea/theme/scenic?spot=gyeongbokgung`
- **QA**: 투어 섹션 하단 「렌터카 보기」·MRT 국내 렌터카·트립닷컴 기차표. 최저가 비교 문구 없음.

## 한국 투어티켓 #8 — 왕가의 산책 인천 폴백 (Cloud)

- **세션** `한국 투어티켓 #8, Preview OK면 PR 병합`
- **브랜치** `cursor/korea-tna-strip-ef65` · tip `beb65f1a` · PR [#234](https://github.com/catgeot/Days/pull/234)
- **병합 안 함**: 인천공항 「왕가의 산책」이 옹진 숙소·행사명 투어(룩소르 왕가의 계곡)로 나옴
- **원인**: 인천 시드가 인천·강화·옹진뿐이고 옹진 군청 좌표가 최근접. `location.name`이 행사명이라 재고 0이면 「왕가의 산책」으로 TNA 폴백
- **수정**: 중구(공항)는 시도 대표 인천. 숙소 칩 인천·강화(옹진 주소가 아니면 옹진 제외). 투어 키워드·알트에서 행사명 제거
- **VERIFY**: `smoke:korea-tna-strip` · `smoke:korea-theme-cross-links` · `smoke:korea-festival-personal` · `smoke:travel-agencies` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/korea-tna-strip
- **QA**: 왕가의 산책 숙소·투어 **인천**(옹진·룩소르 아님). 비면 인천·강화 칩. 경복궁 「렌터카 보기」·MRT·기차표

## 한국 투어티켓 #9 — 명승·축제 숙소·투어 시도 폴백 (Cloud)

- **세션** `한국 투어티켓 #9, Preview OK면 PR 병합`
- **브랜치** `cursor/korea-tna-strip-ef65` · tip `e885df64` · PR [#234](https://github.com/catgeot/Days/pull/234)
- **이후 #10에서 `origin/main` 병합** (`2374db5f`). 당시 보류 이유: 옹진 대청도 숙소가 비고 폴백이 안 됨. 시드 군·섬은 재고 0인데 명승이 `stayAreas`를 안 넘기고, `cityHints=옹진`이 인천 CITY를 거절함
- **수정**: 명승에도 축제와 같은 인천·강화 칩. 같은 시도 시드를 숙소·투어 알트에 넣음. 빈 alt 배열이 지역 알트를 지우지 않음. cityHints에 폴백 도시명. 재고 0이면 인접 칩으로 재조회
- **VERIFY**: `smoke:korea-tna-strip` · `smoke:korea-theme-cross-links` · `smoke:korea-scenic-stay` · `smoke:korea-festival-personal` · `smoke:mrt-stay` · `smoke:travel-agencies` · `vite build` PASS
- **Preview** https://www.gateo.kr/qa/korea-tna-strip → git Preview `/korea/theme/scenic?spot=daecheongdo-ongjin`
- **QA**: 대청도 숙소·투어 카드·인천·강화 칩. 왕가의 산책 인천. 경복궁 렌터카·기차표. #10에서 main 병합

## 한국 투어티켓 #10 — origin/main 반영 (Cloud)

- **세션** `한국 투어티켓 #10, main 반영`
- **브랜치** `cursor/korea-tna-strip-ef65` · merge `2374db5f` · PR [#234](https://github.com/catgeot/Days/pull/234)
- **완료**: Preview OK 후 PR #234를 `origin/main`에 병합. #7 렌터카·기차표, #8 왕가의 산책 인천, #9 시드 군 숙소·투어 시도 폴백. 작업 로그는 팔경 활용으로 되돌림. `/qa/korea-tna-strip` → PROD `/korea/theme/scenic?spot=gyeongbokgung`
- **VERIFY**: `smoke:korea-tna-strip` · `smoke:korea-theme-cross-links` · `smoke:korea-scenic-stay` · `smoke:korea-festival-personal` · `smoke:mrt-stay` · `smoke:travel-agencies` PASS
- **PROD** https://www.gateo.kr/korea/theme/scenic?spot=gyeongbokgung
- **다음 제시어 없음** (주제 종료). 축제 숙소허브 PR [#233](https://github.com/catgeot/Days/pull/233)은 병합하지 않음
