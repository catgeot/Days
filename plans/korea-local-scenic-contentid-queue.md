# 팔경·명소 Tour contentId 큐

**상태**: R01–R16 ✅ · **P0·P1 F 소진** · membersWithContentId **292**/876 · hub+P1 **68** · P2 **null 104**/871(78 hub) · **P2-L keyword 38/142** · Tour API **운영 승인 ~10만/일** · 다음 **P2 잔여 LIVE(areaBased+keyword)**  
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
| **P2-L2** | 메인 직렬 **플래그 없음** — DB(잔여) → `areaBased` → `keyword` | 쿼터 ~10만/일 | LIVE | ⬜ **다음 세션** |
| **P0-L** | `fill-korea-local-scenic-content-ids.mjs --keyword-only` (멤버 null **584**) | 쿼터 ~10만/일 | LIVE | ⬜ P2-L2 후 |

### 다음 세션 (복붙)

**채팅명** `팔경contentId #P2-L2, 잔여 LIVE`

| | |
|--|--|
| **브랜치** | `cursor/palgyeong-cid` · tip `15f6e56c` · PR [#185](https://github.com/catgeot/Days/pull/185) |
| **스냅샷** | P0 멤버 292/876 · P2 테마 null **104**/871 · Tour API 운영 **~10만/일** · keyword 1회 **38건** 완료 |
| **1순위** | `node scripts/fill-korea-scenic-spot-content-ids.mjs` → `npm run generate:korea-scenic-spots` → audit/smoke scenic |
| **2순위** | P0 멤버 null 584 — `node scripts/fill-korea-local-scenic-content-ids.mjs --keyword-only` (필요 시 `--limit=100`) |
| **읽기** | index 팔경 contentId 행 · 본 큐 이 절 · method **§5.7** |
| **금지** | UI · scenic 승격 · 워커 병렬 LIVE · 429 같은 날 재시도 · feature에 `plans/**` |

**Auth**: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (Edge `tourapi-proxy`)

- 429 → 해당 R `blocked: quota` · **그날 정지** · 다음날 [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md) §1.2 B 429 블록.  
- 상업·리조트·아울렛 등은 스크립트 `COMMERCIAL_RE`로 MISS 가능 — 무리한 LIVE 반복 금지.
