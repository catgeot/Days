# 2026-09-15 프로젝트 일지

직전: [`2026-09-14-project-log.md`](./2026-09-14-project-log.md)

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

## 팔경 활용 #48 다음 — 동해 결손 오버레이

```
팔경 활용 #48, 동해 결손 오버레이
@plans/feature-handoff-index.md
@plans/2026-09-15-project-log.md
@plans/korea-local-scenic-use-plan.md
브랜치 cursor/palgyeong-use-e744 · Preview /qa/palgyeong-use
금지: JSON contentId 기입 · scenic 승격 · 축제 홈 파드 · feature에 plans/** 커밋
작업: 동해비경 사진·개요 없는 3건(호해정·할미바위·초록봉)을 LOCAL_SCENIC_MEMBER_OVERLAYS로 보강. Preview /korea/theme/scenic?hub=donghae
```

