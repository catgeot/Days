# 2026-09-02 프로젝트 일지

직전: [`2026-09-01-project-log.md`](./2026-09-01-project-log.md)

---

## 홈 locale 토글 — #8 merge ✅ · #9 모바일 지명

- **#8** main `053a4587` — PR [#174](https://github.com/catgeot/Days/pull/174) merge
- **#9** `cursor/globe-locale-mobile-5f5c` · tip `e2214bdb` · PR [#176](https://github.com/catgeot/Days/pull/176)
- **증상** 모바일 EN 토글 시 UI만 EN · 지구본 지명·핀 KO 고착 (Preview 모바일 미QA)
- **수정** suppress는 레이어 갱신>0일 때만 · refresh·재시도·자전 정지·핀 setData
- **다음** 사람 **모바일** Preview QA → merge

**다음 제시어**:

```
홈 locale #9, 모바일 Preview QA
@plans/feature-handoff-index.md
@plans/2026-09-02-project-log.md
@plans/i18n-en-plan.md
브랜치 cursor/globe-locale-mobile-5f5c · PR #176 · Preview https://days-git-cursor-globe-locale-mobile-5f5c-catgeots-projects.vercel.app/
금지: 검색바 flex(#175) 동시 · HomeUI 리디자인 · plans/** feature 커밋
작업: 모바일 EN 토글 → 지구본 지명·핀 EN · KO 복귀 · OK 시 merge
```

---

## 홈 검색바 히트 (EN 토글·검색 겹침)

### #1 브랜치·핸드오프 준비 ✅

- **세션** `홈 검색바 히트 #1, 브랜치·핸드오프 준비`
- **브랜치** `cursor/search-locale-hit-5f5c` · tip `4dff1699` · PR [#175](https://github.com/catgeot/Days/pull/175)
- **증상** 모바일 검색바 `left-[7.75rem]` ↔ chrome 실드 `z-[110]` → 검색 클릭 무력화
- **준비** `/qa/search-hit` · Preview 작업 로그 · 핸드오프 §13 A′′
- **다음** **#2 HomeUI flex** — `HomeUI.jsx`만 · 참고 `f3ec61d7`/`0ba69445` · **HomeGlobeMapbox 금지** (#9 지명 수정과 분리)

**다음 제시어 (지명 QA 후)**:

```
홈 검색바 히트 #2, HomeUI flex
@plans/feature-handoff-index.md
@plans/2026-09-02-project-log.md
@plans/i18n-en-plan.md
브랜치 cursor/search-locale-hit-5f5c · PR #175 · Preview https://days-git-cursor-search-locale-hit-5f5c-catgeots-projects.vercel.app/
금지: HomeGlobeMapbox · LocaleProvider Mapbox · #173 통째 cherry-pick · UI 리디자인 · plans/** feature 커밋
작업: HomeUI.jsx만 — 모바일 [로고+EN | 검색 flex-1] · 바로가기 칩 2행 · EN 토글·검색 각각 클릭 가능
```
