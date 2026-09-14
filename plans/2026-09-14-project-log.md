# 2026-09-14 프로젝트 일지

직전: [`2026-09-13-project-log.md`](./2026-09-13-project-log.md)

## 방문자 개선 #4 QA — MOONi 카드 상단·목적지 중첩 해제 (Cloud)

- **세션** `방문자 개선 #4, 무드검색 분리 및 AI추천 브릿지`
- **브랜치** `cursor/visitor-growth-1f90` · tip `f708581d` · PR [#249](https://github.com/catgeot/Days/pull/249)
- **원인**: 지명 검색(김포)에서 MOONi 카드가 드롭다운 맨 아래. 탭하면 `freshSession` 없이 마지막 장소 대화(코타키나발루)를 이어받아 질의와 목적지가 겹침.
- **완료**: MOONi 카드를 드롭다운 맨 위(sticky)로. `freshSession: true`로 일반 MOONi 세션을 열고 이전 여행지 resume을 건너뜀.
- **VERIFY**: `npm run smoke:mood-search-intent` PASS · `npm run smoke:mooni-ask-bridge` PASS · `npm run smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/` · `/explore`
- **QA**: 김포 드롭다운 카드가 맨 위인지 · 탭 후 헤더가 코타키나발루가 아닌지 · 파리/도쿄/제주 지명 회귀.

## 방문자 개선 #4 — 무드검색 분리 및 AI추천 브릿지 (Cloud)

- **세션** `방문자 개선 #4, 무드검색 분리 및 AI추천 브릿지`
- **브랜치** `cursor/visitor-growth-1f90` · tip `7a938802` · PR [#249](https://github.com/catgeot/Days/pull/249)
- **완료**: `quiet beaches`·`따뜻한 휴양지`·`조용한 바다` 결합은 지오코딩 스킵 → AI 무드 큐레이션. 도로명·상호 POI 오탐 버림. 탐색 드롭다운 MOONi 추천 카드.
- **VERIFY**: `npm run smoke:mood-search-intent` PASS · `npm run smoke:explore-search-aliases` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/` · `/explore`
- **QA**: 무드 질의 엉뚱한 핀 여부 · MOONi 카드 탭 시 채팅 · 파리/도쿄/제주 지명 회귀.

## 방문자 개선 #3 — 크롤러 SEO 및 본문 프리렌더링 (Cloud)

- **세션** `방문자 개선 #3, 크롤러 SEO 및 본문 프리렌더링`
- **브랜치** `cursor/visitor-growth-1f90` · tip `dd317cf9` · PR [#248](https://github.com/catgeot/Days/pull/248)
- **완료**: `botDetect`에 카카오·다음·슬랙 봇 추가. `TRAVEL_SPOTS` 274곳 전수 크롤러 메타. 봇 응답 `#root`에 장소별 `h1`·설명·갤러리/플래너/AI 도슨트 nav 주입(허브는 기존 본문 유지).
- **VERIFY**: `npm run generate:crawler-place-meta` 274 slugs · `npm run smoke:crawler-place-meta` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/place/tokyo?crawler=1` · `/place/santorini?crawler=1`
- **QA**: `?crawler=1` 도쿄·산토리니 본문이 홈 소개글이 아닌지 · 일반 브라우저 UI 그대로인지.

## 팔경 활용 #42 — 진도 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #42, 진도 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `aac4eaf2` · PR [#245](https://github.com/catgeot/Days/pull/245)
- **진행 확인**: GATEO 빈허브 큐는 소진(빈 hub 0). 팔경 contentId(B)는 병합 종료. 활성 트랙은 팔경 활용 A 오버레이. 핸드오프의 문경8경 4건은 사진·개요 기완료(순수 누락 0)라 건너뛰고, 다음 순수 누락 4건 허브 **진도10경**을 채움.
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 진도10경 결손 4건(조도관음도·의장대·돈대산·하조대)의 개요·주소·진도군 문화관광 공식 사진 보강. 하조대는 하조도등대이며 양양 하조대와 혼동하지 않음. origin/main 병합 때 남은 Tour 썸네일 충돌 표식은 영덕(127160·1621219·126143)·문경석탄(2599737) 양쪽을 유지해 해소.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS · `report-local-scenic-missing-content --hub=jindo` 사진/개요 10/10, 순수 누락 0
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=jindo`
- **잔여**: 사진/개요 순수 누락 **106**/876. 다음 허브 **함평8경 4** (그다음 해남8경·홍성12경·화순11경)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #42 QA — 진도 검색 조도 썸네일 (Cloud)

- **세션** `팔경 활용 #42, 진도 QA 조도 썸네일`
- **브랜치** `cursor/palgyeong-use-e744` · tip `8b3aa5ed` · PR [#245](https://github.com/catgeot/Days/pull/245)
- **원인**: 진도 검색 관광지 행 `조도(조도6군도)`는 TourAPI contentId `553447`인데 DB `first_image`가 비어 플레이스홀더가 뜸. 속초 조도·남해 조도와는 다른 진도 조도 6군도.
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_TOUR_THUMB_BY_CONTENT_ID`에 진도군 조도 다도해 공식 사진 연결. 진도 주소 TourAPI 빈 썸네일은 이 1건.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use — 검색「진도」`조도(조도6군도)` 행
- **다음**: **#43 함평 결손 오버레이** (동일 브랜치)

## 팔경 활용 #43 — 함평 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #43, 함평 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `bdd87bac` · PR [#250](https://github.com/catgeot/Days/pull/250) (#245는 #42 squash merge)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 함평8경 결손 4건(백제고도·모악산·삼호천·청계산) 보강. 백제고도는 예덕리고분군, 모악산은 해보 348m·꽃무릇공원(용천사 GATEO `3061070`과 다른 URL), 삼호천은 함평천수변공원, 청계산은 신광 청계·군유산 자락 양재리 이팝나무. 부여·전주·창원·과천 동명과 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npm run build` PASS · `report-local-scenic-missing-content --hub=hampyeong` 사진/개요 8/8, 순수 누락 0
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=hampyeong`
- **잔여**: 사진/개요 순수 누락 **102**/876. 다음 허브 **해남8경 4** (그다음 홍성12경·화순11경)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #43 QA — 함평 1경·2경 중복 썸네일 (Cloud)

- **세션** `팔경 활용 #43, 함평 엑스포 중복 썸네일`
- **브랜치** `cursor/palgyeong-use-e744` · tip `5d812d09` · PR [#250](https://github.com/catgeot/Days/pull/250)
- **원인**: GATEO 선정 `hampyeong-expo-park` fill 폴백이 생태공원 contentId `129235`라 1경·2경이 같은 한국관광공사 사진 `3536105`를 씀.
- **완료**: 엑스포는 TourAPI `130864` firstimage `4065063`(함평나비대축제)와 생태관·온실 갤러리. fill 관련 매핑 제거. JSON contentId 기입·scenic 승격 없음.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=hampyeong`
- **다음**: **#44 해남 결손 오버레이** (동일 브랜치)

## 팔경 활용 #44 — 해남 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #44, 해남 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `b48d9624` · PR [#251](https://github.com/catgeot/Days/pull/251)
- **완료**: JSON contentId·scenic 승격 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`로 해남8경 결손 4건(해남 구 목포구등대 낙조 전망대·해남윤씨 옥우당·미황사 및 도솔암·울돌목) 보강. 등대는 화원면 매봉길 582 구 목포구등대·낙조전망대(국가등록문화재 제379호), 옥우당은 사적 해남윤씨 녹우당 일원, 미황사·도솔암은 달마산 명승, 울돌목은 문내면 스카이워크. 목포 고하도등대·보길도 원림·고창 선운산 도솔암·진도 군내면과 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS · `report-local-scenic-missing-content --hub=haenam` 사진/개요 8/8, 순수 누락 0
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=haenam`
- **잔여**: 사진/개요 순수 누락 **98**/876. 다음 허브 **홍성12경 4** (그다음 화순11경)
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #45 다음 — 홍성 결손 오버레이

```
팔경 활용 #45, 홍성 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-14-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 홍성12경 사진·개요 없는 4건(만해한용운생가지·선상문선생 유허지·고암이응노 생가 기념관·그림같은수목원)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=hongseong
```
