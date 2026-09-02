# koreaLocalScenicLists — 사전 배치 큐 (기초지자체 팔경·구경)

**상태**: R06 ✅ · **I#3** ✅ · 다음 **R07**  
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
| **R07** | `yeongju-?` · `mungyeong-?` · `bonghwa-?` | `yecheon-?` · `cheongsong-?` · `yeongdeok-?` | 경북 | ⬜ |
| **R08** | `uljin-?` · `goryeong-?` · `gunwi-?` | `uiseong-?` · `chilgok-?` · `seongju-?` | 경북 | ⬜ |
| **R09** | `gyeongsan-?` · `yeongcheon-?` · `cheongdo-?` | `yeongyang-?` · `ulleung-?` · `dokdo-?` | 경북 | ⬜ |

> **R04 skip**: `chungju`·`cheongju`·`boeun`·`goesan` 시·군 단위 공식 N경 없음(`skip_no_source`) — chungju.go.kr·cheongju.go.kr·boeun.go.kr·goesan.go.kr.

> **R04 충돌 접두**: `옥순봉`(jecheon) → hub `제천 옥순봉` (단양팔경·제천10경 공통 멤버).

> **R05 skip**: `eumseong` 시·군 단위 공식 N경 없음(`skip_no_source` — eumseong.go.kr/tour).

> **R06 skip**: `andong`·`gumi`·`sangju`·`gimcheon` 시·군 단위 공식 N경 SSOT 없음(`skip_no_source`).

> **R05 verified**: `okcheon-gugyeong`(9) · `yeongdong-yangsan-palgyeong`(8) · `yeongdong-hancheon-palgyeong`(8) · `jincheon-palgyeong`(8) · `jeungpyeong-gugyeong`(9).

> **R06 verified**: `gyeongju-8gwae`(8怪 · listKind other) · `pohang-sipgyeong`(12).

> **충북 11** hub (`cheongju`·`jincheon`·`jeungpyeong`·`eumseong`·`goesan`·`chungju`·`jecheon`·`danyang`·`boeun`·`okcheon`·`yeongdong`) — [`korea-scenic-mid-cluster-plan.md`](./korea-scenic-mid-cluster-plan.md) 청주권·북부·남부 순.

> **경북 24** hub — 신라·가야·유교·동해 권역 순. `ulleung`·`dokdo`는 섬·공식 N경 유무 **착수 전 확인**.

**I 주기**: R04–R06 VERIFY 누적 후 → **I 무결성 #3** ✅ 2026-09-02 → 다음 **R07**.

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
다음: R07 · lists 23 · members 203 · 충북 skips 5 · 경북 skips 4
I#3: R04–R06 PASS 2026-09-02
```
