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

### #1 스키마·검색 ✅

- **세션** `지자체 팔경 #1, 스키마·검색`
- **브랜치** `cursor/palgyeong` · tip `ebe47009`
- **산출** `koreaLocalScenicLists.json`(시드 0) · `koreaLocalScenicLists.js` · `audit:korea-local-scenic-lists` · `smoke:korea-local-scenic-lists` · `searchSuggestions`·`scenicSearch` 브리지
- **VERIFY** audit 0 · smoke PASS · build PASS
- **다음** **#2 파일럿 3건** — 홍천·양구·인제(P0)

### #2 파일럿 3건 ✅

- **세션** `지자체 팔경 #2, 파일럿 3건`
- **브랜치** `cursor/palgyeong` · tip `3faf3bca`
- **산출** `hongcheon-palgyeong`(홍천9경 9) · `yanggu-gugyeong`(양구9경 9) · `inje-palgyeong`(인제8경 8) · hub append 18 · aliases
- **출처** 홍천군 문화관광포털 · 양구볼구양 · injetour.co.kr/scenics
- **VERIFY** audit:korea-local-scenic-lists 0 · audit:city-attraction-hubs 0 · smoke · build PASS
- **다음** **#3 무결성** — I#1 §6.3 · 큐 P0✅

### #3 무결성 I#1 ✅

- **세션** `지자체 팔경 #3, 무결성`
- **브랜치** `cursor/palgyeong` · tip `2b4ccff0` (쓰기 0)
- **§6.3** audit 0 · smoke PASS · build PASS · `_tmp*` 없음
- **대조** lists 3 = 큐 P0 · members 26 · hub append 18 = 일지 #2
- **샘플 exact** 홍천9경·양구9경·인제8경 — `resolveLocalScenicList`·hub·scenicSearch 전부 OK
- **다음** **#4 채우기 R01** — 오케 워커2 · 강원 6리스트

### #4 채우기 R01 ✅

- **세션** `지자체 팔경 #4, 채우기 R01`
- **브랜치** `cursor/palgyeong` · tip `17f7ebed` · PR [#172](https://github.com/catgeot/Days/pull/172)
- **산출** `samcheok-sipgyeong`(10) · `wonju-palgyeong`(8) · `donghae-bijing`(9) · `sokcho-palgyeong`(8) · `yangyang-sipgyeong`(10) · `goseong-palgyeong`(8) · hub append +36 · aliases
- **skip** `chuncheon`·`gangneung` 시 단위 공식 8경 없음 → 예비 `samcheok-sipgyeong`·`donghae-bijing`
- **충돌 접두** `설악산 대청봉`(yangyang) · `삼척 천은사`(samcheok)
- **VERIFY** audit:korea-local-scenic-lists 0 · audit:city-attraction-hubs 0 · smoke(원주8경·속초8경·양양10경·고성8경·삼척십경·동해비경) · build PASS
- **Preview** `https://days-git-cursor-palgyeong-catgeots-projects.vercel.app`
- **다음** **#5 채우기 R02** — samcheok·donghae 큐 예비 소진 · R02 재조사

### #5 채우기 R02 ✅

- **세션** `지자체 팔경 #5, 채우기 R02`
- **브랜치** `cursor/palgyeong` · tip `0337bc26` · PR [#172](https://github.com/catgeot/Days/pull/172)
- **산출** `cheorwon-gugyeong`(9) · `yeongwol-sipgyeong`(10) · `taebaek-palgyeong`(8) · `jeongseon-palgyeong`(8) · `hwacheon-gugyeong`(9) · hub append +30 · aliases
- **EXISTS** `samcheok-sipgyeong`·`donghae-bijing`(R01 tip) → 예비 `cheorwon-gugyeong`·`yeongwol-sipgyeong` 1:1
- **skip** `pyeongchang` 시·군 단위 공식 N경 없음(`skip_no_source`)
- **VERIFY** audit:korea-local-scenic-lists 0 · audit:city-attraction-hubs 0 · smoke(철원9경·영월10경·태백8경·화암8경·화천9경) · build PASS
- **Preview** `https://days-git-cursor-palgyeong-catgeots-projects.vercel.app`
- **다음** **#6 채우기 R03** — `hoengseong`·예비 · R01–R03 누적 후 **I#2**

### #6 채우기 R03 ✅

- **세션** `지자체 팔경 #6, 채우기 R03`
- **브랜치** `cursor/palgyeong` · tip `abed4013` · PR [#172](https://github.com/catgeot/Days/pull/172)
- **산출** R03 신규 lists 0 · `merge-local-scenic-r03.mjs` · 강원 F 라운드 마감
- **skip** `hoengseong` 시·군 단위 공식 N경 없음(`skip_no_source`, hsg.go.kr tour 팔경/8경/구경/비경 0건)
- **예비** 강원 5칸 소진 — lists 14 = 18 hubs − 4 skips(chuncheon·gangneung·pyeongchang·hoengseong)
- **I#2 검토** audit 0 · smoke(파일럿3+R01–R02 샘플 10) · build PASS · `_tmp*` 없음
- **Preview** `https://days-git-cursor-palgyeong-catgeots-projects.vercel.app`
- **다음** **#7 무결성 I#2** — §6.3 쓰기 0 · 충북·경북 큐 확장
