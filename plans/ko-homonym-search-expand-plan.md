# 국내 동명 검색 확장 — 필요성 확인 · 후보 추출 · 선택 라벨

**상태**: ⏳ 다음 세션  
**제시어**: `동명검색-확장-후보추출-이어하기`  
**일지**: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)  
**선행**: 읍·면·리 다후보 ✅ ([#36](https://github.com/catgeot/Days/pull/36) · [`koHomonymRiSearch.js`](../src/pages/Home/lib/koHomonymRiSearch.js))

---

## 0. 사람 목표 (이번 준비의 의도)

1. **리 외(동·시·군·무접미사 지명)**까지 다후보를 넓힐 **필요 여부**를 데이터로 판단한다.  
2. **실제 검색·SSOT·Nominatim**에서 「구분이 필요한」 지명 후보를 표로 뽑는다.  
3. 선택 UI는 기존 카드 재사용 — 라벨이 **지역이 한눈에** 보이게 (`이름 · 상위행정`).

**금지(다음 세션도)**: UI 리디자인 · 전국 slug override 남발 · Nominatim 병렬 폭주 · `travelSpots.js` 전체 스캔 · 특정 지역 단독 우선 재도입.

---

## 1. 현재 vs 확장

| | #36 (완료) | 다음(본 계획) |
|--|------------|----------------|
| 쿼리 | 단독 `○○리`/`○○읍`/`○○면` | **필요 시** `○○동` · 짧은 시·군명 · 무접미사(광주·고성 등) |
| 판정 | Nominatim KR 다히트 → 군/시 라벨 | 동일 + **후보 표로 확장 범위 결정** |
| 제품 | 자동 단독 진입 금지 | 동일 · 라벨·뱃지만 유형별 미세 조정 가능 |

**확장 결정 기준 (에이전트가 임의로 전부 켜지 말 것)**

| 신호 | 확장 O에 가깝 | 확장 X / 보류 |
|------|----------------|----------------|
| Nominatim 국내 히트 ≥2 **서로 다른** 시·군·구 | 해당 접미사/패턴 포함 | 히트 1 · 또는 도로/정류장만 |
| `search_dictionary`·일지·이슈에 **오탐 제보** | 우선 큐 | 제보 없음·시설·테마 쿼리 |
| hub/정착지 exact가 이미 선택 카드 | 중복 경로 만들지 말 것 | hub exact 유지 |

---

## 2. Phase 0 — 후보 추출 (다음 세션 먼저)

### 2.1 입력 소스 (우선순위)

| # | 소스 | 방법 |
|---|------|------|
| A | 시드 목록 | 아래 §2.3 + 일지 오탐(대화·광주·고성 등) |
| B | SSOT 짧은 한글명 | `cityAttractionHubs` · `mapboxSettlementPlaces` · `travelSpots-list.json` — 길이≤4·한글·국내 |
| C | `search_dictionary` | Secrets 있을 때 `original_query` 빈도 상위 (없으면 스킵·일지에 명시) |
| D | Nominatim LIVE | 후보마다 `limit=8` **순차·딜레이** · 지역 라벨 수 ≥2면 `NEED_DISAMBIG` |

출력: `scripts/outputs/ko-homonym-expand-candidates.json` (+ 콘솔 표 상위 N).

### 2.2 감사 스크립트

- 경로: [`scripts/audit-ko-homonym-expand-candidates.mjs`](../scripts/audit-ko-homonym-expand-candidates.mjs)
- npm: `audit:ko-homonym-expand`  
- LIVE: `KO_HOMONYM_EXPAND_LIVE=1` (기본은 시드·오프라인 분류만 · `KO_HOMONYM_EXPAND_LIMIT`로 LIVE 상한)
- 재사용: `formatKoHomonymRiRegionLabel` / 라벨 규칙을 **동·시에도 쓸 수 있게** 일반화 검토(함수 rename은 구현 시)

### 2.3 시드 (초기 · 사람이 늘려도 됨)

```
대화리, 대화동, 광주, 고성, 남양, 신촌, 중동, 사천, 진주, 공주, 세종, 제주
```

### 2.4 Phase 0 샘플 (2026-07-30 시드 LIVE · 준비 커밋)

시드 14건 Nominatim 샘플 (`KO_HOMONYM_EXPAND_LIVE=1` · LIMIT=14):

| 쿼리 | 패턴 | #36 커버 | LIVE |
|------|------|----------|------|
| 대화리 | ri | ✅ | NEED (천안·충주·김제·평창) |
| 대화면 | myeon | ✅ | SINGLE (평창) |
| 대화동 | dong | ❌ gap | NEED (대전·고양) |
| 고성 | bare | ❌ | NEED (울진·진도·고성군·대구 등) |
| 남양 | bare | ❌ | NEED (다수 군·시) |
| 신촌·중동·진주·공주·사천 | bare/dong | ❌ | NEED |
| 세종·남양주 | bare | ❌ | SINGLE |
| 제주 | bare | ❌ | NO_HIT(이 샘플) — hub exact 경로와 별개 확인 |

**해석**: 동·무접미사에서 NEED가 실제로 나옴 → **확장 후보 가치 있음**. hub exact(`광주`/`고성` 등)와 겹치면 다후보 경로 중복 금지. 전수 LIVE는 다음 세션(딜레이·상한).

---

## 3. Phase 1 — 제품 반영 (표 확인 후)

1. `isKoHomonymRiSearchQuery` → **패턴 확장**(또는 `isKoHomonymPlaceSearchQuery`) — Phase 0 표에서 **NEED_DISAMBIG**만.  
2. 라벨 SSOT: `{이름} · {시|군|구}` (기존 카드 `name` + `parentCity`).  
3. `useHomeHandlers` early path 재사용 · hub/정착지 exact보다 **뒤** 또는 exact가 이미 다후보면 스킵.  
4. smoke: 시드 중 LIVE 다히트 2~3건 + 회귀(대화리·속초·파리).

**완료 조건**

- [ ] Phase 0 표: 접미사별 NEED 건수 · 샘플 20  
- [ ] 사람/에이전트가 **확장 O/X** 1줄 결정  
- [ ] 확장 O면 해당 패턴만 코드 반영 · 선택 라벨 명확 · smoke PASS · 커밋·push·PR

---

## 4. Cloud 붙여넣기

```text
동명검색-확장-후보추출-이어하기

@.ai-context.md
@plans/ko-homonym-search-expand-plan.md
@plans/2026-07-30-project-log.md

Phase 0: 동·시·군·무접미사 동명 확장 필요성 + 후보 표.
audit:ko-homonym-expand (± LIVE) · search_dictionary는 Secrets 있을 때만.
표 보고 확장 O면 라벨 다후보 연결 · X면 보류 일지만.
#36 리/읍/면 회귀 유지. UI 리디자인·단독 우선 금지.
VERIFY 후 커밋·push.
```
