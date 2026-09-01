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

### #3-a 진입 QA ✅

- **세션** `축제 로드 #3-a, 진입 QA`
- **브랜치** `cursor/korea-festival-proxy` · tip `0708af9b` · PR [#170](https://github.com/catgeot/Days/pull/170)
- **이슈** 하단 스크롤 후 아래 로드 클릭 시 선택 카드가 화면 밖으로 밀림 (위쪽 아코디언 접힘 + scrollTop 유지)
- **수정** `FestivalBeltPanel` — 펼침 후 `scrollIntoView(block:start)` · `scroll-mt-2`
- **VERIFY** build PASS
- **Preview** https://www.gateo.kr/qa/korea → **로드** 칩 → 스크롤 하단 → 로드 클릭·펼침 시 카드 상단 유지
- **다음** 사람 Preview 1~2줄 → **#4 leg UI**

---

## 지자체 팔경·구경 → 도시 명소

### #0 플랜·핸드오프 ✅

- **세션** `지자체 팔경 #0, 플랜·핸드오프`
- **결정** 시·군·구 단위 · 기존 hub 유지+지자체 선정 **append** · **UI·scenic 자동승격 금지** · 검색 키워드만 보강
- **산출** [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md) · [`korea-local-scenic-lists-queue.md`](./korea-local-scenic-lists-queue.md) · 오케 **§5.6** · index 행
- **분량** P=3 · F 라운드=6(A3+B3) · 세션상한 ~12 · **3R마다 I 무결성** · 정지=§3.3+플랜 §6.2
- **다음** **#1 스키마·검색** — `cursor/palgyeong` · SSOT·audit·검색 브리지
