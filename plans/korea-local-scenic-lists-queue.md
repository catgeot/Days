# koreaLocalScenicLists — 사전 배치 큐 (기초지자체 팔경·구경)

**상태**: R09 ✅ · **I#4** ✅ · PR #172 **main merge** ✅ · **R10–R29** ⬜ (잔류 84 hub)  
**규칙**: 라운드 = **6 칸** · 워커A **3** + 워커B **3** · VERIFY PASS → **다음 R 자동** · **3R마다 I#** · §6.2만 정지  
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) **§5.6** · 플랜 [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md)  
**단위**: 시·군·구만 · **광역 팔경(관동팔경 등) 큐 금지**(1차)  
**QA**: F 라운드 **사람 Preview 생략** · I# 일지 요약만

### 사용법

1. 다음 미완료 라운드(또는 P 파일럿)만 워커/메인에 전달.  
2. EXISTS(`listId` 이미 tip) → 예비 1:1 대체 · 일지 1줄.  
3. `hubId` tip 없음 · 공식 URL 없음 → `skip_*` · 예비 대체.  
4. **금지**: 큐 밖 임의 시군 · UI · scenic 승격 · 기존 명소 삭제.  
5. 문제 시: 오케 **§3.3** + 플랜 **§6.2**.

### hubId 표기

기존 `cityAttractionHubs` KR `hubId`와 **동일** (`hongcheon`, `yanggu`, `gangneung` …).

---

## P0 파일럿 (오케 전 · 메인 솔로)

| # | listId | hubId | 기대 title | 상태 |
|---|--------|-------|------------|------|
| P1 | `hongcheon-palgyeong` | `hongcheon` | 홍천9경 | ✅ 2026-09-01 |
| P2 | `yanggu-gugyeong` | `yanggu` | 양구9경 | ✅ 2026-09-01 |
| P3 | `inje-palgyeong` | `inje` | 인제8경 | ✅ 2026-09-01 |

P 완료 → **I 무결성 #1** ✅ 2026-09-02 → F R01 시작.

---

## F 라운드 (워커A 3 + 워커B 3) — 강원 우선

| R | 워커A (3) | 워커B (3) | 권역 | 상태 |
|---|-----------|-----------|------|------|
| **R01** | `samcheok-sipgyeong`(예비↔chuncheon skip) · `wonju-palgyeong` · `donghae-bijing`(예비↔gangneung skip) | `sokcho-palgyeong` · `yangyang-sipgyeong` · `goseong-palgyeong` | 강원 | ✅ 2026-09-02 |
| **R02** | `cheorwon-gugyeong`(EXISTS→samcheok) · `yeongwol-sipgyeong`(EXISTS→donghae) · `taebaek-palgyeong` | `jeongseon-palgyeong` · `hwacheon-gugyeong` · skip `pyeongchang` | 강원 | ✅ 2026-09-02 |
| **R03** | `hoengseong` skip · 예비 강원 2 소진 | 예비 강원 3 소진 | 강원 | ✅ 2026-09-02 |

> **R01 skip**: `chuncheon`·`gangneung` 시 단위 공식 8경 없음(`skip_no_source`) → 예비 `samcheok-sipgyeong`·`donghae-bijing` 1:1 대체.

> **R02 EXISTS**: `samcheok-sipgyeong`·`donghae-bijing` tip 기존 → 예비 `cheorwon-gugyeong`·`yeongwol-sipgyeong` 1:1 · `pyeongchang` `skip_no_source`.

> **R03 skip**: `hoengseong` 시·군 단위 공식 N경 없음(`skip_no_source`, hsg.go.kr tour 팔경/8경/구경/비경 0건) · 예비 강원 5칸 소진(P0·R01·R02로 14 lists / 18 hubs 완료).

> R의 `?` = 착수 전 **소스 조사로 listKind·공식 title 확정**. 리스트가 없으면 그 칸은 예비로 교체하고 큐에 `skip_no_source` 1줄.

**I 주기**: R01–R03 VERIFY 누적 후 → **I 무결성 #2** ✅ 2026-09-02 → 충북·경북 큐 확장(아래).

---

## F 라운드 — 충북·경북 (I#2 후 확장 · 착수 전 소스 조사)

> `hubId-?` = 착수 전 **공식 title·listKind·sourceUrl** 확정. hub 없음·공식 N경 없음 → `skip_no_source` · 예비 1:1.

| R | 워커A (3) | 워커B (3) | 권역 | 상태 |
|---|-----------|-----------|------|------|
| **R04** | `danyang-palgyeong` · `jecheon-sipgyeong` · skip `chungju` | skip `cheongju` · skip `boeun` · skip `goesan` | 충북 | ✅ 2026-09-02 |
| **R05** | `okcheon-gugyeong` · `yeongdong-yangsan-palgyeong` · `yeongdong-hancheon-palgyeong` · `jincheon-palgyeong` | `jeungpyeong-gugyeong` · skip `eumseong` · — | 충북 | ✅ 2026-09-02 |
| **R06** | `gyeongju-8gwae` · `pohang-sipgyeong` · skip `andong` | skip `gumi` · skip `sangju` · skip `gimcheon` | 경북 | ✅ 2026-09-02 |
| **R07** | skip `yeongju` · `mungyeong-palgyeong` · skip `bonghwa` | `yecheon-palgyeong` · skip `cheongsong` · `yeongdeok-sipgyeong` | 경북 | ✅ 2026-09-02 |
| **R08** | skip `uljin` · skip `goryeong` · skip `gunwi` | `uiseong-binggye-palgyeong` · skip `chilgok` · `seongju-sipgyeong` | 경북 | ✅ 2026-09-02 |
| **R09** | skip `gyeongsan` · `yeongcheon-gugyeong` · `cheongdo-gugyeong` | skip `yeongyang` · skip `ulleung` · skip `dokdo` | 경북 | ✅ 2026-09-02 |

> **R04 skip**: `chungju`·`cheongju`·`boeun`·`goesan` 시·군 단위 공식 N경 없음(`skip_no_source`) — chungju.go.kr·cheongju.go.kr·boeun.go.kr·goesan.go.kr.

> **R04 충돌 접두**: `옥순봉`(jecheon) → hub `제천 옥순봉` (단양팔경·제천10경 공통 멤버).

> **R05 skip**: `eumseong` 시·군 단위 공식 N경 없음(`skip_no_source` — eumseong.go.kr/tour).

> **R06 skip**: `andong`·`gumi`·`sangju`·`gimcheon` 시·군 단위 공식 N경 SSOT 없음(`skip_no_source`).

> **R05 verified**: `okcheon-gugyeong`(9) · `yeongdong-yangsan-palgyeong`(8) · `yeongdong-hancheon-palgyeong`(8) · `jincheon-palgyeong`(8) · `jeungpyeong-gugyeong`(9).

> **R06 verified**: `gyeongju-8gwae`(8怪 · listKind other) · `pohang-sipgyeong`(12).

> **R07 verified**: `mungyeong-palgyeong`(8) · `yecheon-palgyeong`(8) · `yeongdeok-sipgyeong`(9). **skip** `yeongju`·`bonghwa` `skip_no_source` · `cheongsong` `skip_ambiguous`.

> **R08 verified**: `uiseong-binggye-palgyeong`(8) · `seongju-sipgyeong`(10). **skip** `uljin`·`goryeong`·`gunwi`·`chilgok` `skip_no_source`.

> **R09 verified**: `yeongcheon-gugyeong`(9) · `cheongdo-gugyeong`(9). **skip** `gyeongsan`·`ulleung`·`dokdo` `skip_no_source` · `yeongyang` `skip_ambiguous`.

> **충북 11** hub (`cheongju`·`jincheon`·`jeungpyeong`·`eumseong`·`goesan`·`chungju`·`jecheon`·`danyang`·`boeun`·`okcheon`·`yeongdong`) — [`korea-scenic-mid-cluster-plan.md`](./korea-scenic-mid-cluster-plan.md) 청주권·북부·남부 순.

> **경북 24** hub — 신라·가야·유교·동해 권역 순. `ulleung`·`dokdo`는 섬·공식 N경 유무 **착수 전 확인**.

**I 주기**: R07–R09 VERIFY 누적 후 → **I 무결성 #4** ✅ 2026-09-02 · 경북 큐 소진.

---

## F 라운드 — 경남 (PR #172 merge 후 · I#4 다음 · 착수 전 소스 조사)

> `hubId-?` = 착수 전 **공식 title·listKind·sourceUrl** 확정. hub 없음·공식 N경 없음 → `skip_no_source` · 예비 1:1.  
> 경남 고성 hubId = `goseongnam` (강원 `goseong`과 구분).

| R | 워커A (3) | 워커B (3) | 세권 | 상태 |
|---|-----------|-----------|------|------|
| **R10** | `tongyeong-?` · `geoje-?` · `sacheon-?` | `changwon-?` · `goseongnam-?` · `namhae-?` | 남해안 | ⬜ |
| **R11** | `hadong-?` · `jinju-?` · `sancheong-?` | `hamyang-?` · `geochang-?` · `hapcheon-?` | 지리산·서부 | ⬜ |
| **R12** | `gimhae-?` · `yangsan-?` · `miryang-?` | `uiryeong-?` · `haman-?` · `changnyeong-?` | 낙동·중부 | ⬜ |

> **경남 18** hub — [`korea-scenic-mid-cluster-plan.md`](./korea-scenic-mid-cluster-plan.md) 남해안·지리산·낙동 순.

**I 주기**: R10–R12 VERIFY 누적 후 → **I 무결성 #5** (예정).

---

## F 라운드 — 전남 (I#5 후 · 착수 전 소스 조사)

> 도 4관광권 순: **동부 → 북부 → 서부 → 중남**. `hubId-?` = 공식 title·listKind·sourceUrl 확정.

| R | 워커A (3) | 워커B (3) | 세권 | 상태 |
|---|-----------|-----------|------|------|
| **R13** | `yeosu-?` · `suncheon-?` · `gwangyang-?` | `gokseong-?` · `gurye-?` · `naju-?` | 동·북 | ⬜ |
| **R14** | `damyang-?` · `jangseong-?` · `hwasun-?` | `hampyeong-?` · `yeonggwang-?` · `mokpo-?` | 북·서 | ⬜ |
| **R15** | `muan-?` · `sinan-?` · `jindo-?` | `haenam-?` · `wando-?` · `gangjin-?` | 서·중남 | ⬜ |
| **R16** | `jangheung-?` · `boseong-?` · `goheung-?` | `yeongam-?` · — · — | 중남 | ⬜ |

> **전남 22** hub — [`korea-scenic-mid-cluster-plan.md`](./korea-scenic-mid-cluster-plan.md) 동·북·서·중남 순. R16은 4칸(잔여).

**I 주기**: R13–R15 → **I#6** · R16–R18 → **I#7**.

---

## F 라운드 — 전북 (전남 R16 직후 · 착수 전 소스 조사)

| R | 워커A (3) | 워커B (3) | 세권 | 상태 |
|---|-----------|-----------|------|------|
| **R17** | `jeonju-?` · `wanju-?` · `iksan-?` | `gimje-?` · `gunsan-?` · `buan-?` | 전주권·서부 | ⬜ |
| **R18** | `gochang-?` · `jeongeup-?` · `namwon-?` | `muju-?` · `jinan-?` · `jangsu-?` | 서부·동부 | ⬜ |
| **R19** | `imsil-?` · `sunchang-?` · — | — · — · — | 동부 | ⬜ |

> **전북 14** hub — 전주권·서부·동부 순. R19는 2칸(잔여).

**I 주기**: R19–R21 → **I#8**.

---

## F 라운드 — 충남 (전북 R19 직후 · 착수 전 소스 조사)

| R | 워커A (3) | 워커B (3) | 세권 | 상태 |
|---|-----------|-----------|------|------|
| **R20** | `cheonan-?` · `asan-?` · `dangjin-?` | `seosan-?` · `taean-?` · `boryeong-?` | 북부·서해 | ⬜ |
| **R21** | `seocheon-?` · `hongseong-?` · `yesan-?` | `cheongyang-?` · `gongju-?` · `buyeo-?` | 서해·내포·백제 | ⬜ |
| **R22** | `nonsan-?` · `gyeryong-?` · `geumsan-?` | — · — · — | 백제·내륙 | ⬜ |

> **충남 15** hub — 북부·서해·내포·백제 순. R22는 3칸(잔여).

**I 주기**: R22–R24 → **I#9**.

---

## F 라운드 — 경기 (충남 R22 직후 · 착수 전 소스 조사)

> 동서남북 4세권 순. `gwangju_gi` = 경기 광주시.

| R | 워커A (3) | 워커B (3) | 세권 | 상태 |
|---|-----------|-----------|------|------|
| **R23** | `goyang-?` · `paju-?` · `uijeongbu-?` | `yangju-?` · `dongducheon-?` · `pocheon-?` | 북부 | ⬜ |
| **R24** | `yeoncheon-?` · `hanam-?` · `namyangju-?` | `guri-?` · `gapyeong-?` · `yangpyeong-?` | 북·동 | ⬜ |
| **R25** | `yeoju-?` · `icheon-?` · `gwangju_gi-?` | `gimpo-?` · `bucheon-?` · `gwangmyeong-?` | 동·서 | ⬜ |
| **R26** | `siheung-?` · `ansan-?` · `hwaseong-?` | `pyeongtaek-?` · `suwon-?` · `seongnam-?` | 서·남 | ⬜ |
| **R27** | `yongin-?` · `anyang-?` · `gunpo-?` | `uiwang-?` · `gwacheon-?` · `osan-?` | 남부 | ⬜ |
| **R28** | `anseong-?` · — · — | — · — · — | 남부 | ⬜ |

> **경기 31** hub — R28은 1칸(잔여).

**I 주기**: R25–R27 → **I#10** · R28–R29 → **I#11**.

---

## F 라운드 — 제주 (경기 R28 직후)

| R | 워커A (3) | 워커B (3) | 상태 |
|---|-----------|-----------|------|
| **R29** | `jeju-?` · `seogwipo-?` · — | — · — · — | ⬜ |

> **제주 2** hub. R29는 2칸.

**I 주기**: R28–R29 누적 → **I#11** · 이후 광역시 백로그.

---

## 백로그 — 광역시·서울 (R29 후 · 큐 미배치)

세권 불필요([`korea-scenic-mid-cluster-plan.md`](./korea-scenic-mid-cluster-plan.md) §3). hub별 공식 N경 **착수 전 조사** 후 라운드 추가.

| 시도 | hub 수 | hubId (tip 기준) |
|------|-------:|------------------|
| 서울 | 1 | `seoul` |
| 인천 | 3 | `incheon` · `ganghwa` · `ongjin` |
| 부산 | 2 | `busan` · `busanjin` |
| 대구 | 1 | `daegu` |
| 광주 | 1 | `gwangju` |
| 대전 | 1 | `daejeon` |
| 울산 | 1 | `ulsan` |
| 세종 | 1 | `sejong` |

> F 큐 **R29까지** 소진 후 잔여 hub 수·skip율 보고 → 사람 합의로 R30+ 추가 또는 주제 종료.

### I# 주기 요약 (R10–)

| I# | R 범위 | 권역 |
|----|--------|------|
| **#5** | R10–R12 | 경남 |
| **#6** | R13–R15 | 전남 |
| **#7** | R16–R18 | 전남 잔·전북 |
| **#8** | R19–R21 | 전북 잔·충남 |
| **#9** | R22–R24 | 충남 잔·경기 |
| **#10** | R25–R27 | 경기 |
| **#11** | R28–R29 | 경기 잔·제주 |

### 예비 (스킵·EXISTS 시)

강원: `hongcheon`(P 완료 후 제외) · `yanggu` · `inje` · `gosung` 표기 주의(`goseong-gw` vs 경남) · `sokcho` 시드 append만  
기타: tip에 hub 있는 시군만 · hub 없으면 예비에서 제외

### 한 세션 권장

| 종류 | 분량 |
|------|------|
| P 파일럿 | 리스트 **3** |
| F 짧게 | R **1** (6) |
| F 기본 | R **2** (12) 후 이관 또는 I |
| I | 쓰기 0 |

### 진행 체크

```text
운영: 자동 오케 §4.3 — VERIFY PASS → 다음 ⬜ R (사람 제시어·Preview QA 없음)
현재: lists 30 · members 264 · main merge ✅ · 다음 ⬜ R10 (경남)
잔류 큐: R10–R29 (84 hub) — 경남18·전남22·전북14·충남15·경기31·제주2 · 광역시=백로그
I#5–#11: 3R마다 무결성 · R29 후 광역시 합의 또는 주제 종료
```
