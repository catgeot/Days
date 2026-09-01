# 축제 로드 — 킬러 맵 (장기·완성도 우선)

**세션 표기**: `축제 로드 #{N}, {단계}` — **본 트랙 전용 순번** ([`cloud-preview-continuity.md`](./cloud-preview-continuity.md) §1.1)  
**고정 브랜치**: `cursor/korea-festival-proxy`  
**Preview**: `/qa/korea` → `/korea`  
**상위 플랜**: [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) S5 · corridor 칩 **부활 금지**  
**워크플로**: 로직=feature · 문서=`main` — [`docs-on-main-workflow.md`](./docs-on-main-workflow.md)

> **구 `축제 페이지 #1~#4`**(S2~S5-C UI)와 **별도** — 로드 트랙은 **#0부터** 리셋.

---

## 세션 순번 규칙

| 표기 | 의미 |
|------|------|
| **`#N`** | 메인 세션. **한 채팅 = 한 번호**(해당 단계 완료·게이트 통과 시에만 **N+1**) |
| **`#Na` · `#Nb` …** | **같은 #N** 작업이 끝나지 않아 **이어하기** — 일지·index에 **남은 작업** 명시 |
| **리셋 금지** | 로드 트랙 안에서 `#1`로 되돌리기 금지 · suffix만 추가 |

**예**: #1에서 SSOT만 끝나고 smoke 미완 → 다음 채팅 `축제 로드 #1a, 로드 검증·확장` · smoke PASS 후 → `#2` 매칭.

---

## 제품 비전

**축제 로드**는 `/korea`의 **킬러 맵** — 「어디로 가서 무엇을 할까」를 **동선 제안**으로 줄입니다.

| 기존 | 목표 |
|------|------|
| 시도·시군·테마 색인 | **로드 1개** → 정류장 타임라인 + 지도 동선 |
| 축제 개별 탐색 | **이동 지역 → 축제 → 다음 지역** 구분이 한눈에 |
| 지도 = 핀 모음 | 지도 = **선택 로드의 루트** + 번호 정류장 |

**완성도 원칙**: 한 세션 = 한 덩어리 · Phase 게이트 = 사람 Preview QA OK · 강원 시범 완료 후 전국.

---

## Phase 로드맵 (#0~#13)

| Phase | 세션 | 목표 | QA 게이트 |
|-------|------|------|-----------|
| **0** | **#0** ✅ | 플랜·index·일지 `main` | — |
| **1** 골격 | **#1~#4** | SSOT → 매칭 → 진입 → **leg UI** | #4 leg 확인 |
| **1** 지도 | **#5~#6** | line·번호 정류장·leg↔지도 | **#6 강원 1차** |
| **2** | **#7~#8** | 카피·매칭·모바일 | **#8 강원 시범 완료** |
| **3** | **#9~#11** | 전국 권역별 시드 | 권역별 Preview |
| **4** | **#12~#13** | 계절·S5-D·코스 (합의 후) | PROD 전 |

### 채팅명 복붙표

| #N | 채팅명 | 산출 |
|----|--------|------|
| **0** | `축제 로드 #0, 플랜·핸드오프` | ✅ 플랜·index·일지 · 제시어 #1 |
| **1** | `축제 로드 #1, 검증·확장` | hub·LIVE 매칭 검증 · overrides · generate/audit/smoke · **UI 없음** |
| **1a** | `축제 로드 #1a, 검증·확장` | (#1 미완 시) smoke·overrides 잔여 |
| **2** | `축제 로드 #2, 매칭` | `festivalBelts.js` · leg 배열 · smoke |
| **3** | `축제 로드 #3, 진입` | belt 패널 · 카드 · 선택 상태 |
| **4** | `축제 로드 #4, leg UI` | `FestivalBeltLegList` · connector · 빈 leg |
| **5** | `축제 로드 #5, 지도` | Mapbox line · 번호 stop |
| **6** | `축제 로드 #6, 지도동기화` | leg↔지도 · Phase1 게이트 |
| **7** | `축제 로드 #7, 강원 다듬기` | blurb·km 튜닝 |
| **8** | `축제 로드 #8, 킬러맵 QA` | 강원 시범 완료 |
| **9~11** | 전국 수도권·영남·호남충청 | 벨트 시드 append |
| **12~13** | 계절·일정연동 | 합의 후 |

---

## 강원 시범 벨트 (Phase 1)

| id | 이름 | 정류장 hubId 순 |
|----|------|----------------|
| `gw-north-inland` | 강원 북부 내륙로 | chuncheon → cheorwon → yanggu → hwacheon → hongcheon → hoengseong |
| `gw-east-coast` | 강원 동해안 축제로드 | goseong → yangyang → sokcho → gangneung → samcheok |
| `gw-central` | 강원 중부 횡단로 | wonju → jeongseon → pyeongchang |
| `gw-west-jungbu` | 원주·충북 북부로 | wonju → jecheon → danyang |

`gw-west`(hongcheon→inje)는 **#7** 밀도 검증 후.

---

## 데이터 · UI (요약)

- SSOT: `scripts/data/korea-festival-belt-overrides.mjs` → `src/pages/Korea/data/koreaFestivalBelts.json`
- 스크립트: `generate:korea-festival-belts` · `audit:korea-festival-belts` · `smoke:korea-festival-belts`
- 런타임: `festivalBelts.js` — `groupFestivalsForBelt()` → leg[] (stopIndex · nextLabel · items · empty)
- UI: `FestivalBeltLegList.jsx` — 정류장 헤더 · connector · `FestivalRow` · **빈 leg 유지**
- 지도: `KoreaFestivalMap` — belt line · 번호 마커 · leg 탭 동기화 (#5~#6)
- 벨트 모드 시 `panelGroups` **대체** (혼용 금지)

---

## 검증

| 시점 | 명령 |
|------|------|
| 매 세션 | 해당 `audit`/`smoke` · `build` |
| #6·#8 | 사람 `/qa/korea` **게이트** |

---

## 9. 핸드오프 — 축제 로드

| | |
|--|--|
| **상태** | **#3-a 진입 QA** · 벨트 스크롤 수정 · 사람 Preview → **#4 leg UI** |
| **브랜치** | `cursor/korea-festival-proxy` · tip `0708af9b` · PR [#170](https://github.com/catgeot/Days/pull/170) |
| **플랜** | 본 파일 · [`korea-festival-hub-plan.md`](./korea-festival-hub-plan.md) S5 벨트 절 |
| **일지** | [`2026-09-01-project-log.md`](./2026-09-01-project-log.md) |
| **Preview** | `/qa/korea` |

**#1 산출**: overrides 4벨트 · `koreaFestivalBelts.json` · generate/audit/smoke · LIVE 32건·10/17 stop 매칭.

**확장 제안 (#2~#7 검토)**:
- `gw-west`(홍천→인제) — #7 밀도 검증 후 append
- sparse stop(철원·양구·속초·제천·단양) — 빈 leg 유지 + addr alias 튜닝 후보
- 계절 필터 leg — #12~#13 합의 후

**#2 산출**: `festivalBelts.js` · `groupFestivalsForBelt()` leg[] · smoke leg 매칭 PASS · sparse stop 빈 leg 유지.

**#3 산출**: `FestivalBeltPanel` · **로드** 대분류 칩 · 4로드 카드·선택 · `beltLegsToPanelGroups()` · belt 모드 시 `panelGroups` 대체.

**#3-a 산출**: 벨트 아코디언 펼침 시 `scrollIntoView` — 하단 스크롤 후 로드 클릭 시 선택 카드 화면 유지.

**다음 제시어 (#4 leg UI)**:

```
축제 로드 #4, leg UI
@plans/feature-handoff-index.md
@plans/2026-09-01-project-log.md
@plans/korea-festival-road-plan.md
브랜치 cursor/korea-festival-proxy · PR #170 · Preview /qa/korea
금지: 지도(#5) 착수 · plans/ feature 커밋 · corridor 부활 · 한 세션 leg UI+지도
작업: FestivalBeltLegList · connector · 빈 leg · belt 모드 리스트 전환
```

**#1 미완 시 다음 채팅**: `축제 로드 #1a, 검증·확장` — index·일지에 **남은 항목**만.

**금지**: corridor 헤더 칩 · hub 대량 신설 · UI 리디자인 · releaseNotes(미승인)
