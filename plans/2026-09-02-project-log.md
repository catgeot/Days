# 2026-09-02 프로젝트 일지

직전: [`2026-09-01-project-log.md`](./2026-09-01-project-log.md)

---

## 홈 축제칩 — 써머리 펼침 방지

### #1 써머리 펼침 방지 ✅

- **세션** `홈 축제칩 #1, 써머리 펼침 방지`
- **브랜치** `cursor/home-festival-chip-59c9` · tip `1d3d324f` · PR [#177](https://github.com/catgeot/Days/pull/177)
- **증상** 모바일 지구본 지명 클릭 → 써머리 카드 + 좌측 축제 칩이 목록으로 펼쳐짐
- **원인** `showMobileQuickLinksCollapsed = !hideExploreChrome && !expanded` — 카드 열림이 펼침으로 떨어짐
- **적용** 접힘 표시를 장소 카드와 분리 · 카드 열림 시 자동 접힘
- **VERIFY** `vite build` PASS
- **Preview** `/qa/home-chip` · git Preview 홈
- **다음** **#2 PC 접힘** — 항상 펼친 PC 바로가기 → 모바일과 동일 접힘

### #2 PC 접힘 ✅

- **세션** `홈 축제칩 #2, PC 접힘`
- **브랜치** `cursor/home-festival-chip-59c9` · tip `b8877d34` · PR [#177](https://github.com/catgeot/Days/pull/177)
- **증상** PC 좌상단 바로가기가 항상 펼쳐져 테마 카테고리와 겹침
- **적용** `renderQuickLinks()` 모바일·PC 공용 — 기본 접힘 · 탭 펼침
- **VERIFY** `vite build` PASS
- **다음** **#3 PC 접힘 너비** — 접힌 칩 라벨 잘림

### #3 PC 접힘 너비 ✅

- **세션** `홈 축제칩 #3, PC 접힘 너비`
- **브랜치** `cursor/home-festival-chip-59c9` · tip `6735df3e` · PR [#177](https://github.com/catgeot/Days/pull/177)
- **증상** PC 접힌 칩 `max-w-[14rem]`으로 「축제 · 행사 · 명승 · 추천」 잘림
- **적용** `md:w-max md:max-w-none` · 말줄임 해제 · 모바일 14rem 유지
- **VERIFY** `vite build` PASS
- **다음** **#4 사람 Preview QA · main 병합**

### #4 사람 Preview QA · main 병합 ✅

- **세션** `홈 축제칩 #4, main 병합`
- **사람 QA** 모바일: 지명 탭 후 접힘 유지 · PC: 접힌 칩 라벨 전부 · 카테고리 겹침 없음
- **main** `7f0f46ca` — PR [#177](https://github.com/catgeot/Days/pull/177) merge
- **종료** 작업 로그 `active: false` · `/qa/home-chip` → PROD `/`

---

## 홈 locale 토글 — #8~#9 merge ✅

- **#8** main `053a4587` — PR [#174](https://github.com/catgeot/Days/pull/174)
- **#9** main `a6a5ede7` — PR [#176](https://github.com/catgeot/Days/pull/176)
- **사람 QA** PC·모바일 실시간 EN↔KO 지명 전환 OK
- **잔여** 없음 — 검색바 히트 PR [#175](https://github.com/catgeot/Days/pull/175) merge `9824bfb8`

---

## 홈 검색바 히트 (EN 토글·검색 겹침)

### #1 브랜치·핸드오프 준비 ✅

- **세션** `홈 검색바 히트 #1, 브랜치·핸드오프 준비`
- **브랜치** `cursor/search-locale-hit-5f5c` · tip `4dff1699` · PR [#175](https://github.com/catgeot/Days/pull/175)
- **증상** 모바일 검색바 `left-[7.75rem]` ↔ chrome 실드 `z-[110]` → 검색 클릭 무력화
- **준비** `/qa/search-hit` · Preview 작업 로그 · 핸드오프 §13 A′′
- **다음** **#2 HomeUI flex** — `HomeUI.jsx`만 · 참고 `f3ec61d7`/`0ba69445` · **HomeGlobeMapbox 금지**

### #2 HomeUI flex ✅

- **세션** `홈 검색바 히트 #2, HomeUI flex`
- **브랜치** `cursor/search-locale-hit-5f5c` · tip `7b8aa801` · PR [#175](https://github.com/catgeot/Days/pull/175)
- **적용** `HomeUI.jsx`만 — 모바일 1행 flex `[로고+EN | 검색 flex-1]` · 바로가기 칩 2행 · `left-[7.75rem]` 제거
- **VERIFY** `audit:i18n` · `build` · `smoke:browser-locale-hint` · `smoke:place-label-slug` PASS
- **다음** **#3 사람 Preview QA** — 검색·EN 토글 각각 클릭 · OK 시 PR #175 merge

### #3 사람 Preview QA · main 병합 ✅

- **세션** `홈 검색바 히트 #3, main 병합`
- **사람 QA** 모바일: 검색→`/explore` · EN 토글 독립 클릭 · 바로가기 2행 OK
- **main** `9824bfb8` — PR [#175](https://github.com/catgeot/Days/pull/175) merge
- **종료** 작업 로그 `active: false` · `/qa/search-hit` → PROD `/`

---

## 홈 지구본 지명 — 첫 로딩 고착

### #1 첫 로딩 지명 ✅

- **세션** `홈 지구본 지명 #1, 첫 로딩 지명`
- **브랜치** `cursor/globe-labels-ddce` · tip `8317146d` · PR [#180](https://github.com/catgeot/Days/pull/180)
- **증상** 모바일 홈 첫 로딩 후 지명 없음 · EN 토글·재실행·새로고침만 복구
- **원인** 마운트 즉시 `jumpTo` 자전이 Mapbox continuePlacement·idle을 끊어 gateo overlay가 숨은 채 고착
- **적용** overlay 페인트+320ms 뒤에만 자전 재개 · 첫 페인트 GeoJSON 직접 setData
- **VERIFY** `smoke:globe-label-first-reveal` · `smoke:place-label-slug` · `vite build` PASS
- **Preview** `/qa/globe-labels` · git Preview 홈
- **다음** **#2 사람 Preview QA** — 모바일 첫 진입(EN 없이) 지명 · 자전 · EN↔KO

```
홈 지구본 지명 #2, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-02-project-log.md
브랜치 cursor/globe-labels-ddce · PR #180 · https://www.gateo.kr/qa/globe-labels
금지: UI 리디자인 · HomeGlobeMapbox 광역 리팩터 · 코드를 origin/main에 임의 push
작업: 모바일 첫 진입(EN 없이) 지명 표시 · 자전 · EN↔KO · OK 시 PR #180 merge
```

---

## 지구본 홈 헤더 — Chrome 주소창 가림

### #1 Chrome 주소창 가림 ✅ 에이전트 · 사람 QA에서 첫 진입 악화

- **세션** `지구본 홈 헤더 #1, Chrome 주소창 가림`
- **브랜치** `cursor/home-header-3eef` · tip `def1832c` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **증상** iOS Chrome 지구본 홈 첫 로딩 시 로고·검색·바로가기 칩이 주소창 뒤로 깔림(간헐)
- **원인** `h-screen`(100vh)가 주소창보다 커서 문서가 스크롤되고 fixed 헤더가 URL바 뒤로 깔림
- **적용** 홈 루트 100dvh 잠금 · 첫 페인트 `scrollTo(0,0)` · offsetTop 지속 보정 없음(칩 히트 회귀 방지)
- **VERIFY** `smoke:home-chrome-viewport` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **사람 QA** 새로고침은 정상 · **첫 진입은 더 위로 밀림** → #2

### #2 첫 로딩 재현 수정 ✅ 에이전트 · 사람 QA에서 첫 진입 잔존

- **세션** `지구본 홈 헤더 #2, 첫 로딩 재현 수정`
- **브랜치** `cursor/home-header-3eef` · tip `97163af3` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **증상** 첫 진입은 칩이 주소창 뒤로 더 밀림 · 새로고침하면 정상
- **원인** #1 즉시 `scrollTo(0,0)`·rAF 리마운트·html 잠금이 첫 페인트 웹뷰(주소창 뒤)를 고착. Chrome은 새로고침에서만 웹뷰를 주소창 아래로 내림
- **적용** CriOS 첫 navigate만 56px top(페인트 전) · 웹뷰 높이 감소 시 0 · reload는 보정 없음 · 잠금은 정착 후
- **VERIFY** `smoke:home-chrome-viewport` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **사람 QA** 로고·검색 상단이 주소창에 잘림 → #3

### #3 서브에이전트 QA 수정 ✅ 에이전트 · 사람 Preview 대기

- **세션** `지구본 홈 헤더 #3, 서브에이전트 QA 수정`
- **브랜치** `cursor/home-header-3eef` · tip `8f4d4201` · PR [#181](https://github.com/catgeot/Days/pull/181)
- **원인** 지구본/Mapbox가 visualViewport 높이를 줄이면(844→780) 웹뷰 inset으로 오인하고 56px를 0으로 지움. 주소창은 그대로 덮음
- **적용** 첫 navigate 세션은 높이 감소와 무관하게 56px 유지 · reload는 0 · 계측 로그 제거
- **VERIFY** CriOS mock `56 survives -64` · reload `0` · `vite build` PASS
- **Preview** `/qa/home-header` · git Preview 홈
- **다음** **#4 사람 Preview QA** — 탭 재오픈 첫 진입 + 새로고침 이중 여백

```
지구본 홈 헤더 #4, 사람 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-02-project-log.md
브랜치 cursor/home-header-3eef · PR #181 · https://www.gateo.kr/qa/home-header
금지: UI 리디자인 · offsetTop 지속 보정 · 코드를 origin/main에 임의 push
작업: 탭 닫고 다시 열기(새로고침 아님) 헤더가 주소창에 안 가리는지 · 새로고침 후 너무 안 내려가는지 · OK 시 PR #181 merge
```

