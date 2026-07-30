# 국내 동명 검색 확장 — 필요성 확인 · 후보 추출 · 선택 라벨

**상태**: ✅ Phase 0 표 · **확장 O=`동`** · bare 보류 · tip 구현  
**제시어**: `동명검색-확장-후보추출-이어하기`  
**일지**: [`2026-07-30-project-log.md`](./2026-07-30-project-log.md)  
**선행**: 읍·면·리 다후보 ✅ ([#36](https://github.com/catgeot/Days/pull/36) · [`koHomonymRiSearch.js`](../src/pages/Home/lib/koHomonymRiSearch.js))

---

## 0. 사람 목표

1. **리 외(동·시·군·무접미사 지명)**까지 다후보를 넓힐 **필요 여부**를 데이터로 판단한다.  
2. **실제 검색·SSOT·Nominatim**에서 「구분이 필요한」 지명 후보를 표로 뽑는다.  
3. 선택 UI는 기존 카드 재사용 — 라벨이 **지역이 한눈에** 보이게 (`이름 · 상위행정`).

**금지**: UI 리디자인 · 전국 slug override 남발 · Nominatim 병렬 폭주 · `travelSpots.js` 전체 스캔 · 특정 지역 단독 우선 재도입.

---

## 1. 확장 결정 (2026-07-30 Phase 0)

| 결정 | 내용 |
|------|------|
| **확장 O** | **`동` 패턴** — LIVE NEED 확인 · hub exact와 거의 비중복 · #36과 동일 라벨 카드 |
| **보류** | **bare(무접미사)** — NEED 다수이나 hub exact가 고성·사천·진주·가평·거제·강남·광주 등 이미 선택 카드 · 비허브 NEED(남양·신촌·강북·강서·강진)는 **화이트리스트 후속** |
| **유지** | #36 읍·면·리 회귀 · 단독 자동 진입 금지 |

---

## 2. Phase 0 표 (완료)

### 2.1 소스

| # | 소스 | 결과 |
|---|------|------|
| A | 시드 14 | LIVE 완료 |
| B | SSOT 짧은 한글명 | 후보 풀 ~899 |
| C | `search_dictionary` | Secrets OK · **53** queries 병합 |
| D | Nominatim LIVE | `LIMIT=40` · 순차 1.1s |

출력: `scripts/outputs/ko-homonym-expand-candidates.json` (gitignore).

### 2.2 LIVE 요약 (접미사별 NEED · 샘플 40)

| 패턴 | LIVE 샘플 | NEED | SINGLE | NO_HIT | 비고 |
|------|----------:|-----:|-------:|-------:|------|
| ri | 1 | 1 | 0 | 0 | #36 커버 (대화리) |
| myeon | 1 | 0 | 1 | 0 | #36 |
| dong | 12 | **5** | 7 | 0 | **확장 O** |
| bare | 26 | **12** | 12 | 2 | hub exact 우선 · **보류** |

**NEED 샘플 (dong)**: 대화동(대전·고양) · 중동(부천·부산·대구) · 가동 · 갈현동 · 강동  
**NEED 샘플 (bare·hub 있음)**: 고성·공주·사천·진주·가평·거제·강남 → hub 경로  
**NEED 샘플 (bare·비허브)**: 남양·신촌·강북·강서·강진 → 후속 화이트리스트 후보  
**SINGLE**: 세종·남양주·강화·대화면 등 · **NO_HIT**: 제주(hub exact와 별개)

### 2.3 시드

```
대화리, 대화동, 대화면, 광주, 고성, 남양, 신촌, 중동, 사천, 진주, 공주, 세종, 제주, 남양주
```

---

## 3. Phase 1 — 제품 반영 (✅ `동`)

1. `isKoHomonymPlaceSearchQuery` = 읍·면·리·**동** · `isKoHomonymRiSearchQuery`는 #36 회귀(읍·면·리만)  
2. `collectKoHomonymPlaceCandidates` · 라벨 `{이름} · {시|군|광역시}`  
3. `useHomeHandlers` — hub/정착지/명소 exact **뒤** · ≥2면 선택 카드  
4. smoke: 대화리 회귀 + 대화동 픽스처/LIVE

**완료 조건**

- [x] Phase 0 표: 접미사별 NEED · 샘플 40 · search_dictionary 53  
- [x] 확장 O=`동` / bare 보류 1줄 결정  
- [x] `동` 라벨 다후보 · #36 회귀 smoke PASS · 커밋·push·PR

---

## 4. 후속 (bare 화이트리스트)

비허브 NEED만 시드 배열로 붙일지 사람 확인 후. 전 bare 패턴 개방 **금지**(Nominatim 폭주·잡음).

```text
동명검색-bare-화이트리스트-이어하기
@plans/ko-homonym-search-expand-plan.md
남양·신촌·강북·강서·강진 등 비허브 NEED만.
```

---

## 5. 검증

```bash
npm run audit:ko-homonym-expand
KO_HOMONYM_EXPAND_LIVE=1 KO_HOMONYM_EXPAND_LIMIT=40 npm run audit:ko-homonym-expand
npm run smoke:ko-homonym-ri-search
KO_HOMONYM_RI_LIVE=1 npm run smoke:ko-homonym-ri-search
```
