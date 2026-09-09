# 팔경·명소 Tour contentId 큐

**상태**: R01–R16 ✅ · **P0·P1 F 소진** · membersWithContentId **575**/876 · hub+P1 **68** · P2 **null 104**/871(78 hub) · **P2-L2** ✅ 0/104 · **P0-L** ✅ 109/584 · **P0-L02·L03·L05** ✅ 0/100(동일 본명 keyword **폐기**) · **P0-L06 폐기** · **P0-L07++** ✅ 2/100 · **P0-L07+++ 폐기**(같은 100명 로또) · **P0-K01** ✅ 10/40 · **P0-K02** ✅ 4/40 · **P0-K03** ✅ 4/23 · **P0-K04** ✅ 5/41 · **P0-K05** ✅ 8/40 · **P0-K06** ✅ 3/40 · **P0-K07** ✅ 8/40 · **P0-K08** ✅ 4/40 · **P0-K09** ✅ 8/21 · **P0-K10** ✅ 5/22 · **P0-K11** ✅ 0/2 · **P0-K12** ✅ 0/1 · **P0-A02** ✅ 6/48 · **P0-C01** ✅ 소진 · **P0-A03** ✅ 11/41 · **P0-A04** ✅ 8/29 · **P0-A05** ✅ 4/21 · **P0-A06** ✅ 4/12 · **다음 P0-A07** siho alias (8) · Tour API **운영 승인 ~10만/일**  
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) **§5.7** · 플랜 [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md)  
**브랜치**: `cursor/palgyeong-cid` (A UI `cursor/palgyeong-use-e744`와 **분리** · 수집 `cursor/palgyeong` 금지)  
**금지**: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 같은 날 재호출 · P1/P2를 P0 전에

### 사용법

1. **S0** 끝날 때까지 F 오케 금지 (메인 솔로: 스크립트 + 문경 DB-only).  
2. F: 다음 ⬜ R만 · 워커A 3 + 워커B 3. **DB-only R** 우선.  
3. LIVE R은 메인 직렬(또는 워커 1). **운영 쿼터 ~10만/일**(2026-09-07 승인) — P2 세션당 20건 상한 해제 · 429 → `blocked: quota` · 그날 정지.  
4. **P0/P1** `listId`·hub — [`koreaLocalScenicLists.json`](../src/pages/Home/data/koreaLocalScenicLists.json) `verified`만. 큐 밖 임의 시군 금지.  
5. **P2** 대상 — [`korea-scenic-spots-overrides.mjs`](../scripts/data/korea-scenic-spots-overrides.mjs) `contentId: null`만 · 스크립트 `fill:korea-scenic-spot-content-ids` · `--hubs=` 큐 배정 hub · 적용 후 `generate:korea-scenic-spots` · VERIFY `audit:korea-scenic-spots` + `smoke:korea-scenic-spots`.

---

## S0 (오케 전 · 메인 솔로)

| # | 작업 | 상태 |
|---|------|------|
| S0 | fill 스크립트 `--db-only`/`--keyword-only`/`--limit`/`--resume` · 문경(`mungyeong-palgyeong`) DB 매칭 스모크 · audit가 `contentId` 허용 | ✅ 2026-09-04 |
| S0-P2 | `nullIdsFromOverrides` → `KOREA_SCENIC_SPOTS_OVERRIDES` import · dry-run `targets>0` | ✅ 2026-09-07 · `3c67e133` |

S0 PASS 후에만 아래 F. 라운드 표는 `listKoreaLocalScenicLists()` verified 순 6칸씩.

---

## F P0 (워커A 3 + 워커B 3) — 팔경 멤버

| R | 워커A (3 listId) | 워커B (3 listId) | 모드 | 상태 |
|---|------------------|------------------|------|------|
| **R01** | `hongcheon-palgyeong` · `yanggu-gugyeong` · `inje-palgyeong` | `samcheok-sipgyeong` · `wonju-palgyeong` · `donghae-bijing` | DB-only | ✅ 2026-09-04 15/53 · `6affda87` |
| **R02** | `sokcho-palgyeong` · `yangyang-sipgyeong` · `goseong-palgyeong` | `cheorwon-gugyeong` · `yeongwol-sipgyeong` · `taebaek-palgyeong` | DB-only | ✅ 2026-09-04 17/53 · `4b160554` |
| **R03** | `jeongseon-palgyeong` · `hwacheon-gugyeong` · `danyang-palgyeong` | `jecheon-sipgyeong` · `okcheon-gugyeong` · `yeongdong-yangsan-palgyeong` | DB-only | ✅ 2026-09-04 21/52 · `003b34d8` |
| **R04** | `yeongdong-hancheon-palgyeong` · `jincheon-palgyeong` · `jeungpyeong-gugyeong` | `gyeongju-8gwae` · `pohang-sipgyeong` · `mungyeong-palgyeong` | DB-only | ✅ 2026-09-04 6/52 · `c0897266` |
| **R05** | `yecheon-palgyeong` · `yeongdeok-sipgyeong` · `uiseong-binggye-palgyeong` | `seongju-sipgyeong` · `yeongcheon-gugyeong` · `cheongdo-gugyeong` | DB-only | ✅ 2026-09-04 14/53 · `8d2e11a1` |
| **R06** | `tongyeong-palgyeong` · `geoje-gugyeong` · `sacheon-gugyeong` | `namhae-sipgyeong` · `hadong-sipgyeong` · `jinju-palgyeong` | DB-only | ✅ 2026-09-04 19/56 · `6b2aa715` |
| **R07** | `sancheong-gugyeong` · `hamyang-palgyeong` · `geochang-gugyeong` | `hapcheon-palgyeong` · `gimhae-gugyeong` · `yangsan-other` | DB-only | ✅ 2026-09-05 19/55 · `97039b14` |
| **R08** | `miryang-palgyeong` · `uiryeong-gugyeong` · `haman-gugyeong` | `changnyeong-gugyeong` · `yeosu-other` · `gwangyang-gugyeong` | DB-only | ✅ 2026-09-05 12/54 · `06d9b915` |
| **R09** | `gokseong-gugyeong` · `gurye-other` · `damyang-other` | `hwasun-other` · `hampyeong-palgyeong` · `yeonggwang-gugyeong` | DB-only | ✅ 2026-09-05 26/57 · `d1e36e5b` |
| **R10** | `mokpo-gugyeong` · `muan-gugyeong` · `jindo-other` | `haenam-palgyeong` · `wando-palgyeong` · `gangjin-other` | DB-only | ✅ 2026-09-05 21/56 · `face87c6` |
| **R11** | `jangheung-gugyeong` · `boseong-gugyeong` · `goheung-other` | `wanju-gugyeong` · `gunsan-palgyeong` · `buan-palgyeong` | DB-only | ✅ 2026-09-07 17/53 · `9862b617` |
| **R12** | `jeongeup-gugyeong` · `muju-other` · `imsil-gugyeong` | `cheonan-palgyeong` · `seosan-gugyeong` · `taean-palgyeong` | DB-only | ✅ 2026-09-07 24/76 · `9d9a7276` |
| **R13** | `seocheon-gugyeong` · `hongseong-other` · `yesan-sipgyeong` | `gongju-sipgyeong` · `buyeo-sipgyeong` · `nonsan-other` | DB-only | ✅ 2026-09-07 28/62 · `5276a853` |
| **R14** | `gyeryong-gugyeong` · `geumsan-sipgyeong` · `uijeongbu-palgyeong` | `yeoju-palgyeong` · `icheon-gugyeong` · `gwangju-gi-palgyeong` | DB-only | ✅ 2026-09-07 15/52 · `e088c22b` |
| **R15** | `ansan-gugyeong` · `hwaseong-palgyeong` · `yongin-palgyeong` | `anyang-gugyeong` · `anseong-palgyeong` · `incheon-gugyeong` | DB-only | ✅ 2026-09-07 20/51 · `1e297c87` |
| **R16** | `ganghwa-palgyeong` · `daegu-sipgyeong` · `daejeon-palgyeong` | `ulsan-sipgyeong` | DB-only | ✅ 2026-09-07 17/40 · `d8556c2e` · **P0 소진** |

---

## 후순위 (P0 소진 전 착수 금지)

| 순위 | 대상 | 상태 |
|------|------|------|
| P1 | hub `attractions[]` 중 `contentId` 없는 KR 명소 | **P1-R01–R10** ✅ 68/197 · **P1 F 소진** |
| P2 | 테마 선정 `contentId: null` **142**/871 (78 hub) — 구 ~75·429 백로그 포함 | **P2-R01** ⬜ |

### P1 F (워커A 3 hub + 워커B 3 hub) — hub attraction DB-only

| R | 워커A (3 hub) | 워커B (3 hub) | 모드 | 상태 |
|---|---------------|---------------|------|------|
| **P1-R01** | `yeongdong` · `gyeongju` · `jincheon` | `pohang` · `samcheok` · `hongcheon` | DB-only | ✅ 2026-09-07 9/83 · `0725230f` |
| **P1-R02** | `yanggu` · `inje` · `wonju` | `donghae` · `sokcho` · `yangyang` | DB-only | ✅ 2026-09-07 9/63 · `2e4bac58` |
| **P1-R03** | `goseong` · `cheorwon` · `yeongwol` | `taebaek` · `jeongseon` · `hwacheon` | DB-only | ✅ 2026-09-07 9/50 · `fc4e85d0` |
| **P1-R04** | `danyang` · `jecheon` · `okcheon` | `jeungpyeong` · `mungyeong` · `yecheon` | DB-only | ✅ 2026-09-07 6/38 · `8d609d90` |
| **P1-R05** | `sacheon` · `uiryeong` · `geoje` | `ganghwa` · `geochang` · `haman` | DB-only | ✅ 2026-09-07 6/51 · `3648d7b1` |
| **P1-R06** | `changnyeong` · `yeongdeok` · `uiseong` | `tongyeong` · `hadong` · `hapcheon` | DB-only | ✅ 2026-09-07 4/37 · `ec615db9` |
| **P1-R07** | `seongju` · `yeongcheon` · `cheongdo` | `namhae` · `jinju` · `sancheong` | DB-only | ✅ 2026-09-07 5/23 · `7c0d040a` |
| **P1-R08** | `hamyang` · `gimhae` · `yangsan` | `miryang` · `yeosu` · `gwangyang` | DB-only | ✅ 2026-09-07 5/24 · `8ea8bdd6` |
| **P1-R09** | `ansan` · `anseong` · `anyang` | `boseong` · `buan` · `buyeo` | DB-only | ✅ 2026-09-07 8/27 · `0ab99f56` |
| **P1-R10** | `cheonan` · `daegu` · `daejeon` | `damyang` · `geumsan` · `goheung` | DB-only | ✅ 2026-09-07 7/25 · `a248e546` · **P1 소진** |

---

## P2 (테마 선정 · `koreaScenicSpots`)

**SSOT**: overrides `contentId: null` **142**건 · **78** hub (2026-09-07 `cursor/palgyeong-cid` tip 기준 · 구 일지 ~75는 동일 백로그의 이전 스냅샷).  
**스크립트**: `npm run fill:korea-scenic-spot-content-ids` → `npm run generate:korea-scenic-spots`  
**워커 예**: `node scripts/fill-korea-scenic-spot-content-ids.mjs --db-only --hubs=samcheok,hapcheon,hadong --dry-run`  
**착수 전 게이트 (S0-P2)**: `nullIdsFromOverrides` 파서가 overrides 배열 형식과 불일치 시 dry-run `targets=0` — **메인 솔로 1회 수정** 후 F. (대안: 스크립트가 `KOREA_SCENIC_SPOTS_OVERRIDES` import로 null 목록 로드)

### P2 F DB-only (워커A 3 hub + 워커B 3 hub)

| R | 워커A (3 hub) | 워커B (3 hub) | null≈ | 모드 | 상태 |
|---|---------------|---------------|-------|------|------|
| **P2-R01** | `samcheok` · `hapcheon` · `hadong` | `uiryeong` · `sokcho` · `buyeo` | 28 | DB-only | ✅ 2026-09-07 **0/28** |
| **P2-R02** | `namwon` · `seongnam` · `wando` | `hanam` · `geochang` · `gunwi` | 21 | DB-only | ✅ 2026-09-07 **0/21** |
| **P2-R03** | `chuncheon` · `boseong` · `gwangju` | `jeongeup` · `danyang` · `gurye` | 18 | DB-only | ✅ 2026-09-07 **0/18** |
| **P2-R04** | `jecheon` · `pyeongchang` · `siheung` | `eumseong` · `yangsan` · `changwon` | 13 | DB-only | ✅ 2026-09-07 **0/13** · 월악산 약초마을 오탐 제외 |
| **P2-R05** | `yeongcheon` · `dokdo` · `goryeong` | `gyeongsan` · `yeongdeok` · `donghae` | 12 | DB-only | ✅ 2026-09-07 **0/12** |
| **P2-R06** | `buan` · `cheongju` · `ansan` | `gwangmyeong` · `yangpyeong` · `gunpo` | 8 | DB-only | ✅ 2026-09-07 **0/8** |
| **P2-R07** | `gwacheon` · `osan` · `jincheon` | `yeoju` · `dongducheon` · `icheon` | 6 | DB-only | ✅ 2026-09-07 **0/6** |
| **P2-R08** | `pyeongtaek` · `ulljin` · `chungju` | `sejong` · `seosan` · `dangjin` | 6 | DB-only | ✅ 2026-09-07 **0/5** |
| **P2-R09** | `sangju` · `gyeryong` · `mungyeong` | `bonghwa` · `hongseong` · `yeongi` | 6 | DB-only | ✅ 2026-09-07 **0/6** |
| **P2-R10** | `yesan` · `gokseong` · `seocheon` | `hwasun` · `imsil` · `jangseong` | 6 | DB-only | ✅ 2026-09-07 **0/6** |
| **P2-R11** | `yeonggwang` · `gimje` · `iksan` | `yeongam` · `cheongdo` · `gijang` | 6 | DB-only | ✅ 2026-09-07 **0/6** |
| **P2-R12** | `uiseong` · `yecheon` · `chilgok` | `gwangyang` · `sancheong` · `yeongyang` | 6 | DB-only | ✅ 2026-09-07 **0/6** |
| **P2-R13** | `pohang` · `mokpo` · `ulleung` | `gapyeong` · `gongju` · `yanggu` | 6 | DB-only | ✅ 2026-09-07 **0/6** · **P2 DB-only F 소진** |

P2-R13 완료 후 `null` 재집계 · DB-only F 소진 표기. **2026-09-07**: 전수 DB-only **유효 0건**(월악산→약초마을 1건은 overrides 오탐 제외) · null **142** 유지.

### P2 LIVE (메인 직렬 · 워커 병렬 금지)

DB-only 종료 후 overrides에 `contentId: null`이 남은 hub만. 라운드는 **잔여 수 재집계 후** 아래 패턴으로 추가.

| R | 방식 | 한도 | 모드 | 상태 |
|---|------|------|------|------|
| **P2-L01+** | 메인 직렬 `--keyword-only` (전수 또는 `--limit`) · 잔여는 `areaBased`+`keyword` | 쿼터 ~10만/일 | LIVE | **P2-L keyword** ✅ 2026-09-07 **38/142** · null **104** · tip `768b1635` |
| **P2-L2** | 메인 직렬 **플래그 없음** — DB(잔여) → `areaBased` → `keyword` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-07 **0/104** · null **104** 유지 · tip `4c141c27` |
| **P0-L** | `fill-korea-local-scenic-content-ids.mjs --keyword-only` (멤버 null **584**) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-07 **109/584** · members **400/876** · hub 72 |
| **P0-L02** | `--keyword-only --limit=100` (null **476** · resume 전부 소진 → **--resume 없이** 재시도) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-07 **0/100** · null **476** · 429 없음 |
| **P0-L03** | `--keyword-only --limit=100` (null **476** · P0-L02 동일 100건 재시도) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-07 **0/100** · null **476** · 429 없음 |
| **P0-L05** | `--keyword-only --limit=100` (`--resume` dry-run targets=0 → **--resume 없이**) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-07 **0/100** · null **476** · 429 없음 |
| **P0-L06** | 동일 본명 `--keyword-only --limit=100` | — | — | **폐기** 2026-09-07 — L02·L03·L05와 같은 호출 · 로또 금지 |
| **P0-L07** | S01 후 `--keyword-only --limit=100` (memberQueries) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-07 **11/100** · members **470/876** · tip `6212fab3` |
| **P0-L07+** | A01 후 `--keyword-only --limit=100` (memberQueries) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **2/100** · members **480/876** · tip `851fda40` |
| **P0-L07++** | `--keyword-only --limit=100` (memberQueries) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **2/100** · members **482/876** · tip `c914703c` |
| **P0-L07+++** | 같은 앞 100명 `--keyword-only --limit=100` | — | — | **폐기** 2026-09-08 — HIT 정체 · 세션 무한 · **P0-K**로 대체 |

### P0 키워드 종결 (K)

목적: 세션마다 **같은 100명 로또가 아니라** 남은 null을 버킷별로 LIVE 검색어를 바꿔 **채우거나 닫기**. contentId는 **LIVE가 준 행만**. AI 숫자 기입 금지.

**인벤토리** (2026-09-09 P0-A06 후, null **301**): siho **0 open**(siho_wait **8**) · poetic **0** · prefix **0 open**(ambiguous **2**) · short **0** · other **0** · closed **383**

| 명령 | 역할 |
|------|------|
| `npm run inventory:korea-local-scenic-content-ids` | 버킷·queries 기록 (`scripts/data/korea-local-scenic-content-id-close.json`) · LIVE 없음 |
| `npm run close:korea-local-scenic-content-ids -- --bucket=short --limit=40 --dry-run` | LIVE 유일·같은 시군 후보만 출력 |
| `npm run close:korea-local-scenic-content-ids -- --bucket=short --limit=40 --apply-unique` | HIT만 lists 기입 · MISS는 종결 상태 기록 |

| status | 의미 | 다음 세션 |
|--------|------|-----------|
| `unique_hit` | LIVE 1건 · 주소/제목이 해당 시군 | 다시 안 봄 |
| `tour_missing` | 전략 keyword 전부 0건(또는 이름 불일치) | 다시 안 봄 |
| `hub_mismatch` | Tour 행은 있으나 **다른 시군** | 다시 안 봄 |
| `ambiguous` | 같은 시군 후보 2+ | 에이전트 제목 확인 또는 null |
| `siho_wait` | 시호 · Tour 0건 | alias 세션만 |
| `open` | 아직 LIVE 종결 전 | `--bucket=` 대상 |

검색어(`strategyQueries`): 본명 · 시군 접두(`삼척 죽서루`) · 수식어 제거(`호미곶 일출`→`호미곶`) · 기존 `memberQueries`/alias.

**준비 검증** (apply 없음): short 8건 dry-run **4 HIT / 3 tour_missing / 1 hub_mismatch**(대청봉→양양). 예: 죽서루→`125799` 삼척 죽서루.

같은 본명 `--keyword-only --limit=100` **추가 금지.**

| R | 방식 | 한도 | 모드 | 상태 |
|---|------|------|------|------|
| **P0-K01** | `--bucket=short --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **10/40** · members **492/876** · tip `bf6e9882` |
| **P0-K02** | `--bucket=prefix --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **4/40** · members **496/876** · tip `5f3a2916` |
| **P0-K03** | `--bucket=poetic --apply-unique` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **4/23** · members **500/876** · tip `4dcee055` |
| **P0-K04** | `--bucket=other --apply-unique` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **5/41** · members **505/876** · tip `77e90417` |
| **P0-K05** | `--bucket=short --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **8/40** · members **513/876** · tip `65fd2b8d` |
| **P0-K06** | `--bucket=prefix --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **3/40** · members **516/876** · tip `03881a1c` |
| **P0-K07** | `--bucket=short --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-08 **8/40** · members **524/876** · tip `c3360044` |
| **P0-K08** | `--bucket=prefix --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-09 **4/40** · members **528/876** · tip `0c14512e` |
| **P0-K09** | `--bucket=short --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-09 **8/21** · members **536/876** · tip `77fe74bb` |
| **P0-K10** | `--bucket=prefix --apply-unique --limit=40` | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-09 **5/22** · members **541/876** · tip `1388e038` |
| **P0-K11** | `--bucket=prefix --apply-unique --limit=40` (잔여 2) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-09 **0/2** ambiguous · tip `c12f063a` |
| **P0-K12** | `--bucket=short --apply-unique --limit=40` (임실 옥정호 1건) | 쿼터 ~10만/일 | LIVE | ✅ 2026-09-09 **0/1** ambiguous · tip `a5131b5a` |
| **P0-A02** | `--bucket=siho` · 공식 본명 alias → LIVE (gunsan 등) | 소수 | 혼합 | ✅ 2026-09-09 **6/48** · members **547/876** · tip `f0019f88` |
| **P0-A03** | `--bucket=siho --apply-unique` · KEYWORD_ALIASES 12건 → LIVE | 소수 | 혼합 | ✅ 2026-09-09 **11/41** · members **559/876** · tip `ce464d0a` |
| **P0-A04** | `--bucket=siho --apply-unique` · KEYWORD_ALIASES 8건 + type38 시장 → LIVE | 소수 | 혼합 | ✅ 2026-09-09 **8/29** · members **567/876** · tip `2b7dc375` |
| **P0-A05** | `--bucket=siho --apply-unique` · KEYWORD_ALIASES 9건 → LIVE | 소수 | 혼합 | ✅ 2026-09-09 **4/21** · members **571/876** · tip `cc3fa3cc` |
| **P0-A06** | `--bucket=siho --apply-unique` · KEYWORD_ALIASES 4건 → LIVE | 소수 | 혼합 | ✅ 2026-09-09 **4/12** · members **575/876** · tip `e3acbf8d` |

### P0 잔여 전략 (2026-09-07 진단 · keyword 로또 대체)

P0-L02·L03·L05는 **같은 앞 100멤버**에 JSON `attractionName` **한 단어만** `searchKeyword`로 재호출했다. Tour 카탈로그가 안 바뀌면 **결정적으로 0/100**이다. `--resume`은 476 null이 이미 processed라 targets=0. **같은 본명 keyword 라운드 추가 금지.**

진단 스냅샷 (null **476**):

| 갈래 | 대략 | 같은 본명 재시도 | 다음 R |
|------|------|------------------|--------|
| scenic JSON에 이미 같은 hub+이름 `contentId` | **62** | 무효 | **P0-C01** 복사 (API 0) |
| 시군 접두 (`삼척 환선굴` → Tour는 `환선굴`) | `memberQueries` 2개+ **175** | 무효 | **P0-S01** 후 **P0-L07** |
| Tour 제목 괄호 수식어 → `scoreHit` 0 | 화암동굴·용늪 등 | 무효 | **P0-S01** 가드 |
| 시호 4글자 (`평사낙안` 등) | **85** | 무효 | **P0-A01** 웹/alias → API 검증 |
| Tour 미등재 (`양구 수목원` 등) | 소수 | 무효 | **null 유지** |

**금지**: AI 지식으로 contentId 숫자 기입 · 웹만으로 ID 확정. AI·웹은 **검색어 후보만**. 확정은 DB 또는 LIVE `searchKeyword`/`detail`.

로컬 DB(`tourapi_attraction` ~7463)는 LIVE보다 구멍 큼(환선굴·박수근 행 없음). `--db-only`만으로 이 476을 풀 수 없음.

| R | 방식 | 한도 | 모드 | 상태 |
|---|------|------|------|------|
| **P0-C01** | 같은 `hubId`+`attractionName`(정규화) · scenic `contentId` → 팔경 멤버 + 동명 hub attraction. `copy:korea-local-scenic-content-ids-from-scenic` · **LIVE 금지** | 62 | 오프라인 | ✅ 2026-09-09 **60/62** 소진 · tip `e78f0e5a` (임실 옥정호 동명 멤버 apply 수정) |
| **P0-S01** | `fill-korea-local-scenic-content-ids.mjs` keyword를 `memberQueries` 루프로 · `scoreHit` 괄호는 지자체 동명이인만 거름 · 멤버에 hub attraction lat/lng 폴백 | — | 코드 | ✅ 2026-09-07 · tip `55cfd8ab` |
| **P0-L07** | S01 후 `--keyword-only` 잔여 null · **본명-only 재시도 금지** · `--resume`은 새 쿼리 집합일 때만 | 쿼터 ~10만/일 · 세션 `--limit` | LIVE | ✅ 2026-09-07 **11/100** · tip `6212fab3` |
| **P0-A01** | 시호·별칭 MISS만 공식 출처/웹으로 후보 → `KEYWORD_ALIASES` → LIVE 1~2회 검증 | 소수 건 | 혼합 | ✅ 2026-09-08 **8/16** L07 cohort · tip `dc608b4b` |

### 다음 세션 (복붙) — 1순위 P0-A07

**채팅명** `팔경contentId #P0-A07, siho alias`

| | |
|--|--|
| **브랜치** | `cursor/palgyeong-cid` · tip `e3acbf8d` · PR [#185](https://github.com/catgeot/Days/pull/185) |
| **스냅샷** | P0 멤버 **575/876** (null **301**) · siho_wait **8** · prefix ambiguous **2** · closed **383** |
| **1순위** | `--bucket=siho --apply-unique` — 공식 본명 alias → LIVE · HIT만 lists 기입 |
| **읽기** | index 팔경 contentId 행 · 본 큐 「P0 키워드 종결」· method **§5.7** |
| **금지** | UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 `plans/**` |

**이어질 제시어**:

```
팔경contentId #P0-A07, siho alias
@plans/feature-handoff-index.md
@plans/korea-local-scenic-contentid-queue.md
브랜치 cursor/palgyeong-cid · PR #185
금지: UI · scenic 승격 · Tour LIVE · AI가 contentId 기입 · feature에 plans/** 커밋
작업: --bucket=siho --apply-unique · alias→LIVE · HIT는 LIVE 행만 · 종결을 close JSON에 기록
```

**Auth**: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Edge `tourapi-proxy`) — inventory만이면 불필요. K·A LIVE 필요.

- 429 → 해당 R `blocked: quota` · **그날 정지** · 다음날 [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) §1.2 B 429 블록.  
- 상업·리조트·아울렛 등은 스크립트 `COMMERCIAL_RE`로 MISS 가능 — 무리한 LIVE 반복 금지.
