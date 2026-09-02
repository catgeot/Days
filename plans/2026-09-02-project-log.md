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
- **다음** **#2 사람 Preview QA** — 지명 탭 후 좌측 칩 한 줄 접힘 · OK 시 PR #177 merge

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
