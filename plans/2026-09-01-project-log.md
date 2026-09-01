# 2026-09-01 프로젝트 일지

직전: [`2026-08-27-project-log.md`](./2026-08-27-project-log.md)

---

## 축제 로드 — 플랜·핸드오프

### #0 플랜·핸드오프 ✅

- **세션** `축제 로드 #0, 플랜·핸드오프`
- **산출** [`korea-festival-road-plan.md`](./korea-festival-road-plan.md) · index · hub-pl 벨트 절 · **순번 #0~** (#Na 이어하기 규칙)
- **main** `25c82886` → 순번 정리 커밋 예정

### #1 검증·확장 ✅

- **세션** `축제 로드 #1, 검증·확장`
- **브랜치** `cursor/korea-festival-proxy` · tip `42072600` · PR [#170](https://github.com/catgeot/Days/pull/170)
- **산출** overrides 4벨트 · `koreaFestivalBelts.json` · generate/audit/smoke · `/qa/korea` Preview
- **VERIFY** generate · audit · smoke PASS · LIVE 32건·**10/17** stop hub 매칭
- **LIVE 0건 stop** 철원·양구·양양·속초·삼척·제천·단양 — #2 빈 leg · #7 밀도 후보
- **다음** **#2 매칭** — `festivalBelts.js` · `groupFestivalsForBelt()` leg[]

### #2 매칭 ✅

- **세션** `축제 로드 #2, 매칭`
- **브랜치** `cursor/korea-festival-proxy` · tip `b1d44ef9` · PR [#170](https://github.com/catgeot/Days/pull/170)
- **산출** `festivalBelts.js` · `groupFestivalsForBelt()` leg[] (stopIndex·nextLabel·items·empty) · smoke leg 검증 확장
- **VERIFY** generate · audit · smoke · build PASS · sparse stop 빈 leg 유지 · 벨트 밖 축제 제외
- **다음** **#3 진입** — belt 패널 · 로드 카드 · 선택 상태

### #3 진입 ✅

- **세션** `축제 로드 #3, 진입`
- **브랜치** `cursor/korea-festival-proxy` · tip `87844dae` · PR [#170](https://github.com/catgeot/Days/pull/170)
- **산출** `FestivalBeltPanel` · **로드** 대분류 칩 · 4로드 카드·선택·해제 · `beltLegsToPanelGroups()` · belt 모드 `panelGroups` 대체
- **VERIFY** smoke · build PASS
- **Preview** `/qa/korea` → `/korea` · **로드** 칩 → 카드 선택 → 정류장별 리스트
- **다음** **#4 leg UI** — `FestivalBeltLegList` · connector · 빈 leg
