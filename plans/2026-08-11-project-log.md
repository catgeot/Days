# 2026-08-11 프로젝트 일지

직전: [`2026-08-10-project-log.md`](./2026-08-10-project-log.md)

## AI 큐레이션 #4, main 동기화·병합 QA

**상태**: feature `cursor/blog-ai-curation-links-5aff` · PR [#42](https://github.com/catgeot/Days/pull/42) · tip `0517c120` · 사람 Preview QA·병합 대기  
**세션**: `AI 큐레이션 #4, main 동기화·병합 QA`

- **한 일**: main(364↑) 머지 · 홈 축제·명승 칩 톤 유지 + 「AI 큐레이션」칩 · `/qa/curation`·작업 로그 유지
- **VERIFY**: `npm run smoke:curation-history` · `smoke:curation-place-bridge` · `npm run build` PASS
- **로컬 UI**: 홈 칩·낙원 탐색·리치·나의 목록·`/blog`→도구→페이지 열기 PASS
- **공유**: `https://www.gateo.kr/qa/curation` (병합 후 PROD redirect · 지금은 Preview URL)
- **Preview**: `https://days-git-cursor-blog-ai-curation-links-5aff-catgeots-projects.vercel.app/blog/curation`
- **작업 로그**: 「main 동기화 후 Preview QA」
- **남은 일**: 사람 Preview QA → main 병합 · PR [#38](https://github.com/catgeot/Days/pull/38)은 #42에 포함(닫아도 됨)
- **다음 채팅명**:

```
AI 큐레이션 #5, Preview QA·병합
```

## 지구본 홈 #3, 모바일 써머리 하단

**상태**: feature `cursor/summary-mobile-bottom-f024` · PR [#104](https://github.com/catgeot/Days/pull/104) · tip `238992f9` · Preview QA 대기  
**세션**: `지구본 홈 #3, 모바일 써머리 하단`

- **증상**: 모바일 써머리 카드가 화면 하단이 아니라 떠 보임 · 예전 `bottom 6.75rem`이 카테고리 바 높이용인데 카드 표시 시 바는 숨김
- **한 일**: `PlaceCardSummary` 모바일 `fixed` + `bottom 1rem+safe-area` · 몰입 컴팩트 바 동일 · PC `lg:absolute lg:bottom-6` 유지
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/summary-bottom`
- **Preview**: `https://days-git-cursor-summary-mobile-bottom-f024-catgeots-projects.vercel.app/`
- **작업 로그**: 「써머리 카드 모바일 하단 고정」
- **남은 일**: 사람 Preview QA(모바일 핀 탭 → 써머리 하단)
- **다음 채팅명**:

```
지구본 홈 #4, 모바일 써머리 하단 QA
```

## 지구본 홈 #2, 항로 플래너·체르마트

**상태**: feature `cursor/flight-cinema-zermatt-f4d1` · PR [#103](https://github.com/catgeot/Days/pull/103) · tip `fa230659` · Preview QA 대기  
**세션**: `지구본 홈 #2, 항로 플래너·체르마트`

- **증상**: 항로 Bar 「여행 플랜」문구 · 체르마트 graph-2hop `ICN→MUC→GVA→ZRH`(ZRH·GVA 도착 관문을 경유로 오표시)
- **한 일**: Bar 「여행 플래너」·`zermatt` `flightRouteHubIatas: []`(ICN→ZRH 직항) · smoke `icn-zermatt-direct` · `/qa/zermatt-flight`
- **VERIFY**: `npm run generate:airports` · `smoke:flight-route-baseline` 26/26 · `audit:airports` none:0 · `npm run build`
- **공유**: `https://www.gateo.kr/qa/zermatt-flight`
- **Preview**: `https://days-git-cursor-flight-cinema-zermatt-f4d1-catgeots-projects.vercel.app/`
- **작업 로그**: 「항로 Bar 「여행 플래너」·체르마트 직항」
- **남은 일**: 사람 Preview QA(체르마트→항공 경로 직항 · Bar 버튼 문구)
- **다음 채팅명**:

```
지구본 홈 #3, 체르마트 항로 QA
```

## 지구본 홈 #1, 플래너 보기 버튼

**상태**: **main 병합** · PR [#102](https://github.com/catgeot/Days/pull/102) MERGED · `/qa/summary-planner` inactive  
**세션**: `지구본 홈 #1, 플래너 보기 버튼`

- **한 일**: 써머리 「가까이 보기」→ 플래너 있으면 「여행 플래너」`Link` · 없으면 가까이 보기 유지 · 문구 「플래너 보기」→「여행 플래너」
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/summary-planner` (inactive)
- **Preview**: `https://days-git-cursor-summary-planner-bd48-catgeots-projects.vercel.app/`
- **작업 로그**: 「써머리 CTA 문구 「여행 플래너」」

## 테마여행 #144, 축제 같은 도시 명소 튕김

**상태**: feature `cursor/festival-samehub-8585` · PR [#101](https://github.com/catgeot/Days/pull/101) · tip `af6d41ac` · Preview QA 대기  
**세션**: `테마여행 #144, 축제 같은 도시 명소 튕김`

- **증상**: 축제홈→가을→강원→횡성한우축제→횡성호→안흥찐빵마을 클릭 시 명소홈으로 튕김 · 헤더 「횡성호 · 테마」클릭 시 축제홈으로 튕김
- **원인**: 축제 오버레이 `returnTo="/korea"`에 scenic spotId를 붙여 themeBack이 `/korea?spot=횡성호`가 됨 · sameHub deepPath가 명소홈으로 navigate
- **한 일**: sameHub는 modalSpot 중첩 모달 우선 · `themeNavBackEntryForSpot`로 축제 returnTo는 명승 `?spot=` 복귀 · 스모크 보강
- **VERIFY**: `npm run smoke:korea-theme-nav-back` · `smoke:korea-theme-cross-links` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/festival-samehub`
- **Preview**: `https://days-git-cursor-festival-samehub-8585-catgeots-projects.vercel.app/korea`
- **작업 로그**: 「축제→같은 도시 명소 중첩·이전 복귀」
- **남은 일**: 사람 Preview QA(위 클릭 경로)
- **다음 채팅명**:

```
테마여행 #145, 축제 sameHub QA
```

## 테마여행 #143, 내 위치 핀 시인성

**상태**: **main 병합** · `d71a530f` · PR [#100](https://github.com/catgeot/Days/pull/100) MERGED · `/qa/scenic-map`→PROD  
**세션**: `테마여행 #143, 내 위치 핀 main 병합`

- **한 일**: 내 위치 **붉은 깃발 핀** main 반영 · `/qa/scenic-map`→PROD
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **PROD**: `https://www.gateo.kr/korea/theme/scenic`

## 테마여행 #142, 지도 내 위치 주변 칩

**상태**: **main 병합** · PR [#99](https://github.com/catgeot/Days/pull/99) `99c53c74`  
**세션**: `테마여행 #142, 지도 내 위치 주변 칩`

- **잠금**: 표시 상한 **12** · 반경 목표 ≤24 · 단계 **20→40→60→80**
- **한 일**: 파드별 지도 내 위치→해당 파드만 주변 칩 · 분류/위치 해제로 드릴 복귀 · 목록 내 주변 적응 반경·더보기·권역 칩 클릭 시 위치 해제
- **VERIFY**: `npm run smoke:korea-scenic-nearby` · `smoke:korea-scenic-map` · `npm run build`

## 테마여행 #141, 지도 내 위치

**상태**: feature `cursor/scenic-locate-1064` · PR [#99](https://github.com/catgeot/Days/pull/99) · tip `c52836b5` · → #142로 이어짐  
**세션**: `테마여행 #141, 지도 내 위치`

- **한 일**: 명승홈 지도(`KoreaScenicMap`)에 **내 위치** 버튼·파란 점 마커·flyTo 추가(우상단). 목록「내 주변」·필터 해제·TourAPI 호출은 없음
- **VERIFY**: `npm run smoke:korea-scenic-map` · `npm run build`
- **공유**: `https://www.gateo.kr/qa/scenic-map`
- **Preview**: `https://days-git-cursor-scenic-locate-1064-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「명승 지도 — 내 위치 버튼」

## 테마여행 #140, 페이지 하단 여백

**상태**: feature `cursor/page-end-pad-1e22` · Preview QA 대기  
**세션**: `테마여행 #140, 페이지 하단 여백`

- **증상**: 명승홈 명소 리스트 끝에서 국가유산 명승·지역 관광지 접힘 버튼이 화면 하단에 붙어 시인성·클릭 접근성 부족
- **한 일**: `.page-scroll-end-pad`(≈50vh) SSOT · 명승홈·테마 셸·축제 목록에 적용(짧은 관광지 목록 전용 조건 제거)
- **VERIFY**: `npm run build`
- **공유**: `https://www.gateo.kr/qa/page-end-pad`
- **Preview**: `https://days-git-cursor-page-end-pad-1e22-catgeots-projects.vercel.app/korea/theme/scenic`
- **작업 로그**: 「스크롤 끝 하단 여백(중앙 착지)」
- **남은 일**: 사람 Preview QA(명소 끝→접힘 버튼이 중앙 부근)
- **다음 채팅명**:

```
테마여행 #141, 하단 여백 QA
```
