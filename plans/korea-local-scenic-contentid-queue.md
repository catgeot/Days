# 팔경·명소 Tour contentId 큐

**상태**: R01–R07 ✅ · 다음 ⬜ **R08** · membersWithContentId **112**/876 · LIVE 쿼터 주의  
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) **§5.7** · 플랜 [`korea-local-scenic-use-plan.md`](./korea-local-scenic-use-plan.md)  
**브랜치**: `cursor/palgyeong-cid` (A UI `cursor/palgyeong-use-e744`와 **분리** · 수집 `cursor/palgyeong` 금지)  
**금지**: UI · scenic 승격 · 워커 병렬 LIVE · 429 후 같은 날 재호출 · P1/P2를 P0 전에

### 사용법

1. **S0** 끝날 때까지 F 오케 금지 (메인 솔로: 스크립트 + 문경 DB-only).  
2. F: 다음 ⬜ R만 · 워커A 3 listId + 워커B 3. **DB-only R** 우선.  
3. LIVE R은 메인 직렬(또는 워커 1). 429 → `blocked: quota` · 그날 정지.  
4. listId는 [`koreaLocalScenicLists.json`](../src/pages/Home/data/koreaLocalScenicLists.json) `verified`만. 큐 밖 임의 시군 금지.

---

## S0 (오케 전 · 메인 솔로)

| # | 작업 | 상태 |
|---|------|------|
| S0 | fill 스크립트 `--db-only`/`--keyword-only`/`--limit`/`--resume` · 문경(`mungyeong-palgyeong`) DB 매칭 스모크 · audit가 `contentId` 허용 | ✅ 2026-09-04 |

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
| **R08** | `miryang-palgyeong` · `uiryeong-gugyeong` · `haman-gugyeong` | `changnyeong-gugyeong` · `yeosu-other` · `gwangyang-gugyeong` | DB-only | ⬜ |

---

## 후순위 (P0 소진 전 착수 금지)

| 순위 | 대상 | 상태 |
|------|------|------|
| P1 | hub `attractions[]` 중 `contentId` 없는 KR 명소 | 대기 |
| P2 | 테마 선정 contentId 잔여(~75, 기존 429) | 대기 |
