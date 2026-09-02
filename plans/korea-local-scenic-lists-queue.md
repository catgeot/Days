# koreaLocalScenicLists — 사전 배치 큐 (기초지자체 팔경·구경)

**상태**: ⬜ Phase 0 전 · 파일럿 P0만 확정 · 나머지 권역은 I#1 후 확장  
**규칙**: 라운드 = **6 리스트** · 워커A **3** + 워커B **3** · 메인 직렬 머지(A→B) · VERIFY 후 다음  
**방법**: [`orchestrator-method.md`](./orchestrator-method.md) **§5.6** · 플랜 [`korea-local-scenic-lists-plan.md`](./korea-local-scenic-lists-plan.md)  
**단위**: 시·군·구만 · **광역 팔경(관동팔경 등) 큐 금지**(1차)

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
| **R02** | `samcheok-?` · `donghae-?` · `taebaek-?` | `pyeongchang-?` · `jeongseon-?` · `hwacheon-?` | 강원 | ⬜ |
| **R03** | `cheorwon-?` · `hwengseong-?` · `yeongwol-?` | 예비 강원 3 | 강원 | ⬜ |

> **R01 skip**: `chuncheon`·`gangneung` 시 단위 공식 8경 없음(`skip_no_source`) → 예비 `samcheok-sipgyeong`·`donghae-bijing` 1:1 대체.

> R의 `?` = 착수 전 **소스 조사로 listKind·공식 title 확정**. 리스트가 없으면 그 칸은 예비로 교체하고 큐에 `skip_no_source` 1줄.

**I 주기**: R01–R03 VERIFY 누적 후 → **I 무결성 #2** → 충북·경북 큐 확장(별도 커밋으로 표 추가).

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
다음 시작: F R02 (#5, R01 ✅ 2026-09-02)
tip lists: 9 · members: 79 · hub append(R01): +36
```
