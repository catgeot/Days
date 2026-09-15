# 2026-09-15 프로젝트 일지

직전: [`2026-09-14-project-log.md`](./2026-09-14-project-log.md)

## 종각역 숙소 #2 — 원주 오탐 → 서울 CITY (Cloud)

- **세션** `종각역 숙소 #2, Preview OK면 PR 병합`
- **브랜치** `cursor/jonggak-stay-5f4f` · tip `02587d54` · PR [#260](https://github.com/catgeot/Days/pull/260)
- **원인**: Nominatim 종각역(railway)을 버려 지오코딩 실패 → `search_dictionary` 원주 좌표. #1 시 선두가 원주 숙소(오크밸리)를 부름. `서울 종각역` 단독은 MRT CITY 없음.
- **완료**: 역 검색은 철도역 허용·typo 캐시 스킵. stayAdmin `서울특별시`도 키워드 `서울`. **병합 안 함** (Preview 재확인 전).
- **VERIFY**: `npm run smoke:mrt-stay` PASS · LIVE `서울` CITY 4563 · `원주` 오크밸리(대조)
- **Preview** https://days-git-cursor-jonggak-stay-5f4f-catgeots-projects.vercel.app/
- **QA**: 하드 리프레시 후 종각역 → 숙소 찾기 → 서울 호텔(원주 오크밸리 아님)

## 종각역 숙소 #1 — 역 POI 시·군 선두 (Cloud)

- **세션** `종각역 숙소 #1, 역 POI 시·군 선두`
- **브랜치** `cursor/jonggak-stay-5f4f` · tip `b2e7c5c9` · PR [#260](https://github.com/catgeot/Days/pull/260)
- **원인**: 지구본 종각역 숙소 찾기가 `종각역`을 MRT 1차 키워드로 보냄. autocomplete CITY 없음 → 빈 목록·트립닷컴 폴백.
- **완료**: 국내 역·길·터미널은 시·군 선두. cityHints에서 역 이름 제외. 동네만 있는 stayAdmin은 역지오로 시 채움.
- **VERIFY**: `npm run smoke:mrt-stay` PASS · LIVE `종각역` 0건 · `서울` CITY total 4507
- **Preview** https://days-git-cursor-jonggak-stay-5f4f-catgeots-projects.vercel.app/
- **QA**: 홈 검색「종각역」→ 숙소 찾기 → 서울 숙소 카드(빈 목록 아님)

## 방문자 개선 #8 QA — 지구본 일시정지 버튼 제거 (Cloud)

- **세션** `방문자 개선 #8, 언어일관성 및 가입혜택/접근성`
- **브랜치** `cursor/visitor-growth-1f90` · tip `0faa423e` · PR [#259](https://github.com/catgeot/Days/pull/259)
- **원인**: 모바일 홈에 일시정지 버튼이 없고, 드래그하면 자전이 이미 멈춤.
- **완료**: 상단 자전 토글 제거. `prefers-reduced-motion` 기본 정지는 유지.
- **VERIFY**: `npm run smoke:visitor-locale` PASS · `npm run audit:i18n` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/`
- **QA**: 홈에서 지구본을 드래그하면 자전이 멈추는지 · 일시정지 버튼이 없는지.

## 방문자 개선 #8 — 언어일관성 및 가입혜택/접근성 (Cloud)

- **세션** `방문자 개선 #8, 언어일관성 및 가입혜택/접근성`
- **브랜치** `cursor/visitor-growth-1f90` · tip `b296a29c` · PR [#259](https://github.com/catgeot/Days/pull/259)
- **완료**: PlaceCard 개요·태그 locale 연동 · EN 한글 본문 안내 칩 · 가입 4대 혜택 · 아이콘 aria-label · 로고 키보드 · 지구본 reduced-motion 기본 정지.
- **VERIFY**: `npm run smoke:visitor-locale` PASS · `npm run audit:i18n` PASS · `npm run smoke:trust-disclosure` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/` · `/auth/signup` · `/place/paris/gallery`
- **QA**: EN 전환 후 파리 개요가 영어인지 · 회원가입 4대 혜택 · Tab으로 로고.

## 방문자 개선 #7 QA — 단계 하단 다음 선택 (Cloud)

- **세션** `방문자 개선 #7, 플래너 3단계 점진적 노출`
- **브랜치** `cursor/visitor-growth-1f90` · tip `7e55fc04` · PR [#257](https://github.com/catgeot/Days/pull/257)
- **완료**: 각 단계 하단에 「확인하셨다면 다음 단계를 선택해 주세요」와 나머지 단계 버튼. 상단으로 다시 올라가지 않아도 됨.
- **VERIFY**: `npm run smoke:trust-disclosure` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/place/bora-bora/planner`
- **QA**: 필수 단계를 끝까지 내린 뒤 하단 `2 이동·통신`으로 넘어가는지.

## 방문자 개선 #7 — 플래너 3단계 점진적 노출 (Cloud)

- **세션** `방문자 개선 #7, 플래너 3단계 점진적 노출`
- **브랜치** `cursor/visitor-growth-1f90` · tip `e1dbd731` · 작업 `ad873fc3` · PR [#257](https://github.com/catgeot/Days/pull/257)
- **완료**: 플래너 필수→이동·통신→즐기기 단계. 항공 배너·숙소 CTA를 체크리스트 예약 카드로 통합. 픽업은 2단계. 유심 Airalo/Holafly 택1. 복잡도 90/100 → 「상세 안내 포함」.
- **VERIFY**: `npm run smoke:trust-disclosure` PASS · `npm run smoke:klook-affiliate` PASS · `npm run smoke:planner-empty-scroll` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/place/bora-bora/planner` · `/place/paris/planner`
- **QA**: 단계 전환 · 항공/숙소가 한 카드인지 · 복잡도 90/100 없는지 · 유심이 한 번에 하나만인지.

## 방문자 개선 #6 — PR 병합 (Cloud)

- **세션** `방문자 개선 #6, 신뢰요소 및 제휴투명성 강화`
- **병합** PR [#255](https://github.com/catgeot/Days/pull/255) · main `4a84e979`
- **PROD** `https://www.gateo.kr/` — 신뢰 바·Credits·플래너 제휴 고지. 모바일 홈은 테마 칩 위에 출처 링크.
- **다음** #7 플래너 3단계 점진적 노출 · 같은 브랜치 `cursor/visitor-growth-1f90`

## 방문자 개선 #6 QA — 모바일 홈 신뢰 바·테마 칩 겹침 (Cloud)

- **세션** `방문자 개선 #6, 신뢰요소 및 제휴투명성 강화`
- **브랜치** `cursor/visitor-growth-1f90` · tip `fca5bf22` · PR [#255](https://github.com/catgeot/Days/pull/255)
- **원인**: 하단 고정 신뢰 바가 모바일 홈 테마 카테고리(휴양·자연…)와 겹침.
- **완료**: 모바일 홈은 고정 바를 숨기고 카테고리 스택 바로 위에 둠. 나라 칩이 펼쳐져도 테마 칩을 덮지 않음.
- **VERIFY**: `npm run smoke:trust-disclosure` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/`
- **QA**: 모바일 홈에서 테마 칩과 About·출처가 겹치지 않는지 · 출처 탭이 열리는지.

## 방문자 개선 #6 — 신뢰요소 및 제휴투명성 강화 (Cloud)

- **세션** `방문자 개선 #6, 신뢰요소 및 제휴투명성 강화`
- **브랜치** `cursor/visitor-growth-1f90` · tip `f1da6f4a` · PR [#255](https://github.com/catgeot/Days/pull/255)
- **완료**: MainLayout 하단 슬림 신뢰 바(About·약관·개인정보·출처·문의) → FooterModal. Credits에 TourAPI·Open-Meteo·Unsplash·Pexels·제휴 파트너. 체크리스트 항공·숙소·픽업에 제휴광고 표기. hybridNotice를 플래너 헤더 아래로.
- **VERIFY**: `npm run smoke:trust-disclosure` PASS · `npm run audit:i18n` PASS · `npm run build` PASS
- **Preview** https://www.gateo.kr/qa/visitor-growth → git Preview `/` · `/about` · `/place/paris/planner`
- **QA**: 홈 하단 바에서 출처·약관 · Credits 데이터/제휴 목록 · 파리 플래너 헤더 아래 하이브리드 안내와 체크리스트 제휴광고 표기.

## 팔경 활용 #46 QA — 화순 연둔리 숲정이 빈 썸네일 (Cloud)

- **세션** `팔경 활용 #46, 화순 연둔리 썸네일`
- **브랜치** `cursor/palgyeong-use-e744` · tip `8b2c0a65` · PR [#254](https://github.com/catgeot/Days/pull/254)
- **원인**: Preview 화순11경 7경 연둔리 숲정이·탐색 검색 Tour 행 `화순동복연둔리숲정이`(3014431)가 플레이스홀더. GATEO 선정 행 없음 · 탐색홈은 Tour DB `first_image`에 의존하는데 비어 있음.
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`·`TOUR_THUMB` 3014431에 화순군 문화관광 제7경 공식 사진(동복면 둔동1길 38·동복천 수양버들). 만연산 치유숲과 구분. 규봉암·쌍봉사·환산정은 TourAPI `firstimage` 있음.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=hwasun` 7경 · 검색「화순」연둔리
- **잔여**: 사진/개요 순수 누락 **90**/876. 다음 허브 **거제9경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #47 — 거제 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #47, 거제 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `7fc97a23` · PR [#256](https://github.com/catgeot/Days/pull/256)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 거제9경 결손 3건(학동몽돌해수욕장·거제포로수용소유적공원·공곶이·내도) 공공 공식 팩트·한국관광공사 사진. 공곶이 Tour `2536196` 빈 썸네일만 `TOUR_THUMB`. 고성 학동마을·외도보타니아와 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=geoje`
- **잔여**: 사진/개요 순수 누락 **87**/876. 다음 허브 **동해비경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #47 QA — 거제 빈 썸네일 (Cloud)

- **세션** `팔경 활용 #47, 거제 빈 썸네일`
- **브랜치** `cursor/palgyeong-use-e744` · tip `fb232667` · PR [#256](https://github.com/catgeot/Days/pull/256)
- **원인**: Preview 검색「거제」거제 식물원(5경)·매미성(9경)·구조라해수욕장, 명소 검색 동백섬 지심도터미널(`2756617`)이 플레이스홀더. 학동·포로수용소·공곶이·내도는 이미 사진 있음. GATEO 선정 행 없음 · 탐색홈은 Tour `firstimage`를 쓰지 않음 · 터미널 Tour `first_image` 공란.
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`·`TOUR_THUMB`에 한국관광공사 공식 사진. 식물원 `2648073`·매미성 `2536133` JSON id 유지. 구조라 `583071`·지심도터미널 `2756617`만 검색 행. 외도보타니아·매미면가 식당·학동몽돌·지심도 본섬과 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → 검색「거제」식물원·매미성·구조라 · `/korea/theme/scenic` 검색「거제」동백섬 지심도터미널
- **잔여**: 사진/개요 순수 누락 **87**/876. 다음 허브 **동해비경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #48 — 동해비경 결손 오버레이 (Cloud)

- **세션** `팔경 활용 #48, 동해 결손 오버레이`
- **브랜치** `cursor/palgyeong-use-e744` · tip `a92c127f` · PR [#258](https://github.com/catgeot/Days/pull/258)
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 동해비경 결손 3건(호해정·할미바위·초록봉) 동해 시 관광 공식 팩트·사진. 강릉 호해정·추암 해암정·삼척/고성 할미바위·두타산·청옥산과 구분. 동해 순수 누락 3→0 · CID 6/9 유지.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → git Preview `/korea/theme/scenic?hub=donghae`
- **잔여**: 사진/개요 순수 누락 **84**/876. 다음 허브 **영광9경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #48 QA — 동해 빈 썸네일 (Cloud)

- **세션** `팔경 활용 #48, 동해 빈 썸네일`
- **브랜치** `cursor/palgyeong-use-e744` · tip `9a95d38a` · PR [#258](https://github.com/catgeot/Days/pull/258)
- **원인**: Preview 용추폭포(2경)·무릉반석(3경)이 같은 무릉계곡 Tour `125673` 사진. 탐색 검색 동해 망상해수욕장(4경)·명승 검색 어달해변은 플레이스홀더. 탐색홈은 Tour `firstimage`를 쓰지 않음 · 어달 Tour `first_image` 공란.
- **완료**: JSON contentId 기입 없이 `LOCAL_SCENIC_MEMBER_OVERLAYS`에 용추·반석·망상 동해시 관광 공식 사진. `TOUR_THUMB` 망상 `125713`·어달 `125708`. 문경 용추계곡·쌍폭포·대진·노봉과 구분.
- **VERIFY**: `npm run smoke:korea-local-scenic-lists` PASS · `npm run smoke:korea-scenic-search` PASS · `npm run smoke:korea-scenic-spots` PASS · `npx vite build` PASS
- **Preview** https://www.gateo.kr/qa/palgyeong-use → 검색「동해」용추·반석·망상 · `/korea/theme/scenic` 검색「동해」어달해변
- **잔여**: 사진/개요 순수 누락 **84**/876. 다음 허브 **영광9경 3**
- **QA 방식**: 사람은 **같은 턴** Preview QA. 다음 에이전트 세션을 `사람 Preview QA`로 넘기지 않음.

## 팔경 활용 #49 다음 — 영광 결손 오버레이

```
팔경 활용 #49, 영광 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-15-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 영광9경 사진·개요 없는 3건(황금산·왕글공원·백학촌)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=yeonggwang
```

